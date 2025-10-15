import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeModules,
  Linking,
  Image,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {AppStyle} from '../../../common/AppStyle';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import NavigationService from '../NavigationService';

const {StatusBarManager} = NativeModules;

interface IAboutProps {}

interface IAboutState {}

export default class About extends React.PureComponent<IAboutProps, IAboutState> {
  constructor(props: IAboutProps) {
    super(props);
    this.state = {};
  }

  handleOpenWebsite = () => {
    Linking.openURL('https://travelapp.com');
  };

  handleOpenFacebook = () => {
    Linking.openURL('https://facebook.com/travelapp');
  };

  handleOpenInstagram = () => {
    Linking.openURL('https://instagram.com/travelapp');
  };

  handleSendFeedback = () => {
    Linking.openURL('mailto:feedback@travelapp.com?subject=Phản hồi về ứng dụng Travel');
  };

  handleRateApp = () => {
    // For iOS: Linking.openURL('https://apps.apple.com/app/idXXXXXXXXX');
    // For Android: Linking.openURL('https://play.google.com/store/apps/details?id=com.travelapp');
    Linking.openURL('https://play.google.com/store/apps/details?id=com.travelapp');
  };

  renderInfoItem = (label: string, value: string) => {
    return (
      <View style={styles.infoItem}>
        <TextBase style={styles.infoLabel}>{label}</TextBase>
        <TextBase style={styles.infoValue}>{value}</TextBase>
      </View>
    );
  };

  renderActionButton = (title: string, subtitle: string, onPress: () => void) => {
    return (
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <View style={styles.actionContent}>
          <TextBase style={styles.actionTitle}>{title}</TextBase>
          <TextBase style={styles.actionSubtitle}>{subtitle}</TextBase>
        </View>
        <TextBase style={styles.actionArrow}>›</TextBase>
      </TouchableOpacity>
    );
  };

  render(): React.ReactNode {
    return (
      <Page>
        <HeaderBase
          title="Thông tin ứng dụng"
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => NavigationService.pop()}
        />

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* App Logo and Name */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <TextBase style={styles.logoText}>T</TextBase>
              </View>
            </View>
            <TextBase style={styles.appName}>Travel App</TextBase>
            <TextBase style={styles.appSlogan}>
              Khám phá Việt Nam cùng chúng tôi
            </TextBase>
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Thông tin ứng dụng</TextBase>
            {this.renderInfoItem('Phiên bản', '1.0.0')}
            {this.renderInfoItem('Ngày phát hành', '01/01/2024')}
            {this.renderInfoItem('Kích thước', '45.2 MB')}
            {this.renderInfoItem('Nhà phát triển', 'Travel Team')}
            {this.renderInfoItem('Hỗ trợ', 'iOS 12.0+, Android 8.0+')}
          </View>

          {/* About Description */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Giới thiệu</TextBase>
            <TextBase style={styles.description}>
              Travel App là ứng dụng du lịch hàng đầu Việt Nam, giúp bạn khám phá những địa điểm tuyệt vời nhất trên khắp đất nước. 
              Với cơ sở dữ liệu phong phú về các điểm du lịch, nhà hàng, khách sạn và hoạt động giải trí, 
              chúng tôi mang đến cho bạn trải nghiệm du lịch hoàn hảo.
            </TextBase>
            <TextBase style={styles.description}>
              Ứng dụng cung cấp thông tin chi tiết, đánh giá từ cộng đồng, bản đồ tương tác và nhiều tính năng hữu ích khác 
              để giúp bạn lên kế hoạch và tận hưởng chuyến đi một cách tốt nhất.
            </TextBase>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Tính năng nổi bật</TextBase>
            <View style={styles.featureList}>
              <TextBase style={styles.featureItem}>🗺️ Bản đồ tương tác với GPS</TextBase>
              <TextBase style={styles.featureItem}>⭐ Đánh giá và bình luận từ cộng đồng</TextBase>
              <TextBase style={styles.featureItem}>📸 Chia sẻ hình ảnh và trải nghiệm</TextBase>
              <TextBase style={styles.featureItem}>🔍 Tìm kiếm thông minh</TextBase>
              <TextBase style={styles.featureItem}>📱 Giao diện thân thiện, dễ sử dụng</TextBase>
              <TextBase style={styles.featureItem}>🌐 Hoạt động offline</TextBase>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Hành động</TextBase>
            {this.renderActionButton(
              'Đánh giá ứng dụng',
              'Chia sẻ trải nghiệm của bạn trên cửa hàng ứng dụng',
              this.handleRateApp
            )}
            {this.renderActionButton(
              'Gửi phản hồi',
              'Góp ý để chúng tôi cải thiện ứng dụng',
              this.handleSendFeedback
            )}
            {this.renderActionButton(
              'Website chính thức',
              'Truy cập trang web của chúng tôi',
              this.handleOpenWebsite
            )}
          </View>

          {/* Social Media */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Theo dõi chúng tôi</TextBase>
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={this.handleOpenFacebook}>
                <TextBase style={styles.socialText}>Facebook</TextBase>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={this.handleOpenInstagram}>
                <TextBase style={styles.socialText}>Instagram</TextBase>
              </TouchableOpacity>
            </View>
          </View>

          {/* Copyright */}
          <View style={styles.footer}>
            <TextBase style={styles.copyright}>
              © 2024 Travel App. All rights reserved.
            </TextBase>
            <TextBase style={styles.copyright}>
              Made with ❤️ in Vietnam
            </TextBase>
          </View>
        </ScrollView>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: StatusBarManager.HEIGHT,
  },
  header: {
    alignItems: 'center',
    paddingVertical: sizes._32sdp,
    backgroundColor: colors.white,
  },
  logoContainer: {
    marginBottom: sizes._16sdp,
  },
  logoPlaceholder: {
    width: sizes._80sdp,
    height: sizes._80sdp,
    borderRadius: sizes._40sdp,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...AppStyle.txt_32_bold,
    color: colors.white,
  },
  appName: {
    ...AppStyle.txt_24_bold,
    color: colors.primary_950,
    marginBottom: sizes._8sdp,
  },
  appSlogan: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_600,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    marginTop: sizes._8sdp,
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._20sdp,
  },
  sectionTitle: {
    ...AppStyle.txt_18_bold,
    color: colors.primary_950,
    marginBottom: sizes._16sdp,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizes._8sdp,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  infoLabel: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_700,
  },
  infoValue: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_950,
  },
  description: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_700,
    lineHeight: sizes._24sdp,
    marginBottom: sizes._16sdp,
  },
  featureList: {
    marginTop: sizes._8sdp,
  },
  featureItem: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_700,
    lineHeight: sizes._28sdp,
    marginBottom: sizes._8sdp,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sizes._16sdp,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_950,
    marginBottom: sizes._4sdp,
  },
  actionSubtitle: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_600,
  },
  actionArrow: {
    ...AppStyle.txt_20_bold,
    color: colors.primary_400,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: sizes._16sdp,
  },
  socialButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: sizes._24sdp,
    paddingVertical: sizes._12sdp,
    borderRadius: sizes._8sdp,
    minWidth: sizes._100sdp,
    alignItems: 'center',
  },
  socialText: {
    ...AppStyle.txt_16_bold,
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: sizes._32sdp,
    backgroundColor: colors.primary_50,
  },
  copyright: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_600,
    marginBottom: sizes._4sdp,
  },
});
