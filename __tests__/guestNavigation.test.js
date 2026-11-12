const React = require('react');
const renderer = require('react-test-renderer');

jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));
jest.mock('@react-navigation/stack', () => ({createStackNavigator: () => ({Navigator: 'Stack', Screen: 'Route', Group: 'Group'})}));
jest.mock('@react-navigation/bottom-tabs', () => ({createBottomTabNavigator: () => ({Navigator: 'Tabs', Screen: 'Tab'})}));
jest.mock('../src/context/TranslationContext', () => ({TranslationProvider: ({children}) => children}));
jest.mock('../src/hooks/useTranslation', () => ({useTranslation: () => ({t: key => key})}));
jest.mock('../src/container/screens/Home/HomeScreen', () => 'Home');
jest.mock('../src/container/screens/Discover/ViewAllScreen', () => ({__esModule: true, default: 'ViewAll'}));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/container/screens/Home/DetailLocation', () => 'DetailLocation');
jest.mock('../src/container/screens/Home/LocationImage', () => 'Images');
jest.mock('../src/container/screens/Home/LocationVideo', () => 'Videos');
jest.mock('../src/container/screens/Festival/DetailFestival', () => 'DetailFestival');
// P7: Feed tab (screen covered by __tests__/newFeed.test.js).
jest.mock('../src/container/screens/NewFeed/NewFeedScreen', () => 'Feed');
// P8: Camera tab (covered by __tests__/camera.test.js); vision-camera stays unloaded.
jest.mock('../src/container/screens/Camera/CameraScreen', () => 'Camera');
jest.mock('../src/container/screens/Camera/PreviewImage', () => 'PreviewImage');
jest.mock('react-native-vision-camera', () => {throw new Error('Guest must not initialize the camera');});
jest.mock('../src/container/screens/Profile/Settings', () => 'Settings');
jest.mock('../src/container/screens/Profile/FAQ', () => 'FAQ');
jest.mock('../src/container/screens/Profile/Policy', () => 'Policy');
jest.mock('../src/container/screens/Profile/About', () => 'About');
// P6: account screens are routed; mocked here so the shell itself never loads auth.api.
jest.mock('../src/container/screens/Profile/ProfileScreen', () => 'Profile');
jest.mock('../src/container/screens/Profile/Personal', () => 'Personal');
jest.mock('../src/container/screens/Login/LoginScreen', () => 'Login');
jest.mock('../src/container/screens/Login/SignUpScreen', () => 'SignUp');
// P4: Map tab/route are enabled; the screens are mocked here so Mapbox stays uninitialized in this test.
jest.mock('../src/container/screens/Maps/MapScreen', () => 'Map');
jest.mock('../src/container/screens/Maps/Advise', () => 'Advise');
jest.mock('@rnmapbox/maps', () => {throw new Error('Guest must not initialize Mapbox');});
jest.mock('../src/services/auth.api', () => {throw new Error('Guest must not initialize Auth');});
// P9: Chatbot is routed (screen covered by __tests__/chatbot.test.js); the shell itself never loads chatbot.api.
jest.mock('../src/container/screens/Profile/ChatbotScreen', () => 'Chatbot');
jest.mock('../src/services/chatbot.api', () => {throw new Error('Guest must not initialize Chatbot');});
// Donation is gated by ENABLE_PAYMENT; the shell itself never loads payment.api.
jest.mock('../src/container/screens/Profile/Donation', () => 'Donation');
jest.mock('../src/services/payment.api', () => {throw new Error('Guest must not initialize Payment');});

it('registers guest + account routes and Home/Feed/Map/Camera/Profile tabs (D-2: festivals live in Home) without initializing deferred modules', () => {
  const AppContainer = require('../src/container/AppContainer').default;
  let tree;
  renderer.act(() => {tree = renderer.create(React.createElement(AppContainer));});
  const routes = tree.root.findAllByType('Route').map(route => route.props.name);
  expect(routes).toEqual(['HomeStack', 'LoginScreen', 'ViewAllLocation', 'ViewAllFestivals', 'DetailLocationScreen',
    'PreviewImage', 'MapsScreen', 'LocationImage', 'LocationVideo', 'Personal', 'Settings', 'FAQ', 'Policy', 'About',
    'Advise', 'DetailFestivalScreen', 'SignUpScreen', 'ForgotPasswordScreen', 'ChatBotScreen']);
  // R-NAV1: stack screens other than the tab roots load lazily (getComponent), so they are not evaluated at startup.
  const lazyRoutes = tree.root.findAllByType('Route').filter(route => route.props.getComponent).map(route => route.props.name);
  expect(lazyRoutes).toEqual(expect.arrayContaining(['LoginScreen', 'DetailLocationScreen', 'Settings', 'ChatBotScreen']));
  // Both legacy "view all" route names open the single merged list.
  const viewAll = tree.root.findAllByType('Route').filter(route => route.props.name.startsWith('ViewAll'));
  expect(viewAll.map(route => route.props.getComponent())).toEqual(['ViewAll', 'ViewAll']);
  expect(routes).not.toContain('Donation');
  // Debt N1 restored: reachable from Login, loaded lazily.
  expect(lazyRoutes).toContain('ForgotPasswordScreen');
  expect(tree.root.findByType('Stack').props.initialRouteName).toBe('HomeStack');
  const HomeStack = tree.root.findAllByType('Route')[0].props.component;
  let tabs;
  renderer.act(() => {tabs = renderer.create(React.createElement(HomeStack));});
  expect(tabs.root.findAllByType('Tab').map(tab => tab.props.name)).toEqual(['TabHome', 'TabFeed', 'TabMap', 'TabCamera', 'TabProfile']);
  tree.unmount();
  tabs.unmount();
});
