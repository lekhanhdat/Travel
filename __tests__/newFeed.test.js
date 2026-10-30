/**
 * P7: review/upload services through the BE, the Feed (guest → Login, signed in → POST /uploads + /reviews)
 * and ReviewItem's "Báo cáo" / "Xóa".
 */
const React = require('react');
const renderer = require('react-test-renderer');

jest.mock('axios', () => jest.requireActual(require('path').join(require.resolve('axios/package.json'), '..', 'dist', 'node', 'axios.cjs')));
jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/assets/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {LOGIN_SCREEN: 'LoginScreen'}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn()}));
jest.mock('../src/utils/requireLogin', () => ({requireLogin: jest.fn()}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
jest.mock('react-native-paper', () => ({TextInput: Object.assign(() => null, {Icon: () => null}), Button: 'Button'}));
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('../src/component/HeaderBase', () => 'Header');
jest.mock('../src/component/BottomSheet', () => 'BottomSheet');
jest.mock('../src/component/LargeItemLocation', () => 'LocationCard');
jest.mock('../src/component/CachedImage', () => 'CachedImage');

const {Alert} = require('react-native');
const Toast = require('react-native-toast-message');
const {requireLogin} = require('../src/utils/requireLogin');
const {apiRequest, tokenStore} = require('../src/services/api.client');
const catalogRepository = require('../src/services/catalogRepository').default;
const {buildCatalogSnapshot} = require('../src/services/catalogRepository');
const locationApi = require('../src/services/locations.api').default;
const festivalsApi = require('../src/services/festivals.api').default;
const reviewsApi = require('../src/services/reviews.api').default;
const NewFeedScreen = require('../src/container/screens/NewFeed/NewFeedScreen').default;
const ReviewItem = require('../src/component/ReviewItem').default;
const LocalStorageCommon = require('../src/utils/LocalStorageCommon').default;
const AsyncStorage = require('@react-native-async-storage/async-storage');

const VENUE = {id: 7, name: 'Bà Nà Hills'};
const dto = (id, extra = {}) => ({id, location_id: 7, festival_id: null, rating: 5, content: `Hay ${id}`, images: [],
  created_at: '2026-10-30T02:05:00Z', author: {id: 3, user_name: 'u3', full_name: 'Người Ba', avatar: null}, ...extra});

let store;
beforeEach(() => {
  jest.clearAllMocks();
  store = {};
  AsyncStorage.setItem.mockImplementation(async (key, value) => {store[key] = value;});
  AsyncStorage.getItem.mockImplementation(async key => (key in store ? store[key] : null));
  jest.spyOn(catalogRepository, 'get').mockResolvedValue(
    buildCatalogSnapshot([VENUE], [{id: 2, name: 'Lễ hội pháo hoa', location_id: 7}]));
});
afterEach(() => jest.restoreAllMocks());

function instance(Component, props) {
  const screen = new Component(props);
  screen.setState = (update, callback) => {
    screen.state = {...screen.state, ...(typeof update === 'function' ? update(screen.state) : update)};
    callback?.();
  };
  return screen;
}

describe('review + upload services (BE)', () => {
  it('uploads one picked image as multipart with the token and a long timeout', async () => {
    await tokenStore.set('jwt-7');
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {url: 'https://storage.googleapis.com/b/uploads/7/x.jpg'}});
    const result = await locationApi.uploadImage({uri: 'file:///a.jpg', type: 'image/jpeg', fileName: 'a.jpg', fileSize: 1000});
    expect(result).toEqual({url: 'https://storage.googleapis.com/b/uploads/7/x.jpg'});
    const config = request.mock.calls[0][0];
    expect(config).toMatchObject({method: 'post', url: '/uploads', timeout: 60000});
    expect(config.headers).toMatchObject({Authorization: 'Bearer jwt-7', 'Content-Type': 'multipart/form-data'});
    expect(config.data).toBeInstanceOf(FormData);
  });

  it('refuses an image over 2 MB before sending it', async () => {
    const request = jest.spyOn(apiRequest, 'request');
    await expect(locationApi.uploadImage({uri: 'file:///big.jpg', fileSize: 2 * 1024 * 1024 + 1}))
      .rejects.toMatchObject({status: 413, message: 'Ảnh vượt quá 2 MB'});
    expect(request).not.toHaveBeenCalled();
  });

  it('createReview / addReview send only what the BE accepts; the author comes from the token', async () => {
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: dto(11, {images: ['https://x/a.jpg']})});
    const clear = jest.spyOn(catalogRepository, 'clear');
    const saved = await locationApi.createReview({location: VENUE, start: 5, content: 'Hay', images: ['https://x/a.jpg'],
      name_user_review: 'giả mạo'});
    expect(request.mock.calls[0][0]).toMatchObject({method: 'post', url: '/reviews',
      data: {location_id: 7, rating: 5, content: 'Hay', images: ['https://x/a.jpg']}});
    expect(Object.keys(request.mock.calls[0][0].data).sort()).toEqual(['content', 'images', 'location_id', 'rating']);
    expect(saved).toMatchObject({id: 11, accountId: 3, start: 5, name_user_review: 'u3', fullName: 'Người Ba',
      location: VENUE, images: ['https://x/a.jpg']});
    expect(saved.time_review).toMatch(/^\d{2}:\d{2} 30\/10\/2026$/);
    expect(clear).toHaveBeenCalled();
    await expect(locationApi.createReview({content: 'x', start: 4})).rejects.toThrow('Location ID is required');
    await festivalsApi.addReview(2, {id: 0, content: 'Vui', name_user_review: '', time_review: '', start: 4, avatar: ''});
    expect(request.mock.calls[1][0].data).toEqual({festival_id: 2, rating: 4, content: 'Vui', images: []});
  });

  it('lists reviews publicly, attaching the location or festival from the catalog', async () => {
    await tokenStore.set('jwt-7');
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {items: [
      dto(1), dto(2, {location_id: null, festival_id: 2})], limit: 100, offset: 0, has_more: false}});
    const reviews = await locationApi.getReviews();
    expect(request.mock.calls[0][0]).toMatchObject({url: '/reviews', params: {limit: 100}});
    expect(request.mock.calls[0][0].headers.Authorization).toBeUndefined();
    expect(reviews[0].location).toEqual(VENUE);
    expect(reviews[1].location).toBeUndefined();
    expect(reviews[1].festival).toEqual({id: 2, name: 'Lễ hội pháo hoa'});
    await festivalsApi.getReviews(2);
    expect(request.mock.calls[1][0].params).toEqual({festival_id: 2, limit: 100});
  });

  it('report and delete call the review endpoints', async () => {
    const request = jest.spyOn(apiRequest, 'request').mockResolvedValue({data: {detail: 'Đã gửi báo cáo, cảm ơn bạn'}});
    expect(await reviewsApi.report(5)).toBe('Đã gửi báo cáo, cảm ơn bạn');
    await reviewsApi.remove(5);
    expect(request.mock.calls.map(([config]) => [config.method, config.url])).toEqual([
      ['post', '/reviews/5/report'], ['delete', '/reviews/5']]);
  });
});

