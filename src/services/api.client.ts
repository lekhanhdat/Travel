import axios, {AxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {env} from '../utils/env';
import {localStorageKey} from '../common/constants';

// Authenticated calls to the Cloud Run API (auth now; reviews/uploads/AI in later phases).
// Same service and timeout as catalog.client; only GETs are retried (writes are not idempotent).
export const API_REQUEST_TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 500;

export const apiRequest = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
  withCredentials: false,
  headers: {Accept: 'application/json'},
});

export class ApiError extends Error {
  constructor(public kind: 'timeout' | 'network' | 'http', public status?: number, message?: string,
              public tokenRejected = false) {
    super(message || (kind === 'http' ? `Lỗi máy chủ (${status})` : 'Không thể kết nối đến server. Vui lòng thử lại sau.'));
    this.name = 'ApiError';
  }
}

// Session = short access token (sent on every call) + long refresh token (only sent to /auth/refresh).
// Tokens are stored as plain strings (LocalStorageCommon would JSON-encode them).
const ACCESS_KEY = localStorageKey.AUTH_TOKEN;
const REFRESH_KEY = localStorageKey.REFRESH_TOKEN;
const EXPIRES_AT_KEY = localStorageKey.AUTH_TOKEN_EXPIRES_AT;
// Refresh this long before the access token expires, so a call never goes out with a dying token.
const REFRESH_MARGIN_MS = 60 * 1000;

export interface TokenPair {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}

// Called when the session is over (refresh token rejected or missing: expired, password changed,
// account deleted) and after a refresh (the server sends the account again).
let onUnauthorized: (() => Promise<void> | void) | undefined;
let onRefreshed: ((pair: TokenPair & Record<string, unknown>) => Promise<void> | void) | undefined;
export function setUnauthorizedHandler(handler: typeof onUnauthorized) {
  onUnauthorized = handler;
}
export function setSessionRefreshedHandler(handler: typeof onRefreshed) {
  onRefreshed = handler;
}

export const tokenStore = {
  /** Access token for a signed-in call, refreshed first when it is about to expire; null when signed out. */
  get: async (): Promise<string | null> => {
    const token = await AsyncStorage.getItem(ACCESS_KEY);
    if (!token) {return null;}
    const expiresAt = await AsyncStorage.getItem(EXPIRES_AT_KEY);
    if (expiresAt && Date.now() > Number(expiresAt) - REFRESH_MARGIN_MS) {
      try {
        return await refreshSession();
      } catch {
        return token; // offline: let the call go out and fail on its own
      }
    }
    return token;
  },
  /** Access token only (no expiry known, never refreshed early): kept for callers and tests. */
  set: (token: string) => AsyncStorage.setItem(ACCESS_KEY, token),
  save: async (pair: TokenPair) => {
    await AsyncStorage.setItem(ACCESS_KEY, pair.access_token);
    if (pair.refresh_token) {await AsyncStorage.setItem(REFRESH_KEY, pair.refresh_token);}
    if (pair.expires_in) {
      await AsyncStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + pair.expires_in * 1000));
    } else {
      await AsyncStorage.removeItem(EXPIRES_AT_KEY);
    }
  },
  clear: async () => {
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
    await AsyncStorage.removeItem(EXPIRES_AT_KEY);
  },
};

let refreshing: Promise<string | null> | null = null;

/** New access token from the refresh token (one request at a time). Null = session over (handler called);
 * throws on network/server errors, so being offline never signs the user out. */
export function refreshSession(): Promise<string | null> {
  if (refreshing) {return refreshing;}
  refreshing = (async () => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      await onUnauthorized?.();
      return null;
    }
    try {
      const {data} = await apiRequest.post<TokenPair & Record<string, unknown>>(
        '/auth/refresh', {refresh_token: refreshToken});
      await tokenStore.save(data);
      await onRefreshed?.(data);
      return data.access_token;
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'http' && (apiError.status === 401 || apiError.status === 422)) {
        await onUnauthorized?.();
        return null;
      }
      throw apiError;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError('network');
  }
  const status = error.response?.status;
  if (!status) {
    const timeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    return new ApiError(timeout ? 'timeout' : 'network');
  }
  const detail = (error.response?.data as {detail?: unknown} | undefined)?.detail;
  // FastAPI: a string for our errors, a list for validation errors (422).
  const message = typeof detail === 'string' ? detail : status === 422 ? 'Thông tin chưa hợp lệ' : undefined;
  // The backend marks token failures with WWW-Authenticate; a wrong password is a plain 401.
  const tokenRejected = status === 401 && Boolean(error.response?.headers?.['www-authenticate']);
  return new ApiError('http', status, message, tokenRejected);
}

export async function apiCall<T>(config: AxiosRequestConfig & {signedIn?: boolean}): Promise<T> {
  const {signedIn = true, ...request} = config;
  const headers: Record<string, string> = {...(request.headers as Record<string, string> | undefined)};
  if (signedIn) {
    const token = await tokenStore.get();
    if (token) {headers.Authorization = `Bearer ${token}`;}
  }
  const method = (request.method || 'get').toLowerCase();
  let refreshed = false;
  for (let attempt = 0; ; attempt++) {
    try {
      return (await apiRequest.request<T>({...request, headers: {...headers}})).data;
    } catch (error) {
      const apiError = toApiError(error);
      // Access token rejected (expired early, revoked): refresh once and resend the same request.
      if (signedIn && apiError.tokenRejected && headers.Authorization && !refreshed) {
        refreshed = true;
        let token: string | null;
        try {
          token = await refreshSession();
        } catch {
          throw apiError;
        }
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          continue;
        }
        throw apiError;
      }
      const retryable = method === 'get' && attempt === 0 &&
        (apiError.kind !== 'http' || apiError.status === 429 || (apiError.status ?? 0) >= 500);
      if (!retryable) {
        throw apiError;
      }
      await new Promise<void>(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
