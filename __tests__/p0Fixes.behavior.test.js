/* eslint-env jest */
const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(), multiRemove: jest.fn(),
}));
jest.mock('../src/services/semantic.api', () => ({
  chatWithRAG: jest.fn(), clearChatSession: jest.fn(async () => true),
  generateSessionId: jest.fn(() => 'new-session'), searchSemantic: jest.fn(),
  // Neon history restore (default: nothing stored, so existing chat tests are unaffected).
  getLatestConversation: jest.fn(async () => ({sessionId: null, messages: []})),
  getConversation: jest.fn(async () => []),
  EndpointMissingError: class EndpointMissingError extends Error {},
  cacheControls: {getStats: jest.fn(() => ({size: 0})), invalidateAll: jest.fn()},
  debounce: fn => {
    let timer;
    const debounced = (...args) => {clearTimeout(timer); timer = setTimeout(() => fn(...args), 500);};
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  },
}));
jest.mock('../src/config/featureFlags', () => ({ENABLE_AI: true}));
jest.mock('../src/i18n', () => ({t: key => key}));
jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/common/TextBase', () => 'TextBase');
jest.mock('../src/common/sizes', () => ({width: 400}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('../src/component/HeaderBase', () => 'Header');
jest.mock('../src/component/SafeAreaModal', () => 'Modal');
jest.mock('../src/component/CameraResultModal', () => 'Result');
jest.mock('../src/container/screens/NavigationService', () => ({}));
jest.mock('../src/services/locations.api', () => ({}));
jest.mock('../src/utils/requireLogin', () => ({}));
jest.mock('../src/services/detect.api', () => ({}));
jest.mock('../src/services/api.client', () => ({
  apiCall: jest.fn(), tokenStore: {clear: jest.fn(), save: jest.fn()},
  setUnauthorizedHandler: jest.fn(), setSessionRefreshedHandler: jest.fn(),
}));
jest.mock('../src/services/catalogRepository', () => ({get: jest.fn(), clear: jest.fn()}));
jest.mock('../src/services/festivals.api', () => ({}));
jest.mock('../src/hoc/withTranslation', () => ({withTranslation: Component => Component}));
jest.mock('../src/component/CatalogStatus', () => 'CatalogStatus');
jest.mock('../src/component/ReviewItem', () => 'ReviewItem');
jest.mock('../src/component/SimilarItemsComponent', () => 'SimilarItems');
jest.mock('../src/component/LanguageDropdown', () => 'LanguageDropdown');
jest.mock('../src/utils/avatarUtils', () => ({Avatar: 'Avatar', getDisplayName: () => 'Guest'}));
jest.mock('@react-navigation/native', () => ({useIsFocused: jest.fn(() => true), useFocusEffect: effect => require('react').useEffect(effect, [effect])}));
jest.mock('react-i18next', () => ({useTranslation: () => ({t: key => key})}));
jest.mock('../src/utils/preciseLocation', () => ({getPreciseLocation: jest.fn(() => new Promise(() => {}))}));
jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(), watchPosition: jest.fn(() => 1), clearWatch: jest.fn(),
  requestAuthorization: jest.fn(),
}));
jest.mock('@rnmapbox/maps', () => ({
  setAccessToken: jest.fn(), StyleURL: {Outdoors: 'outdoors', Satellite: 'satellite'},
  MapView: 'MapView', Camera: 'MapCamera', MarkerView: 'MarkerView',
  ShapeSource: 'ShapeSource', LineLayer: 'LineLayer', Images: 'Images', Image: 'MapImage',
  SymbolLayer: 'SymbolLayer', CircleLayer: 'CircleLayer',
}));
jest.mock('react-native-sound-player', () => ({addEventListener: () => ({remove: jest.fn()})}));
jest.mock('react-native-tts', () => ({
  getInitStatus: jest.fn(() => Promise.resolve()), setDefaultLanguage: jest.fn(),
  setDefaultRate: jest.fn(), setDefaultPitch: jest.fn(), addEventListener: jest.fn(),
  stop: jest.fn(), removeAllListeners: jest.fn(),
}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {}}));
jest.mock('../src/res/images', () => ({}));
jest.mock('../src/services/mapbox.api', () => ({
  getDirections: jest.fn(), formatDistance: value => String(value), formatDuration: value => String(value),
  convertGeoJSONToCoordinates: coords => coords.map(([longitude, latitude]) => ({latitude, longitude})),
}));
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));
jest.mock('react-native-paper', () => ({Searchbar: 'Searchbar', Button: 'Button', Modal: 'Modal'}));
jest.mock('react-native-svg', () => ({__esModule: true, default: 'Svg', Circle: 'Circle', Line: 'Line'}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-markdown-display', () => 'Markdown');
jest.mock('react-native-vision-camera', () => ({Camera: {
  requestCameraPermission: jest.fn(async () => 'granted'),
  getCameraPermissionStatus: jest.fn(() => 'granted'),
  getAvailableCameraDevices: jest.fn(() => [{id: 'back'}]),
}}));

const storage = require('@react-native-async-storage/async-storage');
const session = require('../src/services/chatStorage');
const chatbot = require('../src/services/chatbot.api');
const semantic = require('../src/services/semantic.api');
const Search = require('../src/component/SemanticSearchBarComponent').default;
const Chat = require('../src/container/screens/Profile/ChatbotScreen').default;
const CameraScreen = require('../src/container/screens/Camera/CameraScreen').default;
const CachedImage = require('../src/component/CachedImage').default;
const {entityKey} = require('../src/utils/entityKey');
const {routeDeviation} = require('../src/utils/routeDeviation');
const {AppState, Image} = require('react-native');

let store;
const deferred = () => {let resolve; const promise = new Promise(done => {resolve = done;}); return {promise, resolve};};
function instance(Component, props = {}) {
  const value = new Component(props);
  value.setState = (update, callback) => {value.state = {...value.state, ...update}; callback?.();};
  return value;
}
beforeEach(() => {
  jest.clearAllMocks();
  store = {};
  storage.getItem.mockImplementation(async key => store[key] ?? null);
  storage.setItem.mockImplementation(async (key, value) => {store[key] = value;});
  storage.multiRemove.mockImplementation(async keys => {keys.forEach(key => {delete store[key];});});
  session.invalidateChatSession();
});

it('discards unowned history and isolates A, B and guest storage', async () => {
  store.CHAT_HISTORY = '["legacy"]'; store.CHAT_SESSION_ID = '"legacy-session"';
  store.AVT = '{"id":1}';
  expect(await session.chatAccountId()).toBe('1');
  expect(store.CHAT_HISTORY).toBeUndefined();
  expect(store.CHAT_SESSION_ID).toBeUndefined();
  await session.writeChat(session.chatKey('CHAT_HISTORY', '1'), ['A']);
  await session.writeChat(session.chatKey('CHAT_HISTORY', '2'), ['B']);
  await session.clearAccountChat('1');
  expect(store['CHAT_HISTORY:1']).toBeUndefined();
  expect(JSON.parse(store['CHAT_HISTORY:2'])).toEqual(['B']);
  store.AVT = '{"id":2}'; expect(await session.chatAccountId()).toBe('2');
  store.AVT = 'null'; expect(await session.chatAccountId()).toBe('guest');
});

it('does not resurrect a logged-out account through queued stale writes', async () => {
  const revision = session.chatRevision();
  const write = session.writeChat('CHAT_HISTORY:1', ['A'], revision);
  const clear = session.clearAccountChat('1');
  await Promise.all([write, clear]);
  await session.writeChat('CHAT_HISTORY:1', ['late'], revision);
  expect(store['CHAT_HISTORY:1']).toBeUndefined();
});

it('uses separate backend sessions and drops old source images after invalidation', async () => {
  semantic.chatWithRAG.mockResolvedValue({success: true, message: 'reply', sources: [{image_url: 'https://image'}]});
  store['CHAT_SESSION_ID:1'] = '"session-A"';
  store['CHAT_SESSION_ID:2'] = '"session-B"';
  await chatbot.sendChatMessage([{role: 'user', content: 'hello'}], undefined, '1');
  expect(semantic.chatWithRAG.mock.calls[0][0].session_id).toBe('session-A');
  session.invalidateChatSession();
  expect((await chatbot.searchImage('photo')).imageUrls).toBeUndefined();
  await chatbot.sendChatMessage([{role: 'user', content: 'hello'}], undefined, '2');
  expect(semantic.chatWithRAG.mock.calls[1][0].session_id).toBe('session-B');
});

it('chat admits one send and ignores a reply after session change', async () => {
  jest.useFakeTimers();
  const waiting = deferred();
  semantic.chatWithRAG.mockReturnValue(waiting.promise);
  const chat = instance(Chat);
  await chat.loadChatHistory();
  chat.state.inputText = 'hello';
  const first = chat.handleSendMessage();
  await chat.handleSendMessage();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(chat.state.messages.filter(item => item.role === 'user')).toHaveLength(1);
  chat.generation++;
  chat.state.messages = [];
  waiting.resolve({success: true, message: 'stale'});
  await first;
  expect(semantic.chatWithRAG).toHaveBeenCalledTimes(1);
  expect(chat.state.messages).toEqual([]);
  jest.clearAllTimers(); jest.useRealTimers();
});

it('late search responses cannot overwrite newer results or submit them', async () => {
  const old = deferred(); const recent = deferred();
  semantic.searchSemantic.mockReturnValueOnce(old.promise).mockReturnValueOnce(recent.promise);
  const data = [{kind: 'location', id: 1, name: 'old'}, {kind: 'hotel', id: 1, name: 'new'}];
  const onSearch = jest.fn();
  const search = instance(Search, {data, searchFields: ['name'], entityType: 'location', onSearch});
  search.state.searchValue = 'old';
  const first = search.handleSubmitSearch();
  search.handleSearchChange('new');
  const second = search.handleSubmitSearch();
  recent.resolve({success: true, results: []}); await second;
  old.resolve({success: true, results: [{id: 1, score: 1}]}); await first;
  expect(search.state.lastFilteredData).toEqual([data[1]]);
  expect(onSearch).toHaveBeenCalledTimes(1);
  expect(onSearch.mock.calls[0][1]).toBe('new');
  expect(entityKey(data[0])).not.toBe(entityKey(data[1]));
});

it('submit cancels debounce and reuses a pending request for the same query', async () => {
  jest.useFakeTimers();
  const pending = deferred(); semantic.searchSemantic.mockReturnValue(pending.promise);
  const search = instance(Search, {data: [], searchFields: [], entityType: 'location', onSearch: jest.fn()});
  search.componentDidMount(); search.handleSearchChange('beach');
  jest.advanceTimersByTime(500);
  const submit = search.handleSubmitSearch();
  jest.advanceTimersByTime(500);
  expect(semantic.searchSemantic).toHaveBeenCalledTimes(1);
  pending.resolve({success: true, results: []}); await submit;
  search.componentWillUnmount(); jest.useRealTimers();
});

it('camera stops on blur/background and removes its listeners', async () => {
  const events = {}; const removers = [];
  const listener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
    events.app = callback; return {remove: jest.fn()};
  });
  AppState.currentState = 'active'; let focused = true;
  const camera = instance(CameraScreen, {navigation: {
    isFocused: () => focused,
    addListener: (event, callback) => {events[event] = callback; const remove = jest.fn(); removers.push(remove); return remove;},
  }});
  camera.testBackendConnection = jest.fn();
  await camera.componentDidMount(); expect(camera.state.isActive).toBe(true);
  focused = false; events.blur(); expect(camera.state.isActive).toBe(false);
  focused = true; AppState.currentState = 'background'; events.app('background');
  expect(camera.state.isActive).toBe(false);
  AppState.currentState = 'active'; events.app('active'); expect(camera.state.isActive).toBe(true);
  camera.componentWillUnmount(); removers.forEach(remove => expect(remove).toHaveBeenCalled());
  expect(listener.mock.results[0].value.remove).toHaveBeenCalled(); listener.mockRestore();
});

