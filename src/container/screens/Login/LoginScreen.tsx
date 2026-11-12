import React from 'react';
import i18n from '../../../i18n';
import {StyleSheet} from 'react-native';
import Toast from 'react-native-toast-message';

import {AuthButton, AuthInput, AuthLayout, AuthSwitch, PasswordInput} from '../../../features/auth/AuthLayout';
import {Text} from '../../../ui/Text';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import authApi from '../../../services/auth.api';

interface ILoginScreenProps {
  navigation?: {canGoBack: () => boolean; goBack: () => void};
}

interface ILoginScreenState {
  userName: string;
  password: string;
  loading: boolean;
}

export default class LoginScreen extends React.PureComponent<ILoginScreenProps, ILoginScreenState> {
  constructor(props: ILoginScreenProps) {
    super(props);
    // The banner carousel (images.caurong/cauvang/dienhai/nharong) was replaced by one static header image.
    this.state = {
      userName: '',
      password: '',
      loading: false,
    };
  }

  handleLogin = async () => {
    const {userName, password} = this.state;

    if (!userName || !password) {
      Toast.show({
        type: 'error',
        text1: i18n.t('common:ui.common.fillAll'),
      });
      return;
    }

    this.setState({loading: true});

    try {
      const account = await authApi.login(userName, password);

      if (!account) {
        Toast.show({
          type: 'error',
          text1: i18n.t('common:ui.login.wrongCredentials'),
        });
        this.setState({loading: false});
        return;
      }

      // authApi.login stored the session (token + profile); the password is never stored.
      Toast.show({
        type: 'success',
        text1: i18n.t('common:ui.login.success'),
      });

      this.setState({loading: false});
      // Opened from a screen that needs an account: go back to it; otherwise start at Home.
      if (this.props.navigation?.canGoBack()) {
        this.props.navigation.goBack();
      } else {
        NavigationService.reset(ScreenName.HOME_STACK_SCREEN);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error?.message);
      this.setState({loading: false});

      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: error?.message || i18n.t('common:ui.common.serverErrorLater'),
      });
    }
  };

  goBack = () => {
    if (this.props.navigation?.canGoBack()) {
      this.props.navigation.goBack();
    } else {
      NavigationService.reset(ScreenName.HOME_STACK_SCREEN);
    }
  };

  render() {
    const {userName, password, loading} = this.state;
    const isLoginDisabled = !userName || !password || loading;

    return (
      <AuthLayout
        title={i18n.t('common:ui.common.login')}
        subtitle={i18n.t('common:auth.loginSubtitle')}
        onBack={this.goBack}
        backLabel={i18n.t('common:buttons.back')}
        footer={
          <AuthSwitch
            question={i18n.t('common:ui.login.noAccount')}
            action={i18n.t('common:ui.common.signup')}
            onPress={() => NavigationService.reset(ScreenName.SIGN_UP)}
          />
        }>
        <AuthInput
          icon="account-outline"
          label={i18n.t('common:ui.common.userName')}
          placeholder={i18n.t('common:ui.common.userNamePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          value={userName}
          onChangeText={userNameInput => this.setState({userName: userNameInput})}
        />
        <PasswordInput
          label={i18n.t('common:auth.password')}
          placeholder={i18n.t('common:auth.enterPassword')}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          value={password}
          onSubmitEditing={this.handleLogin}
          onChangeText={passwordInput => this.setState({password: passwordInput})}
        />
        <Text
          variant="label"
          tone="primary"
          style={styles.forgot}
          accessibilityRole="link"
          // Debt N1 restored (email OTP through Gmail SMTP). Previous behaviour, kept for reference:
          // onPress={() => Toast.show({type: 'info', text1: i18n.t('common:ui.login.forgotSoon')})}
          onPress={() => NavigationService.navigate(ScreenName.FORGOT_PASSWORD)}>
          {i18n.t('common:ui.login.forgot')}
        </Text>
        <AuthButton
          label={i18n.t('common:ui.common.login')}
          icon="login"
          onPress={this.handleLogin}
          loading={loading}
          disabled={isLoginDisabled}
        />
      </AuthLayout>
    );
  }
}

const styles = StyleSheet.create({
  forgot: {alignSelf: 'flex-end', paddingVertical: 4},
});
