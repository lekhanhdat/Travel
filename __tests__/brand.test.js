/* eslint-env jest */
import React from 'react';
import {Linking} from 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import About from '../src/container/screens/Profile/About';
import Policy from '../src/container/screens/Profile/Policy';
import {BRAND} from '../src/config/brand';

jest.mock('../src/component/HeaderBase', () => 'HeaderBase');
jest.mock('../src/assets/assets/ImageSvg', () => ({BackSvg: 'BackSvg'}));
jest.mock('../src/container/screens/NavigationService', () => ({
  pop: jest.fn(),
}));

it('hides policy and deletion links while their URLs are unconfigured', () => {
  const screen = render(<Policy />);
  expect(BRAND.privacyPolicyUrl).toBeNull();
  expect(BRAND.accountDeletionUrl).toBeNull();
  expect(screen.queryByText('Xem chính sách đầy đủ')).toBeNull();
  expect(screen.queryByText('Yêu cầu xóa tài khoản')).toBeNull();
});

it.each([
  ['privacyPolicyUrl', 'Xem chính sách đầy đủ'],
  ['accountDeletionUrl', 'Yêu cầu xóa tài khoản'],
])('opens the configured %s', (key, label) => {
  const previous = BRAND[key];
  const url = `https://example.com/${key}`;
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  try {
    BRAND[key] = url;
    const screen = render(<Policy />);
    fireEvent.press(screen.getByText(label));
    expect(openURL).toHaveBeenCalledWith(url);
  } finally {
    BRAND[key] = previous;
    openURL.mockRestore();
  }
});

it('renders Danavi branding and hides unconfigured contact links', () => {
  const screen = render(<About />);
  expect(screen.getByLabelText(BRAND.appName)).toBeTruthy();
  expect(screen.queryByText(BRAND.appName)).toBeNull();
  expect(screen.getByText(`Android ${BRAND.minAndroid}+`)).toBeTruthy();
  expect(screen.queryByText('45.2 MB')).toBeNull();
  expect(screen.getByText(BRAND.tagline)).toBeTruthy();
  expect(screen.getByText('1.0.0')).toBeTruthy();
  expect(screen.queryAllByText(/travelapp/i)).toHaveLength(0);
  expect(screen.queryByText('Website chính thức')).toBeNull();
  expect(screen.queryByText('Gửi phản hồi')).toBeNull();
  expect(screen.queryByText('Facebook')).toBeNull();
  expect(screen.queryByText('Instagram')).toBeNull();
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  fireEvent.press(screen.getByText('Đánh giá ứng dụng'));
  expect(openURL).toHaveBeenCalledWith(
    'https://play.google.com/store/apps/details?id=com.travel',
  );
  openURL.mockRestore();
});