it('CachedImage recovers from an error when its URI changes', async () => {
  let tree;
  await act(async () => {tree = renderer.create(React.createElement(CachedImage, {uri: 'bad'}));});
  act(() => tree.root.findByType(Image).props.onError());
  expect(tree.root.findAllByType(Image)).toHaveLength(0);
  await act(async () => {tree.update(React.createElement(CachedImage, {uri: 'good'}));});
  expect(tree.root.findByType(Image).props.source.uri).toBe('good');
  act(() => tree.unmount());
});

it('route deviation measures distance to the line, with a 50 meter boundary', () => {
  const route = [{latitude: 0, longitude: 0}, {latitude: 0, longitude: 0.02}];
  expect(routeDeviation({latitude: 0, longitude: 0.01}, route)).toBeLessThan(1);
  expect(routeDeviation({latitude: 0.0004, longitude: 0.01}, route)).toBeLessThan(50);
  expect(routeDeviation({latitude: 0.0005, longitude: 0.01}, route)).toBeGreaterThan(50);
});

it('logout and account deletion remove only the current account chat cache', async () => {
  const auth = require('../src/services/auth.api').default;
  const {apiCall} = require('../src/services/api.client');
  // Logout keeps the session id (restores the Neon history after the next login); deletion removes it.
  for (const [endSession, keepsSession] of [[() => auth.logout(), true], [() => auth.deleteAccount('test-password'), false]]) {
    store.AVT = '{"id":1}'; store['CHAT_HISTORY:1'] = '["A"]';
    store['CHAT_SESSION_ID:1'] = '"A"'; store['CHAT_HISTORY:2'] = '["B"]';
    apiCall.mockResolvedValue(undefined);
    await endSession();
    expect(store['CHAT_HISTORY:1']).toBeUndefined();
    expect(store['CHAT_SESSION_ID:1']).toBe(keepsSession ? '"A"' : undefined);
    expect(store['CHAT_HISTORY:2']).toBe('["B"]');
  }
});

