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

// The token is stored as a plain string (LocalStorageCommon would JSON-encode it).
export const tokenStore = {
  get: () => AsyncStorage.getItem(localStorageKey.AUTH_TOKEN),
  set: (token: string) => AsyncStorage.setItem(localStorageKey.AUTH_TOKEN, token),
  clear: () => AsyncStorage.removeItem(localStorageKey.AUTH_TOKEN),
};

// Called when the server rejects the stored token (expired, password changed, account deleted).
let onUnauthorized: (() => Promise<void> | void) | undefined;
export function setUnauthorizedHandler(handler: typeof onUnauthorized) {
  onUnauthorized = handler;
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
  for (let attempt = 0; ; attempt++) {
    try {
      return (await apiRequest.request<T>({...request, headers})).data;
    } catch (error) {
      const apiError = toApiError(error);
      const retryable = method === 'get' && attempt === 0 &&
        (apiError.kind !== 'http' || apiError.status === 429 || (apiError.status ?? 0) >= 500);
      if (!retryable) {
        if (signedIn && apiError.tokenRejected && headers.Authorization && onUnauthorized) {
          await onUnauthorized();
        }
        throw apiError;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
