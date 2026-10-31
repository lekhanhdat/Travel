/**
 * P6: Login / Profile / Personal flows against a mocked auth.api.
 */
jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/assets/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {
  HOME_STACK_SCREEN: 'HomeStack', LOGIN_SCREEN: 'LoginScreen', PERSONAL: 'Personal', SIGN_UP: 'SignUpScreen',
  CHATBOT: 'ChatBotScreen', DONATION: 'Donation', SETTINGS: 'Settings', FAQ: 'FAQ', POLICY: 'Policy', ABOUT: 'About',
}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn(), reset: jest.fn(), pop: jest.fn(), push: jest.fn()}));
jest.mock('../src/hoc/withAzureTranslation', () => ({withAzureTranslation: component => component}));
jest.mock('../src/services/auth.api', () => ({__esModule: true, default: {
  login: jest.fn(), logout: jest.fn(), isLoggedIn: jest.fn(), deleteAccount: jest.fn(),
  updateProfile: jest.fn(), changePassword: jest.fn(),
}}));
jest.mock('../src/services/locations.api', () => ({__esModule: true, default: {uploadImage: jest.fn()}}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
jest.mock('react-native-swiper', () => 'Swiper');
jest.mock('react-native-paper', () => ({TextInput: Object.assign(() => null, {Icon: () => null}), IconButton: 'IconButton', Button: 'Button'}));
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('../src/component/HeaderBase', () => 'Header');

const Toast = require('react-native-toast-message');
const NavigationService = require('../src/container/screens/NavigationService');
const authApi = require('../src/services/auth.api').default;
const LoginScreen = require('../src/container/screens/Login/LoginScreen').default;
const ProfileScreen = require('../src/container/screens/Profile/ProfileScreen').default;
const Personal = require('../src/container/screens/Profile/Personal').default;
const FEATURE_FLAGS = require('../src/config/featureFlags').default;
const locationApi = require('../src/services/locations.api').default;

function instance(Component, props) {
  const screen = new Component(props);
  screen.setState = update => {
    screen.state = {...screen.state, ...(typeof update === 'function' ? update(screen.state) : update)};
  };
  return screen;
}

beforeEach(() => jest.clearAllMocks());

describe('Login', () => {
  const ACCOUNT = {id: 7, userName: 'seed1'};

  it('goes back to the screen that asked for an account after logging in', async () => {
    authApi.login.mockResolvedValue(ACCOUNT);
    const navigation = {canGoBack: jest.fn(() => true), goBack: jest.fn()};
    const login = instance(LoginScreen, {navigation});
    login.state = {...login.state, userName: 'seed1', password: 'matkhau1'};
    await login.handleLogin();
    expect(authApi.login).toHaveBeenCalledWith('seed1', 'matkhau1');
    expect(navigation.goBack).toHaveBeenCalled();
    expect(NavigationService.reset).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({type: 'success'}));
  });

  it('starts at Home when Login is the only screen', async () => {
    authApi.login.mockResolvedValue(ACCOUNT);
    const login = instance(LoginScreen, {navigation: {canGoBack: () => false, goBack: jest.fn()}});
    login.state = {...login.state, userName: 'seed1', password: 'matkhau1'};
    await login.handleLogin();
    expect(NavigationService.reset).toHaveBeenCalledWith('HomeStack');
  });

  it('wrong credentials and server errors keep the user on Login with a message', async () => {
    const login = instance(LoginScreen, {});
    login.state = {...login.state, userName: 'seed1', password: 'sai'};
    authApi.login.mockResolvedValueOnce(null);
    await login.handleLogin();
    expect(Toast.show).toHaveBeenLastCalledWith(expect.objectContaining({text1: 'Tên tài khoản hoặc mật khẩu không chính xác'}));
    authApi.login.mockRejectedValueOnce(new Error('Bạn thao tác quá nhiều lần, vui lòng thử lại sau'));
    await login.handleLogin();
    expect(Toast.show).toHaveBeenLastCalledWith(expect.objectContaining({text2: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau'}));
    expect(login.state.loading).toBe(false);
    expect(NavigationService.reset).not.toHaveBeenCalled();
  });
});

describe('Profile', () => {
  const props = () => ({navigation: {addListener: jest.fn()}, t: key => key});

  it('a guest asking for account info is sent to Login', async () => {
    authApi.isLoggedIn.mockResolvedValue(false);
    const profile = instance(ProfileScreen, props());
    await profile.openAccountInfo();
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({type: 'info'}));
    expect(NavigationService.navigate).toHaveBeenCalledWith('LoginScreen');
    expect(NavigationService.navigate).not.toHaveBeenCalledWith('Personal');
  });

  it('a signed-in user opens Personal; logout clears the account and returns to Home', async () => {
    authApi.isLoggedIn.mockResolvedValue(true);
    const profile = instance(ProfileScreen, props());
    profile.state = {account: {id: 7, userName: 'seed1'}};
    await profile.openAccountInfo();
    expect(NavigationService.navigate).toHaveBeenCalledWith('Personal');
    await profile.handleLogout();
    expect(authApi.logout).toHaveBeenCalled();
    expect(profile.state.account).toBeUndefined();
    expect(NavigationService.reset).toHaveBeenCalledWith('HomeStack');
  });

  // N2: Donation is routed; guests are sent to Login first.
  it('Donation opens for a signed-in user and asks a guest to log in', async () => {
    const profile = instance(ProfileScreen, props());
    authApi.isLoggedIn.mockResolvedValue(false);
    await profile.openDonation();
    expect(NavigationService.navigate).toHaveBeenLastCalledWith('LoginScreen');
    authApi.isLoggedIn.mockResolvedValue(true);
    await profile.openDonation();
    expect(NavigationService.navigate).toHaveBeenLastCalledWith('Donation');
  });

  // P9: Chatbot is routed; guests are sent to Login first.
  it('Chatbot opens for a signed-in user and asks a guest to log in', async () => {
    const profile = instance(ProfileScreen, props());
    authApi.isLoggedIn.mockResolvedValue(false);
    await profile.openChatbot();
    expect(NavigationService.navigate).toHaveBeenLastCalledWith('LoginScreen');
    authApi.isLoggedIn.mockResolvedValue(true);
    await profile.openChatbot();
    expect(NavigationService.navigate).toHaveBeenLastCalledWith('ChatBotScreen');
  });
});

describe('Personal: account deletion (Play policy)', () => {
  it('asks for the password, deletes, then returns to Home', async () => {
    const personal = instance(Personal, {});
    await personal.handleDeleteAccount();
    expect(authApi.deleteAccount).not.toHaveBeenCalled();
    authApi.deleteAccount.mockResolvedValue();
    personal.state = {...personal.state, showDeleteModal: true, deletePassword: 'matkhau1'};
    await personal.handleDeleteAccount();
    expect(authApi.deleteAccount).toHaveBeenCalledWith('matkhau1');
    expect(personal.state).toMatchObject({showDeleteModal: false, deletePassword: '', deletingAccount: false});
    expect(NavigationService.reset).toHaveBeenCalledWith('HomeStack');
  });

  it('a wrong password keeps the dialog open with the server message', async () => {
    authApi.deleteAccount.mockRejectedValue(new Error('Mật khẩu không đúng'));
    const personal = instance(Personal, {});
    personal.state = {...personal.state, showDeleteModal: true, deletePassword: 'sai'};
    await personal.handleDeleteAccount();
    expect(personal.state.showDeleteModal).toBe(true);
    expect(Toast.show).toHaveBeenLastCalledWith(expect.objectContaining({text2: 'Mật khẩu không đúng'}));
    expect(NavigationService.reset).not.toHaveBeenCalled();
  });

  it('avatar change uploads through the BE, then saves the returned URL in the profile (P7)', async () => {
    expect(FEATURE_FLAGS.ENABLE_UPLOAD).toBe(true);
    const url = 'https://storage.googleapis.com/bucket/uploads/7/20261030/a.jpg';
    locationApi.uploadImage.mockResolvedValue({url});
    authApi.updateProfile.mockResolvedValue({id: 7, userName: 'seed1', avatar: url});
    const personal = instance(Personal, {});
    personal.state = {...personal.state, account: {id: 7, userName: 'seed1'}, previewAvatarUri: 'file:///a.jpg'};
    await personal.handleConfirmAvatar();
    expect(locationApi.uploadImage).toHaveBeenCalledWith(expect.objectContaining({uri: 'file:///a.jpg'}));
    expect(authApi.updateProfile).toHaveBeenCalledWith(7, {avatar: url});
    expect(personal.state).toMatchObject({uploadingAvatar: false, editAvatarUri: url, account: {avatar: url}});
    locationApi.uploadImage.mockRejectedValue(new Error('Ảnh vượt quá 2 MB'));
    personal.state = {...personal.state, previewAvatarUri: 'file:///b.jpg'};
    await personal.handleConfirmAvatar();
    expect(authApi.updateProfile).toHaveBeenCalledTimes(1);
    expect(Toast.show).toHaveBeenLastCalledWith(expect.objectContaining({type: 'error'}));
  });
});
