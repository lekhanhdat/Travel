/* eslint-env jest */
/**
 * Jest Setup File
 * Configures global mocks and test utilities
 */

require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => Promise.resolve(false)),
  useHideAnimation: jest.fn(() => ({})),
}));
// Metro transforms SVG assets into components; Jest's asset mock returns objects.
for (const directory of ['src/assets/svg', 'src/assets/assets/svg']) {
  const path = require('path');
  const folder = path.join(__dirname, directory);
  for (const filename of require('fs').readdirSync(folder)) {
    if (filename.endsWith('.svg')) {
      jest.doMock(path.join(folder, filename), () => 'SvgAsset');
    }
  }
}
jest.mock('react-native-root-siblings', () => ({
  RootSiblingParent: ({children}) => children,
}));
jest.mock('rn-fetch-blob', () => ({
  fetch: jest.fn(),
  wrap: jest.fn(path => path),
  fs: {dirs: {CacheDir: '/tmp'}},
}));
// Native device features are unavailable in the Jest renderer.
jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(),
}));
jest.mock('@rnmapbox/maps', () => ({
  StyleURL: {Outdoors: 'outdoors', Satellite: 'satellite', Dark: 'dark'},
  setAccessToken: jest.fn(),
  MapView: require('react-native').View,
  Camera: require('react-native').View,
  ShapeSource: require('react-native').View,
  LineLayer: require('react-native').View,
  PointAnnotation: require('react-native').View,
  UserLocation: require('react-native').View,
}));
jest.mock('react-native-tts', () => ({
  getInitStatus: jest.fn(() => Promise.resolve()),
  setDefaultLanguage: jest.fn(),
  setDefaultRate: jest.fn(),
  setDefaultPitch: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(() => ({remove: jest.fn()})),
}));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));
jest.mock('react-native-vision-camera', () => ({
  Camera: Object.assign(
    function Camera(props) {
      return require('react').createElement(
        require('react-native').View,
        props,
      );
    },
    {
      getCameraPermissionStatus: jest.fn(() => 'not-determined'),
      requestCameraPermission: jest.fn(() => Promise.resolve('denied')),
      getAvailableCameraDevices: jest.fn(() => []),
    },
  ),
  useCameraDevice: jest.fn(),
  useCameraDevices: jest.fn(() => []),
}));
jest.mock('react-native-image-viewing', () => require('react-native').View);
jest.mock('react-native-raw-bottom-sheet', () => require('react-native').View);
jest.mock('react-native-markdown-display', () => require('react-native').Text);
jest.mock('react-native-qrcode-svg', () => require('react-native').View);
jest.mock('react-native-youtube-iframe', () => require('react-native').View);
jest.mock('react-native-webview', () => ({
  WebView: require('react-native').View,
}));
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native-iphone-x-helper', () => ({
  isIphoneX: () => false,
  getStatusBarHeight: () => 20,
  getBottomSpace: () => 0,
}));
jest.mock('react-native-swiper', () => require('react-native').View);
jest.mock('react-native-toast-message', () => {
  const Toast = () => null;
  Toast.show = jest.fn();
  Toast.hide = jest.fn();
  return Toast;
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const {View} = require('react-native');
  const insets = {top: 0, right: 0, bottom: 0, left: 0};
  const frame = {x: 0, y: 0, width: 320, height: 640};
  const SafeAreaInsetsContext = React.createContext(insets);
  const SafeAreaFrameContext = React.createContext(frame);
  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaView: View,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    SafeAreaConsumer: SafeAreaInsetsContext.Consumer,
    initialWindowMetrics: {insets, frame},
    useSafeAreaInsets: () => React.useContext(SafeAreaInsetsContext),
    useSafeAreaFrame: () => React.useContext(SafeAreaFrameContext),
  };
});

jest.mock('react-native-sound-player', () => ({
  playSoundFile: jest.fn(),
  playUrl: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  stop: jest.fn(),
  setVolume: jest.fn(),
  addEventListener: jest.fn(() => ({remove: jest.fn()})),
  getInfo: jest.fn(() => Promise.resolve({duration: 0, currentTime: 0})),
}));

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Global timeout for async tests
jest.setTimeout(10000);
