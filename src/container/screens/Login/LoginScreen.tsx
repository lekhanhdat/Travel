import React from 'react';
import Page from '../../../component/Page';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import images from '../../../res/images';
import { AppStyle } from '../../../common/AppStyle';
import { accounts } from '../../../common/authConstants';
import Toast from 'react-native-toast-message';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import Swiper from 'react-native-swiper'
import { localStorageKey } from '../../../common/constants';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';

interface ILoginScreenProps {

}

interface ILoginScreenState {
  isSecureTextEntry: boolean;
  userName: string;
  password: string;
  banners: any[]
}

export default class LoginScreen extends React.PureComponent<ILoginScreenProps, ILoginScreenState> {
  constructor(props: ILoginScreenProps) {
    super(props);
    this.state = {
      isSecureTextEntry: true,
      userName: '',
      password: '',
      banners: [
        images.banner,
        images.banner2,
        images.banner,

      ]
    }
  }

  handleLogin = () => {
    const findExitsAccount = accounts.find(account => account.userName === this.state.userName && account.password === this.state.password)
    if (!findExitsAccount) {
      Toast.show({
        type: 'error',
        text1: 'Tên tài khoản hoặc mật khẩu không chính xác',
      })
      return;
    }
    LocalStorageCommon.setItem(localStorageKey.USERNAME, findExitsAccount.userName);
    LocalStorageCommon.setItem(localStorageKey.PASSWORD, findExitsAccount.password);
    LocalStorageCommon.setItem(localStorageKey.AVT, findExitsAccount);
    NavigationService.push(ScreenName.HOME_STACK_SCREEN);
  }

  render(): React.ReactNode {
    return (
      <Page >
        <View style={[styles.wrapper]}>
          <Swiper
            height={sizes._200sdp}
            autoplay
            activeDotColor={colors.primary}
          >
            {
              this.state.banners.map(banner => {
                return <View style={{ flex: 1 }}>
                  <Image source={banner} style={{ width: sizes.width, height: sizes._200sdp }} />
                </View>
              })
            }
          </Swiper>
        </View>
        <View style={styles.container}>

          <TextInput
            mode="outlined"
            label="Tên đăng nhập"
            placeholder="Nhập tên đăng nhập"
            style={{ width: '100%', marginBottom: sizes._16sdp }}
            outlineStyle={{ borderColor: colors.primary }}
            textColor={colors.primary_950}
            placeholderTextColor={colors.primary_950}
            onChangeText={(txt) => {
              this.setState({
                userName: txt
              })
            }}
          />

          <TextInput
            mode="outlined"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            style={{ width: '100%' }}
            outlineStyle={{ borderColor: colors.primary }}
            textColor={colors.primary_950}
            placeholderTextColor={colors.primary_950}
            right={<TextInput.Icon icon={this.state.isSecureTextEntry ? images.eye_open : images.eye_close} onPress={() => {
              this.setState({
                isSecureTextEntry: !this.state.isSecureTextEntry
              })
            }} />}
            secureTextEntry={this.state.isSecureTextEntry}
            onChangeText={(txt) => {
              this.setState({
                password: txt
              })
            }}
          />

          <TouchableOpacity style={[styles.btn, (this.state.userName.length === 0 || this.state.password.length === 0) && {
            backgroundColor: colors.primary_100
          }]}
            onPress={this.handleLogin}
            disabled={this.state.userName.length === 0 || this.state.password.length === 0}
          >
            <Text style={[AppStyle.txt_16_medium, {
              color: (this.state.userName.length === 0 || this.state.password.length === 0) ?
                colors.primary_400 : colors.primary_950
            }]}>Đăng nhập</Text>
          </TouchableOpacity>

        </View>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: sizes._16sdp,
    marginTop: sizes._100sdp
  },
  btn: {
    width: '100%',
    paddingVertical: sizes._16sdp,
    borderRadius: sizes._8sdp,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes._16sdp
  },
  wrapper: {
    width: '100%',
    height: sizes._200sdp,
  }
})