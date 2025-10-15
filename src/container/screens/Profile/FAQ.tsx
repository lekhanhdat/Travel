import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

interface IFAQProps {}

interface IFAQState {
  expandedItems: Set<number>;
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    category: 'Tài khoản',
    question: 'Làm thế nào để tạo tài khoản mới?',
    answer: 'Bạn có thể tạo tài khoản mới bằng cách nhấn vào nút "Đăng ký" trên màn hình đăng nhập, sau đó điền đầy đủ thông tin cá nhân và xác nhận email.',
  },
  {
    id: 2,
    category: 'Tài khoản',
    question: 'Tôi quên mật khẩu, phải làm sao?',
    answer: 'Nhấn vào "Quên mật khẩu" trên màn hình đăng nhập, nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.',
  },
  {
    id: 3,
    category: 'Sử dụng ứng dụng',
    question: 'Làm thế nào để tìm kiếm địa điểm du lịch?',
    answer: 'Bạn có thể sử dụng thanh tìm kiếm ở trang chủ hoặc duyệt qua các danh mục địa điểm được đề xuất. Ứng dụng cũng có thể gợi ý địa điểm dựa trên vị trí hiện tại của bạn.',
  },
  {
    id: 4,
    category: 'Sử dụng ứng dụng',
    question: 'Tôi có thể đánh giá và bình luận về địa điểm không?',
    answer: 'Có, bạn có thể đánh giá từ 1-5 sao và viết bình luận chi tiết về trải nghiệm của mình tại mỗi địa điểm. Điều này giúp cộng đồng có thêm thông tin hữu ích.',
  },
  {
    id: 5,
    category: 'Sử dụng ứng dụng',
    question: 'Làm thế nào để chia sẻ hình ảnh địa điểm?',
    answer: 'Khi viết đánh giá, bạn có thể thêm hình ảnh bằng cách nhấn vào biểu tượng camera và chọn ảnh từ thư viện hoặc chụp ảnh mới.',
  },
  {
    id: 6,
    category: 'Bản đồ và định vị',
    question: 'Tại sao ứng dụng cần quyền truy cập vị trí?',
    answer: 'Quyền truy cập vị trí giúp ứng dụng đề xuất các địa điểm gần bạn, cung cấp chỉ đường chính xác và hiển thị khoảng cách đến các điểm du lịch.',
  },
  {
    id: 7,
    category: 'Bản đồ và định vị',
    question: 'Tôi có thể sử dụng ứng dụng khi không có internet không?',
    answer: 'Một số tính năng cơ bản có thể hoạt động offline, nhưng để có trải nghiệm tốt nhất, bạn nên kết nối internet để cập nhật thông tin mới nhất.',
  },
  {
    id: 8,
    category: 'Hỗ trợ',
    question: 'Tôi gặp lỗi kỹ thuật, phải làm sao?',
    answer: 'Hãy thử khởi động lại ứng dụng trước. Nếu vẫn gặp vấn đề, vui lòng liên hệ với chúng tôi qua email support@travelapp.com hoặc gọi hotline 1900-xxxx.',
  },
  {
    id: 9,
    category: 'Hỗ trợ',
    question: 'Làm thế nào để báo cáo nội dung không phù hợp?',
    answer: 'Bạn có thể báo cáo bằng cách nhấn vào biểu tượng "..." trên bình luận hoặc đánh giá và chọn "Báo cáo". Chúng tôi sẽ xem xét và xử lý trong 24h.',
  },
  {
    id: 10,
    category: 'Bảo mật',
    question: 'Thông tin cá nhân của tôi có được bảo mật không?',
    answer: 'Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo chính sách bảo mật. Dữ liệu được mã hóa và chỉ sử dụng để cải thiện trải nghiệm người dùng.',
  },
];

export default class FAQ extends React.PureComponent<IFAQProps, IFAQState> {
  constructor(props: IFAQProps) {
    super(props);
    this.state = {
      expandedItems: new Set(),
    };
  }

  toggleExpanded = (id: number) => {
    const newExpandedItems = new Set(this.state.expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    this.setState({expandedItems: newExpandedItems});
  };

  handleContactSupport = () => {
    Linking.openURL('mailto:support@travelapp.com?subject=Hỗ trợ ứng dụng Travel');
  };

  renderFAQItem = (item: FAQItem) => {
    const isExpanded = this.state.expandedItems.has(item.id);
    
    return (
      <View key={item.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => this.toggleExpanded(item.id)}>
          <View style={styles.questionContent}>
            <TextBase style={styles.categoryText}>{item.category}</TextBase>
            <TextBase style={styles.questionText}>{item.question}</TextBase>
          </View>
          <TextBase style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            ▼
          </TextBase>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <TextBase style={styles.answerText}>{item.answer}</TextBase>
          </View>
        )}
      </View>
    );
  };

  renderCategorySection = (category: string, items: FAQItem[]) => {
    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <TextBase style={styles.categoryHeaderText}>{category}</TextBase>
        </View>
        {items.map(item => this.renderFAQItem(item))}
      </View>
    );
  };

  render(): React.ReactNode {
    // Group FAQ items by category
    const groupedFAQ = faqData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, FAQItem[]>);

    return (
      <Page>
        <HeaderBase
          title="Câu hỏi thường gặp"
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
          <View style={styles.header}>
            <TextBase style={styles.headerTitle}>
              Câu hỏi thường gặp
            </TextBase>
            <TextBase style={styles.headerSubtitle}>
              Tìm câu trả lời cho những thắc mắc phổ biến về ứng dụng
            </TextBase>
          </View>

          {Object.entries(groupedFAQ).map(([category, items]) =>
            this.renderCategorySection(category, items)
          )}

          <View style={styles.contactSection}>
            <TextBase style={styles.contactTitle}>
              Không tìm thấy câu trả lời?
            </TextBase>
            <TextBase style={styles.contactSubtitle}>
              Liên hệ với đội ngũ hỗ trợ của chúng tôi
            </TextBase>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={this.handleContactSupport}>
              <TextBase style={styles.contactButtonText}>
                Liên hệ hỗ trợ
              </TextBase>
            </TouchableOpacity>
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
    padding: sizes._16sdp,
    backgroundColor: colors.primary_50,
  },
  headerTitle: {
    ...AppStyle.txt_20_bold,
    color: colors.primary_950,
    marginBottom: sizes._8sdp,
  },
  headerSubtitle: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_600,
  },
  categorySection: {
    marginBottom: sizes._16sdp,
  },
  categoryHeader: {
    backgroundColor: colors.primary_100,
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._12sdp,
  },
  categoryHeaderText: {
    ...AppStyle.txt_16_bold,
    color: colors.primary_700,
  },
  faqItem: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._16sdp,
  },
  questionContent: {
    flex: 1,
  },
  categoryText: {
    ...AppStyle.txt_12_regular,
    color: colors.primary_500,
    marginBottom: sizes._4sdp,
  },
  questionText: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_950,
  },
  expandIcon: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_400,
    marginLeft: sizes._8sdp,
  },
  expandIconRotated: {
    transform: [{rotate: '180deg'}],
  },
  answerContainer: {
    paddingHorizontal: sizes._16sdp,
    paddingBottom: sizes._16sdp,
    backgroundColor: colors.primary_25,
  },
  answerText: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_700,
    lineHeight: sizes._20sdp,
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
    marginBottom: sizes._8sdp,
  },
  contactSubtitle: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_600,
    textAlign: 'center',
    marginBottom: sizes._16sdp,
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
