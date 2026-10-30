const React = require('react');
const renderer = require('react-test-renderer');

jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));
jest.mock('@react-navigation/stack', () => ({createStackNavigator: () => ({Navigator: 'Stack', Screen: 'Route', Group: 'Group'})}));
jest.mock('@react-navigation/bottom-tabs', () => ({createBottomTabNavigator: () => ({Navigator: 'Tabs', Screen: 'Tab'})}));
jest.mock('../src/context/TranslationContext', () => ({TranslationProvider: ({children}) => children}));
jest.mock('../src/hooks/useTranslation', () => ({useTranslation: () => ({t: key => key})}));
jest.mock('../src/services/translation', () => ({offlineFallback: {initialize: jest.fn()}}));
jest.mock('../src/container/screens/Home/HomeScreen', () => 'Home');
jest.mock('../src/container/screens/Home/ViewAllLocation', () => 'Locations');
jest.mock('../src/container/screens/Home/DetailLocation', () => 'DetailLocation');
jest.mock('../src/container/screens/Home/LocationImage', () => 'Images');
jest.mock('../src/container/screens/Home/LocationVideo', () => 'Videos');
jest.mock('../src/container/screens/Festival/FestivalsScreen', () => 'Festivals');
jest.mock('../src/container/screens/Festival/DetailFestival', () => 'DetailFestival');
jest.mock('../src/container/screens/Festival/ViewAllFestivals', () => 'AllFestivals');
jest.mock('../src/container/screens/Profile/Settings', () => 'Settings');
jest.mock('../src/container/screens/Profile/FAQ', () => 'FAQ');
jest.mock('../src/container/screens/Profile/Policy', () => 'Policy');
jest.mock('../src/container/screens/Profile/About', () => 'About');
// P4: Map tab/route are enabled; the screens are mocked here so Mapbox stays uninitialized in this test.
jest.mock('../src/container/screens/Maps/MapScreenV2', () => 'Map');
jest.mock('../src/container/screens/Maps/Advise', () => 'Advise');
jest.mock('@rnmapbox/maps', () => {throw new Error('Guest must not initialize Mapbox');});
jest.mock('../src/services/auth.api', () => {throw new Error('Guest must not initialize Auth');});
jest.mock('../src/services/chatbot.api', () => {throw new Error('Guest must not initialize Chatbot');});
jest.mock('../src/services/payment.api', () => {throw new Error('Guest must not initialize Payment');});

it('registers guest routes plus Map and Home/Festival/Map tabs without initializing deferred modules', () => {
  const AppContainer = require('../src/container/AppContainer').default;
  const {offlineFallback} = require('../src/services/translation');
  let tree;
  renderer.act(() => {tree = renderer.create(React.createElement(AppContainer));});
  const routes = tree.root.findAllByType('Route').map(route => route.props.name);
  expect(routes).toEqual(['HomeStack', 'ViewAllLocation', 'DetailLocationScreen', 'MapsScreen', 'LocationImage',
    'LocationVideo', 'Settings', 'FAQ', 'Policy', 'About', 'Advise', 'SearchScreen', 'DetailFestivalScreen', 'ViewAllFestivals']);
  expect(tree.root.findByType('Stack').props.initialRouteName).toBe('HomeStack');
  const HomeStack = tree.root.findAllByType('Route')[0].props.component;
  let tabs;
  renderer.act(() => {tabs = renderer.create(React.createElement(HomeStack));});
  expect(tabs.root.findAllByType('Tab').map(tab => tab.props.name)).toEqual(['TabHome', 'TabFestival', 'TabMap']);
  expect(offlineFallback.initialize).not.toHaveBeenCalled();
  tree.unmount();
  tabs.unmount();
});
