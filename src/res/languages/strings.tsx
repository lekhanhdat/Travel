// import i18next from 'i18next'
import {Platform, NativeModules} from 'react-native';

export function getLanguage() {
  let deviceLanguage = '';
  if (Platform.OS === 'ios') {
    deviceLanguage = NativeModules.SettingsManager.settings.AppleLocale;
    if (!deviceLanguage) {
      deviceLanguage = NativeModules.SettingsManager.settings.AppleLanguages[0];
    }
    if (!deviceLanguage) {
      deviceLanguage = 'en';
    }
  } else {
    deviceLanguage = NativeModules.I18nManager.localeIdentifier;
  }

  return deviceLanguage.toString().slice(0, 2);
}
