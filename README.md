# 🌍 Travel App - Ứng dụng Du lịch Thông minh

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.74.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.8.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)

Ứng dụng du lịch toàn diện với tính năng AI nhận diện địa điểm, bản đồ tương tác, và hệ thống đánh giá thông minh.

[Tính năng](#-tính-năng-chính) • [Cài đặt](#-cài-đặt) • [Sử dụng](#-hướng-dẫn-sử-dụng) • [API](#-api--backend) • [Đóng góp](#-đóng-góp)

</div>

---

## 📱 Giới thiệu

**Travel App** là ứng dụng di động được xây dựng bằng React Native, cung cấp trải nghiệm du lịch hoàn chỉnh với các tính năng:

- 🔐 **Xác thực người dùng** - Đăng ký, đăng nhập, quên mật khẩu với OTP
- 🗺️ **Bản đồ tương tác** - Tích hợp Mapbox với chỉ đường thông minh
- 📸 **Camera AI** - Nhận diện địa điểm du lịch bằng AI
- 🏛️ **Khám phá địa điểm** - Danh sách địa điểm phổ biến và gần bạn
- ⭐ **Đánh giá & Review** - Hệ thống đánh giá và bình luận
- 👤 **Quản lý Profile** - Cài đặt cá nhân, FAQ, chính sách

---

## ✨ Tính năng chính

### 🏠 Trang chủ (Home)
- Hiển thị địa điểm du lịch phổ biến
- Địa điểm gần bạn dựa trên vị trí GPS
- Xem chi tiết địa điểm với hình ảnh, video, đánh giá
- Tìm kiếm địa điểm nhanh chóng

### 🗺️ Bản đồ (Maps)
- **Mapbox Integration** - Bản đồ vệ tinh chất lượng cao
- **Turn-by-turn Navigation** - Chỉ đường chi tiết từng bước
- **Alternative Routes** - Nhiều lộ trình lựa chọn
- **Real-time Location** - Theo dõi vị trí thời gian thực
- **Marker Clustering** - Hiển thị nhiều địa điểm trên bản đồ

### 📸 Camera AI
- **Chụp ảnh trực tiếp** - Sử dụng camera thiết bị
- **Chọn từ thư viện** - Upload ảnh có sẵn
- **AI Detection** - Nhận diện địa điểm tự động
- **Backend API** - Xử lý ảnh qua FastAPI server
- **Flash Control** - Bật/tắt đèn flash

### 🔐 Xác thực (Authentication)
- **Đăng nhập** - Username/Password với validation
- **Đăng ký** - Tạo tài khoản mới với email
- **Quên mật khẩu** - Khôi phục qua OTP email
- **NocoDB Backend** - Lưu trữ tài khoản an toàn
- **Local Storage** - Lưu phiên đăng nhập

### 📰 Bảng tin (NewsFeed)
- Danh sách bài viết du lịch
- Tìm kiếm bài viết
- Xem chi tiết bài viết
- Lọc theo danh mục

### 👤 Hồ sơ (Profile)
- Thông tin cá nhân
- Cài đặt ứng dụng
- FAQ - Câu hỏi thường gặp
- Chính sách & Điều khoản
- Giới thiệu ứng dụng

---

## 🛠️ Công nghệ sử dụng

### Core
- **React Native** `0.74.2` - Framework chính
- **TypeScript** `4.8.4` - Type safety
- **React Navigation** `6.x` - Điều hướng
- **React Native Paper** `5.12.5` - UI Components

### Maps & Location
- **@rnmapbox/maps** `10.1.31` - Mapbox integration
- **react-native-maps** `1.18.0` - Google Maps fallback
- **@react-native-community/geolocation** `3.4.0` - GPS tracking

### Camera & Media
- **react-native-vision-camera** `4.5.2` - Camera API
- **react-native-image-picker** `7.1.2` - Image selection
- **react-native-image-viewing** `0.2.2` - Image viewer
- **react-native-video** `6.7.0` - Video player

### Storage & Network
- **@react-native-async-storage/async-storage** `1.23.1` - Local storage
- **axios** `1.5.0` - HTTP client
- **rn-fetch-blob** `0.12.0` - File upload/download

### UI & Animation
- **react-native-reanimated** `3.12.1` - Animations
- **react-native-gesture-handler** `2.17.1` - Gestures
- **react-native-svg** `15.3.0` - SVG support
- **react-native-vector-icons** `10.2.0` - Icons

### Utilities
- **moment** `2.30.1` - Date/time handling
- **crypto-js** `4.2.0` - Encryption
- **@faker-js/faker** `9.2.0` - Mock data
- **lodash** `4.17.5` - Utility functions

---

## 📋 Yêu cầu hệ thống

- **Node.js** >= 18
- **npm** hoặc **yarn**
- **React Native CLI**
- **Android Studio** (cho Android)
- **Xcode** (cho iOS - chỉ macOS)
- **JDK** 17 trở lên

---

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/lekhanhdat/Travel.git
cd Travel/Travel
```

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### 3. Cấu hình môi trường

#### Android
```bash
# Reverse port cho Reactotron (debugging)
npm run reactotron

# Reverse port cho Metro bundler (real device)
npm run realDevice
```

#### iOS
```bash
cd ios
pod install
cd ..
```

### 4. Cấu hình API Keys

Tạo file `src/utils/configs.ts` (nếu chưa có):

```typescript
export const API_CONFIG = {
  CAMERA_API: 'https://digital-ocean-fast-api-h9zys.ondigitalocean.app',
  NOCODB_API: 'YOUR_NOCODB_URL',
  MAPBOX_TOKEN: 'YOUR_MAPBOX_TOKEN',
};
```

---

## 🎯 Hướng dẫn sử dụng

### Chạy ứng dụng

#### Development Mode

```bash
# Start Metro bundler
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios
```

#### Build Release APK (Android)

```bash
cd android
./gradlew assembleRelease
# APK output: android/app/build/outputs/apk/release/app-release.apk
```

### Scripts hữu ích

```bash
# Lint code
npm run lint

# Run tests
npm test

# Generate image resources
npm run genimg

# Generate SVG resources
npm run genimgsvg

# Link native dependencies
npm run link
```

---

## 🌐 API & Backend

### 1. Camera AI API
- **URL**: `https://digital-ocean-fast-api-h9zys.ondigitalocean.app`
- **Endpoint**: `POST /detect`
- **Chức năng**: Nhận diện địa điểm từ ảnh
- **Tech**: FastAPI + Computer Vision

### 2. NocoDB API
- **Chức năng**: Quản lý tài khoản người dùng
- **Tables**:
  - `Accounts` - Thông tin đăng nhập
  - `Locations` - Dữ liệu địa điểm
  - `Reviews` - Đánh giá người dùng

### 3. Mapbox API
- **Chức năng**: Bản đồ và chỉ đường
- **Features**:
  - Directions API
  - Geocoding
  - Satellite imagery

---

## 📁 Cấu trúc dự án

```
Travel/
├── src/
│   ├── assets/          # Hình ảnh, SVG, fonts
│   ├── common/          # Constants, colors, styles
│   ├── component/       # Reusable components
│   ├── container/       # Screens & navigation
│   │   └── screens/
│   │       ├── Home/
│   │       ├── Maps/
│   │       ├── Camera/
│   │       ├── Login/
│   │       ├── Profile/
│   │       └── NewFeed/
│   ├── i18n/            # Đa ngôn ngữ
│   ├── res/             # Resources (strings, images)
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── android/             # Android native code
├── ios/                 # iOS native code
└── __tests__/           # Unit tests
```

---

## 🔧 Cấu hình nâng cao

### Reactotron (Debugging)
```bash
npm run reactotron
```
Mở Reactotron desktop app để debug state, network, logs.

### Real Device Testing
```bash
npm run realDevice
```
Reverse port 8081 để test trên thiết bị thật.

---

## 📚 Tài liệu tham khảo

- [AUTHENTICATION_SETUP_GUIDE.md](./AUTHENTICATION_SETUP_GUIDE.md) - Hướng dẫn cấu hình xác thực
- [CAMERA_SETUP_GUIDE.md](./CAMERA_SETUP_GUIDE.md) - Hướng dẫn tích hợp Camera AI
- [ADVANCED_NAVIGATION_FEATURES.md](./ADVANCED_NAVIGATION_FEATURES.md) - Tính năng navigation nâng cao
- [CRYPTO_JS_MIGRATION.md](./CRYPTO_JS_MIGRATION.md) - Migration guide cho crypto-js

---

## 🐛 Troubleshooting

### Lỗi Metro bundler
```bash
npm start -- --reset-cache
```

### Lỗi Android build
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Lỗi iOS build
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Lỗi permissions (Android)
Kiểm tra `AndroidManifest.xml` đã có đủ permissions:
- `ACCESS_FINE_LOCATION`
- `CAMERA`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📄 License

Dự án này là private repository. Mọi quyền được bảo lưu.

---

## 👨‍💻 Tác giả

**Lê Khánh Đạt**
- GitHub: [@lekhanhdat](https://github.com/lekhanhdat)
- Repository: [Travel](https://github.com/lekhanhdat/Travel)

---

## 🙏 Lời cảm ơn

- [React Native Community](https://reactnative.dev/)
- [Mapbox](https://www.mapbox.com/)
- [NocoDB](https://nocodb.com/)
- Tất cả contributors và open-source libraries

---

<div align="center">

**⭐ Nếu bạn thấy dự án hữu ích, hãy cho một star! ⭐**

Made with ❤️ by Lê Khánh Đạt

</div>
