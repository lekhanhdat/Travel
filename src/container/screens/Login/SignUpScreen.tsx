import React from 'react';
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
      isSecureTextEntry: true,
      isSecureTextEntryConfirm: true,
      loading: false,
    };
  }

  handleSignUp = async () => {
    const {userName, password, confirmPassword, fullName, email} = this.state;

    // Validation
    if (!userName || !password || !confirmPassword || !fullName || !email) {
      Toast.show({type: 'error', text1: 'Vui lòng nhập đầy đủ thông tin'});
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({type: 'error', text1: 'Mật khẩu nhập lại không khớp'});
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({type: 'error', text1: 'Email không hợp lệ'});
      return;
    }

    this.setState({loading: true});

    try {
      await authApi.signUp(userName, password, fullName, email);

      Toast.show({
        type: 'success',
        text1: 'Đăng ký thành công!',
        text2: 'Vui lòng đăng nhập',
      });

      this.setState({loading: false});
      NavigationService.reset(ScreenName.LOGIN_SCREEN);
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      this.setState({loading: false});

      Toast.show({
        type: 'error',
        text1: 'Đăng ký thất bại',
        text2: error.message || 'Vui lòng thử lại sau',
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
            <Text style={styles.title}>Đăng ký</Text>
            <Text style={styles.subtitle}>Tạo tài khoản mới</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <TextInput
              mode="outlined"
              label="Họ và tên"
              placeholder="Nhập họ và tên đầy đủ"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              value={fullName}
              onChangeText={fullName => this.setState({fullName})}
            />

            {/* Username */}
            <TextInput
              mode="outlined"
              label="Tên đăng nhập"
              placeholder="Nhập tên đăng nhập"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              value={userName}
              onChangeText={userName => this.setState({userName})}
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
              onChangeText={email => this.setState({email})}
            />

            {/* Password */}
            <TextInput
              mode="outlined"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              secureTextEntry={isSecureTextEntry}
              value={password}
              onChangeText={password => this.setState({password})}
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
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              textColor={colors.primary_950}
              placeholderTextColor={colors.primary_400}
              secureTextEntry={isSecureTextEntryConfirm}
              value={confirmPassword}
              onChangeText={confirmPassword => this.setState({confirmPassword})}
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
                  Đăng ký
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity
                onPress={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}
              >
                <Text style={styles.loginLink}>Đăng nhập</Text>
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
});

