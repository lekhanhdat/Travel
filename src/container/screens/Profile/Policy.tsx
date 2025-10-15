import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeModules,
  Linking,
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

interface IPolicyProps {}

interface IPolicyState {
  activeTab: 'privacy' | 'terms' | 'security';
}

export default class Policy extends React.PureComponent<IPolicyProps, IPolicyState> {
  constructor(props: IPolicyProps) {
    super(props);
    this.state = {
      activeTab: 'privacy',
    };
  }

  handleContactUs = () => {
    Linking.openURL('mailto:legal@travelapp.com?subject=Chính sách và điều khoản');
  };

  renderTabButton = (tab: 'privacy' | 'terms' | 'security', title: string) => {
    const isActive = this.state.activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => this.setState({activeTab: tab})}>
        <TextBase style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
          {title}
        </TextBase>
      </TouchableOpacity>
    );
  };

  renderPrivacyPolicy = () => {
    return (
      <View style={styles.contentContainer}>
        <TextBase style={styles.sectionTitle}>Chính sách bảo mật</TextBase>
        <TextBase style={styles.lastUpdated}>Cập nhật lần cuối: 01/01/2024</TextBase>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>1. Thu thập thông tin</TextBase>
          <TextBase style={styles.content}>
            Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, sử dụng dịch vụ, hoặc tương tác với ứng dụng:
          </TextBase>
          <TextBase style={styles.bulletPoint}>• Thông tin cá nhân: tên, email, số điện thoại</TextBase>
          <TextBase style={styles.bulletPoint}>• Thông tin vị trí khi bạn cho phép</TextBase>
          <TextBase style={styles.bulletPoint}>• Dữ liệu sử dụng ứng dụng và tương tác</TextBase>
          <TextBase style={styles.bulletPoint}>• Hình ảnh và nội dung bạn chia sẻ</TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>2. Sử dụng thông tin</TextBase>
          <TextBase style={styles.content}>
            Thông tin của bạn được sử dụng để:
          </TextBase>
          <TextBase style={styles.bulletPoint}>• Cung cấp và cải thiện dịch vụ</TextBase>
          <TextBase style={styles.bulletPoint}>• Gửi thông báo và cập nhật quan trọng</TextBase>
          <TextBase style={styles.bulletPoint}>• Đề xuất địa điểm phù hợp với sở thích</TextBase>
          <TextBase style={styles.bulletPoint}>• Bảo vệ an toàn và ngăn chặn gian lận</TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>3. Chia sẻ thông tin</TextBase>
          <TextBase style={styles.content}>
            Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp:
          </TextBase>
          <TextBase style={styles.bulletPoint}>• Với sự đồng ý của bạn</TextBase>
          <TextBase style={styles.bulletPoint}>• Để tuân thủ pháp luật</TextBase>
          <TextBase style={styles.bulletPoint}>• Với các đối tác dịch vụ đáng tin cậy</TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>4. Bảo mật dữ liệu</TextBase>
          <TextBase style={styles.content}>
            Chúng tôi áp dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn, bao gồm mã hóa dữ liệu và kiểm soát truy cập nghiêm ngặt.
          </TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>5. Quyền của bạn</TextBase>
          <TextBase style={styles.content}>
            Bạn có quyền:
          </TextBase>
          <TextBase style={styles.bulletPoint}>• Truy cập và cập nhật thông tin cá nhân</TextBase>
          <TextBase style={styles.bulletPoint}>• Yêu cầu xóa tài khoản và dữ liệu</TextBase>
          <TextBase style={styles.bulletPoint}>• Từ chối nhận thông báo marketing</TextBase>
          <TextBase style={styles.bulletPoint}>• Khiếu nại về việc xử lý dữ liệu</TextBase>
        </View>
      </View>
    );
  };

  renderTermsOfService = () => {
    return (
      <View style={styles.contentContainer}>
        <TextBase style={styles.sectionTitle}>Điều khoản sử dụng</TextBase>
        <TextBase style={styles.lastUpdated}>Cập nhật lần cuối: 01/01/2024</TextBase>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>1. Chấp nhận điều khoản</TextBase>
          <TextBase style={styles.content}>
            Bằng việc sử dụng ứng dụng Travel, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
          </TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>2. Sử dụng dịch vụ</TextBase>
          <TextBase style={styles.content}>
            Bạn cam kết:
          </TextBase>
          <TextBase style={styles.bulletPoint}>• Cung cấp thông tin chính xác và cập nhật</TextBase>
          <TextBase style={styles.bulletPoint}>• Không sử dụng dịch vụ cho mục đích bất hợp pháp</TextBase>
          <TextBase style={styles.bulletPoint}>• Tôn trọng quyền của người dùng khác</TextBase>
          <TextBase style={styles.bulletPoint}>• Không spam hoặc gửi nội dung có hại</TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>3. Nội dung người dùng</TextBase>
          <TextBase style={styles.content}>
            Khi chia sẻ nội dung (đánh giá, hình ảnh, bình luận), bạn:
          </TextBase>
          <TextBase style={styles.bulletPoint}>• Giữ quyền sở hữu nội dung của mình</TextBase>
          <TextBase style={styles.bulletPoint}>• Cấp cho chúng tôi quyền sử dụng để cung cấp dịch vụ</TextBase>
          <TextBase style={styles.bulletPoint}>• Chịu trách nhiệm về tính chính xác của nội dung</TextBase>
          <TextBase style={styles.bulletPoint}>• Không vi phạm bản quyền của bên thứ ba</TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>4. Hạn chế trách nhiệm</TextBase>
          <TextBase style={styles.content}>
            Chúng tôi cung cấp dịch vụ "như hiện có" và không đảm bảo tính chính xác tuyệt đối của thông tin địa điểm. Người dùng tự chịu trách nhiệm khi đưa ra quyết định dựa trên thông tin từ ứng dụng.
          </TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>5. Chấm dứt dịch vụ</TextBase>
          <TextBase style={styles.content}>
            Chúng tôi có quyền tạm ngừng hoặc chấm dứt tài khoản của bạn nếu vi phạm điều khoản sử dụng mà không cần thông báo trước.
          </TextBase>
        </View>
      </View>
    );
  };

  renderSecurityInfo = () => {
    return (
      <View style={styles.contentContainer}>
        <TextBase style={styles.sectionTitle}>Thông tin bảo mật</TextBase>
        <TextBase style={styles.lastUpdated}>Cập nhật lần cuối: 01/01/2024</TextBase>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>1. Bảo vệ tài khoản</TextBase>
          <TextBase style={styles.content}>
            Để bảo vệ tài khoản của bạn:
          </TextBase>
          <TextBase style={styles.bulletPoint}>• Sử dụng mật khẩu mạnh và duy nhất</TextBase>
          <TextBase style={styles.bulletPoint}>• Không chia sẻ thông tin đăng nhập</TextBase>
          <TextBase style={styles.bulletPoint}>• Đăng xuất khi sử dụng thiết bị chung</TextBase>
          <TextBase style={styles.bulletPoint}>• Cập nhật ứng dụng thường xuyên</TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>2. Mã hóa dữ liệu</TextBase>
          <TextBase style={styles.content}>
            Tất cả dữ liệu được truyền tải giữa ứng dụng và máy chủ đều được mã hóa bằng SSL/TLS. Thông tin nhạy cảm được mã hóa trước khi lưu trữ.
          </TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>3. Phát hiện và ngăn chặn</TextBase>
          <TextBase style={styles.content}>
            Hệ thống của chúng tôi liên tục giám sát các hoạt động bất thường và tự động chặn các mối đe dọa bảo mật.
          </TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>4. Báo cáo sự cố</TextBase>
          <TextBase style={styles.content}>
            Nếu phát hiện hoạt động đáng ngờ trên tài khoản, vui lòng liên hệ ngay với chúng tôi qua email security@travelapp.com hoặc hotline 1900-xxxx.
          </TextBase>
        </View>

        <View style={styles.section}>
          <TextBase style={styles.subTitle}>5. Cập nhật bảo mật</TextBase>
          <TextBase style={styles.content}>
            Chúng tôi thường xuyên cập nhật các biện pháp bảo mật và sẽ thông báo cho người dùng về những thay đổi quan trọng.
          </TextBase>
        </View>
      </View>
    );
  };

  renderContent = () => {
    switch (this.state.activeTab) {
      case 'privacy':
        return this.renderPrivacyPolicy();
      case 'terms':
        return this.renderTermsOfService();
      case 'security':
        return this.renderSecurityInfo();
      default:
        return this.renderPrivacyPolicy();
    }
  };

  render(): React.ReactNode {
    return (
      <Page>
        <HeaderBase
          title="Chính sách & Bảo mật"
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => NavigationService.pop()}
        />

        <View style={styles.container}>
          <View style={styles.tabContainer}>
            {this.renderTabButton('privacy', 'Bảo mật')}
            {this.renderTabButton('terms', 'Điều khoản')}
            {this.renderTabButton('security', 'An toàn')}
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {this.renderContent()}

            <View style={styles.contactSection}>
              <TextBase style={styles.contactTitle}>
                Có thắc mắc về chính sách?
              </TextBase>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={this.handleContactUs}>
                <TextBase style={styles.contactButtonText}>
                  Liên hệ với chúng tôi
                </TextBase>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_200,
  },
  tabButton: {
    flex: 1,
    paddingVertical: sizes._16sdp,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_600,
  },
  activeTabButtonText: {
    ...AppStyle.txt_16_bold,
    color: colors.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: sizes._16sdp,
  },
  sectionTitle: {
    ...AppStyle.txt_24_bold,
    color: colors.primary_950,
    marginBottom: sizes._8sdp,
  },
  lastUpdated: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_500,
    marginBottom: sizes._24sdp,
  },
  section: {
    marginBottom: sizes._24sdp,
  },
  subTitle: {
    ...AppStyle.txt_18_bold,
    color: colors.primary_800,
    marginBottom: sizes._12sdp,
  },
  content: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_700,
    lineHeight: sizes._24sdp,
    marginBottom: sizes._8sdp,
  },
  bulletPoint: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_700,
    lineHeight: sizes._24sdp,
    marginBottom: sizes._4sdp,
    paddingLeft: sizes._8sdp,
  },
  contactSection: {
    margin: sizes._16sdp,
    padding: sizes._20sdp,
    backgroundColor: colors.white,
    borderRadius: sizes._12sdp,
    alignItems: 'center',
    shadowColor: colors.primary_950,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    ...AppStyle.txt_18_bold,
    color: colors.primary_950,
    marginBottom: sizes._16sdp,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: sizes._24sdp,
    paddingVertical: sizes._12sdp,
    borderRadius: sizes._8sdp,
  },
  contactButtonText: {
    ...AppStyle.txt_16_bold,
    color: colors.white,
  },
});
