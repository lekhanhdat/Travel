import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
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
import {IAccount} from '../../../common/types';

type ForgotPasswordProps = {
  navigation: any;
};

type ForgotPasswordState = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  step: 1 | 2 | 3;
  loading: boolean;
  accountId: number | null;
  isSecureTextEntry: boolean;
  isSecureTextEntryConfirm: boolean;
};

export default class ForgotPasswordScreen extends React.PureComponent<
  ForgotPasswordProps,
  ForgotPasswordState
> {
  constructor(props: ForgotPasswordProps) {
    super(props);
    this.state = {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
      step: 1,
      loading: false,
      accountId: null,
      isSecureTextEntry: true,
      isSecureTextEntryConfirm: true,
    };
  }

  // STEP 1: Send OTP to email
  handleSendOTP = async () => {
    const {email} = this.state;

    if (!email) {
      Toast.show({type: 'error', text1: 'Vui lòng nhập email'});
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
      // Check if email exists
      const account = await authApi.checkEmailExists(email);

      if (!account) {
        Toast.show({
          type: 'error',
          text1: 'Email không tồn tại trong hệ thống',
        });
        this.setState({loading: false});
        return;
      }

      // Send OTP via SendGrid (with rate limiting)
      const result = await authApi.sendOTPEmail(email);

      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: 'Không thể gửi mã xác thực',
          text2: result.error || 'Vui lòng thử lại sau',
        });
        this.setState({loading: false});
        return;
      }

      // Save account ID for password reset
      this.setState({
        accountId: account.Id ?? null,
        step: 2,
        loading: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Mã xác thực đã được gửi',
        text2: 'Vui lòng kiểm tra email của bạn',
      });
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      this.setState({loading: false});

      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến server',
      });
    }
  };

  // STEP 2: Verify OTP (with expiry check)
  handleVerifyOTP = () => {
    const {otp, email} = this.state;

    if (!otp) {
      Toast.show({type: 'error', text1: 'Vui lòng nhập mã xác thực'});
      return;
    }

    // Verify OTP with authApi (checks expiry and validity)
    const result = authApi.verifyOTP(email, otp);

    if (!result.valid) {
      Toast.show({
        type: 'error',
        text1: result.error || 'Mã xác thực không hợp lệ',
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Xác thực thành công',
    });

    this.setState({step: 3});
  };

  // STEP 3: Reset password
  handleResetPassword = async () => {
    const {newPassword, confirmPassword, accountId} = this.state;

    if (!newPassword || !confirmPassword) {
      Toast.show({type: 'error', text1: 'Vui lòng nhập đầy đủ thông tin'});
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({type: 'error', text1: 'Mật khẩu nhập lại không khớp'});
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
      return;
    }

    if (!accountId) {
      Toast.show({type: 'error', text1: 'Lỗi hệ thống'});
      return;
    }

    this.setState({loading: true});

    try {
      await authApi.updatePassword(accountId, newPassword);

      Toast.show({
        type: 'success',
        text1: 'Đặt lại mật khẩu thành công!',
        text2: 'Vui lòng đăng nhập',
      });

      this.setState({loading: false});

      // Navigate to login after 1 second
      setTimeout(() => {
        NavigationService.reset(ScreenName.LOGIN_SCREEN);
      }, 1000);
    } catch (error) {
      console.error('❌ Reset password error:', error);
      this.setState({loading: false});

      Toast.show({
        type: 'error',
        text1: 'Không thể đặt lại mật khẩu',
        text2: 'Vui lòng thử lại sau',
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

  renderStep1() {
    const {email, loading} = this.state;

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={images.dienhai}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Quên mật khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập email để nhận mã xác thực
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <TextInput
            mode="outlined"
            label="Email"
            placeholder="Nhập email của bạn"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            textColor={colors.primary_950}
            placeholderTextColor={colors.primary_400}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={email => this.setState({email})}
          />

          <TouchableOpacity
            style={[styles.btn, !email && styles.disabledButton]}
            onPress={this.handleSendOTP}
            disabled={!email || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text
                style={[
                  AppStyle.txt_20_bold,
                  {color: !email ? colors.primary_400 : colors.white},
                ]}
              >
                Gửi mã xác thực
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}
          >
            <Text style={styles.backText}>← Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  renderStep2() {
    const {otp, loading} = this.state;

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={images.nharong}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Nhập mã xác thực</Text>
          <Text style={styles.subtitle}>
            Mã xác thực đã được gửi đến email của bạn
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <TextInput
            mode="outlined"
            label="Mã xác thực (6 số)"
            placeholder="Nhập mã 6 số"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            textColor={colors.primary_950}
            placeholderTextColor={colors.primary_400}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={otp => this.setState({otp})}
          />

          <TouchableOpacity
            style={[styles.btn, !otp && styles.disabledButton]}
            onPress={this.handleVerifyOTP}
            disabled={!otp || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text
                style={[
                  AppStyle.txt_20_bold,
                  {color: !otp ? colors.primary_400 : colors.white},
                ]}
              >
                Xác nhận
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={this.handleSendOTP}
          >
            <Text style={styles.resendText}>Gửi lại mã</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  renderStep3() {
    const {
      newPassword,
      confirmPassword,
      loading,
      isSecureTextEntry,
      isSecureTextEntryConfirm,
    } = this.state;

    const isDisabled = !newPassword || !confirmPassword || loading;

    return (
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
          <Text style={styles.title}>Đặt mật khẩu mới</Text>
          <Text style={styles.subtitle}>
            Nhập mật khẩu mới cho tài khoản của bạn
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <TextInput
            mode="outlined"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            textColor={colors.primary_950}
            placeholderTextColor={colors.primary_400}
            secureTextEntry={isSecureTextEntry}
            value={newPassword}
            onChangeText={newPassword => this.setState({newPassword})}
            right={
              <TextInput.Icon
                icon={isSecureTextEntry ? images.eye_open : images.eye_close}
                onPress={this.toggleSecureEntry}
              />
            }
          />

          <TextInput
            mode="outlined"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu mới"
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
                  isSecureTextEntryConfirm ? images.eye_open : images.eye_close
                }
                onPress={this.toggleSecureEntryConfirm}
              />
            }
          />

          <TouchableOpacity
            style={[styles.btn, isDisabled && styles.disabledButton]}
            onPress={this.handleResetPassword}
            disabled={isDisabled}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text
                style={[
                  AppStyle.txt_20_bold,
                  {color: isDisabled ? colors.primary_400 : colors.white},
                ]}
              >
                Đặt lại mật khẩu
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  render() {
    const {step} = this.state;

    return (
      <Page>
        {step === 1 && this.renderStep1()}
        {step === 2 && this.renderStep2()}
        {step === 3 && this.renderStep3()}
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
  backButton: {
    marginTop: sizes._16sdp,
    alignItems: 'center',
  },
  backText: {
    color: colors.primary,
    fontSize: sizes._16sdp,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: sizes._16sdp,
    alignItems: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: sizes._16sdp,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