it('after re-login the chat restores the latest Neon conversation (and falls back on an older BE)', async () => {
  const semantic = require('../src/services/semantic.api');
  const ChatbotScreen = require('../src/container/screens/Profile/ChatbotScreen').default;
  store.AVT = '{"id":1}'; delete store['CHAT_HISTORY:1']; store['CHAT_SESSION_ID:1'] = '"old"';
  const latest = jest.spyOn(semantic, 'getLatestConversation').mockResolvedValue({
    sessionId: 's-9', messages: [{role: 'user', content: 'Hỏi'}, {role: 'assistant', content: 'Đáp'}],
  });
  let tree;
  await act(async () => {tree = renderer.create(React.createElement(ChatbotScreen, {navigation: {addListener: () => jest.fn()}}));});
  await act(async () => {await new Promise(r => setTimeout(r, 0));});
  const contents = () => tree.root.findByType(require('react-native').FlatList).props.data.map(m => m.content);
  expect(contents().slice(1)).toEqual(['Hỏi', 'Đáp']);
  expect(store['CHAT_SESSION_ID:1']).toBe('"s-9"');
  tree.unmount();
  // Older BE (no /conversations/latest): use the session id kept at logout.
  delete store['CHAT_HISTORY:1']; store['CHAT_SESSION_ID:1'] = '"s-1"';
  latest.mockRejectedValueOnce(new semantic.EndpointMissingError('404'));
  const one = jest.spyOn(semantic, 'getConversation').mockResolvedValue([{role: 'user', content: 'Cũ'}]);
  await act(async () => {tree = renderer.create(React.createElement(ChatbotScreen, {navigation: {addListener: () => jest.fn()}}));});
  await act(async () => {await new Promise(r => setTimeout(r, 0));});
  expect(one).toHaveBeenCalledWith('s-1');
  expect(contents().slice(1)).toEqual(['Cũ']);
  tree.unmount();
});

