/**
 * P10: donations go to the Cloud Run API (module `payments`, debt N2) with the account token.
 */
const AsyncStorage = require('@react-native-async-storage/async-storage');
const {apiRequest, tokenStore} = require('../../src/services/api.client');
const paymentApi = require('../../src/services/payment.api').default;

let store;
beforeEach(() => {
  store = {};
  AsyncStorage.setItem.mockImplementation(async (key, value) => {store[key] = value;});
  AsyncStorage.getItem.mockImplementation(async key => (key in store ? store[key] : null));
});
afterEach(() => jest.restoreAllMocks());

it('creates a donation and reads its status through the BE; the donor comes from the token', async () => {
  await tokenStore.set('jwt-1');
  const request = jest.spyOn(apiRequest, 'request')
    .mockResolvedValueOnce({data: {orderCode: 5, paymentLinkId: 'l5', qrCode: 'q', checkoutUrl: 'https://pay'}})
    .mockResolvedValueOnce({data: {status: 'PAID', amountPaid: 10000, orderCode: 5, paymentLinkId: 'l5'}});
  expect((await paymentApi.createDonation({amount: 10000, userId: 99})).orderCode).toBe(5);
  expect((await paymentApi.getStatus(5)).status).toBe('PAID');
  const [create, status] = request.mock.calls.map(([config]) => config);
  expect(create).toMatchObject({method: 'post', url: '/payments/create', data: {amount: 10000}});
  expect(create.data).not.toHaveProperty('userId');
  expect(create.headers.Authorization).toBe('Bearer jwt-1');
  expect(create.baseURL ?? apiRequest.defaults.baseURL).not.toContain('ondigitalocean');
  expect(status).toMatchObject({method: 'get', url: '/payments/status/5'});
});
