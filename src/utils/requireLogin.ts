import Toast from 'react-native-toast-message';
import authApi from '../services/auth.api';
import NavigationService from '../container/screens/NavigationService';
import i18n from '../i18n';

/**
 * Guest gate for features that need an account (review, upload, Camera, Chatbot, Donation).
 * Returns true when signed in; otherwise explains why and opens Login (which goes back on success).
 */
export async function requireLogin(): Promise<boolean> {
  if (await authApi.isLoggedIn()) {
    return true;
  }
  Toast.show({type: 'info', text1: i18n.t('common:profile.loginRequired')});
  // Route name of ScreenName.LOGIN_SCREEN (AppContainer imports this module's callers).
  NavigationService.navigate('LoginScreen');
  return false;
}
