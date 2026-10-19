jest.mock('axios', () => jest.requireActual(require('path').join(require.resolve('axios/package.json'), '..', 'dist', 'node', 'axios.cjs')));
const axios = require('axios').default;
const {catalogRequest, createCatalogCache, CatalogError, CATALOG_BASE_URL} = require('../../src/services/catalog.client');
const {adaptLocation, adaptFestival} = require('../../src/services/catalog.adapter');
const locations = require('../../src/services/locations.api').default;
const festivals = require('../../src/services/festivals.api').default;
const {request: legacyRequest} = require('../../src/services/axios');

const common = id => ({id, record_id: `source-${id}`, name: 'Catalog', types: ['culture'],
  description: '', long_description: '', rating: null, reviews: [], images: [], videos: [],
  advise: ['Advice'], website: '', phone: '', ticket_info: '', verification_status: '', publishable: false});
const location = id => ({...common(id), address: '', lat: null, long: null, opening_hours: '', avatar: ''});
const festival = id => ({...common(id), event_time: '', location: 'Same name', location_id: null,
  start_date: null, end_date: null, schedule_status: '', organizer: ''});
const page = (items, offset = 0, has_more = false, limit = 100) => ({items, offset, has_more, limit});
const response = (config, data) => ({config, data, status: 200, statusText: 'OK', headers: {}});

