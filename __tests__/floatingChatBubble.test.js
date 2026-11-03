/**
 * Floating chat bubble (App.tsx, shown when ENABLE_AI): opens the Chatbot for accounts, sends guests to Login.
 */
const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('../src/assets/ImageSvg', () => ({__esModule: true, ChatBotSvg: 'ChatBotSvg'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {CHATBOT: 'ChatBotScreen'}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn()}));
jest.mock('../src/services/auth.api', () => ({isLoggedIn: jest.fn()}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));

const {TouchableOpacity} = require('react-native');
const FloatingChatBubble = require('../src/component/FloatingChatBubble').default;
const NavigationService = require('../src/container/screens/NavigationService');
const authApi = require('../src/services/auth.api');

beforeEach(() => jest.clearAllMocks());

const press = async tree => {
  await act(async () => {await tree.root.findByType(TouchableOpacity).props.onPress();});
};

it('opens the Chatbot when signed in', async () => {
  authApi.isLoggedIn.mockResolvedValue(true);
  let tree;
  act(() => {tree = renderer.create(React.createElement(FloatingChatBubble));});
  expect(tree.root.findAllByType('ChatBotSvg')).toHaveLength(1);
  await press(tree);
  expect(NavigationService.navigate).toHaveBeenCalledWith('ChatBotScreen');
  tree.unmount();
});

it('asks a guest to log in instead of opening the Chatbot', async () => {
  authApi.isLoggedIn.mockResolvedValue(false);
  let tree;
  act(() => {tree = renderer.create(React.createElement(FloatingChatBubble));});
  await press(tree);
  expect(NavigationService.navigate).toHaveBeenCalledWith('LoginScreen');
  expect(NavigationService.navigate).not.toHaveBeenCalledWith('ChatBotScreen');
  tree.unmount();
});

it('is draggable and can be hidden', () => {
  let tree;
  act(() => {tree = renderer.create(React.createElement(FloatingChatBubble));});
  expect(tree.root.findAll(node => typeof node.props.onResponderMove === 'function').length).toBeGreaterThan(0);
  act(() => {tree.update(React.createElement(FloatingChatBubble, {visible: false}));});
  expect(tree.toJSON()).toBeNull();
  tree.unmount();
});
