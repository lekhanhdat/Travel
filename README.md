# 🌍 Travel App - Ứng dụng Du lịch Thông minh

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.74.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.8.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.108.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)

Ứng dụng du lịch toàn diện với tính năng AI nhận diện địa điểm, bản đồ tương tác, chatbot thông minh, và hệ thống thanh toán tích hợp.

[Tính năng](#-tính-năng-chính) • [Kiến trúc](#-kiến-trúc-hệ-thống) • [Cài đặt](#-hướng-dẫn-cài-đặt) • [API](#-api-documentation) • [Deployment](#-deployment)

</div>

---

## 📱 Giới thiệu

**Travel App** là hệ thống ứng dụng du lịch hoàn chỉnh bao gồm **Mobile App (React Native)** và **Backend API (FastAPI)**, cung cấp trải nghiệm du lịch thông minh với các tính năng:

- 🔐 **Xác thực người dùng** - Đăng ký, đăng nhập, quên mật khẩu với OTP qua email
- 🗺️ **Bản đồ tương tác** - Tích hợp Mapbox với chỉ đường thông minh, nhiều lộ trình
- 📸 **Camera AI** - Nhận diện địa điểm du lịch bằng AI (OpenAI Vision)
- 🏛️ **Khám phá địa điểm** - Danh sách địa điểm phổ biến và gần bạn với GPS
- ⭐ **Đánh giá & Review** - Hệ thống đánh giá và bình luận địa điểm
- 🎉 **Lễ hội & Sự kiện** - Khám phá các lễ hội và sự kiện du lịch
- 💰 **Thanh toán/Donate** - Tích hợp PayOS payment gateway
- 🤖 **AI Chatbot** - Trợ lý du lịch thông minh với OpenAI
- 🌐 **Đa ngôn ngữ** - Hỗ trợ tiếng Việt và tiếng Anh
- 👤 **Quản lý Profile** - Cài đặt cá nhân, FAQ, chính sách

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APPLICATION                       │
│              (React Native + TypeScript)                    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Home   │  │   Maps   │  │  Camera  │  │  Profile │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ NewsFeed │  │ Festival │  │  Chatbot │  │ Donation │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/REST API
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌───────────────────────────┐
│  FASTAPI BACKEND │          │  NOCODB DATABASE          │
│   (Python 3.8+)  │◄────────►│   (Cloud/Self)            │
│                  │          │                           │
│  Endpoints:      │          │  Tables:                  │
│  • /detect       │          │  • Accounts + Objects     │
│  • /payments/*   │          │  • Locations + Festivals  │
│  • /webhook/*    │          │  • Transactions           │
└────────┬─────────┘          └───────────────────────────┘
         │
         │ External APIs
         │
    ┌────┴────┬──────────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ OpenAI │ │ PayOS  │ │Mapbox  │ │Firebase│ │SerpAPI │ │SendGrid│
│  API   │ │Payment │ │  Maps  │ │Storage │ │ Search │ │ Email  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

### Luồng hoạt động chính

1. **Authentication Flow**: Mobile App → NocoDB API → Validate → Store in AsyncStorage
2. **Camera AI Flow**: Capture Image → Upload to FastAPI → OpenAI Vision → Return Location Info
3. **Payment Flow**: Create Payment → PayOS API → QR Code → Webhook → Update Balance
4. **Maps Flow**: Get Location → Mapbox API → Display Route → Turn-by-turn Navigation
5. **Chatbot Flow**: User Message → FastAPI → OpenAI Chat → AI Response

---

## ✨ Tính năng chính

### 🏠 Trang chủ (Home)
- Hiển thị địa điểm du lịch phổ biến với hình ảnh đẹp
- Địa điểm gần bạn dựa trên vị trí GPS real-time
- Xem chi tiết địa điểm với hình ảnh, video, đánh giá
- Tìm kiếm địa điểm nhanh chóng với autocomplete
- Lọc theo danh mục: Văn hóa, Ngắm cảnh, Thiên nhiên, Ẩm thực, v.v.

### 🗺️ Bản đồ (Maps)
- **Mapbox Integration** - Bản đồ vệ tinh chất lượng cao
- **Turn-by-turn Navigation** - Chỉ đường chi tiết từng bước với giọng nói
- **Alternative Routes** - Nhiều lộ trình lựa chọn (nhanh nhất, ngắn nhất)
- **Real-time Location** - Theo dõi vị trí thời gian thực
- **Marker Clustering** - Hiển thị nhiều địa điểm trên bản đồ
- **Distance & Duration** - Tính toán khoảng cách và thời gian di chuyển
- **Offline Maps** - Hỗ trợ bản đồ offline (tính năng tương lai)

### 📸 Camera AI (Nhận diện địa điểm)
- **Chụp ảnh trực tiếp** - Sử dụng camera thiết bị với chất lượng cao
- **Chọn từ thư viện** - Upload ảnh có sẵn từ gallery
- **AI Detection** - Nhận diện địa điểm tự động bằng OpenAI Vision
- **Backend Processing** - Xử lý ảnh qua FastAPI server
- **Flash Control** - Bật/tắt đèn flash
- **Location Info** - Hiển thị tên địa điểm và mô tả chi tiết
- **Fallback Data** - Sử dụng dữ liệu local khi offline

### 🔐 Xác thực (Authentication)
- **Đăng nhập** - Username/Password với validation và mã hóa
- **Đăng ký** - Tạo tài khoản mới với email verification
- **Quên mật khẩu** - Khôi phục qua OTP email (SendGrid)
- **NocoDB Backend** - Lưu trữ tài khoản an toàn với encryption
- **Local Storage** - Lưu phiên đăng nhập với AsyncStorage
- **Password Encryption** - Mã hóa mật khẩu với CryptoJS
- **Session Management** - Quản lý phiên đăng nhập tự động

### 📰 Bảng tin (NewsFeed)
- Danh sách bài viết du lịch từ NocoDB
- Tìm kiếm bài viết theo tiêu đề và nội dung
- Xem chi tiết bài viết với markdown rendering
- Lọc theo danh mục và tags
- Chia sẻ bài viết lên mạng xã hội

### 🎉 Lễ hội & Sự kiện (Festivals)
- Danh sách lễ hội và sự kiện du lịch
- Xem chi tiết lễ hội với hình ảnh và video
- Lọc theo thời gian và địa điểm
- Thông báo nhắc nhở sự kiện sắp diễn ra
- Lưu lễ hội yêu thích

### 💰 Thanh toán/Donate (Payment)
- **PayOS Integration** - Cổng thanh toán PayOS
- **QR Code Payment** - Thanh toán qua mã QR
- **Payment Link** - Tạo link thanh toán tự động
- **Webhook Handler** - Xử lý callback từ PayOS
- **Transaction History** - Lịch sử giao dịch
- **Balance Management** - Quản lý số dư tài khoản
- **Secure Payment** - Thanh toán an toàn với signature verification

### 🤖 AI Chatbot (Trợ lý du lịch)
- **OpenAI Integration** - Chatbot thông minh với GPT
- **Travel Assistant** - Tư vấn địa điểm du lịch
- **Natural Language** - Giao tiếp tự nhiên bằng tiếng Việt/Anh
- **Context Aware** - Hiểu ngữ cảnh cuộc hội thoại
- **Floating Bubble** - Chatbot nổi trên mọi màn hình
- **Quick Suggestions** - Gợi ý câu hỏi nhanh

### 👤 Hồ sơ (Profile)
- Thông tin cá nhân với avatar tùy chỉnh
- Cài đặt ứng dụng (ngôn ngữ, thông báo)
- FAQ - Câu hỏi thường gặp
- Chính sách & Điều khoản sử dụng
- Giới thiệu ứng dụng và phiên bản
- Đăng xuất và xóa tài khoản

### 🌐 Đa ngôn ngữ (i18n)
- Hỗ trợ tiếng Việt và tiếng Anh
- Chuyển đổi ngôn ngữ real-time
- Dịch tự động nội dung địa điểm
- Lưu ngôn ngữ ưa thích

---

## 🛠️ Công nghệ sử dụng

### 📱 Frontend (Mobile App)

#### Core Technologies
- **React Native** `0.74.2` - Framework chính cho cross-platform
- **TypeScript** `4.8.4` - Type safety và developer experience
- **React Navigation** `6.x` - Điều hướng và navigation stack
- **React Native Paper** `5.12.5` - Material Design UI Components

#### Maps & Location
- **@rnmapbox/maps** `10.1.31` - Mapbox integration chính
- **react-native-maps** `1.18.0` - Google Maps fallback
- **@react-native-community/geolocation** `3.4.0` - GPS tracking

#### Camera & Media
- **react-native-vision-camera** `4.5.2` - Modern Camera API
- **react-native-image-picker** `7.1.2` - Image selection từ gallery
- **react-native-image-viewing** `0.2.2` - Image viewer với zoom
- **react-native-video** `6.7.0` - Video player

#### Storage & Network
- **@react-native-async-storage/async-storage** `1.23.1` - Local storage
- **axios** `1.5.0` - HTTP client cho API calls
- **rn-fetch-blob** `0.12.0` - File upload/download

#### UI & Animation
- **react-native-reanimated** `3.12.1` - Smooth animations
- **react-native-gesture-handler** `2.17.1` - Gesture handling
- **react-native-svg** `15.3.0` - SVG support
- **react-native-vector-icons** `10.2.0` - Icon library

#### Utilities
- **moment** `2.30.1` - Date/time handling
- **crypto-js** `4.2.0` - Password encryption
- **@faker-js/faker** `9.2.0` - Mock data generation
- **lodash** `4.17.5` - Utility functions
- **react-native-toast-message** `2.2.1` - Toast notifications

### 🖥️ Backend (API Server)

#### Core Technologies
- **FastAPI** `0.108.0+` - Modern Python web framework
- **Python** `3.8+` - Programming language
- **Uvicorn** `0.25.0+` - ASGI server
- **Gunicorn** `20.1.0+` - Production WSGI server
- **Pydantic** `2.0.0+` - Data validation

#### AI & Machine Learning
- **OpenAI** `1.51.0+` - GPT models cho chatbot và image recognition
- **SerpAPI** `0.1.5+` - Search API cho location data

#### Payment & Services
- **PayOS** `1.0.0+` - Payment gateway integration
- **Firebase Admin** `6.5.0+` - Firebase/Firestore integration
- **python-dotenv** - Environment variables management

#### HTTP & Utilities
- **requests** `2.32.3+` - HTTP library
- **python-multipart** - File upload handling

### 🗄️ Database & Storage

- **NocoDB** - No-code database platform (Cloud/Self-hosted)
  - Tables: Accounts, Locations, Items, Transactions
  - REST API với authentication
- **Firebase Storage** - File storage cho images/videos
- **AsyncStorage** - Local storage trên mobile

### 🌐 External Services

- **Mapbox API** - Maps, directions, geocoding
- **OpenAI API** - AI chatbot và image recognition
- **PayOS** - Payment gateway (VN)
- **SendGrid** - Email service cho OTP
- **SerpAPI** - Search và location data
- **Unsplash API** - High-quality images
- **NocoDB Cloud** - Database hosting

---

## 📋 Yêu cầu hệ thống

### Frontend (Mobile App)
- **Node.js** >= 18.x
- **npm** >= 9.x hoặc **yarn** >= 1.22.x
- **React Native CLI** (cài đặt global)
- **Android Studio** (cho Android development)
  - Android SDK Platform 33+
  - Android SDK Build-Tools
  - Android Emulator hoặc thiết bị thật
- **Xcode** >= 14 (cho iOS - chỉ macOS)
  - iOS Simulator hoặc thiết bị thật
  - CocoaPods
- **JDK** 17 trở lên (OpenJDK hoặc Oracle JDK)
- **Watchman** (khuyến nghị cho macOS/Linux)

### Backend (API Server)
- **Python** >= 3.8
- **pip** >= 21.x hoặc **poetry**
- **Virtual Environment** (venv, virtualenv, hoặc conda)
- **Git** (để clone repository)

### Development Tools (Khuyến nghị)
- **VS Code** với extensions:
  - React Native Tools
  - Python
  - ESLint
  - Prettier
- **Reactotron** - Debugging tool cho React Native
- **Postman** hoặc **Insomnia** - API testing
- **Android Device** hoặc **iOS Device** - Testing trên thiết bị thật

### External Services (Cần đăng ký)
- **NocoDB Account** - Database hosting
- **Mapbox Account** - Maps API key
- **OpenAI Account** - API key cho AI features
- **PayOS Account** - Payment gateway credentials
- **SendGrid Account** - Email service API key
- **Firebase Project** - Storage và services
- **Digital Ocean Account** - Backend deployment (optional)

---

## 📂 Cấu trúc Repository

Dự án Travel App được chia thành **2 repositories riêng biệt**:

### 1️⃣ Frontend Repository (Mobile App)
```
📁 https://github.com/lekhanhdat/Travel
├── 📁 src/
│   ├── 📁 assets/              # Hình ảnh, SVG, fonts
│   │   ├── images/
│   │   └── svg/
│   ├── 📁 common/              # Constants, colors, styles, types
│   │   ├── colors.ts
│   │   ├── fonts.ts
│   │   ├── sizes.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── 📁 component/           # Reusable UI components
│   │   ├── HeaderBase.tsx
│   │   ├── BigItemLocation.tsx
│   │   ├── FloatingChatBubble.tsx
│   │   └── ...
│   ├── 📁 container/           # Screens & navigation
│   │   ├── AppContainer.tsx
│   │   └── screens/
│   │       ├── Home/           # Trang chủ
│   │       ├── Maps/           # Bản đồ
│   │       ├── Camera/         # Camera AI
│   │       ├── Login/          # Đăng nhập/Đăng ký
│   │       ├── Profile/        # Hồ sơ
│   │       ├── NewFeed/        # Bảng tin
│   │       ├── Festival/       # Lễ hội
│   │       └── Donation/       # Thanh toán
│   ├── 📁 i18n/                # Đa ngôn ngữ (i18n)
│   │   ├── en.json
│   │   └── vi.json
│   ├── 📁 res/                 # Resources
│   │   ├── images.tsx
│   │   └── strings.ts
│   ├── 📁 services/            # API services
│   │   ├── axios.ts            # Axios config
│   │   ├── auth.api.ts         # Authentication API
│   │   ├── locations.api.ts    # Locations API
│   │   ├── payment.api.ts      # Payment API
│   │   ├── chatbot.api.ts      # Chatbot API
│   │   └── mapbox.api.ts       # Mapbox API
│   ├── 📁 types/               # TypeScript type definitions
│   └── 📁 utils/               # Utility functions
│       ├── configs.ts          # App configuration
│       ├── env.ts              # Environment variables
│       └── LocalStorageCommon.tsx
├── 📁 android/                 # Android native code
│   ├── app/
│   └── build.gradle
├── 📁 ios/                     # iOS native code
│   ├── Travel/
│   ├── Podfile
│   └── Travel.xcworkspace
├── 📁 __tests__/               # Unit tests
├── App.tsx                     # Root component
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # Documentation (file này)
```

### 2️⃣ Backend Repository (API Server)
```
📁 https://github.com/lekhanhdat/Travel_BE
├── app.py                      # Main FastAPI application
├── service.py                  # AI detection service
├── nocodb_service.py           # NocoDB integration
├── payment_service.py          # PayOS payment service
├── data.py                     # Fallback data
├── firestore.py                # Firebase integration
├── requirements.txt            # Python dependencies
├── Procfile                    # Digital Ocean deployment config
├── .env                        # Environment variables (không commit)
├── .gitignore
├── privateKey.json             # Firebase credentials (không commit)
└── README.md                   # Backend documentation
```

---

## 🚀 Hướng dẫn cài đặt

### 📋 Tổng quan quy trình cài đặt

1. **Setup Backend** → Cài đặt và chạy API server trước
2. **Setup Frontend** → Cài đặt mobile app và kết nối với backend
3. **Configure Services** → Cấu hình các dịch vụ bên ngoài
4. **Test & Run** → Kiểm tra và chạy ứng dụng

---

### 🖥️ PHẦN 1: Cài đặt Backend (API Server)

#### Bước 1: Clone Backend Repository

```bash
# Mở terminal/command prompt
cd C:\Users\lekha\Desktop

# Clone repository (nếu chưa có)
git clone <backend-repo-url> freelance-travel-app-server
cd freelance-travel-app-server
```

#### Bước 2: Tạo Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Bước 3: Cài đặt Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Cài đặt packages
pip install -r requirements.txt
```

**Dependencies chính:**
- `fastapi>=0.108.0` - Web framework
- `uvicorn>=0.25.0` - ASGI server
- `openai>=1.51.0` - OpenAI API
- `payos>=1.0.0` - PayOS payment
- `firebase-admin>=6.5.0` - Firebase
- `requests>=2.32.3` - HTTP client

#### Bước 4: Cấu hình Environment Variables

Tạo file `.env` trong thư mục backend:

```bash
# .env file
# ============================================
# OpenAI Configuration
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key-here

# ============================================
# NocoDB Configuration
# ============================================
NOCODB_BASE_URL=https://app.nocodb.com
NOCODB_API_TOKEN=your-nocodb-api-token
NOCODB_TABLE_ID=mj77cy6909ll2wc

# ============================================
# PayOS Configuration
# ============================================
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key

# ============================================
# Server Configuration
# ============================================
PUBLIC_BASE_URL=https://digital-ocean-fast-api-h9zys.ondigitalocean.app

# ============================================
# Search API
# ============================================
SERPAPI_KEY=your-serpapi-key
```

#### Bước 5: Cấu hình Firebase (Optional)

Nếu sử dụng Firebase Storage:

1. Tạo Firebase project tại https://console.firebase.google.com
2. Tạo Service Account và download `privateKey.json`
3. Đặt file `privateKey.json` vào thư mục backend
4. **Lưu ý**: Không commit file này lên git!

#### Bước 6: Chạy Backend Server

```bash
# Development mode (auto-reload)
uvicorn app:app --reload --host 0.0.0.0 --port 8080

# Production mode
gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 app:app
```

#### Bước 7: Kiểm tra Backend

Mở browser và truy cập:
- **Health Check**: http://localhost:8080/
- **API Docs**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

Kết quả mong đợi:
```json
{
  "message": "Hello World"
}
```

---

### 📱 PHẦN 2: Cài đặt Frontend (Mobile App)

#### Bước 1: Clone Frontend Repository

```bash
# Mở terminal mới
cd C:\Users\lekha\Desktop\Travel

# Clone repository (nếu chưa có)
git clone https://github.com/lekhanhdat/Travel.git
cd Travel
```

#### Bước 2: Cài đặt Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install
```

**Lưu ý**: Quá trình này có thể mất 5-10 phút tùy vào tốc độ mạng.

#### Bước 3: Cấu hình Environment Variables

Kiểm tra file `src/utils/env.ts` và cập nhật các giá trị:

```typescript
// src/utils/env.ts
export const env: AppEnv = {
  // Backend API URL
  SERVER_URL: 'https://digital-ocean-fast-api-h9zys.ondigitalocean.app',
  // Hoặc local: 'http://localhost:8080' (khi test local)

  // NocoDB Configuration
  DB_URL: 'https://app.nocodb.com',
  NOCODB_TOKEN: 'your-nocodb-api-token',

  // Mapbox Token
  MAPBOX_ACCESS_TOKEN: 'pk.your-mapbox-token',

  // PayOS Backend URL (same as SERVER_URL)
  PAYOS_BACKEND_URL: 'https://digital-ocean-fast-api-h9zys.ondigitalocean.app',

  // SendGrid Email API
  SENDGRID_API_KEY: 'SG.your-sendgrid-api-key',

  // Password Encryption Salt
  PASSWORD_SALT: 'TravelApp_Secret_Salt_2025',

  // OpenAI API Key (for chatbot)
  OPENAI_API_KEY: 'sk-your-openai-api-key',

  // Unsplash API (for images)
  UNSPLASH_ACCESS_KEY: 'your-unsplash-access-key',

  // SerpAPI Key (for search)
  SERPAPI_KEY: 'your-serpapi-key',
};
```

#### Bước 4: Cấu hình Android

```bash
# Reverse port cho Reactotron (debugging tool)
npm run reactotron

# Reverse port cho Metro bundler (khi test trên thiết bị thật)
npm run realDevice
```

**Cấu hình Android SDK:**
1. Mở Android Studio
2. SDK Manager → Android SDK → Chọn Android 13 (API 33)
3. SDK Tools → Chọn:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

**Cấu hình Environment Variables (Windows):**
```bash
ANDROID_HOME=C:\Users\<YourUsername>\AppData\Local\Android\Sdk
```

#### Bước 5: Cấu hình iOS (chỉ macOS)

```bash
# Di chuyển vào thư mục ios
cd ios

# Cài đặt CocoaPods dependencies
pod install

# Quay lại thư mục root
cd ..
```

**Lưu ý**:
- Cần Xcode >= 14
- Cần Apple Developer Account để chạy trên thiết bị thật
- Simulator không cần account

#### Bước 6: Link Native Dependencies

```bash
# Link các native modules
npm run link

# Hoặc
npx react-native link
```

---

### ⚙️ PHẦN 3: Cấu hình External Services

#### 1. NocoDB Setup

**Tạo tài khoản và database:**

1. Truy cập https://app.nocodb.com hoặc self-host
2. Tạo workspace mới
3. Tạo các tables sau:

**Table: Accounts** (ID: `mad8fvjhd0ba1bk`)
```
Columns:
- Id (Number, Auto-increment)
- userName (Text, Unique)
- password (Text, Encrypted)
- fullName (Text)
- email (Text, Unique)
- avatar (Text, URL)
- balance (Number, Default: 0)
- createdAt (DateTime)
```

**Table: Base_Locations** (ID: `mfz84cb0t9a84jt`)
```
Columns:
- Id (Number, Auto-increment)
- title (Text)
- description (LongText)
- latitude (Number)
- longitude (Number)
- images (Attachment, Multiple)
- videos (Attachment, Multiple)
- category (SingleSelect)
- rating (Number)
- reviews (JSON)
```

**Table: Transactions** (cho payment)
```
Columns:
- Id (Number, Auto-increment)
- accountId (Number, Link to Accounts)
- amount (Number)
- orderCode (Text)
- paymentLinkId (Text)
- status (SingleSelect: PENDING, PAID, CANCELLED)
- description (Text)
- createdAt (DateTime)
```

4. Copy API Token từ Settings → API Tokens
5. Copy Table IDs từ URL hoặc API docs

#### 2. Mapbox Setup

1. Đăng ký tại https://www.mapbox.com/
2. Tạo Access Token tại https://account.mapbox.com/access-tokens/
3. Chọn scopes: `styles:read`, `fonts:read`, `datasets:read`
4. Copy token và paste vào `env.ts`

#### 3. OpenAI Setup

1. Đăng ký tại https://platform.openai.com/
2. Tạo API Key tại https://platform.openai.com/api-keys
3. Nạp credits (tối thiểu $5)
4. Copy API key và paste vào `.env` (backend) và `env.ts` (frontend)

#### 4. PayOS Setup

1. Đăng ký tại https://my.payos.vn/
2. Tạo payment channel
3. Lấy credentials:
   - Client ID
   - API Key
   - Checksum Key
4. Cấu hình Webhook URL:
   - URL: `https://your-backend-url.com/webhook/payos`
   - Method: POST

#### 5. SendGrid Setup (cho OTP email)

1. Đăng ký tại https://sendgrid.com/
2. Tạo API Key tại Settings → API Keys
3. Verify sender email
4. Copy API key và paste vào `env.ts`

#### 6. Firebase Setup (Optional)

1. Tạo project tại https://console.firebase.google.com/
2. Enable Storage
3. Tạo Service Account:
   - Project Settings → Service Accounts
   - Generate New Private Key
   - Download JSON file → Rename thành `privateKey.json`
4. Đặt file vào thư mục backend

---

## 🎯 Hướng dẫn sử dụng

### 🚀 Chạy Backend Server

```bash
# Di chuyển vào thư mục backend
cd C:\Users\lekha\Desktop\freelance-travel-app-server

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Chạy development server
uvicorn app:app --reload --host 0.0.0.0 --port 8080

# Server sẽ chạy tại: http://localhost:8080
# API Docs: http://localhost:8080/docs
```

**Kiểm tra backend hoạt động:**
```bash
# Test health check
curl http://localhost:8080/

# Kết quả mong đợi:
# {"message": "Hello World"}
```

---

### 📱 Chạy Mobile App

#### Development Mode

```bash
# Di chuyển vào thư mục frontend
cd C:\Users\lekha\Desktop\Travel\Travel

# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Chạy trên Android
npm run android

# Terminal 3: Chạy trên iOS (chỉ macOS)
npm run ios
```

**Chạy trên Android Emulator:**
1. Mở Android Studio
2. AVD Manager → Create Virtual Device
3. Chọn device (ví dụ: Pixel 6)
4. Chọn system image (Android 13)
5. Start emulator
6. Chạy `npm run android`

**Chạy trên Android Device (thiết bị thật):**
1. Bật Developer Options trên điện thoại
2. Bật USB Debugging
3. Kết nối điện thoại với máy tính qua USB
4. Chạy `adb devices` để kiểm tra
5. Chạy `npm run realDevice` để reverse port
6. Chạy `npm run android`

**Chạy trên iOS Simulator:**
```bash
# Chạy trên iPhone 14 Pro
npm run ios -- --simulator="iPhone 14 Pro"

# Hoặc mở Xcode và chọn simulator
```

---

### 🔨 Build Production

#### Build Android APK

```bash
cd android

# Clean build
./gradlew clean

# Build release APK
./gradlew assembleRelease

# APK output location:
# android/app/build/outputs/apk/release/app-release.apk
```

**Build Android AAB (cho Google Play Store):**
```bash
cd android
./gradlew bundleRelease

# AAB output:
# android/app/build/outputs/bundle/release/app-release.aab
```

#### Build iOS IPA (chỉ macOS)

1. Mở Xcode: `open ios/Travel.xcworkspace`
2. Chọn scheme: Travel
3. Chọn device: Any iOS Device
4. Product → Archive
5. Distribute App → App Store Connect

---

### 📜 Scripts hữu ích

#### Frontend Scripts

```bash
# Lint code
npm run lint

# Run tests
npm test

# Generate image resources từ assets
npm run genimg

# Generate SVG resources
npm run genimgsvg

# Link native dependencies
npm run link

# Reset Metro cache
npm start -- --reset-cache

# Clean Android build
cd android && ./gradlew clean && cd ..

# Clean iOS build
cd ios && rm -rf build && pod deintegrate && pod install && cd ..
```

#### Backend Scripts

```bash
# Run development server
uvicorn app:app --reload

# Run production server
gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 app:app

# Test API endpoint
curl -X POST http://localhost:8080/detect -F "image_file=@test_image.jpg"

# Check Python dependencies
pip list

# Update dependencies
pip install --upgrade -r requirements.txt
```

---

## 🌐 API Documentation

### Backend API Endpoints

**Base URL**: `https://digital-ocean-fast-api-h9zys.ondigitalocean.app`

#### 1. Health Check

```http
GET /
```

**Response:**
```json
{
  "message": "Hello World"
}
```

---

#### 2. Camera AI Detection

```http
POST /detect
Content-Type: multipart/form-data
```

**Request:**
```
image_file: File (JPEG, PNG)
```

**Response:**
```json
{
  "name": "Đài thờ Trà Kiệu",
  "description": "# Đài thờ Trà Kiệu\n\nĐài thờ Trà Kiệu là một di tích lịch sử..."
}
```

**Curl Example:**
```bash
curl -X POST "https://digital-ocean-fast-api-h9zys.ondigitalocean.app/detect" \
  -F "image_file=@/path/to/image.jpg"
```

---

#### 3. Create Payment Link

```http
POST /payments/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 50000,
  "userId": 123,
  "description": "Donation from user 123"
}
```

**Response:**
```json
{
  "orderCode": 1234567890,
  "paymentLinkId": "abc123xyz",
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "checkoutUrl": "https://pay.payos.vn/web/abc123xyz"
}
```

**Validation:**
- `amount`: Minimum 1,000 VND
- `userId`: Optional, integer
- `description`: Optional, string

---

#### 4. Get Payment Status

```http
GET /payments/status/{order_code}
```

**Response:**
```json
{
  "status": "PAID",
  "amountPaid": 50000,
  "orderCode": 1234567890,
  "paymentLinkId": "abc123xyz"
}
```

**Status Values:**
- `PENDING` - Chờ thanh toán
- `PAID` - Đã thanh toán
- `CANCELLED` - Đã hủy
- `EXPIRED` - Hết hạn

---

#### 5. PayOS Webhook

```http
POST /webhook/payos
Content-Type: application/json
```

**Request Body (từ PayOS):**
```json
{
  "data": {
    "orderCode": 1234567890,
    "amount": 50000,
    "description": "Donation from user 123",
    "paymentLinkId": "abc123xyz",
    "status": "PAID"
  },
  "signature": "webhook_signature_here"
}
```

**Response:**
```json
{
  "received": true,
  "transactionId": 456,
  "userId": 123,
  "amount": 50000
}
```

---

#### 6. Payment Return URLs

```http
GET /payment/return
```
Redirect URL sau khi thanh toán thành công.

```http
GET /payment/cancel
```
Redirect URL sau khi hủy thanh toán.

---

#### 7. Webhook Info

```http
GET /payment/webhook-info
```

**Response:**
```json
{
  "success": true,
  "webhookUrl": "https://digital-ocean-fast-api-h9zys.ondigitalocean.app/webhook/payos",
  "message": "Configure this webhook URL in PayOS dashboard",
  "instructions": [
    "1. Login to https://my.payos.vn",
    "2. Go to your payment channel settings",
    "3. Find 'Webhook URL' field",
    "4. Enter: https://...",
    "5. Save settings"
  ]
}
```

---

### NocoDB API Endpoints

**Base URL**: `https://app.nocodb.com/api/v2`

**Authentication**: Header `xc-token: YOUR_NOCODB_TOKEN`

#### Get Accounts

```http
GET /tables/mad8fvjhd0ba1bk/records?offset=0&limit=100
```

#### Create Account

```http
POST /tables/mad8fvjhd0ba1bk/records
Content-Type: application/json

{
  "userName": "user123",
  "password": "encrypted_password",
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com"
}
```

#### Get Locations

```http
GET /tables/mfz84cb0t9a84jt/records?offset=0&limit=100
```

#### Update User Balance

```http
PATCH /tables/mad8fvjhd0ba1bk/records
Content-Type: application/json

{
  "Id": 123,
  "balance": 100000
}
```

---

### Mapbox API

**Base URL**: `https://api.mapbox.com`

**Authentication**: Query param `access_token=YOUR_MAPBOX_TOKEN`

#### Directions API

```http
GET /directions/v5/mapbox/driving/{coordinates}
```

**Example:**
```
https://api.mapbox.com/directions/v5/mapbox/driving/
106.6297,10.8231;106.6917,10.7769
?access_token=YOUR_TOKEN
&geometries=geojson
&steps=true
&alternatives=true
```

#### Geocoding API

```http
GET /geocoding/v5/mapbox.places/{query}.json
```

**Example:**
```
https://api.mapbox.com/geocoding/v5/mapbox.places/
Da%20Nang.json?access_token=YOUR_TOKEN
```

---

### OpenAI API (Chatbot)

**Base URL**: `https://api.openai.com/v1`

**Authentication**: Header `Authorization: Bearer YOUR_OPENAI_KEY`

#### Chat Completion

```http
POST /chat/completions
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a travel assistant for Vietnam"
    },
    {
      "role": "user",
      "content": "Gợi ý địa điểm du lịch ở Đà Nẵng"
    }
  ]
}
```

---

## 🔗 Tích hợp Frontend-Backend

### Luồng Authentication

```
┌─────────────┐
│ User Input  │
│ Username    │
│ Password    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend (LoginScreen.tsx)      │
│ - Validate input                │
│ - Encrypt password (CryptoJS)   │
└──────┬──────────────────────────┘
       │
       │ HTTP POST
       ▼
┌─────────────────────────────────┐
│ NocoDB API                      │
│ - Query Accounts table          │
│ - Match username & password     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend Response Handler       │
│ - Save to AsyncStorage          │
│ - Navigate to HomeScreen        │
└─────────────────────────────────┘
```

**Code Example:**

```typescript
// Frontend: src/services/auth.api.ts
const login = async (userName: string, password: string) => {
  // Encrypt password
  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    env.PASSWORD_SALT
  ).toString();

  // Query NocoDB
  const response = await request.get(URL_GET_ACCOUNTS, {
    params: {
      where: `(userName,eq,${userName})~and(password,eq,${encryptedPassword})`
    }
  });

  return response.data.list[0];
};
```

---

### Luồng Camera AI Detection

```
┌─────────────┐
│ User Action │
│ Take Photo  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend (CameraScreen.tsx)     │
│ - Capture image                 │
│ - Convert to FormData           │
└──────┬──────────────────────────┘
       │
       │ HTTP POST /detect
       │ multipart/form-data
       ▼
┌─────────────────────────────────┐
│ Backend (app.py)                │
│ - Receive image file            │
│ - Call service.get_object_name()│
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ OpenAI Vision API               │
│ - Analyze image                 │
│ - Return location name          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Backend (service.py)            │
│ - Get full description          │
│ - Check NocoDB first            │
│ - Fallback to OpenAI            │
└──────┬──────────────────────────┘
       │
       │ JSON Response
       ▼
┌─────────────────────────────────┐
│ Frontend Response Handler       │
│ - Display location name         │
│ - Show description (Markdown)   │
│ - Navigate to detail screen     │
└─────────────────────────────────┘
```

**Code Example:**

```typescript
// Frontend: src/container/screens/Camera/PreviewImage.tsx
const uploadImage = async (imageUri: string) => {
  const formData = new FormData();
  formData.append('image_file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });

  const response = await fetch(`${SERVER_URL}/detect`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = await response.json();
  // data = { name: "...", description: "..." }

  return data;
};
```

```python
# Backend: app.py
@app.post("/detect")
def detect(image_file: UploadFile):
    name = get_object_name(image_file)
    full_description = get_full_description(name)

    return {
        "name": name,
        "description": full_description,
    }
```

---

### Luồng Payment

```
┌─────────────┐
│ User Action │
│ Donate      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend (Donation.tsx)         │
│ - Input amount                  │
│ - Call payment API              │
└──────┬──────────────────────────┘
       │
       │ POST /payments/create
       ▼
┌─────────────────────────────────┐
│ Backend (payment_service.py)    │
│ - Create PayOS payment link     │
│ - Generate QR code              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ PayOS API                       │
│ - Create payment session        │
│ - Return payment link & QR      │
└──────┬──────────────────────────┘
       │
       │ Return to Frontend
       ▼
┌─────────────────────────────────┐
│ Frontend Display                │
│ - Show QR code                  │
│ - Show payment link             │
│ - User scans & pays             │
└─────────────────────────────────┘
       │
       │ After payment
       ▼
┌─────────────────────────────────┐
│ PayOS Webhook                   │
│ POST /webhook/payos             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Backend (app.py)                │
│ - Verify signature              │
│ - Create transaction record     │
│ - Update user balance           │
└─────────────────────────────────┘
```

---

## 📊 Database Schema

### NocoDB Tables

#### Table: Accounts (ID: `mad8fvjhd0ba1bk`)

Lưu trữ thông tin tài khoản người dùng.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| Id | Number | ID tự động tăng | Primary Key, Auto-increment |
| userName | Text | Tên đăng nhập | Unique, Required |
| password | Text | Mật khẩu đã mã hóa | Required, Encrypted (CryptoJS) |
| fullName | Text | Họ và tên | Required |
| email | Text | Email | Unique, Required |
| avatar | Text | URL avatar | Optional |
| balance | Number | Số dư tài khoản (VND) | Default: 0 |
| createdAt | DateTime | Ngày tạo | Auto-generated |

**Indexes:**
- `userName` (Unique)
- `email` (Unique)

---

#### Table: Base_Locations (ID: `mfz84cb0t9a84jt`)

Lưu trữ thông tin địa điểm du lịch.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| Id | Number | ID tự động tăng | Primary Key, Auto-increment |
| title | Text | Tên địa điểm | Required |
| description | LongText | Mô tả chi tiết (Markdown) | Optional |
| latitude | Number | Vĩ độ | Required |
| longitude | Number | Kinh độ | Required |
| images | Attachment | Hình ảnh địa điểm | Multiple files |
| videos | Attachment | Video địa điểm | Multiple files |
| category | SingleSelect | Danh mục | Values: Văn hóa, Thiên nhiên, Ẩm thực, etc. |
| rating | Number | Đánh giá trung bình | 0-5 stars |
| reviews | JSON | Danh sách đánh giá | Array of review objects |
| address | Text | Địa chỉ | Optional |
| openingHours | Text | Giờ mở cửa | Optional |
| ticketPrice | Number | Giá vé (VND) | Optional |

**Sample Review JSON:**
```json
[
  {
    "userId": 123,
    "userName": "Nguyễn Văn A",
    "rating": 5,
    "comment": "Địa điểm rất đẹp!",
    "images": ["url1", "url2"],
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

---

#### Table: Items (ID: `m0s4uwjesun4rl9`)

Lưu trữ bài viết/tin tức du lịch.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| Id | Number | ID tự động tăng | Primary Key, Auto-increment |
| title | Text | Tiêu đề bài viết | Required |
| content | LongText | Nội dung (Markdown) | Required |
| thumbnail | Attachment | Ảnh thumbnail | Single file |
| category | SingleSelect | Danh mục | Values: Tin tức, Hướng dẫn, Review, etc. |
| tags | MultiSelect | Tags | Multiple values |
| author | Text | Tác giả | Optional |
| publishedAt | DateTime | Ngày xuất bản | Auto-generated |
| views | Number | Lượt xem | Default: 0 |

---

#### Table: Transactions (cho Payment)

Lưu trữ lịch sử giao dịch thanh toán.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| Id | Number | ID tự động tăng | Primary Key, Auto-increment |
| accountId | Number | ID tài khoản | Link to Accounts.Id |
| amount | Number | Số tiền (VND) | Required, >= 1000 |
| orderCode | Text | Mã đơn hàng PayOS | Unique |
| paymentLinkId | Text | ID link thanh toán | Optional |
| status | SingleSelect | Trạng thái | Values: PENDING, PAID, CANCELLED, EXPIRED |
| description | Text | Mô tả giao dịch | Optional |
| createdAt | DateTime | Ngày tạo | Auto-generated |
| paidAt | DateTime | Ngày thanh toán | Optional |

**Indexes:**
- `orderCode` (Unique)
- `accountId` (Foreign Key)

---

#### Table: Festivals (cho Lễ hội)

Lưu trữ thông tin lễ hội và sự kiện.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| Id | Number | ID tự động tăng | Primary Key, Auto-increment |
| name | Text | Tên lễ hội | Required |
| description | LongText | Mô tả chi tiết | Optional |
| startDate | DateTime | Ngày bắt đầu | Required |
| endDate | DateTime | Ngày kết thúc | Required |
| location | Text | Địa điểm tổ chức | Required |
| images | Attachment | Hình ảnh lễ hội | Multiple files |
| category | SingleSelect | Loại lễ hội | Values: Văn hóa, Âm nhạc, Ẩm thực, etc. |
| isFeatured | Checkbox | Nổi bật | Default: false |

---

## 🚢 Deployment

### Backend Deployment (Digital Ocean)

#### Bước 1: Tạo App trên Digital Ocean

1. Đăng nhập https://cloud.digitalocean.com/
2. Create → Apps → Deploy from GitHub
3. Chọn repository: `freelance-travel-app-server`
4. Chọn branch: `main`

#### Bước 2: Cấu hình App

**App Spec:**
```yaml
name: travel-backend
region: sgp
services:
  - name: api
    github:
      repo: your-username/freelance-travel-app-server
      branch: main
      deploy_on_push: true
    build_command: pip install -r requirements.txt
    run_command: gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080 app:app
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 8080
    routes:
      - path: /
    envs:
      - key: OPENAI_API_KEY
        value: ${OPENAI_API_KEY}
        type: SECRET
      - key: NOCODB_API_TOKEN
        value: ${NOCODB_API_TOKEN}
        type: SECRET
      - key: PAYOS_CLIENT_ID
        value: ${PAYOS_CLIENT_ID}
        type: SECRET
      - key: PAYOS_API_KEY
        value: ${PAYOS_API_KEY}
        type: SECRET
      - key: PAYOS_CHECKSUM_KEY
        value: ${PAYOS_CHECKSUM_KEY}
        type: SECRET
```

#### Bước 3: Cấu hình Environment Variables

Trong Digital Ocean App Settings → Environment Variables:

```
OPENAI_API_KEY=sk-your-key
NOCODB_BASE_URL=https://app.nocodb.com
NOCODB_API_TOKEN=your-token
NOCODB_TABLE_ID=mj77cy6909ll2wc
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key
PUBLIC_BASE_URL=https://your-app.ondigitalocean.app
SERPAPI_KEY=your-serpapi-key
```

#### Bước 4: Deploy

1. Click "Create Resources"
2. Đợi build và deploy (5-10 phút)
3. Kiểm tra logs để đảm bảo không có lỗi
4. Test API tại: `https://your-app.ondigitalocean.app/docs`

#### Bước 5: Cấu hình Domain (Optional)

1. Settings → Domains
2. Add Domain: `api.yourdomain.com`
3. Cấu hình DNS records tại domain provider
4. Đợi SSL certificate tự động cấp

---

### Frontend Deployment

#### Android APK Distribution

**Option 1: Direct APK Distribution**

1. Build APK:
```bash
cd android
./gradlew assembleRelease
```

2. APK location: `android/app/build/outputs/apk/release/app-release.apk`

3. Distribute qua:
   - Email
   - Google Drive
   - Firebase App Distribution
   - Website download

**Option 2: Google Play Store**

1. Build AAB:
```bash
cd android
./gradlew bundleRelease
```

2. Tạo Google Play Developer Account ($25 one-time)

3. Upload AAB tại https://play.google.com/console

4. Điền thông tin app:
   - App name, description
   - Screenshots (phone, tablet)
   - Privacy policy URL
   - Content rating

5. Submit for review

---

#### iOS IPA Distribution

**Option 1: TestFlight (Beta Testing)**

1. Build IPA trong Xcode
2. Upload lên App Store Connect
3. Thêm beta testers
4. Distribute qua TestFlight app

**Option 2: App Store**

1. Tạo Apple Developer Account ($99/year)
2. Build và Archive trong Xcode
3. Upload lên App Store Connect
4. Điền thông tin app
5. Submit for review
6. Đợi Apple approve (1-3 ngày)

---

### CI/CD Setup (Optional)

#### GitHub Actions cho Backend

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Digital Ocean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Digital Ocean
        uses: digitalocean/app_action@v1
        with:
          app_name: travel-backend
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
```

#### GitHub Actions cho Frontend

Tạo file `.github/workflows/android.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v2
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📚 Tài liệu tham khảo

### React Native
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

### Backend & APIs
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NocoDB Documentation](https://docs.nocodb.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [PayOS Documentation](https://payos.vn/docs/)
- [Mapbox API](https://docs.mapbox.com/api/)

### Development Tools
- [Reactotron](https://github.com/infinitered/reactotron)
- [VS Code React Native Tools](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native)

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Dự án này hoan nghênh sự tham gia của cộng đồng.

### Quy trình đóng góp

1. **Fork repository**
   ```bash
   # Click "Fork" button trên GitHub
   ```

2. **Clone fork của bạn**
   ```bash
   git clone https://github.com/your-username/Travel.git
   cd Travel
   ```

3. **Tạo branch mới**
   ```bash
   git checkout -b feature/amazing-feature
   # Hoặc
   git checkout -b fix/bug-fix
   ```

4. **Thực hiện thay đổi**
   - Viết code clean và có comments
   - Follow coding conventions
   - Test kỹ trước khi commit

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   **Commit message format**:
   - `feat:` - Tính năng mới
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

6. **Push to GitHub**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Tạo Pull Request**
   - Mở repository trên GitHub
   - Click "New Pull Request"
   - Chọn branch của bạn
   - Điền mô tả chi tiết về changes
   - Submit PR

### Areas to Contribute

#### 🐛 Bug Fixes
- Fix existing bugs
- Improve error handling
- Performance optimizations

#### ✨ New Features
- Offline mode support
- Social media sharing
- Advanced search filters
- User reviews and ratings
- Favorite locations
- Trip planning

#### 📚 Documentation
- Improve README
- Add code comments
- Create tutorials
- Translate documentation

#### 🧪 Testing
- Write unit tests
- Add integration tests
- E2E testing
- Performance testing

#### 🎨 UI/UX Improvements
- Design improvements
- Accessibility features
- Dark mode enhancements
- Animations

### Code Review Process

1. **Automated checks**: CI/CD sẽ chạy tests và linting
2. **Manual review**: Maintainer sẽ review code
3. **Feedback**: Có thể yêu cầu changes
4. **Approval**: Sau khi approve, PR sẽ được merge
5. **Deployment**: Changes sẽ được deploy lên production

## 📄 License

Dự án này là **private repository**. Mọi quyền được bảo lưu.

### Điều khoản sử dụng

- ✅ Được phép: Sử dụng cho mục đích học tập và nghiên cứu
- ✅ Được phép: Fork và modify cho personal projects
- ❌ Không được phép: Sử dụng cho mục đích thương mại mà không có sự cho phép
- ❌ Không được phép: Phân phối lại source code
- ❌ Không được phép: Xóa hoặc thay đổi thông tin tác giả

Để sử dụng cho mục đích thương mại, vui lòng liên hệ tác giả.

---

## 👨‍💻 Tác giả

<div align="center">

### **Lê Khánh Đạt**

[![GitHub](https://img.shields.io/badge/GitHub-lekhanhdat-181717?style=for-the-badge&logo=github)](https://github.com/lekhanhdat)
[![Email](https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:lekhanhdat03@gmail.com)

</div>

### Repositories

- **Frontend**: [Travel](https://github.com/lekhanhdat/Travel)
- **Backend**: [Travel_BE](https://github.com/lekhanhdat/Travel_BE)

### Skills & Technologies

- **Mobile**: React Native, TypeScript, iOS, Android
- **Backend**: Python, FastAPI, Node.js
- **Database**: NocoDB, Firebase, PostgreSQL
- **AI/ML**: OpenAI, Computer Vision
- **Cloud**: Digital Ocean, AWS, Firebase
- **Tools**: Git, Docker, CI/CD

---

## 🙏 Lời cảm ơn

Dự án này được xây dựng với sự hỗ trợ của nhiều công nghệ và thư viện open-source tuyệt vời:

### Frameworks & Libraries

- [React Native](https://reactnative.dev/) - Framework mobile cross-platform
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with types
- [React Navigation](https://reactnavigation.org/) - Routing and navigation

### Services & APIs

- [Mapbox](https://www.mapbox.com/) - Maps and location services
- [OpenAI](https://openai.com/) - AI and machine learning
- [NocoDB](https://nocodb.com/) - Open-source Airtable alternative
- [PayOS](https://payos.vn/) - Payment gateway for Vietnam
- [SendGrid](https://sendgrid.com/) - Email delivery service
- [Firebase](https://firebase.google.com/) - Backend services
- [Digital Ocean](https://www.digitalocean.com/) - Cloud hosting

### UI Components & Tools

- [React Native Paper](https://callstack.github.io/react-native-paper/) - Material Design components
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons) - Icon library
- [Reactotron](https://github.com/infinitered/reactotron) - Debugging tool
- [Axios](https://axios-http.com/) - HTTP client

### Community

- [React Native Community](https://github.com/react-native-community) - Community-driven packages
- [Stack Overflow](https://stackoverflow.com/) - Q&A community
- [GitHub](https://github.com/) - Code hosting and collaboration

### Special Thanks

- Tất cả contributors đã đóng góp cho dự án
- Open-source community vì những thư viện tuyệt vời
- Beta testers đã giúp test và feedback
- Người dùng đã tin tưởng và sử dụng ứng dụng

---

## 📞 Liên hệ & Hỗ trợ

### Báo lỗi (Bug Reports)

Nếu bạn phát hiện lỗi, vui lòng tạo issue trên GitHub với thông tin:

- **Mô tả lỗi**: Mô tả chi tiết lỗi
- **Steps to reproduce**: Các bước để tái hiện lỗi
- **Expected behavior**: Hành vi mong đợi
- **Screenshots**: Ảnh chụp màn hình (nếu có)
- **Environment**:
  - Device: (iPhone 14, Samsung S23, etc.)
  - OS: (iOS 16, Android 13, etc.)
  - App version: (1.0.0)

### Yêu cầu tính năng (Feature Requests)

Có ý tưởng cho tính năng mới? Tạo issue với label `enhancement`:

- **Mô tả tính năng**: Tính năng bạn muốn
- **Use case**: Tại sao tính năng này hữu ích
- **Mockups**: Thiết kế UI (nếu có)

### Hỗ trợ kỹ thuật

- **GitHub Issues**: [Create Issue](https://github.com/lekhanhdat/Travel/issues)
- **Email**: lekhanhdat03@gmail.com

---

<div align="center">

## ⭐ Nếu bạn thấy dự án hữu ích, hãy cho một star! ⭐

[![GitHub stars](https://img.shields.io/github/stars/lekhanhdat/Travel?style=social)](https://github.com/lekhanhdat/Travel/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/lekhanhdat/Travel?style=social)](https://github.com/lekhanhdat/Travel/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/lekhanhdat/Travel?style=social)](https://github.com/lekhanhdat/Travel/watchers)

---

**Travel App** - Khám phá Đà Nẵng thông minh hơn

---

*Last updated: 24 November 2025*

</div>
