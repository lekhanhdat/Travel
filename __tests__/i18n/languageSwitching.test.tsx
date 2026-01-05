import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TranslationProvider } from '../../src/context/TranslationContext';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Text, Button } from 'react-native';
import i18n from '../../src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Component to test translation context
const TestComponent = () => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <>
      <Text testID="language-display">{language}</Text>
      <Text testID="translated-text">{t('common.save')}</Text>
      <Button
        testID="switch-to-vi"
        title="Switch to Vietnamese"
        onPress={() => setLanguage('vi')}
      />
      <Button
        testID="switch-to-en"
        title="Switch to English"
        onPress={() => setLanguage('en')}
      />
    </>
  );
};

describe('Translation Integration', () => {
  beforeEach(async () => {
    // Clear mocks and storage before each test
    jest.clearAllMocks();
    await AsyncStorage.clear();
    // Reset i18n language to Vietnamese (default)
    await i18n.changeLanguage('vi');
  });

  it('should render with default language (vi)', async () => {
    // TranslationContext defaults to 'vi' when no saved language exists
    const { getByTestId } = render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    await waitFor(() => {
      expect(getByTestId('language-display').props.children).toBe('vi');
      expect(getByTestId('translated-text').props.children).toBe('Lưu');
    });
  });

  it('should switch language to English and update text', async () => {
    const { getByTestId } = render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    // Initial state check - default is Vietnamese
    await waitFor(() => {
      expect(getByTestId('language-display').props.children).toBe('vi');
    });

    // Press switch button to English
    fireEvent.press(getByTestId('switch-to-en'));

    // Verify language change
    await waitFor(() => {
      expect(getByTestId('language-display').props.children).toBe('en');
      // 'common:common.save' -> 'Save' in English
      expect(getByTestId('translated-text').props.children).toBe('Save');
    });

    // Verify persistence - TranslationContext uses 'app_language' key
    // LocalStorageCommon.setItem uses JSON.stringify, so 'en' becomes '"en"'
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', '"en"');
  });

  it('should switch language back to Vietnamese', async () => {
    const { getByTestId } = render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    // Switch to EN first
    fireEvent.press(getByTestId('switch-to-en'));
    await waitFor(() => expect(getByTestId('language-display').props.children).toBe('en'));

    // Switch back to VI
    fireEvent.press(getByTestId('switch-to-vi'));

    await waitFor(() => {
      expect(getByTestId('language-display').props.children).toBe('vi');
      expect(getByTestId('translated-text').props.children).toBe('Lưu');
    });
    
    // TranslationContext uses 'app_language' key
    // LocalStorageCommon.setItem uses JSON.stringify, so 'vi' becomes '"vi"'
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', '"vi"');
  });

  it('should load persisted language on init', async () => {
    // Mock AsyncStorage to return '"en"' (JSON stringified value)
    // LocalStorageCommon.getItem uses JSON.parse, so we need to return the stringified value
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('"en"');

    const { getByTestId } = render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    await waitFor(() => {
      expect(getByTestId('language-display').props.children).toBe('en');
      expect(getByTestId('translated-text').props.children).toBe('Save');
    });
  });
});
