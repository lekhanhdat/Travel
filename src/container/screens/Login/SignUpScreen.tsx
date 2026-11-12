import React from 'react';
import i18n from '../../../i18n';
import {View, StyleSheet} from 'react-native';
import Toast from 'react-native-toast-message';

import images from '../../../res/images';
import {AuthButton, AuthInput, AuthLayout, AuthSwitch, PasswordInput} from '../../../features/auth/AuthLayout';
import {Text} from '../../../ui/Text';
import {Chip} from '../../../ui/Chip';
import {space} from '../../../theme/tokens';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import authApi from '../../../services/auth.api';

interface ISignUpScreenState {
  userName: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  birthday: string;
  address: string;
  loading: boolean;
}

export default class SignUpScreen extends React.PureComponent<
  {},
  ISignUpScreenState
> {
  constructor(props: {}) {
    super(props);
    this.state = {
      userName: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      email: '',
      phone: '',
      gender: '',
      birthday: '',
      address: '',
      loading: false,
    };
  }

  handleSignUp = async () => {
    const {userName, password, confirmPassword, fullName, email, phone, gender, birthday, address} = this.state;

    // Validation
    if (!userName || !password || !confirmPassword || !fullName || !email) {
      Toast.show({type: 'error', text1: i18n.t('common:ui.common.fillAll')});
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({type: 'error', text1: i18n.t('common:ui.signup.passwordMismatch')});
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: i18n.t('common:ui.signup.passwordShort'),
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({type: 'error', text1: i18n.t('common:ui.common.invalidEmail')});
      return;
    }

    this.setState({loading: true});

    try {
      await authApi.signUp(userName, password, fullName, email, phone, gender || undefined, birthday, address);

      Toast.show({
        type: 'success',
        text1: i18n.t('common:ui.signup.success'),
        text2: i18n.t('common:ui.signup.pleaseLogin'),
      });

      this.setState({loading: false});
      NavigationService.reset(ScreenName.LOGIN_SCREEN);
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      this.setState({loading: false});

      Toast.show({
        type: 'error',
        text1: i18n.t('common:ui.signup.failed'),
        text2: error.message || i18n.t('common:ui.signup.tryLater'),
      });
    }
  };

  render() {
    const {userName, password, confirmPassword, fullName, email, phone, gender, birthday, address, loading} =
      this.state;
    const isSignUpDisabled = !userName || !password || !confirmPassword || !fullName || !email || loading;
    const mismatch = !!confirmPassword && password !== confirmPassword;

    return (
      <AuthLayout
        title={i18n.t('common:ui.common.signup')}
        subtitle={i18n.t('common:ui.signup.createAccount')}
        image={images.dienhai}
        onBack={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}
        backLabel={i18n.t('common:buttons.back')}
        footer={
          <AuthSwitch
            question={i18n.t('common:ui.signup.haveAccount')}
            action={i18n.t('common:ui.common.login')}
            onPress={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}
          />
        }>
        <AuthInput
          icon="account-circle-outline"
          label={i18n.t('common:ui.signup.fullName')}
          placeholder={i18n.t('common:ui.signup.fullNamePlaceholder')}
          autoComplete="name"
          value={fullName}
          onChangeText={fullNameInput => this.setState({fullName: fullNameInput})}
        />
        <AuthInput
          icon="email-outline"
          label="Email"
          placeholder={i18n.t('common:auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={emailInput => this.setState({email: emailInput})}
        />
        <AuthInput
          icon="account-outline"
          label={i18n.t('common:ui.common.userName')}
          placeholder={i18n.t('common:ui.common.userNamePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          value={userName}
          onChangeText={userNameInput => this.setState({userName: userNameInput})}
        />
        <PasswordInput
          label={i18n.t('common:auth.password')}
          placeholder={i18n.t('common:ui.signup.passwordPlaceholder')}
          autoComplete="password-new"
          value={password}
          onChangeText={passwordInput => this.setState({password: passwordInput})}
        />
        <PasswordInput
          label={i18n.t('common:ui.signup.confirmPassword')}
          placeholder={i18n.t('common:ui.signup.confirmPlaceholder')}
          error={mismatch}
          value={confirmPassword}
          onChangeText={confirmInput => this.setState({confirmPassword: confirmInput})}
        />
        {mismatch ? (
          <Text variant="caption" tone="error" style={styles.hint}>
            {i18n.t('common:ui.signup.passwordMismatch')}
          </Text>
        ) : null}

        <Text variant="label" tone="textSecondary" style={styles.group}>
          {i18n.t('common:auth.optionalInfo')}
        </Text>
        <AuthInput
          icon="phone-outline"
          label={i18n.t('common:ui.signup.phone')}
          placeholder={i18n.t('common:ui.common.phonePlaceholder')}
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={phoneInput => this.setState({phone: phoneInput})}
        />
        <AuthInput
          icon="cake-variant-outline"
          label={i18n.t('common:ui.signup.birthday')}
          placeholder="01/01/1990"
          keyboardType="numbers-and-punctuation"
          value={birthday}
          onChangeText={birthdayInput => this.setState({birthday: birthdayInput})}
        />
        <Text variant="caption" tone="textSecondary" style={styles.genderLabel}>
          {i18n.t('common:ui.signup.gender')}
        </Text>
        <View style={styles.genderRow}>
          {(['Male', 'Female', 'Other'] as const).map(g => (
            <Chip
              key={g}
              label={g === 'Male' ? i18n.t('common:auth.male') : g === 'Female' ? i18n.t('common:auth.female') : i18n.t('common:ui.common.other')}
              selected={gender === g}
              onPress={() => this.setState({gender: gender === g ? '' : g})}
            />
          ))}
        </View>
        <AuthInput
          icon="map-marker-outline"
          label={i18n.t('common:ui.signup.address')}
          placeholder={i18n.t('common:ui.common.addressPlaceholder')}
          value={address}
          onChangeText={addressInput => this.setState({address: addressInput})}
        />

        <AuthButton
          label={i18n.t('common:ui.common.signup')}
          icon="account-plus-outline"
          onPress={this.handleSignUp}
          loading={loading}
          disabled={isSignUpDisabled}
        />
      </AuthLayout>
    );
  }
}

const styles = StyleSheet.create({
  hint: {marginTop: -4, marginBottom: space.xs, marginLeft: space.xxs},
  group: {marginTop: space.md, marginBottom: space.xs},
  genderLabel: {marginBottom: space.xs, marginLeft: space.xxs},
  genderRow: {flexDirection: 'row', marginBottom: space.sm},
});
