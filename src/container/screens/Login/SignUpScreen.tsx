import React from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-paper';
import Swiper from 'react-native-swiper';
import Toast from 'react-native-toast-message';

import Page from '../../../component/Page';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import images from '../../../res/images';
import { AppStyle } from '../../../common/AppStyle';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';

interface ISignUpScreenState {
  userName: string;
  password: string;
  confirmPassword: string;
  isSecureTextEntry: boolean;
}

export default class SignUpScreen extends React.PureComponent<{}, ISignUpScreenState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      userName: '',
      password: '',
      confirmPassword: '',
      isSecureTextEntry: true,
    };
  }

  handleSignUp = () => {
    const { userName, password, confirmPassword } = this.state;

    if (!userName || !password || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mật khẩu nhập lại không khớp' });
      return;
    }
    Toast.show({ type: 'success', text1: 'Đăng ký thành công!' });
    NavigationService.push(ScreenName.LOGIN);
  };

  toggleSecureEntry = () => {
    this.setState(prevState => ({ isSecureTextEntry: !prevState.isSecureTextEntry }));
  };

  renderBanner = (banner: any, index: number) => (
    <View key={index} style={styles.bannerContainer}>
      <Image source={banner} style={styles.bannerImage} />
    </View>
  );

  render() {
    const { userName, password, confirmPassword, isSecureTextEntry } = this.state;
    const isSignUpDisabled = !userName || !password || !confirmPassword;

    return (
      <Page>
        <View style={styles.wrapper}>
          <Swiper height={sizes._400sdp} autoplay activeDotColor={colors.primary}>
            {[images.caurong, images.cauvang, images.dienhai, images.nharong].map(this.renderBanner)}
          </Swiper>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Đăng ký</Text>
        </View>

        <View style={styles.container}>
          <TextInput
            mode="outlined"
            label="Tên đăng nhập"
            placeholder="Nhập tên đăng nhập"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            onChangeText={userName => this.setState({ userName })}
          />

          <TextInput
            mode="outlined"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            secureTextEntry={isSecureTextEntry}
            right={<TextInput.Icon icon={isSecureTextEntry ? images.eye_open : images.eye_close} onPress={this.toggleSecureEntry} />}
            onChangeText={password => this.setState({ password })}
          />

          <TextInput
            mode="outlined"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            secureTextEntry={isSecureTextEntry}
            right={<TextInput.Icon icon={isSecureTextEntry ? images.eye_open : images.eye_close} onPress={this.toggleSecureEntry} />}
            onChangeText={confirmPassword => this.setState({ confirmPassword })}
          />

          <TouchableOpacity
            style={[styles.btn, isSignUpDisabled && { backgroundColor: colors.primary_100 }]}
            onPress={this.handleSignUp}
            disabled={isSignUpDisabled}
          >
            <Text style={[AppStyle.txt_20_bold, { color: isSignUpDisabled ? colors.primary_400 : '#F7F2E5' }]}>
              Đăng ký
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Đã có tài khoản?{' '}
              <TouchableOpacity onPress={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: sizes._320sdp,
    marginBottom: sizes._30sdp,
    borderBottomLeftRadius: sizes._50sdp,
    borderBottomRightRadius: sizes._50sdp,
    overflow: 'hidden',
  },
  bannerContainer: {
    flex: 1,
  },
  bannerImage: {
    width: sizes.width,
    height: sizes._400sdp,
    borderBottomLeftRadius: sizes._50sdp,
    borderBottomRightRadius: sizes._50sdp,
    alignSelf: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    color: colors.black,
    fontSize: sizes._25sdp,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: sizes._16sdp,
    marginTop: sizes._10sdp,
  },
  input: {
    width: '100%',
    marginBottom: sizes._16sdp,
  },
  inputOutline: {
    borderColor: colors.primary,
    borderRadius: sizes._16sdp,
  },
  btn: {
    width: '100%',
    paddingVertical: sizes._16sdp,
    borderRadius: sizes._16sdp,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes._40sdp,
  },
  loginContainer: {
    marginTop: sizes._10sdp,
  },
  loginText: {
    color: colors.primary,
    textAlign: 'center',
  },
  loginLink: {
    fontWeight: 'bold',
  },
});