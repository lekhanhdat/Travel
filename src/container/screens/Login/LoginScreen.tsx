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
import { accounts } from '../../../common/authConstants';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import { localStorageKey } from '../../../common/constants';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';

interface ILoginScreenState {
  isSecureTextEntry: boolean;
  userName: string;
  password: string;
  banners: any[];
}

export default class LoginScreen extends React.PureComponent<{}, ILoginScreenState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      isSecureTextEntry: true,
      userName: '',
      password: '',
      banners: [images.caurong, images.cauvang, images.dienhai, images.nharong],
    };
  }

  handleLogin = () => {
    const account = accounts.find(
      acc => acc.userName === this.state.userName && acc.password === this.state.password
    );

    if (!account) {
      Toast.show({
        type: 'error',
        text1: 'Tên tài khoản hoặc mật khẩu không chính xác',
      });
      return;
    }

    LocalStorageCommon.setItem(localStorageKey.USERNAME, account.userName);
    LocalStorageCommon.setItem(localStorageKey.PASSWORD, account.password);
    LocalStorageCommon.setItem(localStorageKey.AVT, account);
    NavigationService.push(ScreenName.HOME_STACK_SCREEN);
  };

  toggleSecureEntry = () => {
    this.setState(prevState => ({
      isSecureTextEntry: !prevState.isSecureTextEntry,
    }));
  };

  renderBanner = (banner: any, index: number) => (
    <View key={index} style={styles.bannerContainer}>
      <Image
        source={banner}
        style={styles.bannerImage}
      />
    </View>
  );

  render() {
    const { userName, password, isSecureTextEntry, banners } = this.state;
    const isLoginDisabled = !userName || !password;

    return (
      <Page>
        <View style={styles.wrapper}>
          <Swiper
            height={sizes._400sdp}
            autoplay
            activeDotColor={colors.white}
          >
            {banners.map(this.renderBanner)}
          </Swiper>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Đăng nhập</Text>
        </View>

        <View style={styles.container}>
          <TextInput
            mode="outlined"
            label="Tên đăng nhập"
            placeholder="Nhập tên đăng nhập"
            style={styles.textInput}
            outlineStyle={styles.inputOutline}
            textColor={colors.primary_950}
            placeholderTextColor={colors.black}
            onChangeText={userName => this.setState({ userName })}
          />

          <TextInput
            mode="outlined"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            style={styles.textInput}
            outlineStyle={styles.inputOutline}
            textColor={colors.primary_950}
            placeholderTextColor={colors.black}
            secureTextEntry={isSecureTextEntry}
            right={
              <TextInput.Icon
                icon={isSecureTextEntry ? images.eye_open : images.eye_close}
                onPress={this.toggleSecureEntry}
              />
            }
            onChangeText={password => this.setState({ password })}
          />

          <TouchableOpacity
            onPress={() => NavigationService.reset(ScreenName.FORGOT_PASSWORD)}
          >
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoginDisabled && styles.disabledButton]}
            onPress={this.handleLogin}
            disabled={isLoginDisabled}
          >
            <Text
              style={[
                AppStyle.txt_20_bold,
                { color: isLoginDisabled ? colors.primary_400 : colors.white },
              ]}
            >
              Đăng nhập
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Chưa có tài khoản?{' '}
              <TouchableOpacity
                onPress={() => NavigationService.reset(ScreenName.SIGN_UP)}
              >
                <Text style={styles.signupLink}>Đăng ký</Text>
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
  textInput: {
    width: '100%',
    marginBottom: sizes._16sdp,
  },
  inputOutline: {
    borderColor: colors.black,
    borderRadius: sizes._16sdp,
  },
  forgotPassword: {
    color: colors.primary,
    marginTop: sizes._10sdp,
    marginLeft: sizes._10sdp,
  },
  loginButton: {
    width: '100%',
    paddingVertical: sizes._16sdp,
    borderRadius: sizes._16sdp,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes._40sdp,
  },
  disabledButton: {
    backgroundColor: colors.primary_200,
  },
  signupContainer: {
    marginTop: sizes._10sdp,
  },
  signupText: {
    color: colors.primary,
    textAlign: 'center',
  },
  signupLink: {
    fontWeight: 'bold',
  },
});