describe('NewFeedScreen', () => {
  const feed = () => {
    const screen = instance(NewFeedScreen, {navigation: {addListener: jest.fn(() => jest.fn())}});
    screen.refSheet = {open: jest.fn(), close: jest.fn()};
    return screen;
  };

  it('a guest pressing "+" is sent to Login; a signed-in user gets the review sheet', async () => {
    const screen = feed();
    requireLogin.mockResolvedValue(false);
    await screen.handleOpenReviewSheet();
    expect(screen.refSheet.open).not.toHaveBeenCalled();
    requireLogin.mockResolvedValue(true);
    await LocalStorageCommon.setItem('AVT', {id: 3, userName: 'u3'});
    await screen.handleOpenReviewSheet();
    expect(screen.refSheet.open).toHaveBeenCalled();
    expect(screen.state.avt).toMatchObject({id: 3});
  });

  it('uploads each picked image, posts the review, and shows the saved review first', async () => {
    const upload = jest.spyOn(locationApi, 'uploadImage')
      .mockResolvedValueOnce({url: 'https://x/1.jpg'}).mockResolvedValueOnce({url: 'https://x/2.jpg'});
    const saved = {id: 11, content: 'Hay', start: 5, images: ['https://x/1.jpg', 'https://x/2.jpg']};
    const create = jest.spyOn(locationApi, 'createReview').mockResolvedValue(saved);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const screen = feed();
    screen.state = {...screen.state, reviews: [{id: 1}], content: 'Hay', star: 5, location: VENUE,
      selectedImages: [{uri: 'file:///1.jpg'}, {uri: 'file:///2.jpg'}]};
    await screen.handleSubmitReview();
    expect(upload).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith({content: 'Hay', start: 5, location: VENUE,
      images: ['https://x/1.jpg', 'https://x/2.jpg']});
    expect(screen.state.reviews.map(review => review.id)).toEqual([11, 1]);
    expect(screen.state).toMatchObject({content: '', star: 0, selectedImages: [], uploading: false});
    expect(screen.refSheet.close).toHaveBeenCalled();
  });

  it('a failed upload stops the post and shows the server message', async () => {
    jest.spyOn(locationApi, 'uploadImage').mockRejectedValue(new Error('Mỗi ngày chỉ tải tối đa 20 ảnh'));
    const create = jest.spyOn(locationApi, 'createReview');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const screen = feed();
    screen.state = {...screen.state, content: 'Hay', star: 5, location: VENUE, selectedImages: [{uri: 'file:///1.jpg'}]};
    await screen.handleSubmitReview();
    expect(create).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Lỗi', 'Mỗi ngày chỉ tải tối đa 20 ảnh');
    expect(screen.state.uploading).toBe(false);
    expect(screen.refSheet.close).not.toHaveBeenCalled();
  });

  it('loads BE reviews on mount and again when the tab is focused', async () => {
    const get = jest.spyOn(locationApi, 'getReviews').mockResolvedValue([{id: 4, time_review: '10:00 30/10/2026'}]);
    jest.spyOn(locationApi, 'getLocations').mockResolvedValue([VENUE]);
    const screen = feed();
    screen.componentDidMount();
    await new Promise(resolve => setImmediate(resolve));
    expect(screen.state.reviews.map(review => review.id)).toEqual([4]);
    const onFocus = screen.props.navigation.addListener.mock.calls[0][1];
    onFocus();
    expect(get).toHaveBeenCalledTimes(2);
    screen.handleReviewDeleted(4);
    expect(screen.state.reviews).toEqual([]);
  });
});

