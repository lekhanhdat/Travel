/**
 * P8: Camera → POST /detect on Cloud Run with the account token; guests are asked to log in.
 */
jest.mock('rn-fetch-blob', () => {
  const fetch = jest.fn();
  return {__esModule: true, default: {config: jest.fn(() => ({fetch})), wrap: path => `RNFetchBlob-file://${path}`, fetch}};
});
jest.mock('react-native-vision-camera', () => ({Camera: {requestCameraPermission: jest.fn(), requestMicrophonePermission: jest.fn(),
  getAvailableCameraDevices: jest.fn(() => [])}}));
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));
jest.mock('react-native-paper', () => ({ActivityIndicator: 'Spinner', Modal: 'Modal', Portal: 'Portal'}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
jest.mock('react-native-image-viewing', () => 'ImageView');
jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/assets/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('../src/component/HeaderBase', () => 'Header');
jest.mock('../src/component/CameraResultModal', () => 'ResultModal');
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn(), pop: jest.fn()}));
jest.mock('../src/utils/requireLogin', () => ({requireLogin: jest.fn()}));
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));

const RNFetchBlob = require('rn-fetch-blob').default;
const Toast = require('react-native-toast-message');
const {Camera} = require('react-native-vision-camera');
const {requireLogin} = require('../src/utils/requireLogin');
const {tokenStore} = require('../src/services/api.client');
const {env} = require('../src/utils/env');
const {detectImage, DetectError} = require('../src/services/detect.api');
const CameraScreen = require('../src/container/screens/Camera/CameraScreen').default;
const PreviewImage = require('../src/container/screens/Camera/PreviewImage').default;
const AsyncStorage = require('@react-native-async-storage/async-storage');

const reply = (status, body) => ({info: () => ({status}), data: typeof body === 'string' ? body : JSON.stringify(body)});
const fetchMock = () => RNFetchBlob.config().fetch;

let store;
beforeEach(() => {
  jest.clearAllMocks();
  store = {};
  AsyncStorage.setItem.mockImplementation(async (key, value) => {store[key] = value;});
  AsyncStorage.getItem.mockImplementation(async key => (key in store ? store[key] : null));
});

function instance(Component, props) {
  const screen = new Component(props);
  screen.setState = update => {screen.state = {...screen.state, ...update};};
  return screen;
}

describe('detect.api', () => {
  it('posts the photo to API_BASE_URL/detect with the bearer token', async () => {
    await tokenStore.set('jwt-7');
    fetchMock().mockResolvedValue(reply(200, {name: 'Cầu Rồng', description: 'Mô tả', object_id: 1}));
    expect(await detectImage('/data/photo.jpg')).toEqual({name: 'Cầu Rồng', description: 'Mô tả', object_id: 1});
    const [method, url, headers, parts] = fetchMock().mock.calls[0];
    expect([method, url]).toEqual(['POST', `${env.API_BASE_URL}/detect`]);
    expect(url).not.toContain('ondigitalocean');
    expect(headers).toEqual({'Content-Type': 'multipart/form-data', Authorization: 'Bearer jwt-7'});
    expect(parts).toEqual([{name: 'image_file', filename: 'image.jpg', type: 'image/jpeg',
      data: 'RNFetchBlob-file:///data/photo.jpg'}]);
  });

  it('turns BE errors into their Vietnamese detail', async () => {
    fetchMock().mockResolvedValueOnce(reply(429, {detail: 'Hôm nay đã hết lượt nhận diện'}));
    await expect(detectImage('/p.jpg')).rejects.toEqual(new DetectError(429, 'Hôm nay đã hết lượt nhận diện'));
    fetchMock().mockResolvedValueOnce(reply(502, '<html>bad gateway</html>'));
    await expect(detectImage('/p.jpg')).rejects.toMatchObject({status: 502, message: 'Server trả về lỗi: 502'});
    fetchMock().mockResolvedValueOnce(reply(200, {unexpected: true}));
    await expect(detectImage('/p.jpg')).rejects.toMatchObject({message: 'Không thể xử lý kết quả từ server'});
  });
});

describe.each([['CameraScreen', CameraScreen], ['PreviewImage', PreviewImage]])('%s', (_, Screen) => {
  it('a guest is sent to Login and nothing is uploaded', async () => {
    requireLogin.mockResolvedValue(false);
    const screen = instance(Screen, {navigation: {addListener: jest.fn()}, route: {params: {}}});
    await screen.uploadImage('/p.jpg');
    expect(fetchMock()).not.toHaveBeenCalled();
  });

  it('a signed-in user gets the result; a BE refusal shows its message', async () => {
    requireLogin.mockResolvedValue(true);
    fetchMock().mockResolvedValueOnce(reply(200, {name: 'Nón lá', description: 'Biểu tượng', object_id: 2}));
    const screen = instance(Screen, {navigation: {addListener: jest.fn()}, route: {params: {}}});
    await screen.uploadImage('/p.jpg');
    expect(screen.state).toMatchObject({visible: true, resultName: 'Nón lá', resultDescription: 'Biểu tượng',
      resultPhotoPath: '/p.jpg', isDetecting: false});
    fetchMock().mockResolvedValueOnce(reply(404, {detail: 'Không nhận diện được hiện vật trong ảnh'}));
    await screen.uploadImage('/p.jpg');
    expect(Toast.show).toHaveBeenLastCalledWith({type: 'error', text1: 'Không nhận diện được',
      text2: 'Không nhận diện được hiện vật trong ảnh'});
    expect(screen.state.isDetecting).toBe(false);
  });
});

it('Camera asks only for the camera permission (photos only)', async () => {
  global.fetch = jest.fn(async () => ({ok: true, status: 200, json: async () => ({})}));
  Camera.requestCameraPermission.mockResolvedValue('granted');
  const screen = instance(CameraScreen, {navigation: {addListener: jest.fn()}});
  await screen.componentDidMount();
  expect(Camera.requestMicrophonePermission).not.toHaveBeenCalled();
  expect(screen.state.hasPermission).toBe(true);
  expect(global.fetch).toHaveBeenCalledWith(`${env.API_BASE_URL}/`, expect.anything());
});
