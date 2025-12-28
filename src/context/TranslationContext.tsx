import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import LocalStorageCommon from '../utils/LocalStorageCommon';
import {translationQueue} from '../services/translation';
import {translationMap, getEnglishText} from '../data/baseTranslations';

// Vietnamese translations for common UI strings (offline fallback)
const vietnameseTranslations: Record<string, string> = {
  // Common
  Back: 'Quay lại',
  Save: 'Lưu',
  Cancel: 'Hủy',
  Success: 'Thành công',
  Error: 'Lỗi',
  'Loading...': 'Đang tải...',
  Search: 'Tìm kiếm',
  'View All': 'Xem tất cả',
  Close: 'Đóng',
  Confirm: 'Xác nhận',
  Delete: 'Xóa',
  Edit: 'Chỉnh sửa',
  Add: 'Thêm',
  Update: 'Cập nhật',
  Select: 'Chọn',
  Done: 'Xong',
  Retry: 'Thử lại',
  Refresh: 'Làm mới',
  // Home
  Hello: 'Xin chào',
  'Welcome to Travel App': 'Chào mừng đến với Travel App',
  'Popular Places': 'Địa điểm phổ biến',
  'Nearby Places': 'Địa điểm gần bạn',
  'Search places...': 'Tìm kiếm địa điểm...',
  'Explore More': 'Khám phá thêm',
  // Navigation
  Home: 'Trang chủ',
  Feed: 'Bảng tin',
  Map: 'Bản đồ',
  Camera: 'Máy ảnh',
  Profile: 'Hồ sơ',
  // Profile
  'Personal Information': 'Thông tin cá nhân',
  'Account Information': 'Thông tin tài khoản',
  Settings: 'Cài đặt',
  FAQ: 'Câu hỏi thường gặp',
  'Privacy & Policy': 'Chính sách & Quyền riêng tư',
  'About App': 'Về ứng dụng',
  Logout: 'Đăng xuất',
  'Edit Profile': 'Chỉnh sửa hồ sơ',
  Language: 'Ngôn ngữ',
  // Settings
  Notifications: 'Thông báo',
  'Push Notifications': 'Thông báo đẩy',
  'Receive notifications about new places and updates':
    'Nhận thông báo về địa điểm mới và cập nhật',
  Privacy: 'Quyền riêng tư',
  'Location Services': 'Dịch vụ vị trí',
  'Allow app to access your location':
    'Cho phép ứng dụng truy cập vị trí của bạn',
  Synchronization: 'Đồng bộ hóa',
  'Auto Sync': 'Tự động đồng bộ',
  'Sync data when internet connection is available':
    'Đồng bộ dữ liệu khi có kết nối internet',
  Interface: 'Giao diện',
  'Dark Mode': 'Chế độ tối',
  'Use dark interface': 'Sử dụng giao diện tối',
  'This feature will be updated in the next version.':
    'Tính năng này sẽ được cập nhật trong phiên bản tiếp theo.',
  Storage: 'Bộ nhớ',
  Cache: 'Bộ nhớ đệm',
  Size: 'Kích thước',
  Clear: 'Xóa',
  'Clear Cache': 'Xóa bộ nhớ đệm',
  'Are you sure you want to delete all temporary data?':
    'Bạn có chắc chắn muốn xóa tất cả dữ liệu tạm thời?',
  'Cache cleared successfully!': 'Đã xóa bộ nhớ đệm thành công!',
  // FAQ
  'Frequently Asked Questions': 'Câu hỏi thường gặp',
  'Search questions...': 'Tìm kiếm câu hỏi...',
  'Contact Support': 'Liên hệ hỗ trợ',
  'No results found': 'Không tìm thấy kết quả',
  // About
  Version: 'Phiên bản',
  Developer: 'Nhà phát triển',
  Contact: 'Liên hệ',
  'Rate App': 'Đánh giá ứng dụng',
  'Share App': 'Chia sẻ ứng dụng',
  Feedback: 'Phản hồi',
  // NewFeed
  'Add Review': 'Thêm đánh giá',
  'Write Review': 'Viết đánh giá',
  Rating: 'Xếp hạng',
  Comment: 'Bình luận',
  Submit: 'Gửi',
  Reviews: 'Đánh giá',
  Photos: 'Ảnh',
  Likes: 'Lượt thích',
  Comments: 'Bình luận',
  'View More': 'Xem thêm',
  'Load More': 'Tải thêm',
  'No reviews yet': 'Chưa có đánh giá',
  // Policy
  'Terms of Service': 'Điều khoản dịch vụ',
  Security: 'Bảo mật',
};

export type Language = 'vi' | 'en';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (text: string) => Promise<string>;
  translateSync: (text: string) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined,
);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await LocalStorageCommon.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await LocalStorageCommon.setItem('app_language', lang);
      setLanguageState(lang);
      setTranslations(new Map()); // Clear cached translations on language change
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const translate = useCallback(
    async (text: string): Promise<string> => {
      if (!text) return '';

      // Check if input is a translation key (e.g., "settings.title")
      const englishText = translationMap[text] || text;

      // If language is English, return English text
      if (language === 'en') return englishText;

      // Check Vietnamese translations first (offline)
      const vietnameseText = vietnameseTranslations[englishText];
      if (vietnameseText) {
        return vietnameseText;
      }

      // Check local state cache
      const cached = translations.get(englishText);
      if (cached) return cached;

      try {
        setIsLoading(true);
        const translated = await translationQueue.translate(
          englishText,
          language,
          'en',
        );
        setTranslations(prev => new Map(prev).set(englishText, translated));
        return translated;
      } catch (error) {
        console.error('Translation error:', error);
        return englishText;
      } finally {
        setIsLoading(false);
      }
    },
    [language, translations],
  );

  const translateSync = useCallback(
    (text: string): string => {
      if (!text) return '';

      // Check if input is a translation key (e.g., "settings.title")
      const englishText = translationMap[text] || text;

      // If language is English, return English text
      if (language === 'en') {
        return englishText;
      }

      // If language is Vietnamese, look up Vietnamese translation
      // First check our local Vietnamese translations map
      const vietnameseText = vietnameseTranslations[englishText];
      if (vietnameseText) {
        return vietnameseText;
      }

      // Check dynamic translations cache
      const cached = translations.get(englishText);
      if (cached) {
        return cached;
      }

      // Return Vietnamese text if available, otherwise English
      return vietnameseText || englishText;
    },
    [language, translations],
  );

  return (
    <TranslationContext.Provider
      value={{language, setLanguage, translate, translateSync, isLoading}}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error(
      'useTranslationContext must be used within a TranslationProvider',
    );
  }
  return context;
};

export default TranslationProvider;
