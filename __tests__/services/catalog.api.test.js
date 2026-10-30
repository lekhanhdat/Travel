jest.mock('axios', () => jest.requireActual(require('path').join(require.resolve('axios/package.json'), '..', 'dist', 'node', 'axios.cjs')));
const axios = require('axios').default;
const {catalogRequest, createCatalogCache, fetchCatalog, CatalogError, CATALOG_BASE_URL} = require('../../src/services/catalog.client');
const {adaptLocation, adaptFestival} = require('../../src/services/catalog.adapter');
const catalogRepository = require('../../src/services/catalogRepository').default;
const locations = require('../../src/services/locations.api').default;
const festivals = require('../../src/services/festivals.api').default;
const {request: legacyRequest} = require('../../src/services/axios');

const common = id => ({id, record_id: `source-${id}`, name: `Catalog ${id}`, types: ['culture'],
  description: '', long_description: '', rating: null, review_count: 0, reviews: [], images: [], videos: [],
  advise: ['Advice'], website: '', phone: '', ticket_info: '', publishable: false});
const location = id => ({...common(id), address: '', lat: null, long: null, opening_hours: '', avatar: ''});
const festival = id => ({...common(id), event_time: '', location_id: null});
const page = (items, offset = 0, has_more = false, limit = 100) => ({items, offset, has_more, limit});
const response = (config, data) => ({config, data, status: 200, statusText: 'OK', headers: {}});
// Serve a single page per path; `byPath` maps '/locations' | '/festivals' to rows or a page factory.
const serve = byPath => jest.fn(async config => {
  const body = byPath[config.url];
  return response(config, typeof body === 'function' ? body(config) : page(body ?? []));
});

