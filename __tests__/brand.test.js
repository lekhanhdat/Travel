/* eslint-env jest */
import React from 'react';
import {Linking} from 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import About from '../src/container/screens/Profile/About';
import {BRAND} from '../src/config/brand';

jest.mock('../src/component/HeaderBase', () => 'HeaderBase');
jest.mock('../src/assets/assets/ImageSvg', () => ({BackSvg: 'BackSvg'}));
jest.mock('../src/container/screens/NavigationService', () => ({
  pop: jest.fn(),
}));

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
