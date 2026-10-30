import {IAccount} from '../common/types';
import {localStorageKey} from '../common/constants';
import LocalStorageCommon from '../utils/LocalStorageCommon';
import {ApiError, apiCall, setUnauthorizedHandler, tokenStore} from './api.client';

// Accounts live in the backend (Travel_BE core_api/auth.py): hashing, validation and sessions
// happen there; the app keeps only the JWT (AUTH_TOKEN) and the profile (AVT), never a password.
// Previous NocoDB/SendGrid client: `git show 39fc44a:src/services/auth.api.ts`.

type Gender = 'Male' | 'Female' | 'Other';

interface AccountResponse {
  id: number;
  user_name: string;
  full_name: string | null;
  email: string | null;
  avatar: string | null;
  balance: number;
  phone: string | null;
  gender: Gender | null;
  birthday: string | null;
  address: string | null;
  created_at: string;
}

interface AuthResponse {
  access_token: string;
  account: AccountResponse;
}

export interface ProfileUpdates {
  fullName?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  gender?: Gender;
  birthday?: string;
  address?: string;
}

export function toAccount(raw: AccountResponse): IAccount {
  return {
    id: raw.id,
    userName: raw.user_name,
    fullName: raw.full_name ?? undefined,
    email: raw.email ?? undefined,
    avatar: raw.avatar ?? undefined,
    balance: raw.balance,
    phone: raw.phone ?? undefined,
    gender: raw.gender ?? undefined,
    birthday: raw.birthday ?? undefined,
    address: raw.address ?? undefined,
    CreatedAt: raw.created_at,
  };
}

const PROFILE_FIELDS: Record<keyof ProfileUpdates, string> = {
  fullName: 'full_name', email: 'email', avatar: 'avatar', phone: 'phone',
  gender: 'gender', birthday: 'birthday', address: 'address',
};

async function saveSession(response: AuthResponse): Promise<IAccount> {
  const account = toAccount(response.account);
  await tokenStore.set(response.access_token);
  await LocalStorageCommon.setItem(localStorageKey.AVT, account);
  return account;
}

async function clearSession() {
  await tokenStore.clear();
  await LocalStorageCommon.setItem(localStorageKey.AVT, null);
}

// Any 401 on a signed-in call (token expired/revoked, account deleted) signs the app out.
setUnauthorizedHandler(clearSession);

const authApi = {
  /** Login; returns null for a wrong user name/password, throws on network/server errors. */
  login: async (userName: string, password: string): Promise<IAccount | null> => {
    try {
      const response = await apiCall<AuthResponse>({
        method: 'post', url: '/auth/login', data: {user_name: userName.trim(), password}, signedIn: false,
      });
      return await saveSession(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {return null;}
      throw error;
    }
  },

  /** Sign up. Server messages (duplicate user name/email, invalid data) are thrown as Error.message. */
  signUp: async (
    userName: string,
    password: string,
    fullName: string,
    email: string,
    phone?: string,
    gender?: Gender,
    birthday?: string,
    address?: string,
  ): Promise<IAccount> => {
    const data: Record<string, string> = {user_name: userName.trim(), password, full_name: fullName, email};
    if (phone) {data.phone = phone;}
    if (gender) {data.gender = gender;}
    if (birthday) {data.birthday = birthday;}
    if (address) {data.address = address;}
    const response = await apiCall<AuthResponse>({method: 'post', url: '/auth/signup', data, signedIn: false});
    // The sign-up screen sends the user to Login afterwards, so no session is kept here.
    return toAccount(response.account);
  },

  /** Signed-in profile from the server (the id comes from the token; kept for old callers). */
  getUserById: async (_userId?: number): Promise<IAccount | null> => {
    try {
      const account = toAccount(await apiCall<AccountResponse>({method: 'get', url: '/me'}));
      await LocalStorageCommon.setItem(localStorageKey.AVT, account);
      return account;
    } catch {
      return null;
    }
  },

  updateProfile: async (_accountId: number, updates: ProfileUpdates): Promise<IAccount> => {
    const data: Record<string, string | null> = {};
    (Object.keys(updates) as (keyof ProfileUpdates)[]).forEach(key => {
      const value = updates[key];
      if (value !== undefined) {data[PROFILE_FIELDS[key]] = key === 'avatar' && !value ? null : value;}
    });
    const account = toAccount(await apiCall<AccountResponse>({method: 'patch', url: '/me', data}));
    await LocalStorageCommon.setItem(localStorageKey.AVT, account);
    return account;
  },

  /** Changing the password revokes older tokens; the new token is stored. */
  changePassword: async (_accountId: number, currentPassword: string, newPassword: string): Promise<void> => {
    await saveSession(await apiCall<AuthResponse>({
      method: 'post', url: '/me/change-password',
      data: {current_password: currentPassword, new_password: newPassword},
    }));
  },

  /** Play policy account deletion: the server removes personal data, then the app signs out. */
  deleteAccount: async (password: string): Promise<void> => {
    await apiCall({method: 'delete', url: '/me', data: {password}});
    await clearSession();
  },

  logout: clearSession,

  isLoggedIn: async (): Promise<boolean> => Boolean(await tokenStore.get()),

  // Forgot password by email is debt N1: the backend module `email` is off, so these calls get 404
  // until it is enabled. ForgotPasswordScreen (still commented out of navigation) moves to
  // sendOTPEmail + resetPassword when N1 is done.
  sendOTPEmail: async (email: string): Promise<{success: boolean; error?: string}> => {
    try {
      await apiCall({method: 'post', url: '/auth/forgot-password', data: {email}, signedIn: false});
      return {success: true};
    } catch (error) {
      return {success: false, error: error instanceof ApiError && error.status !== 404
        ? error.message : 'Tính năng quên mật khẩu sẽ có ở bản sau'};
    }
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await apiCall({method: 'post', url: '/auth/reset-password', data: {email, otp, new_password: newPassword}, signedIn: false});
  },

  checkEmailExists: async (_email: string): Promise<IAccount | null> => {
    throw new Error('Tính năng quên mật khẩu sẽ có ở bản sau');
  },

  verifyOTP: (_email: string, _otp: string): {valid: boolean; error?: string} => ({
    valid: false, error: 'Tính năng quên mật khẩu sẽ có ở bản sau',
  }),

  updatePassword: async (_accountId: number, _newPassword: string): Promise<void> => {
    throw new Error('Tính năng quên mật khẩu sẽ có ở bản sau');
  },
};

export default authApi;
