/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';
import BootSplash from 'react-native-bootsplash';
import HomeScreen from '../src/container/screens/Home/HomeScreen';
import {Text, View} from 'react-native';
import {TAB_NAMES} from '../src/container/AppContainer';
import NavigationService from '../src/container/screens/NavigationService';

jest.mock('../src/container/screens/Home/HomeScreen', () => jest.fn());

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('hides the splash when navigation is ready', async () => {
  jest.mocked(HomeScreen).mockImplementation(() => <View />);
  let tree: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<App />);
  });
  expect(BootSplash.hide).toHaveBeenCalledWith({fade: true});
  renderer.act(() => tree.unmount());
});

it('hides the splash and shows a fallback if the first screen throws', async () => {
  jest.mocked(BootSplash.hide).mockClear();
  jest.mocked(HomeScreen).mockImplementation(() => {
    throw new Error('Startup screen failed');
  });
  let tree: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<App />);
  });
  expect(BootSplash.hide).toHaveBeenCalledWith({fade: true});
  expect(tree!.root.findByType(Text).props.children).toContain('Danavi');
  renderer.act(() => tree.unmount());
});

it('hides the chat bubble on Camera and Profile and restores it on Home', async () => {
  jest.mocked(HomeScreen).mockImplementation(() => <View />);
  let tree: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<App />);
  });
  const app = tree!.root.findByType(App).instance;
  const navigator = jest.spyOn(NavigationService, 'getNavigator');
  try {
    for (const [name, visible] of [
      [TAB_NAMES.CAMERA, false],
      [TAB_NAMES.PROFILE, false],
      [TAB_NAMES.HOME, true],
    ] as const) {
      navigator.mockReturnValue({getCurrentRoute: () => ({name})} as any);
      renderer.act(() => app.updateChatBubble());
      expect(app.state.showChatBubble).toBe(visible);
    }
  } finally {
    navigator.mockRestore();
    renderer.act(() => tree!.unmount());
  }
});