it('map has one focused foreground watch and keeps rendering after catalog failure', async () => {
  const MapScreen = require('../src/container/screens/Maps/MapScreen').default;
  const {useIsFocused} = require('@react-navigation/native');
  const geo = require('@react-native-community/geolocation');
  const catalog = require('../src/services/catalogRepository');
  const {PermissionsAndroid, Platform} = require('react-native');
  Platform.OS = 'android'; AppState.currentState = 'active';
  const permission = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');
  const events = {};
  const appListener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
    events.app = callback; return {remove: jest.fn()};
  });
  useIsFocused.mockReturnValue(false);
  catalog.get.mockRejectedValue(new Error('503'));
  const props = {navigation: {addListener: () => jest.fn()}, route: {params: {}}};
  let tree;
  await act(async () => {tree = renderer.create(React.createElement(MapScreen, props));});
  expect(geo.watchPosition).not.toHaveBeenCalled();
  expect(tree.root.findAllByType('MapView')).toHaveLength(1);
  catalog.get.mockResolvedValue({mapMarkers: [], festivals: [], locationById: new Map()});
  const retry = tree.root.findAllByType('Button').find(button => button.props.children === 'map.retry');
  expect(retry).toBeDefined();
  await act(async () => {await retry.props.onPress();});
  expect(catalog.get).toHaveBeenLastCalledWith(true);
  expect(tree.root.findAllByType('Button').some(button => button.props.children === 'map.retry')).toBe(false);
  useIsFocused.mockReturnValue(true);
  await act(async () => {tree.update(React.createElement(MapScreen, {...props}));});
  expect(geo.watchPosition).toHaveBeenCalledTimes(1);
  await act(async () => {events.app('background');});
  expect(geo.clearWatch).toHaveBeenCalledTimes(1);
  await act(async () => {events.app('active');});
  expect(geo.watchPosition).toHaveBeenCalledTimes(2);
  useIsFocused.mockReturnValue(false);
  await act(async () => {tree.update(React.createElement(MapScreen, {...props}));});
  expect(geo.clearWatch).toHaveBeenCalledTimes(2);
  await act(async () => {tree.unmount();});
  permission.mockRestore(); appListener.mockRestore();
});

