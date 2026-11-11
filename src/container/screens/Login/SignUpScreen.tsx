import React from 'react';
import i18n from '../../../i18n';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import Page from '../../../component/Page';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import images from '../../../res/images';
import {AppStyle} from '../../../common/AppStyle';
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
  isSecureTextEntry: boolean;
  isSecureTextEntryConfirm: boolean;
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
      isSecureTextEntry: true,
      isSecureTextEntryConfirm: true,
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

  toggleSecureEntry = () => {
    this.setState(prevState => ({
      isSecureTextEntry: !prevState.isSecureTextEntry,
    }));
  };

  toggleSecureEntryConfirm = () => {
    this.setState(prevState => ({
      isSecureTextEntryConfirm: !prevState.isSecureTextEntryConfirm,
    }));
  };

  render() {
    const {
      userName,
      password,
      confirmPassword,
      fullName,
      email,
      phone,
      gender,
      birthday,
      address,
      isSecureTextEntry,
      isSecureTextEntryConfirm,
      loading,
    } = this.state;

    const isSignUpDisabled =
      !userName ||
      !password ||
      !confirmPassword ||
      !fullName ||
      !email ||
      loading;

    return (
      <Page>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={images.cauvang}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{i18n.t('common:ui.common.signup')}</Text>
            <Text style={styles.subtitle}>{i18n.t('common:ui.signup.createAccount')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <TextInput
              mode="outlined"
              label={i18n.t('common:ui.signup.fullName')}
              placeholder={i18n.t('common:ui.signup.fullNamePlaceholder')}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              value={fullName}
              onChangeText={fullNameInput => this.setState({fullName: fullNameInput})}
            />

            {/* Birthday */}
            <TextInput
              mode="outlined"
              label={i18n.t('common:ui.signup.birthday')}
              placeholder="VD: 01/01/1990"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              value={birthday}
              onChangeText={birthdayInput => this.setState({birthday: birthdayInput})}
            />

            {/* Gender */}
            <View style={styles.genderSection}>
              <Text style={styles.genderLabel}>{i18n.t('common:ui.signup.gender')}</Text>
              <View style={styles.genderContainer}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      gender === g && styles.genderOptionSelected,
                    ]}
                    onPress={() => this.setState({gender: g})}>
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.genderTextSelected,
                      ]}>
                      {g === 'Male' ? 'Nam' : g === 'Female' ? 'Nữ' : i18n.t('common:ui.common.other')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Address */}
            <TextInput
              mode="outlined"
              label={i18n.t('common:ui.signup.address')}
              placeholder={i18n.t('common:ui.common.addressPlaceholder')}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              value={address}
              onChangeText={addressInput => this.setState({address: addressInput})}
            />

            {/* Phone */}
            <TextInput
              mode="outlined"
              label={i18n.t('common:ui.signup.phone')}
              placeholder={i18n.t('common:ui.common.phonePlaceholder')}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={phoneInput => this.setState({phone: phoneInput})}
            />

            {/* Email */}
            <TextInput
              mode="outlined"
              label="Email"
              placeholder="Nhập email"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={emailInput => this.setState({email: emailInput})}
            />

            {/* Username */}
            <TextInput
              mode="outlined"
              label={i18n.t('common:ui.common.userName')}
              placeholder={i18n.t('common:ui.common.userNamePlaceholder')}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              value={userName}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={userNameInput => this.setState({userName: userNameInput})}
            />

            {/* Password */}
            <TextInput
              mode="outlined"
              label="Mật khẩu"
              placeholder={i18n.t('common:ui.signup.passwordPlaceholder')}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              secureTextEntry={isSecureTextEntry}
              value={password}
              onChangeText={passwordInput => this.setState({password: passwordInput})}
              right={
                <TextInput.Icon
                  icon={isSecureTextEntry ? images.eye_open : images.eye_close}
                  onPress={this.toggleSecureEntry}
                />
              }
            />

            {/* Confirm Password */}
            <TextInput
              mode="outlined"
              label={i18n.t('common:ui.signup.confirmPassword')}
              placeholder={i18n.t('common:ui.signup.confirmPlaceholder')}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              secureTextEntry={isSecureTextEntryConfirm}
              value={confirmPassword}
              onChangeText={confirmPasswordInput => this.setState({confirmPassword: confirmPasswordInput})}
              right={
                <TextInput.Icon
                  icon={
                    isSecureTextEntryConfirm
                      ? images.eye_open
                      : images.eye_close
                  }
                  onPress={this.toggleSecureEntryConfirm}
                />
              }
            />

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.btn, isSignUpDisabled && styles.disabledButton]}
              onPress={this.handleSignUp}
              disabled={isSignUpDisabled}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text
                  style={[
                    AppStyle.txt_20_bold,
                    {
                      color: isSignUpDisabled
                        ? colors.primary_400
                        : colors.white,
                    },
                  ]}
                >
                  {i18n.t('common:ui.common.signup')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{i18n.t('common:ui.signup.haveAccount')}</Text>
              <TouchableOpacity
                onPress={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}
              >
                <Text style={styles.loginLink}>{i18n.t('common:ui.common.login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: sizes._32sdp,
  },
  illustrationContainer: {
    height: sizes._250sdp,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary_100,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    paddingHorizontal: sizes._24sdp,
    paddingTop: sizes._24sdp,
    paddingBottom: sizes._16sdp,
  },
  title: {
    fontSize: sizes._32sdp,
    fontWeight: 'bold',
    color: colors.primary_950,
    marginBottom: sizes._8sdp,
  },
  subtitle: {
    fontSize: sizes._16sdp,
    color: colors.primary_400,
  },
  formContainer: {
    paddingHorizontal: sizes._24sdp,
  },
  input: {
    marginBottom: sizes._16sdp,
    backgroundColor: colors.white,
  },
  inputOutline: {
    borderColor: colors.primary,
    borderRadius: sizes._12sdp,
  },
  btn: {
    width: '100%',
    paddingVertical: sizes._16sdp,
    borderRadius: sizes._16sdp,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes._24sdp,
  },
  disabledButton: {
    backgroundColor: colors.primary_200,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: sizes._16sdp,
  },
  loginText: {
    color: colors.primary_400,
    fontSize: sizes._16sdp,
  },
  loginLink: {
    color: colors.primary,
    fontSize: sizes._16sdp,
    fontWeight: 'bold',
  },
  genderSection: {
    marginBottom: sizes._16sdp,
  },
  genderLabel: {
    fontSize: sizes._14sdp,
    color: colors.primary_400,
    marginBottom: sizes._8sdp,
    marginLeft: sizes._4sdp,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: sizes._12sdp,
  },
  genderOption: {
    flex: 1,
    paddingVertical: sizes._12sdp,
    borderRadius: sizes._12sdp,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  genderOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: sizes._14sdp,
    color: colors.primary_950,
  },
  genderTextSelected: {
    color: colors.white,
  },
});