describe('Cloud Run catalog contract', () => {
  const originalAdapter = catalogRequest.defaults.adapter;
  beforeEach(() => {locations.clearCache(); festivals.clearCache();});
  afterEach(() => {catalogRequest.defaults.adapter = originalAdapter; jest.restoreAllMocks(); jest.useRealTimers();});

  it('preserves IDs, nulls, nested JSON and arrays without filtering publishable=false', () => {
    const raw = {...location(27), reviews: [{arbitrary: {value: null}}], images: ['https://example.com/image']};
    expect(adaptLocation(raw)).toEqual({...raw, Id: 27});
    expect(adaptLocation(raw).images).toBe(raw.images);
    expect(adaptFestival(festival(9))).toEqual({...festival(9), Id: 9});
  });

  it.each([
    {...location(1), id: undefined}, {...location(1), record_id: null},
    {...location(1), lat: undefined}, {...location(1), images: '["bad"]'},
    {...location(1), rating: '0'}, {...location(1), types: [null]},
  ])('rejects malformed records rather than disguising them as empty data', raw => {
    expect(() => adaptLocation(raw)).toThrow(CatalogError);
  });

  it.each(['/locations', '/festivals'])('loads 124 records across pages for %s with clean headers', async path => {
    const make = path === '/locations' ? location : festival;
    const configs = [];
    catalogRequest.defaults.adapter = async config => {
      configs.push(config);
      const offset = config.params.offset;
      const count = offset === 0 ? 100 : 24;
      return response(config, page(Array.from({length: count}, (_, i) => make(offset + i + 1)), offset, offset === 0));
    };
    const legacy = jest.spyOn(legacyRequest, 'get');
    const rows = await (path === '/locations' ? locations.getLocations(true) : festivals.getFestivals(true));
    expect(rows).toHaveLength(124);
    expect(new Set(rows.map(row => row.id)).size).toBe(124);
    expect(configs.map(config => config.params)).toEqual([{limit: 100, offset: 0}, {limit: 100, offset: 100}]);
    for (const config of configs) {
      expect(config.baseURL).toBe(CATALOG_BASE_URL);
      expect(config.url).toBe(path);
      expect(config.timeout).toBe(30000);
      expect(config.withCredentials).toBe(false);
      expect(config.headers.has('xc-token')).toBe(false);
      expect(config.headers.has('Authorization')).toBe(false);
      expect(config.headers.has('Cookie')).toBe(false);
    }
    expect(legacy).not.toHaveBeenCalled();
  });

  it('accepts empty final page and a genuinely empty list', async () => {
    catalogRequest.defaults.adapter = async config => response(config, config.params.offset === 0
      ? page([location(1)], 0, true, 1) : page([], 1));
    expect(await locations.getLocations()).toHaveLength(1);
    catalogRequest.defaults.adapter = async config => response(config, page([]));
    expect(await locations.getLocations(true)).toEqual([]);
  });

  it.each([
    page([], 0, true), page([location(1)], 99), {...page([]), has_more: 'false'},
    {...page([]), limit: 0}, {list: [], pageInfo: {}},
  ])('rejects nonprogressing/malformed pagination', async badPage => {
    catalogRequest.defaults.adapter = async config => response(config, badPage);
    await expect(locations.getLocations()).rejects.toMatchObject({kind: 'contract'});
  });

  it('rejects repeated IDs and bounds endless pagination', async () => {
    let calls = 0;
    catalogRequest.defaults.adapter = async config => {
      calls++;
      return response(config, page([location(1)], config.params.offset, true, 1));
    };
    await expect(locations.getLocations()).rejects.toMatchObject({kind: 'contract'});
    expect(calls).toBe(2);
    calls = 0;
    catalogRequest.defaults.adapter = async config => {
      calls++;
      return response(config, page([location(calls)], config.params.offset, true, 1));
    };
    await expect(locations.getLocations()).rejects.toMatchObject({kind: 'contract'});
    expect(calls).toBe(1000);
  });

  it('uses cached list IDs and exact nullable FK, never names or detail endpoints; refresh/clear reload', async () => {
    const adapter = jest.fn(async config => response(config, page(config.url === '/locations'
      ? [location(7)] : [festival(1), {...festival(2), location_id: 7}, {...festival(3), location_id: 8}])));
    catalogRequest.defaults.adapter = adapter;
    expect((await locations.getLocationById(7)).record_id).toBe('source-7');
    expect(await locations.getLocationById(700)).toBeNull();
    expect((await festivals.getFestivalById(2)).id).toBe(2);
    expect(await festivals.getFestivalById(200)).toBeNull();
    expect((await festivals.getFestivalsByLocationId(7)).map(row => row.id)).toEqual([2]);
    expect(await festivals.getFestivalsByLocationId(null)).toEqual([]);
    expect(adapter).toHaveBeenCalledTimes(2);
    await locations.getLocations(true);
    await festivals.getFestivals(true);
    expect(adapter).toHaveBeenCalledTimes(4);
    locations.clearLocationsCache(); festivals.clearCache();
    await locations.getLocations(); await festivals.getFestivals();
    expect(adapter).toHaveBeenCalledTimes(6);
    expect(adapter.mock.calls.every(([config]) => ['/locations', '/festivals'].includes(config.url))).toBe(true);
  });

  it('expires cache and does not let an old in-flight request overwrite refreshed data', async () => {
    let resolveOld;
    const load = jest.fn().mockImplementationOnce(() => new Promise(resolve => {resolveOld = resolve;}))
      .mockResolvedValue('fresh');
    const cache = createCatalogCache(load);
    const old = cache.get();
    expect(cache.get()).toBe(old);
    expect(await cache.get(true)).toBe('fresh');
    resolveOld('old'); await old;
    expect(await cache.get()).toBe('fresh');
    const now = Date.now(); jest.spyOn(Date, 'now').mockReturnValue(now + 600001);
    await cache.get(); expect(load).toHaveBeenCalledTimes(3);
  });

  it('does not cache a partial result or hide refresh failure behind stale data', async () => {
    const adapter = jest.fn(async config => response(config, config.params.offset === 0
      ? page([location(1)], 0, true, 1) : page([], 0)));
    catalogRequest.defaults.adapter = adapter;
    await expect(locations.getLocations()).rejects.toMatchObject({kind: 'contract'});
    await expect(locations.getLocations()).rejects.toMatchObject({kind: 'contract'});
    expect(adapter).toHaveBeenCalledTimes(4);
    catalogRequest.defaults.adapter = async config => response(config, page([location(2)]));
    await locations.getLocations();
    catalogRequest.defaults.adapter = async config => response(config, {list: []});
    await expect(locations.getLocations(true)).rejects.toMatchObject({kind: 'contract'});
    await expect(locations.getLocations()).rejects.toMatchObject({kind: 'contract'});
  });

  it('invalidates derived reviews when locations refresh and propagates catalog errors', async () => {
    catalogRequest.defaults.adapter = async config => response(config, page([{...location(1), reviews: [{id: 9, images: []}]}]));
    expect((await locations.getReviews())[0].id).toBe(9);
    catalogRequest.defaults.adapter = async config => response(config, page([location(1)]));
    await locations.getLocations(true);
    expect(await locations.getReviews()).toEqual([]);
    catalogRequest.defaults.adapter = async config => response(config, {list: []});
    await expect(locations.getReviews(true)).rejects.toMatchObject({kind: 'contract'});
  });

  it('keeps nullable GPS out of marker visibility and preserves non-null coordinates', () => {
    const {isMapLocationVisible} = require('../../src/utils/catalogVisibility');
    expect(isMapLocationVisible({...adaptLocation(location(1)), publishable: true})).toBe(false);
    const row = adaptLocation({...location(2), lat: 16.05, long: 108.2, rating: 4.5, publishable: true});
    expect(row).toMatchObject({lat: 16.05, long: 108.2, rating: 4.5});
    expect(isMapLocationVisible(row)).toBe(true);
  });

  it.each([['ECONNABORTED', undefined, 'timeout', 3], ['ERR_NETWORK', undefined, 'network', 3],
    ['ERR_BAD_RESPONSE', 503, 'http', 3], ['ERR_BAD_REQUEST', 429, 'http', 3],
    ['ERR_BAD_REQUEST', 404, 'http', 1]])('bounds retry for %s/%s', async (code, status, kind, attempts) => {
    jest.useFakeTimers();
    const adapter = jest.fn(async config => {throw new axios.AxiosError('failure', code, config, {},
      status ? {...response(config, {}), status} : undefined);});
    catalogRequest.defaults.adapter = adapter;
    const result = locations.getLocations().catch(error => error);
    await jest.runAllTimersAsync();
    expect(await result).toMatchObject({kind, status});
    expect(adapter).toHaveBeenCalledTimes(attempts);
  });

  it('recovers on a transient failure', async () => {
    jest.useFakeTimers();
    const adapter = jest.fn().mockRejectedValueOnce(new axios.AxiosError('offline', 'ERR_NETWORK'))
      .mockImplementation(async config => response(config, page([location(1)])));
    catalogRequest.defaults.adapter = adapter;
    const result = locations.getLocations();
    await jest.runAllTimersAsync();
    expect(await result).toHaveLength(1); expect(adapter).toHaveBeenCalledTimes(2);
  });
});

