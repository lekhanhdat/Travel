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
import {Call, FAQ, Policy, Setting} from '../../../assets/ImageSvg';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import {IAccount} from '../../../common/types';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {BackSvg, UserSvg} from '../../../assets/assets/ImageSvg';
import {Button} from 'react-native-paper';
import {Avatar, getDisplayName} from '../../../utils/avatarUtils';


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
        <HeaderBase
          title={'Thông tin cá nhân'}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          />

        <View style={styles.container}>

          <View style={{alignSelf: 'center', marginBottom: sizes._10sdp}}>
            <Avatar avatarUrl={account?.avatar} size={sizes._60sdp} />
          </View>

          {/* Display fullName instead of userName */}
          <TextBase
            style={[
              AppStyle.txt_18_bold_review,
              {alignSelf: 'center'},
            ]}>
            {getDisplayName(this.state.account)}
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

          {/* Họ và tên */}
          <View style={{marginBottom: sizes._16sdp}}>
            <TextBase
              style={[
                AppStyle.txt_16_bold,
                {
                  color: colors.primary_400,
                  marginBottom: sizes._4sdp,
                },
              ]}>
              Họ và tên
            </TextBase>
            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  color: colors.primary_950,
                },
              ]}>
              {account?.fullName || 'Chưa cập nhật'}
            </TextBase>
          </View>

          {/* Tên đăng nhập */}
          <View style={{marginBottom: sizes._16sdp}}>
            <TextBase
              style={[
                AppStyle.txt_16_bold,
                {
                  color: colors.primary_400,
                  marginBottom: sizes._4sdp,
                },
              ]}>
              Tên đăng nhập
            </TextBase>
            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  color: colors.primary_950,
                },
              ]}>
              {account?.userName || 'Chưa cập nhật'}
            </TextBase>
          </View>

          {/* Email */}
          <View style={{marginBottom: sizes._16sdp}}>
            <TextBase
              style={[
                AppStyle.txt_16_bold,
                {
                  color: colors.primary_400,
                  marginBottom: sizes._4sdp,
                },
              ]}>
              Email
            </TextBase>
            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  color: colors.primary_950,
                },
              ]}>
              {account?.email || 'Chưa cập nhật'}
            </TextBase>
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
