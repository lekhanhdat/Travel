import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {AppStyle} from '../../../common/AppStyle';
import {BackSvg} from '../../../assets/ImageSvg';
import images from '../../../res/images';
import {BRAND} from '../../../config/brand';
import NavigationService from '../NavigationService';


interface IAboutProps {}

interface IAboutState {}

export default class About extends React.PureComponent<
  IAboutProps,
  IAboutState
> {
  constructor(props: IAboutProps) {
    super(props);
    this.state = {};
  }

  handleOpenWebsite = () => {
    if (BRAND.website) {
      Linking.openURL(BRAND.website);
    }
  };

  handleOpenFacebook = () => {
    if (BRAND.facebook) {
      Linking.openURL(BRAND.facebook);
    }
  };

  handleOpenInstagram = () => {
    if (BRAND.instagram) {
      Linking.openURL(BRAND.instagram);
    }
  };

  handleSendFeedback = () => {
    if (BRAND.feedbackEmail) {
      Linking.openURL(
        `mailto:${BRAND.feedbackEmail}?subject=${encodeURIComponent(
          `Phản hồi về ứng dụng ${BRAND.appName}`,
        )}`,
      );
    }
  };

  handleRateApp = () => {
    Linking.openURL(
      `https://play.google.com/store/apps/details?id=${BRAND.playStoreId}`,
    );
  };

  renderInfoItem = (label: string, value: string) => {
    return (
      <View style={styles.infoItem}>
        <TextBase style={styles.infoLabel}>{label}</TextBase>
        <TextBase style={styles.infoValue}>{value}</TextBase>
      </View>
    );
  };

  renderActionButton = (
    title: string,
    subtitle: string,
    onPress: () => void,
  ) => {
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

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}>
          {/* App Logo and Name */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={images.danavi_logo}
                accessibilityLabel={BRAND.appName}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <TextBase style={styles.appSlogan}>{BRAND.tagline}</TextBase>
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Thông tin ứng dụng</TextBase>
            {this.renderInfoItem('Phiên bản', BRAND.version)}
            {BRAND.releaseDate &&
              this.renderInfoItem('Ngày phát hành', BRAND.releaseDate)}
            {this.renderInfoItem('Nhà phát triển', BRAND.developer)}
            {this.renderInfoItem('Hỗ trợ', `Android ${BRAND.minAndroid}+`)}
          </View>

          {/* About Description */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Giới thiệu</TextBase>
            <TextBase style={styles.description}>
              {BRAND.appName} là ứng dụng du lịch Đà Nẵng, giúp bạn khám phá các
              địa điểm, ẩm thực và hoạt động tại thành phố. Với cơ sở dữ liệu
              phong phú về các điểm du lịch, nhà hàng, khách sạn và hoạt động
              giải trí, chúng tôi mang đến cho bạn trải nghiệm du lịch hoàn hảo.
            </TextBase>
            <TextBase style={styles.description}>
              Ứng dụng cung cấp thông tin chi tiết, đánh giá từ cộng đồng, bản
              đồ tương tác và nhiều tính năng hữu ích khác để giúp bạn lên kế
              hoạch và tận hưởng chuyến đi một cách tốt nhất.
            </TextBase>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Tính năng nổi bật</TextBase>
            <View style={styles.featureList}>
              <TextBase style={styles.featureItem}>
                🗺️ Bản đồ tương tác với GPS
              </TextBase>
              <TextBase style={styles.featureItem}>
                ⭐ Đánh giá và bình luận từ cộng đồng
              </TextBase>
              <TextBase style={styles.featureItem}>
                📸 Chia sẻ hình ảnh và trải nghiệm
              </TextBase>
              <TextBase style={styles.featureItem}>
                🔍 Tìm kiếm thông minh
              </TextBase>
              <TextBase style={styles.featureItem}>
                📱 Giao diện thân thiện, dễ sử dụng
              </TextBase>
              <TextBase style={styles.featureItem}>
                🌐 Hoạt động offline
              </TextBase>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TextBase style={styles.sectionTitle}>Hành động</TextBase>
            {this.renderActionButton(
              'Đánh giá ứng dụng',
              'Chia sẻ trải nghiệm của bạn trên cửa hàng ứng dụng',
              this.handleRateApp,
            )}
            {BRAND.feedbackEmail &&
              this.renderActionButton(
                'Gửi phản hồi',
                'Góp ý để chúng tôi cải thiện ứng dụng',
                this.handleSendFeedback,
              )}
            {BRAND.website &&
              this.renderActionButton(
                'Website chính thức',
                'Truy cập trang web của chúng tôi',
                this.handleOpenWebsite,
              )}
          </View>

          {/* Social Media */}
          {(BRAND.facebook || BRAND.instagram) && (
            <View style={styles.section}>
              <TextBase style={styles.sectionTitle}>
                Theo dõi chúng tôi
              </TextBase>
              <View style={styles.socialContainer}>
                {BRAND.facebook && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={this.handleOpenFacebook}>
                    <TextBase style={styles.socialText}>Facebook</TextBase>
                  </TouchableOpacity>
                )}
                {BRAND.instagram && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={this.handleOpenInstagram}>
                    <TextBase style={styles.socialText}>Instagram</TextBase>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Copyright */}
          <View style={styles.footer}>
            <TextBase style={styles.copyright}>
              © {BRAND.copyrightYear} {BRAND.appName}
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
  },
  header: {
    alignItems: 'center',
    paddingVertical: sizes._32sdp,
    backgroundColor: colors.white,
  },
  logoContainer: {
    backgroundColor: colors.white,
    marginBottom: sizes._16sdp,
  },
  logo: {
    width: 120,
    height: 120,
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
