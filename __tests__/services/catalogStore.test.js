jest.mock('../../src/services/catalog.client', () => ({
  ...jest.requireActual('../../src/services/catalog.client'), fetchCatalog: jest.fn(),
}));
const AsyncStorage = require('@react-native-async-storage/async-storage');
const {fetchCatalog} = require('../../src/services/catalog.client');
const {adaptLocation} = require('../../src/services/catalog.adapter');
const {readCatalog, writeCatalog, createPersistentCatalog} = require('../../src/services/catalogStore');
const repository = require('../../src/services/catalogRepository').default;
const location = (id, extra = {}) => ({id, record_id: String(id), name: `Place ${id}`, types: [],
  description: '', long_description: '', rating: null, images: [], videos: [], advise: [],
  website: '', phone: '', ticket_info: '', publishable: true, address: '', lat: 16, long: 108,
  opening_hours: '', avatar: '', ...extra});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
};
const flush = async () => {for (let i = 0; i < 15; i++) {await Promise.resolve();}};
let storage;
beforeEach(async () => {
  storage = {};
  AsyncStorage.getItem.mockImplementation(async key => storage[key] ?? null);
  AsyncStorage.setItem.mockImplementation(async (key, value) => {storage[key] = value;});
  AsyncStorage.removeItem.mockImplementation(async key => {delete storage[key];});
  await repository.clear();
  fetchCatalog.mockReset();
});
afterEach(() => jest.restoreAllMocks());
const seed = (resource, items, savedAt = 1234) => {
  storage[`catalog:v1:${resource}`] = JSON.stringify({schemaVersion: 1, savedAt, items});
};

it('writes one versioned DTO snapshot per resource and revalidates on read', async () => {
  await writeCatalog('locations', [location(1)], 1234);
  expect(JSON.parse(storage['catalog:v1:locations'])).toEqual({schemaVersion: 1, savedAt: 1234, items: [location(1)]});
  expect(await readCatalog('locations', adaptLocation)).toMatchObject({savedAt: 1234, items: [{id: 1, review_count: 0, content_en: {}}]});
});
it.each(['broken JSON', JSON.stringify({schemaVersion: 2, savedAt: 1234, items: []}),
  JSON.stringify({schemaVersion: 1, savedAt: '1234', items: []}),
  JSON.stringify({schemaVersion: 1, savedAt: 1234, items: [{id: 1}]}),
  JSON.stringify({schemaVersion: 1, savedAt: 1234, items: [location(1), location(1)]})])('ignores invalid snapshots: %s', async value => {
  storage['catalog:v1:locations'] = value;
  expect(await readCatalog('locations', adaptLocation)).toBeUndefined();
});
it('returns a cold snapshot before network settles, refreshes and notifies subscribers', async () => {
  seed('locations', [location(1)]); seed('festivals', []);
  const network = deferred();
  fetchCatalog.mockImplementation(path => path === '/locations' ? network.promise : Promise.resolve([]));
  const listener = jest.fn(); const unsubscribe = repository.subscribe(listener);
  expect((await repository.get()).locations[0].id).toBe(1);
  expect(repository.meta()).toEqual({savedAt: 1234, fromCache: true});
  network.resolve([location(2)]); await flush();
  expect((await repository.get()).locations[0].id).toBe(2);
  expect(repository.meta().fromCache).toBe(false);
  expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({locations: [location(2)]}));
  unsubscribe(); const calls = listener.mock.calls.length;
  await repository.refresh(); expect(listener).toHaveBeenCalledTimes(calls);
});
it('network wins when disk hydration arrives later', async () => {
  const disk = deferred();
  AsyncStorage.getItem.mockReturnValue(disk.promise);
  const cache = createPersistentCatalog('locations', adaptLocation, async () => [location(2)], jest.fn());
  expect(await cache.get()).toEqual([location(2)]);
  disk.resolve(JSON.stringify({schemaVersion: 1, savedAt: 1234, items: [location(1)]})); await flush();
  expect(await cache.get()).toEqual([location(2)]);
  expect(cache.peek().fromCache).toBe(false);
});
it('persists a successful resource when the other fails and keeps hotels lazy', async () => {
  fetchCatalog.mockImplementation(path => path === '/locations' ? Promise.resolve([location(1)]) : Promise.reject(new Error('offline')));
  await expect(repository.get()).rejects.toThrow('offline'); await flush();
  expect(JSON.parse(storage['catalog:v1:locations']).items).toEqual([location(1)]);
  expect(storage['catalog:v1:festivals']).toBeUndefined();
  expect(fetchCatalog.mock.calls.map(([path]) => path)).not.toContain('/hotels');
});
it('hydrates hotels lazily and clear removes all three keys', async () => {
  seed('hotels', [location(1, {category: null})]);
  const network = deferred(); fetchCatalog.mockReturnValue(network.promise);
  expect((await repository.getHotels())[0]).toMatchObject({id: 1, kind: 'hotel'});
  network.resolve([]); await flush(); await repository.clear();
  expect(Object.keys(storage)).toEqual([]);
});
it('clear prevents late requests from repopulating disk and memory', async () => {
  const network = deferred(); fetchCatalog.mockReturnValue(network.promise);
  const request = repository.get(); await repository.clear();
  network.resolve([location(2)]); await request; await flush();
  expect(storage).toEqual({}); expect(repository.meta().savedAt).toBeNull();
});

it('uses a valid snapshot even when network failure arrives before hydration', async () => {
  const disk = deferred(); AsyncStorage.getItem.mockReturnValue(disk.promise);
  const cache = createPersistentCatalog('locations', adaptLocation, async () => {throw new Error('offline');}, jest.fn());
  const result = cache.get(); await flush();
  disk.resolve(JSON.stringify({schemaVersion: 1, savedAt: 1234, items: [location(1)]}));
  expect((await result)[0].id).toBe(1);
});
