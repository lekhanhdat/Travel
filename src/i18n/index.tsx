import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import LocalStorageCommon from '../utils/LocalStorageCommon';

export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data - sẽ được mở rộng sau
const translations = {
  vi: {
    // Common
    common: {
      back: 'Quay lại',
      save: 'Lưu',
      cancel: 'Hủy',
      success: 'Thành công',
      error: 'Lỗi',
      loading: 'Đang tải...',
      search: 'Tìm kiếm',
      viewAll: 'Xem tất cả',
      close: 'Đóng',
      confirm: 'Xác nhận',
      delete: 'Xóa',
      edit: 'Chỉnh sửa',
      add: 'Thêm',
      update: 'Cập nhật',
      select: 'Chọn',
      done: 'Hoàn thành',
      retry: 'Thử lại',
      refresh: 'Làm mới',
    },
    
    // Home screen
    home: {
      greeting: 'Xin chào',
      welcome: 'Chào mừng đến với Travel App',
      popularPlaces: 'Địa điểm phổ biến',
      nearbyPlaces: 'Địa điểm gần đây',
      searchPlaceholder: 'Tìm kiếm địa điểm...',
      exploreMore: 'Khám phá thêm',
      featuredDestinations: 'Điểm đến nổi bật',
      travelTips: 'Mẹo du lịch',
      weatherToday: 'Thời tiết hôm nay',
      bookNow: 'Đặt ngay',
      viewDetails: 'Xem chi tiết',
    },

    // Navigation/Tabs
    navigation: {
      home: 'Trang chủ',
      newFeed: 'Bảng tin',
      map: 'Bản đồ',
      camera: 'Camera',
      profile: 'Cá nhân',
    },

    // Profile screen
    profile: {
      title: 'Cá nhân',
      personalInfo: 'Thông tin cá nhân',
      accountInfo: 'Thông tin tài khoản',
      settings: 'Cài đặt',
      faq: 'Câu hỏi thường gặp',
      policy: 'Chính sách & Bảo mật',
      about: 'Thông tin ứng dụng',
      logout: 'Đăng xuất',
      editProfile: 'Chỉnh sửa hồ sơ',
      changePassword: 'Đổi mật khẩu',
      notifications: 'Thông báo',
      privacy: 'Quyền riêng tư',
      help: 'Trợ giúp',
      contact: 'Liên hệ',
      version: 'Phiên bản',
      language: 'Ngôn ngữ',
    },

    // Settings screen
    settings: {
      title: 'Cài đặt',
      notifications: 'Thông báo',
      pushNotifications: 'Thông báo đẩy',
      pushNotificationsDesc: 'Nhận thông báo về địa điểm mới và cập nhật',
      privacy: 'Quyền riêng tư',
      locationServices: 'Dịch vụ vị trí',
      locationServicesDesc: 'Cho phép ứng dụng truy cập vị trí của bạn',
      sync: 'Đồng bộ hóa',
      autoSync: 'Tự động đồng bộ',
      autoSyncDesc: 'Đồng bộ dữ liệu khi có kết nối internet',
      interface: 'Giao diện',
      darkMode: 'Chế độ tối',
      darkModeDesc: 'Sử dụng giao diện tối',
      darkModeTitle: 'Chế độ tối',
      darkModeMessage: 'Tính năng này sẽ được cập nhật trong phiên bản tiếp theo.',
      language: 'Ngôn ngữ',
      storage: 'Lưu trữ',
      cache: 'Bộ nhớ đệm',
      cacheSize: 'Dung lượng',
      clearCache: 'Xóa',
      clearCacheTitle: 'Xóa bộ nhớ đệm',
      clearCacheMessage: 'Bạn có chắc chắn muốn xóa tất cả dữ liệu tạm thời?',
      clearCacheSuccess: 'Đã xóa bộ nhớ đệm thành công!',
    },

    // FAQ screen
    faq: {
      title: 'Câu hỏi thường gặp',
      searchFaq: 'Tìm kiếm câu hỏi...',
      contactSupport: 'Liên hệ hỗ trợ',
      noResults: 'Không tìm thấy kết quả',
      categories: {
        account: 'Tài khoản',
        usage: 'Sử dụng ứng dụng',
        maps: 'Bản đồ và định vị',
        support: 'Hỗ trợ',
        security: 'Bảo mật',
      },
    },

    // Policy screen
    policy: {
      title: 'Chính sách & Bảo mật',
      privacy: 'Quyền riêng tư',
      terms: 'Điều khoản sử dụng',
      security: 'Bảo mật',
      contactLegal: 'Liên hệ pháp lý',
      lastUpdated: 'Cập nhật lần cuối',
      acceptTerms: 'Chấp nhận điều khoản',
      readMore: 'Đọc thêm',
    },

    // About screen
    about: {
      title: 'Thông tin ứng dụng',
      version: 'Phiên bản',
      developer: 'Nhà phát triển',
      contact: 'Liên hệ',
      website: 'Website',
      email: 'Email',
      phone: 'Điện thoại',
      social: 'Mạng xã hội',
      rateApp: 'Đánh giá ứng dụng',
      shareApp: 'Chia sẻ ứng dụng',
      feedback: 'Phản hồi',
      reportBug: 'Báo lỗi',
      features: 'Tính năng',
      whatNew: 'Có gì mới',
      changelog: 'Nhật ký thay đổi',
    },

    // NewFeed screen
    newFeed: {
      title: 'Bảng tin',
      addReview: 'Thêm đánh giá',
      writeReview: 'Viết đánh giá',
      addPhoto: 'Thêm ảnh',
      rating: 'Đánh giá',
      comment: 'Bình luận',
      submit: 'Gửi',
      reviews: 'Đánh giá',
      photos: 'Hình ảnh',
      videos: 'Video',
      likes: 'Lượt thích',
      shares: 'Chia sẻ',
      comments: 'Bình luận',
      viewMore: 'Xem thêm',
      loadMore: 'Tải thêm',
      noReviews: 'Chưa có đánh giá nào',
      addFirstReview: 'Hãy là người đầu tiên đánh giá!',
    },

    // Map screen
    map: {
      title: 'Bản đồ',
      myLocation: 'Vị trí của tôi',
      searchLocation: 'Tìm kiếm địa điểm',
      directions: 'Chỉ đường',
      distance: 'Khoảng cách',
      duration: 'Thời gian',
      traffic: 'Giao thông',
      satellite: 'Vệ tinh',
      terrain: 'Địa hình',
      hybrid: 'Kết hợp',
      normal: 'Bình thường',
      zoomIn: 'Phóng to',
      zoomOut: 'Thu nhỏ',
      centerMap: 'Căn giữa bản đồ',
      fullscreen: 'Toàn màn hình',
    },

    // Camera screen
    camera: {
      title: 'Camera',
      takePhoto: 'Chụp ảnh',
      recordVideo: 'Quay video',
      gallery: 'Thư viện',
      flash: 'Đèn flash',
      switchCamera: 'Chuyển camera',
      filters: 'Bộ lọc',
      effects: 'Hiệu ứng',
      timer: 'Hẹn giờ',
      grid: 'Lưới',
      settings: 'Cài đặt camera',
    },
  },
  en: {
    // Common
    common: {
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      success: 'Success',
      error: 'Error',
      loading: 'Loading...',
      search: 'Search',
      viewAll: 'View All',
      close: 'Close',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      update: 'Update',
      select: 'Select',
      done: 'Done',
      retry: 'Retry',
      refresh: 'Refresh',
    },
    
    // Home screen
    home: {
      greeting: 'Hello',
      welcome: 'Welcome to Travel App',
      popularPlaces: 'Popular Places',
      nearbyPlaces: 'Nearby Places',
      searchPlaceholder: 'Search places...',
      exploreMore: 'Explore More',
      featuredDestinations: 'Featured Destinations',
      travelTips: 'Travel Tips',
      weatherToday: 'Today\'s Weather',
      bookNow: 'Book Now',
      viewDetails: 'View Details',
    },

    // Navigation/Tabs
    navigation: {
      home: 'Home',
      newFeed: 'Feed',
      map: 'Map',
      camera: 'Camera',
      profile: 'Profile',
    },

    // Profile screen
    profile: {
      title: 'Profile',
      personalInfo: 'Personal Information',
      accountInfo: 'Account Information',
      settings: 'Settings',
      faq: 'FAQ',
      policy: 'Privacy & Policy',
      about: 'About App',
      logout: 'Logout',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      notifications: 'Notifications',
      privacy: 'Privacy',
      help: 'Help',
      contact: 'Contact',
      version: 'Version',
      language: 'Language',
    },

    // Settings screen
    settings: {
      title: 'Settings',
      notifications: 'Notifications',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Receive notifications about new places and updates',
      privacy: 'Privacy',
      locationServices: 'Location Services',
      locationServicesDesc: 'Allow app to access your location',
      sync: 'Synchronization',
      autoSync: 'Auto Sync',
      autoSyncDesc: 'Sync data when internet connection is available',
      interface: 'Interface',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Use dark interface',
      darkModeTitle: 'Dark Mode',
      darkModeMessage: 'This feature will be updated in the next version.',
      language: 'Language',
      storage: 'Storage',
      cache: 'Cache',
      cacheSize: 'Size',
      clearCache: 'Clear',
      clearCacheTitle: 'Clear Cache',
      clearCacheMessage: 'Are you sure you want to delete all temporary data?',
      clearCacheSuccess: 'Cache cleared successfully!',
    },

    // FAQ screen
    faq: {
      title: 'Frequently Asked Questions',
      searchFaq: 'Search questions...',
      contactSupport: 'Contact Support',
      noResults: 'No results found',
      categories: {
        account: 'Account',
        usage: 'App Usage',
        maps: 'Maps & Location',
        support: 'Support',
        security: 'Security',
      },
    },

    // Policy screen
    policy: {
      title: 'Privacy & Policy',
      privacy: 'Privacy',
      terms: 'Terms of Service',
      security: 'Security',
      contactLegal: 'Contact Legal',
      lastUpdated: 'Last Updated',
      acceptTerms: 'Accept Terms',
      readMore: 'Read More',
    },

    // About screen
    about: {
      title: 'About App',
      version: 'Version',
      developer: 'Developer',
      contact: 'Contact',
      website: 'Website',
      email: 'Email',
      phone: 'Phone',
      social: 'Social Media',
      rateApp: 'Rate App',
      shareApp: 'Share App',
      feedback: 'Feedback',
      reportBug: 'Report Bug',
      features: 'Features',
      whatNew: 'What\'s New',
      changelog: 'Changelog',
    },

    // NewFeed screen
    newFeed: {
      title: 'Feed',
      addReview: 'Add Review',
      writeReview: 'Write Review',
      addPhoto: 'Add Photo',
      rating: 'Rating',
      comment: 'Comment',
      submit: 'Submit',
      reviews: 'Reviews',
      photos: 'Photos',
      videos: 'Videos',
      likes: 'Likes',
      shares: 'Shares',
      comments: 'Comments',
      viewMore: 'View More',
      loadMore: 'Load More',
      noReviews: 'No reviews yet',
      addFirstReview: 'Be the first to review!',
    },

    // Map screen
    map: {
      title: 'Map',
      myLocation: 'My Location',
      searchLocation: 'Search Location',
      directions: 'Directions',
      distance: 'Distance',
      duration: 'Duration',
      traffic: 'Traffic',
      satellite: 'Satellite',
      terrain: 'Terrain',
      hybrid: 'Hybrid',
      normal: 'Normal',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      centerMap: 'Center Map',
      fullscreen: 'Fullscreen',
    },

    // Camera screen
    camera: {
      title: 'Camera',
      takePhoto: 'Take Photo',
      recordVideo: 'Record Video',
      gallery: 'Gallery',
      flash: 'Flash',
      switchCamera: 'Switch Camera',
      filters: 'Filters',
      effects: 'Effects',
      timer: 'Timer',
      grid: 'Grid',
      settings: 'Camera Settings',
    },
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({children}) => {
  const [language, setLanguageState] = useState<Language>('vi');

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
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found for language "${language}"`);
      return key;
    }
    
    if (params) {
      return Object.keys(params).reduce((str, param) => {
        return str.replace(new RegExp(`{${param}}`, 'g'), params[param]);
      }, value);
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
