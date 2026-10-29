import axios from 'axios';
import {CATALOG_API_URL} from '@env';

export const CATALOG_BASE_URL = (CATALOG_API_URL ||
  'https://travel-api-u2xcse44ca-as.a.run.app').replace(/\/$/, '');

// Deliberately independent of the legacy client and its credentials/interceptors.
export const catalogRequest = axios.create({
  baseURL: CATALOG_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: {Accept: 'application/json'},
});

export class CatalogError extends Error {
  constructor(public kind: 'timeout' | 'network' | 'http' | 'contract', public status?: number) {
    super(`Catalog ${kind} error${status ? ` (${status})` : ''}`);
    this.name = 'CatalogError';
  }
}

async function getPage(path: '/locations' | '/festivals', offset: number) {
  for (let attempt = 0; ; attempt++) {
    try {
      return (await catalogRequest.get(path, {params: {limit: 100, offset}})).data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {throw error;}
      const status = error.response?.status;
      const kind = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        ? 'timeout' : status ? 'http' : 'network';
      if (attempt >= 2 || (status && status !== 429 && status < 500) || axios.isCancel(error)) {
        throw new CatalogError(kind, status);
      }
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

export async function fetchCatalog<T extends {id: number}>(
  path: '/locations' | '/festivals', adapt: (record: unknown) => T,
): Promise<T[]> {
  const result: T[] = [];
  const ids = new Set<number>();
  let offset = 0;
  // Bound even a broken server that returns endless fresh records.
  for (let pageNumber = 0; pageNumber < 1000; pageNumber++) {
    const page = await getPage(path, offset);
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

export function createCatalogCache<T>(load: () => Promise<T>) {
  let cached: {data: T; timestamp: number} | undefined;
  let pending: Promise<T> | undefined;
  let generation = 0;
  const clear = () => {generation++; cached = undefined; pending = undefined;};
  const get = (forceRefresh = false): Promise<T> => {
    if (forceRefresh) {clear();}
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {return Promise.resolve(cached.data);}
    if (pending) {return pending;}
    const version = generation;
    pending = load().then(data => {
      if (version === generation) {cached = {data, timestamp: Date.now()};}
      return data;
    }).finally(() => {if (version === generation) {pending = undefined;}});
    return pending;
  };
  return {get, clear};
}
