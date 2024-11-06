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
import {BackSvg, UserSvg} from '../../../assets/assets/ImageSvg';
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

          <Image
            source={{uri: account?.avatar}}
            alt="avatar"
            width={sizes._60sdp}
            height={sizes._60sdp}
            style={{
              borderRadius: 100,
              alignSelf: 'center',
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
            Họ và tên
          </TextBase>
          
          <TextBase
            style={[
              AppStyle.txt_20_bold,
              {
                marginTop: sizes._12sdp,
                fontSize: sizes._20sdp,
                marginBottom: sizes._16sdp,
              },
            ]}>
            Ngày sinh
          </TextBase>

          <TextBase
            style={[
              AppStyle.txt_20_bold,
              {
                marginTop: sizes._12sdp,
                fontSize: sizes._20sdp,
                marginBottom: sizes._16sdp,
              },
            ]}>
            Email
          </TextBase>
          

          <TextBase
            style={[
              AppStyle.txt_20_bold,
              {
                marginTop: sizes._12sdp,
                fontSize: sizes._20sdp,
                marginBottom: sizes._16sdp,
              },
            ]}>
            Số điện thoại
          </TextBase>



    
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