describe('Cloud Run catalog contract', () => {
  const originalAdapter = catalogRequest.defaults.adapter;
  beforeEach(() => {catalogRepository.clear();});
  afterEach(() => {catalogRequest.defaults.adapter = originalAdapter; jest.restoreAllMocks(); jest.useRealTimers();});

  it('preserves IDs, nulls, nested JSON and arrays without filtering publishable=false', () => {
    const raw = {...location(27), reviews: [{arbitrary: {value: null}}], images: ['https://example.com/image']};
    expect(adaptLocation(raw)).toEqual(raw);
    expect(adaptLocation(raw)).not.toHaveProperty('Id');
    expect(adaptLocation(raw).images).toBe(raw.images);
    expect(adaptFestival(festival(9))).toEqual(festival(9));
  });

  it.each([
    {...location(1), id: undefined}, {...location(1), record_id: null},
    {...location(1), lat: undefined}, {...location(1), images: '["bad"]'},
    {...location(1), rating: '0'}, {...location(1), types: [null]},
  ])('rejects malformed records rather than disguising them as empty data', raw => {
    expect(() => adaptLocation(raw)).toThrow(CatalogError);
  });

  it('loads both lists across pages in one repository load with clean headers and a 12 s timeout', async () => {
    const configs = [];
    catalogRequest.defaults.adapter = async config => {
      configs.push(config);
      const make = config.url === '/locations' ? location : festival;
      const offset = config.params.offset;
      const count = offset === 0 ? 100 : 24;
      return response(config, page(Array.from({length: count}, (_, i) => make(offset + i + 1)), offset, offset === 0));
    };
    const legacy = jest.spyOn(legacyRequest, 'get');
    const snapshot = await catalogRepository.get();
    expect(snapshot.locations).toHaveLength(124);
    expect(snapshot.festivals).toHaveLength(124);
    expect(new Set(snapshot.locations.map(row => row.id)).size).toBe(124);
    expect(configs.map(config => [config.url, config.params.offset]).sort()).toEqual([
      ['/festivals', 0], ['/festivals', 100], ['/locations', 0], ['/locations', 100]]);
    for (const config of configs) {
      expect(config.baseURL).toBe(CATALOG_BASE_URL);
      expect(config.params.limit).toBe(100);
      expect(config.timeout).toBe(12000);
      expect(config.withCredentials).toBe(false);
      expect(config.headers.has('xc-token')).toBe(false);
      expect(config.headers.has('Authorization')).toBe(false);
      expect(config.headers.has('Cookie')).toBe(false);
    }
    expect(legacy).not.toHaveBeenCalled();
  });

  it('accepts empty final page and a genuinely empty list', async () => {
    catalogRequest.defaults.adapter = serve({'/locations': config => config.params.offset === 0
      ? page([location(1)], 0, true, 1) : page([], 1)});
    expect(await locations.getLocations()).toHaveLength(1);
    catalogRequest.defaults.adapter = serve({});
    expect(await locations.getLocations(true)).toEqual([]);
    expect(await festivals.getFestivals()).toEqual([]);
  });

  it.each([
    page([], 0, true), page([location(1)], 99), {...page([]), has_more: 'false'},
    {...page([]), limit: 0}, {list: [], pageInfo: {}},
  ])('rejects nonprogressing/malformed pagination', async badPage => {
    catalogRequest.defaults.adapter = serve({'/locations': () => badPage});
    await expect(locations.getLocations()).rejects.toMatchObject({kind: 'contract'});
  });

  it('rejects repeated IDs and bounds endless pagination', async () => {
    let calls = 0;
    catalogRequest.defaults.adapter = async config => {
      calls++;
      return response(config, page([location(1)], config.params.offset, true, 1));
    };
    await expect(fetchCatalog('/locations', adaptLocation)).rejects.toMatchObject({kind: 'contract'});
    expect(calls).toBe(2);
    calls = 0;
    catalogRequest.defaults.adapter = async config => {
      calls++;
      return response(config, page([location(calls)], config.params.offset, true, 1));
    };
    await expect(fetchCatalog('/locations', adaptLocation)).rejects.toMatchObject({kind: 'contract'});
    expect(calls).toBe(1000);
  });

  it('shares one fetch per list across screens and serves indexes; refresh/clear reload', async () => {
    const adapter = serve({
      '/locations': [location(7), {...location(9), publishable: true, lat: 16.05, long: 108.2}],
      '/festivals': [festival(1), {...festival(2), location_id: 7}, {...festival(3), location_id: 8}],
    });
    catalogRequest.defaults.adapter = adapter;
    // Home, Festival, Detail and Map style reads in parallel.
    const [home, fest, detail, related, byId, snapshot] = await Promise.all([
      locations.getLocations(), festivals.getFestivals(), locations.getLocationById(7),
      festivals.getFestivalsByLocationId(7), festivals.getFestivalById(2), catalogRepository.get(),
    ]);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(home).toBe(snapshot.locations);
    expect(fest).toBe(snapshot.festivals);
    expect(detail.record_id).toBe('source-7');
    expect(related.map(row => row.id)).toEqual([2]);
    expect(byId.location).toBe('Catalog 7');
    expect(fest.map(row => row.location)).toEqual(['', 'Catalog 7', '']);
    expect(snapshot.festivalsByLocationId.get(8)).toHaveLength(1);
    expect(snapshot.mapMarkers.map(row => row.id)).toEqual([9]);
    expect(await locations.getLocationById(700)).toBeNull();
    expect(await festivals.getFestivalById(200)).toBeNull();
    expect(await festivals.getFestivalsByLocationId(null)).toEqual([]);
    expect(adapter).toHaveBeenCalledTimes(2);
    await catalogRepository.refresh();
    expect(adapter).toHaveBeenCalledTimes(4);
    locations.clearLocationsCache();
    await festivals.getFestivals();
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

  it('keeps the last good snapshot on failure: refresh rejects, plain reads stay served', async () => {
    catalogRequest.defaults.adapter = serve({'/locations': () => page([location(1)], 0, true, 1)});
    await expect(catalogRepository.get()).rejects.toMatchObject({kind: 'contract'});
    catalogRequest.defaults.adapter = serve({'/locations': [location(2)]});
    const good = await catalogRepository.get();
    const offline = jest.fn(async config => {throw new axios.AxiosError('offline', 'ERR_NETWORK', config);});
    catalogRequest.defaults.adapter = offline;
    jest.useFakeTimers({doNotFake: ['nextTick']});
    const refresh = catalogRepository.refresh().catch(error => error);
    await jest.runAllTimersAsync();
    expect(await refresh).toMatchObject({kind: 'network'});
    expect(await catalogRepository.get()).toBe(good);
    // After the TTL a failed reload falls back to the stale snapshot instead of failing offline.
    jest.setSystemTime(Date.now() + 600001);
    const stale = catalogRepository.get();
    await jest.runAllTimersAsync();
    expect(await stale).toBe(good);
    catalogRepository.clear();
    const empty = catalogRepository.get().catch(error => error);
    await jest.runAllTimersAsync();
    expect(await empty).toMatchObject({kind: 'network'});
  });

  // P7: reviews come from GET /reviews (BE table), no longer from the catalog's legacy `reviews` column.
  it('reads reviews from the BE, ignores the legacy catalog column, and still lists them without a catalog', async () => {
    const {apiRequest} = require('../../src/services/api.client');
    const dto = {id: 9, location_id: 1, festival_id: null, rating: 4, content: 'Đẹp', images: [],
      created_at: '2026-10-30T02:05:00Z', author: {id: 3, user_name: 'u3', full_name: null, avatar: null}};
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: page([dto])});
    catalogRequest.defaults.adapter = serve({'/locations': [{...location(1), reviews: [{id: 99}]}]});
    const [review] = await locations.getReviews(false, 1);
    expect(request.mock.calls[0][0]).toMatchObject({method: 'get', url: '/reviews', params: {location_id: 1, limit: 100}});
    expect(request.mock.calls[0][0].headers.Authorization).toBeUndefined();
    expect(review).toMatchObject({id: 9, accountId: 3, start: 4, name_user_review: 'u3', location: {id: 1}});
    expect((await catalogRepository.get()).locations[0].reviews).toEqual([{id: 99}]);
    catalogRepository.clear();
    catalogRequest.defaults.adapter = serve({'/locations': () => ({list: []})});
    expect((await locations.getReviews())[0]).toMatchObject({id: 9, location: undefined});
  });

  it('keeps nullable GPS out of marker visibility and preserves non-null coordinates', () => {
    const {isMapLocationVisible} = require('../../src/utils/catalogVisibility');
    expect(isMapLocationVisible({...adaptLocation(location(1)), publishable: true})).toBe(false);
    const row = adaptLocation({...location(2), lat: 16.05, long: 108.2, rating: 4.5, publishable: true});
    expect(row).toMatchObject({lat: 16.05, long: 108.2, rating: 4.5});
    expect(isMapLocationVisible(row)).toBe(true);
  });

  it.each([['ECONNABORTED', undefined, 'timeout', 2], ['ERR_NETWORK', undefined, 'network', 2],
    ['ERR_BAD_RESPONSE', 503, 'http', 2], ['ERR_BAD_REQUEST', 429, 'http', 2],
    ['ERR_BAD_REQUEST', 404, 'http', 1]])('retries %s/%s at most once', async (code, status, kind, attempts) => {
    jest.useFakeTimers();
    const adapter = jest.fn(async config => {throw new axios.AxiosError('failure', code, config, {},
      status ? {...response(config, {}), status} : undefined);});
    catalogRequest.defaults.adapter = adapter;
    const result = fetchCatalog('/locations', adaptLocation).catch(error => error);
    await jest.runAllTimersAsync();
    expect(await result).toMatchObject({kind, status});
    expect(adapter).toHaveBeenCalledTimes(attempts);
  });

  it('recovers on a transient failure', async () => {
    jest.useFakeTimers();
    const adapter = jest.fn().mockRejectedValueOnce(new axios.AxiosError('offline', 'ERR_NETWORK'))
      .mockImplementation(async config => response(config, page([location(1)])));
    catalogRequest.defaults.adapter = adapter;
    const result = fetchCatalog('/locations', adaptLocation);
    await jest.runAllTimersAsync();
    expect(await result).toHaveLength(1); expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('bounds the whole list load by a 30 s deadline across pages and retries', async () => {
    let now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    const timeouts = [];
    catalogRequest.defaults.adapter = async config => {
      timeouts.push(config.timeout);
      // Each page takes 11 s; the third request only has the remaining budget.
      now += 11000;
      return response(config, page([location(config.params.offset + 1)], config.params.offset, true, 1));
    };
    await expect(fetchCatalog('/locations', adaptLocation)).rejects.toMatchObject({kind: 'timeout'});
    expect(timeouts).toEqual([12000, 12000, 8000]);
    // A timeout near the deadline is not retried.
    now = 2_000_000;
    let calls = 0;
    catalogRequest.defaults.adapter = async config => {
      calls++; now += 29800;
      throw new axios.AxiosError('timeout', 'ECONNABORTED', config);
    };
    await expect(fetchCatalog('/locations', adaptLocation)).rejects.toMatchObject({kind: 'timeout'});
    expect(calls).toBe(1);
  });
});

const live = process.env.CATALOG_LIVE === '1' ? describe : describe.skip;
live('Cloud Run live read-only verification', () => {
  it('loads the entire real catalog using FE services and matches independent page reads', async () => {
    catalogRequest.defaults.adapter = 'http';
    const snapshot = await catalogRepository.refresh();
    for (const [path, rows] of [['/locations', snapshot.locations], ['/festivals', snapshot.festivals]]) {
      const raw = [];
      let offset = 0;
      for (;;) {
        const {data} = await axios.get(`${CATALOG_BASE_URL}${path}`, {params: {limit: 100, offset}, timeout: 30000, adapter: 'http'});
        raw.push(...data.items);
        if (!data.has_more) {break;}
        offset += data.limit;
        if (offset > 100000) {throw new Error('Unexpected pagination');}
      }
      expect(rows.map(({location: _venue, ...row}) => row)).toEqual(raw);
      expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
      expect(new Set(rows.map(row => row.record_id)).size).toBe(rows.length);
      expect(rows.length).toBeGreaterThan(0);
      process.stdout.write(JSON.stringify({path, count: rows.length, first: {id: rows[0].id, record_id: rows[0].record_id, name: rows[0].name},
        last: {id: rows[rows.length - 1].id, record_id: rows[rows.length - 1].record_id},
        nullRating: rows.filter(row => row.rating === null).length,
        nullFK: path === '/festivals' ? rows.filter(row => row.location_id === null).length : undefined,
        nullLat: path === '/locations' ? rows.filter(row => row.lat === null).length : undefined}) + '\n');
    }
    expect(snapshot.mapMarkers.length).toBeGreaterThan(0);
  }, 180000);
});
