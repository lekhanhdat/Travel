/**
 * P6.1: auth.api talks to the backend auth module; the app keeps only the token + profile.
 */
const AsyncStorage = require('@react-native-async-storage/async-storage');
const {apiRequest, ApiError} = require('../../src/services/api.client');
const authApi = require('../../src/services/auth.api').default;

const ACCOUNT = {
  id: 7, user_name: 'seed1', full_name: 'Seed', email: 'seed@example.com', avatar: null, balance: 5000,
  phone: null, gender: 'Male', birthday: null, address: null, created_at: '2026-10-30T00:00:00Z',
};

function httpError(status, detail, headers = {}) {
  const error = new Error(`HTTP ${status}`);
  error.isAxiosError = true;
  error.response = {status, data: detail === undefined ? {} : {detail}, headers};
  return error;
}

let store;
beforeEach(() => {
  store = {};
  AsyncStorage.setItem.mockImplementation(async (key, value) => {store[key] = value;});
  AsyncStorage.getItem.mockImplementation(async key => (key in store ? store[key] : null));
  AsyncStorage.removeItem.mockImplementation(async key => {delete store[key];});
});
afterEach(() => jest.restoreAllMocks());

const profile = () => JSON.parse(store.AVT ?? 'null');

describe('auth.api (backend)', () => {
  it('login stores the token and the profile, never the password', async () => {
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {access_token: 'jwt-1', account: ACCOUNT}});
    const account = await authApi.login(' seed1 ', 'matkhau1');
    expect(request.mock.calls[0][0]).toMatchObject({method: 'post', url: '/auth/login', data: {user_name: 'seed1', password: 'matkhau1'}});
    expect(request.mock.calls[0][0].headers.Authorization).toBeUndefined();
    expect(account).toMatchObject({id: 7, userName: 'seed1', fullName: 'Seed', balance: 5000, gender: 'Male'});
    expect(store.AUTH_TOKEN).toBe('jwt-1');
    expect(profile()).toEqual(account);
    expect(JSON.stringify(store)).not.toContain('matkhau1');
    expect(store.PASSWORD).toBeUndefined();
  });

  it('login returns null for wrong credentials and keeps no session', async () => {
    jest.spyOn(apiRequest, 'request').mockRejectedValue(httpError(401, 'Sai tên đăng nhập hoặc mật khẩu'));
    await expect(authApi.login('seed1', 'sai')).resolves.toBeNull();
    expect(store.AUTH_TOKEN).toBeUndefined();
  });

  it('surfaces server messages (rate limit, duplicates) and network failures in Vietnamese', async () => {
    const request = jest.spyOn(apiRequest, 'request');
    request.mockRejectedValueOnce(httpError(429, 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau'));
    await expect(authApi.login('seed1', 'x')).rejects.toThrow('Bạn thao tác quá nhiều lần');
    request.mockRejectedValueOnce(httpError(409, 'Tên đăng nhập hoặc email đã được sử dụng'));
    await expect(authApi.signUp('seed1', 'matkhau1', 'Seed', 'seed@example.com')).rejects.toThrow('đã được sử dụng');
    request.mockRejectedValueOnce(httpError(422, [{loc: ['body', 'email']}]));
    await expect(authApi.signUp('x', 'matkhau1', 'X', 'bad')).rejects.toThrow('Thông tin chưa hợp lệ');
    request.mockRejectedValueOnce(Object.assign(new Error('Network Error'), {isAxiosError: true}));
    const error = await authApi.login('seed1', 'x').catch(e => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('network');
    expect(error.message).toContain('Không thể kết nối');
  });

  it('signUp sends snake_case fields and does not sign in', async () => {
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {access_token: 'jwt-2', account: ACCOUNT}});
    await authApi.signUp('new1', 'matkhau1', 'Người Mới', 'new@example.com', '0905', 'Female', '01/01/2000', 'Đà Nẵng');
    expect(request.mock.calls[0][0]).toMatchObject({
      method: 'post', url: '/auth/signup',
      data: {user_name: 'new1', password: 'matkhau1', full_name: 'Người Mới', email: 'new@example.com',
        phone: '0905', gender: 'Female', birthday: '01/01/2000', address: 'Đà Nẵng'},
    });
    expect(store.AUTH_TOKEN).toBeUndefined();
  });

  it('profile calls send the token; updateProfile maps fields and clears the avatar with null', async () => {
    store.AUTH_TOKEN = 'jwt-1';
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {...ACCOUNT, full_name: 'Tên Mới'}});
    const account = await authApi.updateProfile(7, {fullName: 'Tên Mới', avatar: '', gender: undefined});
    const call = request.mock.calls[0][0];
    expect(call).toMatchObject({method: 'patch', url: '/me', data: {full_name: 'Tên Mới', avatar: null}});
    expect(call.data).not.toHaveProperty('gender');
    expect(call.headers.Authorization).toBe('Bearer jwt-1');
    expect(account.fullName).toBe('Tên Mới');
    expect(profile().fullName).toBe('Tên Mới');
  });

  it('changePassword stores the new token (older tokens are revoked by the server)', async () => {
    store.AUTH_TOKEN = 'jwt-old';
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {access_token: 'jwt-new', account: ACCOUNT}});
    await authApi.changePassword(7, 'cu', 'moi12345');
    expect(request.mock.calls[0][0]).toMatchObject({url: '/me/change-password', data: {current_password: 'cu', new_password: 'moi12345'}});
    expect(store.AUTH_TOKEN).toBe('jwt-new');
  });

  it('a wrong password (plain 401) keeps the session; a rejected token signs out', async () => {
    store.AUTH_TOKEN = 'jwt-1';
    store.AVT = JSON.stringify({id: 7});
    const request = jest.spyOn(apiRequest, 'request');
    request.mockRejectedValueOnce(httpError(401, 'Mật khẩu hiện tại không đúng'));
    await expect(authApi.changePassword(7, 'sai', 'moi12345')).rejects.toThrow('Mật khẩu hiện tại không đúng');
    expect(store.AUTH_TOKEN).toBe('jwt-1');
    request.mockRejectedValueOnce(httpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn', {'www-authenticate': 'Bearer'}));
    await expect(authApi.getUserById()).resolves.toBeNull();
    expect(store.AUTH_TOKEN).toBeUndefined();
    expect(profile()).toBeNull();
  });

  it('deleteAccount sends the password then clears the session', async () => {
    store.AUTH_TOKEN = 'jwt-1';
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {detail: 'Tài khoản đã được xóa'}});
    await authApi.deleteAccount('matkhau1');
    expect(request.mock.calls[0][0]).toMatchObject({method: 'delete', url: '/me', data: {password: 'matkhau1'}});
    expect(store.AUTH_TOKEN).toBeUndefined();
    expect(await authApi.isLoggedIn()).toBe(false);
  });

  it('retries a failed GET once, never a write', async () => {
    store.AUTH_TOKEN = 'jwt-1';
    const request = jest.spyOn(apiRequest, 'request')
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce({data: ACCOUNT});
    await expect(authApi.getUserById()).resolves.toMatchObject({id: 7});
    expect(request).toHaveBeenCalledTimes(2);
    request.mockReset().mockRejectedValue(httpError(503));
    await expect(authApi.updateProfile(7, {phone: '1'})).rejects.toBeInstanceOf(ApiError);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('forgot password is debt N1: a disabled backend module gives a clear message', async () => {
    jest.spyOn(apiRequest, 'request').mockRejectedValue(httpError(404, 'Not Found'));
    await expect(authApi.sendOTPEmail('a@b.vn')).resolves.toEqual({success: false, error: 'Tính năng quên mật khẩu sẽ có ở bản sau'});
    expect(authApi.verifyOTP('a@b.vn', '123456').valid).toBe(false);
  });

  it('no request reaches NocoDB, SendGrid or any host other than the API', async () => {
    const source = require('fs').readFileSync(require('path').join(__dirname, '../../src/services/auth.api.ts'), 'utf8');
    expect(source).not.toMatch(/nocodb\.com|api\.sendgrid\.com|from 'crypto-js'|from '\.\/axios'|https?:\/\//i);
  });
});
