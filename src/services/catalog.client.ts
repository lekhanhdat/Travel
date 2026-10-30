import axios from 'axios';
import {CATALOG_API_URL} from '@env';

export const CATALOG_BASE_URL = (CATALOG_API_URL ||
  'https://travel-api-u2xcse44ca-as.a.run.app').replace(/\/$/, '');

// Per request; one retry; the whole list load (all pages) must finish within the deadline.
export const CATALOG_REQUEST_TIMEOUT_MS = 12000;
export const CATALOG_DEADLINE_MS = 30000;
const RETRY_DELAY_MS = 500;

// Deliberately independent of the legacy client and its credentials/interceptors.
export const catalogRequest = axios.create({
  baseURL: CATALOG_BASE_URL,
  timeout: CATALOG_REQUEST_TIMEOUT_MS,
  withCredentials: false,
  headers: {Accept: 'application/json'},
});

export class CatalogError extends Error {
  constructor(public kind: 'timeout' | 'network' | 'http' | 'contract', public status?: number) {
    super(`Catalog ${kind} error${status ? ` (${status})` : ''}`);
    this.name = 'CatalogError';
  }
}

async function getPage(path: '/locations' | '/festivals', offset: number, deadline: number) {
  for (let attempt = 0; ; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {throw new CatalogError('timeout');}
    try {
      return (await catalogRequest.get(path, {
        params: {limit: 100, offset},
        timeout: Math.min(CATALOG_REQUEST_TIMEOUT_MS, remaining),
      })).data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {throw error;}
      const status = error.response?.status;
      const kind = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        ? 'timeout' : status ? 'http' : 'network';
      // Retry once for timeout/network/429/5xx, and only if the deadline leaves room for it.
      if (attempt >= 1 || (status && status !== 429 && status < 500) || axios.isCancel(error) ||
          deadline - Date.now() <= RETRY_DELAY_MS) {
        throw new CatalogError(kind, status);
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function fetchCatalog<T extends {id: number}>(
  path: '/locations' | '/festivals', adapt: (record: unknown) => T,
): Promise<T[]> {
  const result: T[] = [];
  const ids = new Set<number>();
  let offset = 0;
  const deadline = Date.now() + CATALOG_DEADLINE_MS;
  // Bound even a broken server that returns endless fresh records.
  for (let pageNumber = 0; pageNumber < 1000; pageNumber++) {
    const page = await getPage(path, offset, deadline);
    if (!page || !Array.isArray(page.items) || typeof page.has_more !== 'boolean' ||
        page.offset !== offset || !Number.isInteger(page.limit) || page.limit < 1 || page.limit > 100 ||
        page.items.length > page.limit || (page.has_more && page.items.length !== page.limit)) {
      throw new CatalogError('contract');
    }
    for (const raw of page.items) {
      const record = adapt(raw);
      if (ids.has(record.id)) {throw new CatalogError('contract');}
      ids.add(record.id);
      result.push(record);
    }
    if (!page.has_more) {return result;}
    offset += page.limit;
  }
  throw new CatalogError('contract');
}

export const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000;

// TTL cache shared by concurrent callers. A failed load never drops the last good data:
// an explicit refresh still rejects (so the UI can offer Retry), while a plain get after
// the TTL falls back to the stale data instead of failing offline.
export function createCatalogCache<T>(load: () => Promise<T>) {
  let cached: {data: T; timestamp: number} | undefined;
  let pending: Promise<T> | undefined;
  let generation = 0;
  const clear = () => {generation++; cached = undefined; pending = undefined;};
  const get = (forceRefresh = false): Promise<T> => {
    if (forceRefresh) {generation++; pending = undefined;}
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CATALOG_CACHE_TTL_MS) {
      return Promise.resolve(cached.data);
    }
    if (pending) {return pending;}
    const version = generation;
    const stale = cached;
    pending = load().then(data => {
      if (version === generation) {cached = {data, timestamp: Date.now()};}
      return data;
    }, error => {
      if (!forceRefresh && stale) {return stale.data;}
      throw error;
    }).finally(() => {if (version === generation) {pending = undefined;}});
    return pending;
  };
  return {get, clear};
}