it('festival reviews distinguish error from empty and retain the catalog aggregate', async () => {
  const {useReviews} = require('../src/features/detail/useReviews');
  const reviews = require('../src/services/reviews.api').default;
  const catalog = require('../src/services/catalogRepository');
  const page = jest.spyOn(reviews, 'listPage');
  catalog.get.mockResolvedValue({festivalById: new Map([[1, {rating: 4.8, review_count: 250}]])});
  let result;
  const Harness = () => {result = useReviews('festival', 1, {rating: 4.8, count: 250}); return null;};
  const loading = deferred(); page.mockReturnValueOnce(loading.promise);
  let tree;
  await act(async () => {tree = renderer.create(React.createElement(Harness));});
  expect(result.status).toBe('loading');
  await act(async () => {loading.resolve({items: Array.from({length: 100}, (_, id) => ({id, start: 1})), hasMore: true});});
  expect(result.summary).toEqual({rating: 4.8, count: 250}); expect(result.hasMore).toBe(true);
  page.mockRejectedValueOnce(new Error('offline'));
  await act(async () => {await result.reload();});
  expect(result.status).toBe('error');
  page.mockResolvedValueOnce({items: [], hasMore: false});
  await act(async () => {await result.reload();});
  expect(result.status).toBe('ready'); expect(result.items).toEqual([]);
  await act(async () => {tree.unmount();});
  page.mockRestore();
});

