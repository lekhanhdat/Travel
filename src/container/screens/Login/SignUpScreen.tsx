import React from 'react';
import Page from '../../../component/Page';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import images from '../../../res/images';
import { AppStyle } from '../../../common/AppStyle';
import Toast from 'react-native-toast-message';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import Swiper from 'react-native-swiper';

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

  render(): React.ReactNode {
    return (
      <Page>
        <View style={styles.wrapper}>
          <Swiper height={sizes._400sdp} autoplay activeDotColor={colors.primary}>
            {[images.caurong, images.cauvang, images.dienhai, images.nharong].map((banner, index) => (
              <View key={index} style={{ flex: 1 }}>
                <Image source={banner} style={styles.bannerImage} />
              </View>
            ))}
          </Swiper>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Đăng ký</Text>
        </View>

        <View style={styles.container}>
          <TextInput
            mode="outlined"
            label="Tên đăng nhập"
            placeholder="Nhập tên đăng nhập"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            onChangeText={(txt) => this.setState({ userName: txt })}
          />

          <TextInput
            mode="outlined"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            secureTextEntry={this.state.isSecureTextEntry}
            right={<TextInput.Icon icon={this.state.isSecureTextEntry ? images.eye_open : images.eye_close} onPress={() => this.setState({ isSecureTextEntry: !this.state.isSecureTextEntry })} />}
            onChangeText={(txt) => this.setState({ password: txt })}
          />

          <TextInput
            mode="outlined"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            secureTextEntry={this.state.isSecureTextEntry}
            onChangeText={(txt) => this.setState({ confirmPassword: txt })}
          />

          <TouchableOpacity
            style={[styles.btn, (!this.state.userName || !this.state.password || !this.state.confirmPassword) && { backgroundColor: colors.primary_100 }]}
            onPress={this.handleSignUp}
            disabled={!this.state.userName || !this.state.password || !this.state.confirmPassword}
          >
            <Text style={[AppStyle.txt_20_bold, { color: !this.state.userName || !this.state.password || !this.state.confirmPassword ? colors.primary_400 : '#F7F2E5' }]}>Đăng ký</Text>
          </TouchableOpacity>

          <Text style={styles.loginText}>
            Đã có tài khoản? {' '}
            <TouchableOpacity onPress={() => NavigationService.reset(ScreenName.LOGIN_SCREEN)}>
              <Text style={{ fontWeight: 'bold' }}>Đăng nhập</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: sizes._16sdp,
    marginTop: sizes._10sdp,
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
  wrapper: {
    width: '100%',
    height: sizes._320sdp,
    marginBottom: sizes._30sdp,
    borderBottomLeftRadius: sizes._50sdp,
    borderBottomRightRadius: sizes._50sdp,
    overflow: 'hidden',
  },
  bannerImage: {
    width: sizes.width,
    height: sizes._400sdp,
    borderBottomLeftRadius: sizes._50sdp,
    borderBottomRightRadius: sizes._50sdp,
    alignSelf: 'center',
  },
  title: {
    color: '#F97350',
    fontSize: sizes._25sdp,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: sizes._16sdp,
    backgroundColor: '#F7F2E5',
  },
  inputOutline: {
    borderColor: colors.primary,
    borderRadius: sizes._16sdp,
  },
  loginText: {
    color: colors.primary,
    marginTop: sizes._10sdp,
    textAlign: 'center',
  },
});