const live = process.env.CATALOG_LIVE === '1' ? describe : describe.skip;
live('Cloud Run live read-only verification', () => {
  it('loads the entire real catalog using FE services and matches independent page reads', async () => {
    catalogRequest.defaults.adapter = 'http';
    for (const [path, service] of [['/locations', locations.getLocations], ['/festivals', festivals.getFestivals]]) {
      const rows = await service(true);
      const raw = [];
      let offset = 0;
      for (;;) {
        const {data} = await axios.get(`${CATALOG_BASE_URL}${path}`, {params: {limit: 100, offset}, timeout: 30000, adapter: 'http'});
        raw.push(...data.items);
        if (!data.has_more) {break;}
        offset += data.limit;
        if (offset > 100000) {throw new Error('Unexpected pagination');}
      }
      expect(rows).toEqual(raw.map(row => ({...row, Id: row.id})));
      expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
      expect(new Set(rows.map(row => row.record_id)).size).toBe(rows.length);
      expect(rows.length).toBeGreaterThan(0);
      process.stdout.write(JSON.stringify({path, count: rows.length, first: {id: rows[0].id, record_id: rows[0].record_id, name: rows[0].name},
        last: {id: rows[rows.length - 1].id, record_id: rows[rows.length - 1].record_id},
        nullRating: rows.filter(row => row.rating === null).length,
        nullFK: path === '/festivals' ? rows.filter(row => row.location_id === null).length : undefined,
        nullLat: path === '/locations' ? rows.filter(row => row.lat === null).length : undefined}) + '\n');
    }
  }, 180000);
});
