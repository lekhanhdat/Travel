import React from 'react';
import i18n from '../../../i18n';
import Toast from 'react-native-toast-message';
import images from '../../../res/images';
import {AuthButton, AuthInput, AuthLayout, AuthSwitch, PasswordInput} from '../../../features/auth/AuthLayout';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import authApi from '../../../services/auth.api';


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
      // The backend answers the same for unknown emails (no account enumeration), so there is no
      // "email exists" check here any more. Previous flow, kept for reference:
      // const account = await authApi.checkEmailExists(email);
      // if (!account) { Toast.show({type: 'error', text1: 'Email không tồn tại trong hệ thống'}); ... }

      // Send OTP via Gmail SMTP (backend module `email`, rate limited server-side)
      const result = await authApi.sendOTPEmail(email.trim());

      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: 'Không thể gửi mã xác thực',
          text2: result.error || 'Vui lòng thử lại sau',
        });
        this.setState({loading: false});
        return;
      }

      this.setState({step: 2, otp: '', loading: false});

      Toast.show({
        type: 'success',
        text1: 'Đã gửi yêu cầu',
        text2: 'Nếu email đã đăng ký, mã xác thực sẽ đến trong ít phút',
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

  // STEP 2: OTP format only — the backend checks the code (expiry, one-time use) in reset-password.
  handleVerifyOTP = () => {
    const {otp} = this.state;

    if (!/^\d{6}$/.test(otp)) {
      Toast.show({type: 'error', text1: 'Mã xác thực gồm 6 chữ số'});
      return;
    }

    this.setState({step: 3});
  };

  // STEP 3: Reset password
  handleResetPassword = async () => {
    const {email, otp, newPassword, confirmPassword} = this.state;

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

    this.setState({loading: true});

    try {
      const result = await authApi.resetPassword(email.trim(), otp, newPassword);

      if (!result.success) {
        // Wrong or expired code: back to the code step so the user can retype or resend it.
        this.setState({loading: false, step: 2, otp: ''});
        Toast.show({
          type: 'error',
          text1: 'Không thể đặt lại mật khẩu',
          text2: result.error || 'Vui lòng thử lại sau',
        });
        return;
      }

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

  // Layout matches Login/SignUp (features/auth/AuthLayout).
  renderStep1() {
    const {email, loading} = this.state;
    return (
      <AuthLayout
        title={i18n.t('common:forgot.title')}
        subtitle={i18n.t('common:forgot.step1')}
        image={images.caurong}
        onBack={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}
        backLabel={i18n.t('common:buttons.back')}>
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
        <AuthButton
          label={i18n.t('common:forgot.sendCode')}
          icon="email-fast-outline"
          onPress={this.handleSendOTP}
          loading={loading}
          disabled={!email}
        />
      </AuthLayout>
    );
  }

  renderStep2() {
    const {otp, loading} = this.state;
    return (
      <AuthLayout
        title={i18n.t('common:forgot.enterCode')}
        subtitle={i18n.t('common:forgot.step2')}
        image={images.caurong}
        onBack={() => this.setState({step: 1})}
        backLabel={i18n.t('common:buttons.back')}
        footer={
          <AuthSwitch
            question={i18n.t('common:forgot.noCode')}
            action={i18n.t('common:forgot.resend')}
            onPress={this.handleSendOTP}
          />
        }>
        <AuthInput
          icon="shield-key-outline"
          label={i18n.t('common:forgot.code')}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={otpInput => this.setState({otp: otpInput})}
        />
        <AuthButton
          label={i18n.t('common:forgot.verify')}
          icon="check"
          onPress={this.handleVerifyOTP}
          loading={loading}
          disabled={!otp}
        />
      </AuthLayout>
    );
  }

  renderStep3() {
    const {newPassword, confirmPassword, loading} = this.state;
    const isDisabled = !newPassword || !confirmPassword || loading;
    return (
      <AuthLayout
        title={i18n.t('common:forgot.newPassword')}
        subtitle={i18n.t('common:forgot.step3')}
        image={images.caurong}
        onBack={() => this.setState({step: 2})}
        backLabel={i18n.t('common:buttons.back')}>
        <PasswordInput
          label={i18n.t('common:forgot.newPassword')}
          placeholder={i18n.t('common:ui.signup.passwordPlaceholder')}
          value={newPassword}
          onChangeText={newPasswordInput => this.setState({newPassword: newPasswordInput})}
        />
        <PasswordInput
          label={i18n.t('common:ui.signup.confirmPassword')}
          placeholder={i18n.t('common:ui.signup.confirmPlaceholder')}
          error={!!confirmPassword && confirmPassword !== newPassword}
          value={confirmPassword}
          onChangeText={confirmPasswordInput => this.setState({confirmPassword: confirmPasswordInput})}
        />
        <AuthButton
          label={i18n.t('common:forgot.reset')}
          icon="lock-reset"
          onPress={this.handleResetPassword}
          loading={loading}
          disabled={isDisabled}
        />
      </AuthLayout>
    );
  }

  render() {
    const {step} = this.state;
    if (step === 2) {return this.renderStep2();}
    if (step === 3) {return this.renderStep3();}
    return this.renderStep1();
  }
}
