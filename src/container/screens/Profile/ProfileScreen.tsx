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
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {AppStyle} from '../../../common/AppStyle';
import {Call, FAQ, Policy, Setting, ChatBotSvg} from '../../../assets/ImageSvg';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import {IAccount} from '../../../common/types';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {Avatar, getDisplayName} from '../../../utils/avatarUtils';
import {UserSvg} from '../../../assets/assets/ImageSvg';
import {Button} from 'react-native-paper';
import {withAzureTranslation, WithAzureTranslationProps} from '../../../hoc/withAzureTranslation';

const {StatusBarManager} = NativeModules;

interface IProfileScreenProps extends WithAzureTranslationProps {
  navigation?: any;
}

interface IProfileScreenState {
  account?: IAccount | null;
}

class ProfileScreen extends React.PureComponent<
  IProfileScreenProps,
  IProfileScreenState
> {
  constructor(props: IProfileScreenProps) {
    super(props);
    this.state = {
      account: null,
    };
  }

  phoneNumber = 'tel:0528777528'; // Số điện thoại cần gọi

  handleOpenCall = () => {
    Linking.openURL(this.phoneNumber).catch(err =>
      console.error('Error opening call:', err),
    );
  };

  componentDidMount(): void {
    this.handleGetUser();

    // Add focus listener to refresh user data when returning to this screen
    if (this.props.navigation) {
      this.props.navigation.addListener('focus', () => {
        console.log('ProfileScreen focused - refreshing user data');
        this.handleGetUser();
      });
    }
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
    const {t} = this.props;
    return (
      <Page>
        <HeaderBase hideLeftIcon title={t('profile.title')} />
        <View style={styles.container}>
          {/* <TextBase style={[AppStyle.txt_20_bold]}>Thông tin cá nhân</TextBase> */}

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

          {/* <TextBase
            style={[
              AppStyle.txt_20_bold,
              {
                marginTop: sizes._12sdp,
                fontSize: sizes._20sdp,
                marginBottom: sizes._16sdp,
              },
            ]}>
            Account
          </TextBase> */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <TextBase style={AppStyle.txt_18_bold}>
              {t('profile.aiAssistant')}
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
              onPress={() => {
                NavigationService.navigate(ScreenName.CHATBOT);
              }}>
              <ChatBotSvg
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
              {t('profile.emergencyCall')}
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
              {t('profile.accountInfo')}
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
                onPress={() => {
                  NavigationService.navigate(ScreenName.PERSONAL);
                }}
              />
            </TouchableOpacity>
          </View>
          {/* Nạp tiền */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: sizes._16sdp,
            }}>
            <TextBase style={AppStyle.txt_18_bold}>{t('profile.donation')}</TextBase>
            <TouchableOpacity
              style={{
                width: sizes._56sdp,
                height: sizes._40sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._1000sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                NavigationService.navigate(ScreenName.DONATION);
              }}>
              <TextBase style={{
                fontSize: sizes._16sdp,
                fontWeight: 'bold',
                color: colors.primary_950,
              }}>₫</TextBase>
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

          {/* <TextBase
            style={[
              AppStyle.txt_20_bold,
              {
                marginTop: sizes._12sdp,
                fontSize: sizes._20sdp,
                marginBottom: sizes._16sdp,
              },
            ]}>
            Other
          </TextBase> */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <TextBase style={AppStyle.txt_18_bold}>{t('profile.settings')}</TextBase>
            <TouchableOpacity
              style={{
                width: sizes._56sdp,
                height: sizes._40sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._1000sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                NavigationService.navigate(ScreenName.SETTINGS);
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
              {t('profile.faq')}
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
              onPress={() => {
                NavigationService.navigate(ScreenName.FAQ);
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
              {t('profile.policy')}
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
              onPress={() => {
                NavigationService.navigate(ScreenName.POLICY);
              }}>
              <Policy
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
              {t('profile.about')}
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
              onPress={() => {
                NavigationService.navigate(ScreenName.ABOUT);
              }}>
              <TextBase style={{
                fontSize: sizes._16sdp,
                fontWeight: 'bold',
                color: colors.primary_950,
              }}>i</TextBase>
            </TouchableOpacity>
          </View>

          <View style={{marginTop: sizes._26sdp, marginHorizontal: sizes._26sdp}}>
            <Button
              mode="contained"
              labelStyle={{ fontSize: 16, height: sizes._30sdp, textAlignVertical: 'center', color: '#B22222' }}
              onPress={() => {
                NavigationService.reset(ScreenName.LOGIN_SCREEN);
              }}>
              {t('profile.logout')}
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

export default withAzureTranslation(ProfileScreen);
