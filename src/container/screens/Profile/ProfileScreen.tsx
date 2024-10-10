import React from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import { AppStyle } from '../../../common/AppStyle';
import { Call, FAQ, Policy, ProfileSvg, Setting } from '../../../assets/ImageSvg';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import { IAccount } from '../../../common/types';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import { localStorageKey } from '../../../common/constants';
import { UserSvg } from '../../../assets/assets/ImageSvg';

interface IProfileScreenProps {

}

interface IProfileScreenState {
  account?: IAccount | null;
}

export default class ProfileScreen extends React.PureComponent<IProfileScreenProps, IProfileScreenState> {
  constructor(props: IProfileScreenProps) {
    super(props);
    this.state = {
      account: null
    }
  }

  phoneNumber = 'tel:115'; // Số điện thoại cần gọi

  handleOpenCall = () => {
    Linking.openURL(this.phoneNumber).catch((err) =>
      console.error('Error opening call:', err)
    );
  };

  componentDidMount(): void {
    this.handleGetUser();
  }

  handleGetUser = async () => {
    const response: IAccount = await LocalStorageCommon.getItem(localStorageKey.AVT);
    this.setState({
      account: response
    })
  }

  render(): React.ReactNode {
    const { account } = this.state;
    return (
      <Page>
        <HeaderBase hideLeftIcon title={strings.profile} />
        <View style={styles.container}>
          <Image source={{ uri: account?.avatar }} width={sizes._60sdp} height={sizes._60sdp} style={{ borderRadius: 100, alignSelf: 'center' }} />

          <View style={{ width: '100%', height: 1, backgroundColor: colors.primary, marginTop: sizes._16sdp }} />

          <TextBase style={[AppStyle.txt_16_regular, { marginTop: sizes._16sdp, fontSize: sizes._20sdp }]}>Account</TextBase>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TextBase style={AppStyle.txt_14_bold}>{'Cuộc gọi khẩn cấp'}</TextBase>
            <TouchableOpacity style={{
              width: sizes._56sdp,
              height: sizes._40sdp,
              backgroundColor: colors.primary,
              borderRadius: sizes._1000sdp,
              alignItems: 'center',
              justifyContent: 'center'
            }}
              onPress={this.handleOpenCall}
            >
              <Call width={sizes._20sdp} height={sizes._20sdp} color={colors.primary_950} />
            </TouchableOpacity>


          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: sizes._8sdp }}>
            <TextBase style={AppStyle.txt_14_bold}>{'Thông tin tài khoản'}</TextBase>
            <TouchableOpacity style={{
              width: sizes._56sdp,
              height: sizes._40sdp,
              backgroundColor: colors.primary,
              borderRadius: sizes._1000sdp,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            >
              <UserSvg width={sizes._20sdp} height={sizes._20sdp} color={colors.primary_950} />
            </TouchableOpacity>


          </View>
          <View style={{ width: '100%', height: 1, backgroundColor: colors.primary, marginTop: sizes._16sdp }} />


          <TextBase style={[AppStyle.txt_16_regular, { marginTop: sizes._16sdp, fontSize: sizes._20sdp }]}>Others</TextBase>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TextBase style={AppStyle.txt_14_bold}>{'Setting'}</TextBase>
            <TouchableOpacity style={{
              width: sizes._56sdp,
              height: sizes._40sdp,
              backgroundColor: colors.primary,
              borderRadius: sizes._1000sdp,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            >
              <Setting width={sizes._20sdp} height={sizes._20sdp} color={colors.primary_950} />
            </TouchableOpacity>


          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: sizes._8sdp }}>
            <TextBase style={AppStyle.txt_14_bold}>{'FAQ'}</TextBase>
            <TouchableOpacity style={{
              width: sizes._56sdp,
              height: sizes._40sdp,
              backgroundColor: colors.primary,
              borderRadius: sizes._1000sdp,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            >
              <FAQ width={sizes._20sdp} height={sizes._20sdp} color={colors.primary_950} />
            </TouchableOpacity>


          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: sizes._8sdp }}>
            <TextBase style={AppStyle.txt_14_bold}>{'Privacy & Policy'}</TextBase>
            <TouchableOpacity style={{
              width: sizes._56sdp,
              height: sizes._40sdp,
              backgroundColor: colors.primary,
              borderRadius: sizes._1000sdp,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            >
              <Policy width={sizes._20sdp} height={sizes._20sdp} color={colors.primary_950} />
            </TouchableOpacity>


          </View>



          <View
            style={{ position: 'absolute', bottom: sizes._50sdp, left: sizes._16sdp }}
          >
            <TouchableOpacity style={[styles.btn,]}
              onPress={() => {
                NavigationService.reset(ScreenName.LOGIN_SCREEN)
              }}
            >
              <TextBase style={[AppStyle.txt_16_medium, {
                color: colors.primary_950
              }]}>Đăng xuất</TextBase>
            </TouchableOpacity>
          </View>
        </View>
      </Page>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    padding: sizes._16sdp,
    flex: 1,
  },
  btn: {
    width: sizes.width - sizes._32sdp,
    paddingVertical: sizes._16sdp,
    borderRadius: sizes._8sdp,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes._16sdp
  },
})