describe('ReviewItem', () => {
  const review = {id: 5, accountId: 3, content: 'Hay', name_user_review: 'u3', time_review: '', start: 4, avatar: '',
    location: VENUE};
  const texts = tree => tree.root.findAll(node => typeof node.props.children === 'string').map(node => node.props.children);
  const press = (tree, label) => tree.root.findAll(node => node.props.onPress && texts({root: node}).includes(label))[0]
    .props.onPress();

  it('others can report (after login and confirmation); the author can delete', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const report = jest.spyOn(reviewsApi, 'report').mockResolvedValue('Đã gửi báo cáo, cảm ơn bạn');
    let tree;
    renderer.act(() => {tree = renderer.create(React.createElement(ReviewItem, {review, isShowLocation: true, currentAccountId: 9}));});
    expect(texts(tree)).toEqual(expect.arrayContaining(['Địa điểm: Bà Nà Hills', 'Báo cáo']));
    requireLogin.mockResolvedValue(false);
    await press(tree, 'Báo cáo');
    expect(alert).not.toHaveBeenCalled();
    requireLogin.mockResolvedValue(true);
    await press(tree, 'Báo cáo');
    await alert.mock.calls[0][2][1].onPress();
    expect(report).toHaveBeenCalledWith(5);
    expect(Toast.show).toHaveBeenCalledWith({type: 'success', text1: 'Đã gửi báo cáo, cảm ơn bạn'});
    tree.unmount();

    const onDeleted = jest.fn();
    jest.spyOn(reviewsApi, 'remove').mockResolvedValue();
    renderer.act(() => {tree = renderer.create(React.createElement(ReviewItem, {review, currentAccountId: 3, onDeleted}));});
    expect(texts(tree)).toContain('Xóa');
    expect(texts(tree)).not.toContain('Báo cáo');
    press(tree, 'Xóa');
    await alert.mock.calls[1][2][1].onPress();
    expect(reviewsApi.remove).toHaveBeenCalledWith(5);
    expect(onDeleted).toHaveBeenCalledWith(5);
    tree.unmount();
  });

  it('names the festival for festival reviews in the Feed', () => {
    let tree;
    renderer.act(() => {tree = renderer.create(React.createElement(ReviewItem, {
      review: {...review, location: undefined, festival: {id: 2, name: 'Lễ hội pháo hoa'}}, isShowLocation: true}));});
    expect(texts(tree)).toContain('Lễ hội: Lễ hội pháo hoa');
    tree.unmount();
  });
});
