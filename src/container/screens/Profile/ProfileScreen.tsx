import React from 'react';
import {
  Image,
  Linking,
  NativeModules,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {AppStyle} from '../../../common/AppStyle';
import {Call, FAQ, Policy, ProfileSvg, Setting} from '../../../assets/ImageSvg';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import {IAccount} from '../../../common/types';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {UserSvg} from '../../../assets/assets/ImageSvg';
import {Button} from 'react-native-paper';

const {StatusBarManager} = NativeModules;

interface IProfileScreenProps {}

interface IProfileScreenState {
  account?: IAccount | null;
}

export default class ProfileScreen extends React.PureComponent<
  IProfileScreenProps,
  IProfileScreenState
> {
  constructor(props: IProfileScreenProps) {
    super(props);
    this.state = {
      account: null,
    };
  }

  phoneNumber = 'tel:0905447085'; // Số điện thoại cần gọi

  handleOpenCall = () => {
    Linking.openURL(this.phoneNumber).catch(err =>
      console.error('Error opening call:', err),
    );
  };

  componentDidMount(): void {
    this.handleGetUser();
  }

  handleGetUser = async () => {
    const response: IAccount = await LocalStorageCommon.getItem(
      localStorageKey.AVT,
    );
    this.setState({
      account: response,
    });
  };

  render(): React.ReactNode {
    const {account} = this.state;
    return (
      <Page>
        {/* <HeaderBase hideLeftIcon /> */}
        <View style={styles.container}>
          <TextBase style={[AppStyle.txt_20_bold]}>Thông tin cá nhân</TextBase>

          <Image
            source={{uri: account?.avatar}}
            alt="avatar"
            width={sizes._60sdp}
            height={sizes._60sdp}
            style={{
              borderRadius: 100,
              alignSelf: 'center',
              marginTop: sizes._16sdp,
              marginBottom: sizes._10sdp,
            }}
          />

              <TextBase
                style={[
                  AppStyle.txt_18_bold_review,
                  {alignSelf: 'center',},
                  
                  // {marginLeft: sizes._16sdp},
                ]}>
                {this.state.account?.userName}
              </TextBase>

          <View
            style={{
              width: '100%',
              height: 3,
              backgroundColor: colors.xam,
              marginTop: sizes._16sdp,
              marginBottom: sizes._16sdp,
            }}
          />

          <TextBase
            style={[
              AppStyle.txt_20_bold,
              {
                marginTop: sizes._12sdp,
                fontSize: sizes._20sdp,
                marginBottom: sizes._16sdp,
              },
            ]}>
            Account
          </TextBase>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <TextBase style={AppStyle.txt_18_bold}>
              {'Cuộc gọi khẩn cấp SOS'}
            </TextBase>
            <TouchableOpacity
              style={{
                width: sizes._56sdp,
                height: sizes._40sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._1000sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={this.handleOpenCall}>
              <Call
                width={sizes._20sdp}
                height={sizes._20sdp}
                color={colors.primary_950}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: sizes._16sdp,
            }}>
            <TextBase style={AppStyle.txt_18_bold}>
              {'Thông tin tài khoản'}
            </TextBase>
            <TouchableOpacity
              style={{
                width: sizes._56sdp,
                height: sizes._40sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._1000sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <UserSvg
                width={sizes._20sdp}
                height={sizes._20sdp}
                color={colors.primary_950}
              />
            </TouchableOpacity>
          </View>
          <View
            style={{
              width: '100%',
              height: 3,
              backgroundColor: colors.xam,
              marginTop: sizes._24sdp,
              marginBottom: sizes._16sdp,
            }}
          />

          <TextBase
            style={[
              AppStyle.txt_20_bold,
              {
                marginTop: sizes._12sdp,
                fontSize: sizes._20sdp,
                marginBottom: sizes._16sdp,
              },
            ]}>
            Other
          </TextBase>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <TextBase style={AppStyle.txt_18_bold}>{'Cài đặt'}</TextBase>
            <TouchableOpacity
              style={{
                width: sizes._56sdp,
                height: sizes._40sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._1000sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Setting
                width={sizes._20sdp}
                height={sizes._20sdp}
                color={colors.primary_950}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: sizes._16sdp,
            }}>
            <TextBase style={AppStyle.txt_18_bold}>
              {'Các câu hỏi thường gặp'}
            </TextBase>
            <TouchableOpacity
              style={{
                width: sizes._56sdp,
                height: sizes._40sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._1000sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <FAQ
                width={sizes._20sdp}
                height={sizes._20sdp}
                color={colors.primary_950}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: sizes._16sdp,
            }}>
            <TextBase style={AppStyle.txt_18_bold}>
              {'Chính sách & bảo mật'}
            </TextBase>
            <TouchableOpacity
              style={{
                width: sizes._56sdp,
                height: sizes._40sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._1000sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Policy
                width={sizes._20sdp}
                height={sizes._20sdp}
                color={colors.primary_950}
              />
            </TouchableOpacity>
          </View>

          <View style={{marginTop: sizes._26sdp}}>
            <Button
              mode="contained"
              labelStyle={{ fontSize: 18, height: sizes._30sdp, textAlignVertical: 'center', color: '#B22222' }} // Tăng kích thước chữ
              onPress={() => {
                NavigationService.reset(ScreenName.LOGIN_SCREEN);            
              }}>
              Đăng xuất
            </Button>
            {/* <TouchableOpacity
              style={[styles.btn]}
              onPress={() => {
                NavigationService.reset(ScreenName.LOGIN_SCREEN);
              }}>
              <TextBase style={[AppStyle.txt_18_bold]}></TextBase>
            </TouchableOpacity> */}
          </View>
        </View>
      </Page>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    paddingTop: StatusBarManager.HEIGHT + sizes._16sdp,
    padding: sizes._16sdp,
    flex: 1,
    backgroundColor: colors.background,
  },
  btn: {
    width: sizes.width - sizes._30sdp,
    paddingVertical: sizes._16sdp,
    borderRadius: sizes._30sdp,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes._16sdp,
  },
});