it('map does not request Directions for stationary/on-route updates and drops replies after blur', async () => {
  const MapScreen = require('../src/container/screens/Maps/MapScreen').default;
  const {useIsFocused} = require('@react-navigation/native');
  const geo = require('@react-native-community/geolocation');
  const mapApi = require('../src/services/mapbox.api');
  const {PermissionsAndroid, Platform} = require('react-native');
  Platform.OS = 'android'; AppState.currentState = 'active'; useIsFocused.mockReturnValue(true);
  const appListener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({remove: jest.fn()});
  const permission = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');
  const pending = deferred(); mapApi.getDirections.mockReturnValue(pending.promise);
  const target = {id: 9, name: 'Target', lat: 16, long: 108.02};
  const props = {navigation: {addListener: () => jest.fn()}, route: {params: {locations: [target], showRoute: true}}};
  let tree;
  await act(async () => {tree = renderer.create(React.createElement(MapScreen, props));});
  const fix = (latitude, longitude) => geo.watchPosition.mock.calls[0][0]({coords: {latitude, longitude}});
  await act(async () => {fix(16, 108);});
  expect(mapApi.getDirections).toHaveBeenCalledTimes(1);
  await act(async () => {fix(16, 108);});
  expect(mapApi.getDirections).toHaveBeenCalledTimes(1);
  await act(async () => {pending.resolve({routes: [{distance: 2000, duration: 120,
    geometry: {coordinates: [[108, 16], [108.02, 16]]}, legs: [{steps: []}]}]});});
  await act(async () => {fix(16, 108.01);});
  expect(mapApi.getDirections).toHaveBeenCalledTimes(1);
  const reroute = deferred(); mapApi.getDirections.mockReturnValue(reroute.promise);
  await act(async () => {fix(16.001, 108.01);});
  expect(mapApi.getDirections).toHaveBeenCalledTimes(2);
  useIsFocused.mockReturnValue(false);
  await act(async () => {tree.update(React.createElement(MapScreen, {...props}));});
  await act(async () => {reroute.resolve({routes: [{distance: 9999, duration: 9999,
    geometry: {coordinates: [[108, 16], [108.02, 16]]}, legs: [{steps: []}]}]});});
  const line = tree.root.findAllByType('ShapeSource').find(node => node.props.id === 'routeLine');
  expect(line).toBeDefined();
  expect(line.props.shape.geometry.coordinates).toEqual([[108, 16], [108.02, 16]]);
  await act(async () => {tree.unmount();}); permission.mockRestore(); appListener.mockRestore();
});

it('cache clearing invokes the real service controls and SOS only dials 113 after confirmation', async () => {
  const Settings = require('../src/container/screens/Profile/Settings').default;
  const Profile = require('../src/container/screens/Profile/ProfileScreen').default;
  const catalog = require('../src/services/catalogRepository');
  const {Alert, Linking} = require('react-native');
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const dial = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const props = {t: key => key};
  const settings = instance(Settings, props);
  settings.handleClearCache();
  alert.mock.calls[0][2][1].onPress();
  expect(catalog.clear).toHaveBeenCalledTimes(1);
  expect(semantic.cacheControls.invalidateAll).toHaveBeenCalledTimes(1);
  alert.mockClear();
  const profile = instance(Profile, props); profile.handleOpenCall();
  expect(dial).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2];
  expect(buttons[0].style).toBe('cancel');
  buttons[1].onPress(); expect(dial).toHaveBeenCalledWith('tel:113');
  alert.mockRestore(); dial.mockRestore();
});
