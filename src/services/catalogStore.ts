import AsyncStorage from '@react-native-async-storage/async-storage';
import {CATALOG_CACHE_TTL_MS} from './catalog.client';

export type CatalogResource = 'locations' | 'festivals' | 'hotels';
export type StoredCatalog<T> = {schemaVersion: 1; savedAt: number; items: T[]};
const key = (resource: CatalogResource) => `catalog:v1:${resource}`;

export async function readCatalog<T extends {id: number}>(resource: CatalogResource, adapt: (raw: unknown) => T): Promise<StoredCatalog<T> | undefined> {
  try {
    const value = await AsyncStorage.getItem(key(resource));
    if (!value) {return undefined;}
    const snapshot = JSON.parse(value);
    if (snapshot.schemaVersion !== 1 || !Number.isFinite(snapshot.savedAt) || snapshot.savedAt <= 0 ||
        !Array.isArray(snapshot.items)) {return undefined;}
    const items = snapshot.items.map(adapt) as T[];
    if (new Set(items.map(item => item.id)).size !== items.length) {return undefined;}
    return {schemaVersion: 1, savedAt: snapshot.savedAt, items};
  } catch {return undefined;}
}

export function writeCatalog<T>(resource: CatalogResource, items: T[], savedAt = Date.now()) {
  return AsyncStorage.setItem(key(resource), JSON.stringify({schemaVersion: 1, savedAt, items}));
}

/** Independent resource cache. Network starts alongside hydration; a late disk read cannot replace it. */
export function createPersistentCatalog<T extends {id: number}>(
  resource: CatalogResource, adapt: (raw: unknown) => T, load: () => Promise<T[]>, onRefresh: () => void,
) {
  let current: {items: T[]; savedAt: number; fromCache: boolean} | undefined;
  let generation = 0;
  let pending: Promise<T[]> | undefined;
  let hydration: Promise<T[] | undefined> | undefined;
  let writes = Promise.resolve();
  const enqueue = (operation: () => Promise<void>) => {
    writes = writes.catch(() => {}).then(operation);
    return writes;
  };
  const refresh = (force: boolean) => {
    if (pending && !force) {return pending;}
    const version = ++generation;
    const stale = current;
    pending = load().then(items => {
      if (version === generation) {
        current = {items, savedAt: Date.now(), fromCache: false};
        const savedAt = current.savedAt;
        enqueue(() => version === generation ? writeCatalog(resource, items, savedAt) : Promise.resolve()).catch(() => {});
        onRefresh();
      }
      return items;
    }, error => {
      if (!force && (current || stale)) {return (current || stale)!.items;}
      throw error;
    }).finally(() => {if (version === generation) {pending = undefined;}});
    return pending;
  };
  const get = (force = false): Promise<T[]> => {
    if (force) {return refresh(true);}
    if (current) {
      if (current.fromCache) {refresh(false).catch(() => {}); return Promise.resolve(current.items);}
      if (Date.now() - current.savedAt < CATALOG_CACHE_TTL_MS) {return Promise.resolve(current.items);}
      return refresh(false);
    }
    const network = refresh(false);
    if (!hydration) {
      const version = generation;
      hydration = writes.catch(() => {}).then(() => readCatalog(resource, adapt)).then(snapshot => {
        if (snapshot && version === generation && !current) {
          current = {...snapshot, fromCache: true};
          onRefresh();
        }
        return current?.items;
      });
    }
    // An absent/invalid snapshot must wait for the network, including its error.
    return Promise.race([network.catch(async error => {
      const items = await hydration;
      if (items) {return items;}
      throw error;
    }), hydration.then(items => items ?? network)]);
  };
  return {
    get,
    peek: () => current,
    clear: () => {
      generation++;
      current = undefined;
      pending = undefined;
      hydration = undefined;
      return enqueue(() => AsyncStorage.removeItem(key(resource)));
    },
  };
}
