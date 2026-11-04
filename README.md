# 🌍 Travel Da Nang - Ứng dụng Du lịch Thông minh

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.74.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Google Cloud Run](https://img.shields.io/badge/Cloud_Run-Backend-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-Vietnamese%20%7C%20English-blue?style=for-the-badge)

**Ứng dụng di động du lịch Đà Nẵng** với tính năng AI nhận diện hiện vật, tìm kiếm ngữ nghĩa thông minh, bản đồ tương tác Mapbox, chatbot AI, bảng tin đánh giá và ủng hộ qua PayOS.

[Tính năng](#-tính-năng-chính) • [Kiến trúc](#️-kiến-trúc-hệ-thống) • [Cài đặt](#-hướng-dẫn-cài-đặt) • [Cấu trúc](#-cấu-trúc-repository) • [API](#-api-documentation) • [Mở rộng](#-chức-năng-có-thể-mở-rộng)

</div>

---

## 📱 Giới thiệu

**Travel App** là hệ thống ứng dụng du lịch gồm **Mobile App (React Native)** và **Backend API (FastAPI trên Google Cloud Run)**, dữ liệu lưu ở **Neon PostgreSQL**, cung cấp trải nghiệm du lịch thông minh với các tính năng:

- 🔐 **Xác thực người dùng** - Đăng ký, đăng nhập, đổi mật khẩu, xóa tài khoản (quên mật khẩu qua OTP email: đang tắt, xem [Nợ N1](MIGRATION_TASKLIST.md))
- 🗺️ **Bản đồ tương tác** - Mapbox, chỉ đường từng bước, nhiều lộ trình, lớp giao thông, đọc thuyết minh bằng giọng nói
- 📸 **Camera AI** - Nhận diện hiện vật/địa danh qua ảnh (Google Lens + OpenAI, đối chiếu dữ liệu hiện vật)
- 🏛️ **Khám phá địa điểm** - Địa điểm phổ biến và gần bạn theo GPS, chi tiết đầy đủ ảnh/video
- ⭐ **Đánh giá & Review** - Viết đánh giá có sao và ảnh, bảng tin, báo cáo đánh giá xấu
- 🎉 **Lễ hội & Sự kiện** - Danh sách, chi tiết, liên kết địa điểm tổ chức
- 🔍 **Tìm kiếm thông minh** - Tìm theo từ khóa (không dấu) hoặc theo ý nghĩa (AI), gồm cả khách sạn/nhà hàng
- 💰 **Thanh toán/Donate** - Ủng hộ qua mã QR PayOS
- 🤖 **AI Chatbot** - Trợ lý du lịch dựa trên dữ liệu của app (RAG), bong bóng chat nổi
- 🌐 **Đa ngôn ngữ** - Tiếng Việt và tiếng Anh (cả giao diện lẫn nội dung)
- 👤 **Quản lý Profile** - Hồ sơ, ảnh đại diện, cài đặt, FAQ, chính sách

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
│  catalog.client (GET, cache)   api.client (Bearer JWT)      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API            Mapbox (bản đồ, chỉ đường)
                        ▼                           ◄── app gọi trực tiếp, token pk.
┌──────────────────────────────────────────────────────────────┐
│  FASTAPI BACKEND — Google Cloud Run                          │
│                                                              │
│  Modules (bật bằng APP_FEATURES):                            │
│  • catalog  : địa điểm, lễ hội, khách sạn, hiện vật          │
│  • auth     : đăng ký, đăng nhập, hồ sơ                      │
│  • reviews  : đánh giá · uploads : ảnh                       │
│  • detect   : nhận diện ảnh                                  │
│  • ai       : tìm kiếm, tương tự, gợi ý, chatbot             │
│  • payments : PayOS + webhook                                │
│                                                              │
│  AI: FAISS index (dựng từ Neon khi build) · Embeddings · RAG │
└───┬──────────────┬──────────────┬──────────────┬─────────────┘
    ▼              ▼              ▼              ▼
┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐
│   Neon   │ │ Cloud      │ │  OpenAI  │ │ SerpAPI · PayOS  │
│PostgreSQL│ │ Storage    │ │   API    │ │ (Lens · Payment) │
└──────────┘ └────────────┘ └──────────┘ └──────────────────┘
   Key trả phí nằm ở Secret Manager, không nằm trong app
```

### Luồng hoạt động chính

1. **Catalog Flow**: App tải một lần danh sách địa điểm + lễ hội (khách sạn nạp khi tìm kiếm) → cache trong `catalogRepository` → mọi màn hình dùng chung
2. **Authentication Flow**: Mobile App → API đăng nhập → Backend kiểm mật khẩu (scrypt) → JWT lưu AsyncStorage
3. **Camera AI Flow**: Chụp/chọn ảnh → API nhận diện → Google Lens (SerpAPI) → OpenAI chọn tên → đối chiếu bảng `objects` → tên + mô tả
4. **Review Flow**: Chọn ảnh → upload (Cloud Storage) → tạo đánh giá → Bảng tin/Chi tiết đọc danh sách đánh giá
5. **Payment Flow**: Tạo giao dịch → PayOS → QR Code → Webhook có chữ ký → cộng số dư
6. **Maps Flow**: Vị trí GPS → Mapbox Directions → vẽ lộ trình + danh sách bước
7. **Chatbot Flow**: Tin nhắn → API chat RAG → tìm ngữ cảnh (FAISS) → OpenAI → trả lời kèm nguồn
8. **Semantic Search Flow**: Query → API tìm kiếm ngữ nghĩa → OpenAI Embeddings → FAISS → kết quả xếp hạng

---

## ✨ Tính năng chính

> Ký hiệu trạng thái: ✅ đang chạy · ⏸ có code, đang tắt · 🧩 có giao diện/API nhưng chưa hoạt động thật · 💡 chưa có code (xem [Chức năng có thể mở rộng](#-chức-năng-có-thể-mở-rộng)).
> Khách (chưa đăng nhập) xem được mọi nội dung; viết đánh giá, Camera, Chatbot, gợi ý cá nhân và ủng hộ cần đăng nhập.

### 🏠 Trang chủ (Home)
- ✅ Hiển thị địa điểm du lịch phổ biến với hình ảnh
- ✅ Địa điểm gần bạn theo GPS (chỉ xin quyền khi bấm "Gần bạn"), sắp xếp theo khoảng cách
- ✅ Xem chi tiết địa điểm: ảnh, video YouTube, mô tả, giờ mở cửa, vé, lời khuyên, lễ hội tại đây, đánh giá, địa điểm tương tự
- ✅ Thanh tìm kiếm thông minh (xem [Tìm kiếm](#-tìm-kiếm-ngữ-nghĩa-semantic-search))
- ✅ Gợi ý cho bạn (khi đã đăng nhập)
- ✅ Kéo để làm mới, thông báo lỗi mạng + nút Thử lại

### 🗺️ Bản đồ (Maps)
- ✅ **Mapbox Integration** - Nhiều kiểu bản đồ (vệ tinh, đường phố…), lớp giao thông
- ✅ **Turn-by-turn Navigation** - Danh sách chỉ đường từng bước
- ✅ **Alternative Routes** - Nhiều lộ trình lựa chọn
- ✅ **Real-time Location** - Vị trí hiện tại độ chính xác cao (Google Fused Location, `utils/preciseLocation.ts`)
- ✅ **Markers** - Chọn chế độ **Địa điểm** (marker các địa điểm được phép hiện, popup + Lời khuyên) hoặc **Lễ hội** (mọi lễ hội tại địa điểm tổ chức, chạm để xem chi tiết)
- ✅ **Distance & Duration** - Khoảng cách và thời gian di chuyển
- ✅ **Text-to-Speech** - Đọc thuyết minh địa điểm bằng giọng nói
- ⏸ Cảnh báo giọng nói khi tới gần địa điểm (chạy nền, `BackgroundGeolocation` — Backlog)
- 💡 Marker Clustering, Offline Maps

### 📸 Camera AI (Nhận diện hiện vật)
- ✅ **Chụp ảnh trực tiếp** - `react-native-vision-camera`
- ✅ **Chọn từ thư viện** - Upload ảnh có sẵn từ gallery
- ✅ **AI Detection** - Google Lens (SerpAPI) + OpenAI, đối chiếu bảng hiện vật `objects`
- ✅ **Backend Processing** - Xử lý ảnh qua Cloud Run (ảnh tạm tự xóa sau 1 ngày)
- ✅ **Flash Control** - Bật/tắt đèn flash
- ✅ **Kết quả** - Tên + mô tả chi tiết (Markdown)
- Giới hạn: 5 lần/người/ngày, 8 lần/ngày toàn hệ thống (quota SerpAPI miễn phí)

### 🔐 Xác thực (Authentication)
- ✅ **Đăng nhập** - Username (không phân biệt hoa/thường)/Password qua backend, nhận access token (1 giờ) + refresh token (60 ngày); app tự làm mới token
- ✅ **Đăng ký** - Tạo tài khoản mới
- ⏸ **Quên mật khẩu** - OTP qua email (SendGrid) — màn hình và module backend có sẵn, đang tắt (Nợ N1)
- ✅ **Bảo mật mật khẩu** - Hash scrypt ở backend; app **không lưu mật khẩu**, chỉ lưu token + hồ sơ
- ✅ **Session Management** - Token bị thu hồi (đổi mật khẩu, xóa tài khoản) → tự đăng xuất
- ✅ **Giới hạn đăng nhập sai** - Chống dò mật khẩu

### 📰 Bảng tin (NewsFeed)
- ✅ Danh sách đánh giá mới nhất của mọi người (địa điểm và lễ hội)
- ✅ Lọc theo địa điểm
- ✅ Viết đánh giá: chấm sao, nội dung, tối đa 5 ảnh (≤ 2 MB/ảnh)
- ✅ Xóa đánh giá của mình, báo cáo đánh giá xấu (3 báo cáo → tự ẩn)
- 💡 Chia sẻ bài viết lên mạng xã hội

### 🎉 Lễ hội & Sự kiện (Festivals)
- ✅ Danh sách lễ hội và sự kiện du lịch, xem tất cả
- ✅ Xem chi tiết lễ hội với hình ảnh, video, thời gian, vé, đánh giá
- ✅ Liên kết tới địa điểm tổ chức (mở bản đồ chỉ đường)
- ✅ Tìm kiếm lễ hội (từ khóa / AI)
- 💡 Lọc theo tháng, nhắc lịch sự kiện sắp diễn ra, lưu lễ hội yêu thích

### 💰 Thanh toán/Donate (Payment)
- ✅ **PayOS Integration** - Cổng thanh toán PayOS (gọi REST từ backend)
- ✅ **QR Code Payment** - Thanh toán qua mã QR
- ✅ **Payment Link** - Link thanh toán PayOS
- ✅ **Webhook Handler** - Bắt buộc chữ ký HMAC-SHA256, xử lý mỗi đơn đúng một lần
- ✅ **Balance Management** - Cộng số dư tài khoản khi thanh toán xong
- 💡 **Transaction History** - Màn hình lịch sử giao dịch

### 🤖 AI Chatbot (Trợ lý du lịch)
- ✅ **RAG Chatbot** - GPT-4o-mini trả lời dựa trên dữ liệu địa điểm, lễ hội, hiện vật của app, kèm nguồn
- ✅ **Travel Assistant** - Tư vấn địa điểm du lịch, xem ảnh địa điểm trong dữ liệu
- ✅ **Gửi kèm ảnh** - Hỏi về ảnh vừa chụp/chọn
- ✅ **Context Aware** - Lưu lịch sử hội thoại theo phiên (backend), bắt đầu phiên mới
- ✅ **Floating Bubble** - Bong bóng chat nổi, kéo thả được trên mọi màn hình (`FloatingChatBubble`)
- ✅ **Quick Suggestions** - Câu hỏi gợi ý nhanh
- Giới hạn: 30 câu/người/ngày

### 🔍 Tìm kiếm ngữ nghĩa (Semantic Search)
Thanh tìm kiếm `SemanticSearchBarComponent` (Trang chủ, Lễ hội) có:
- ✅ **2 chế độ, đổi bằng nút** - Tìm theo ý nghĩa (AI, mặc định) và tìm theo từ khóa
- ✅ **AI-Powered Search** - OpenAI embeddings + FAISS trên địa điểm và lễ hội
- ✅ **Similarity Score Filtering**
  - PRIMARY RULE: hiển thị tất cả kết quả có score > ngưỡng
  - FALLBACK RULE: hiển thị top kết quả nếu ít kết quả đạt ngưỡng
- ✅ **Tìm khi đang gõ** (debounce) và **tìm khi nhấn Enter** (chuyển sang màn Xem tất cả)
- ✅ **Từ khóa không dấu, nhiều trường** - Tên, địa chỉ, mô tả, loại; khớp nhãn loại cả tiếng Việt và tiếng Anh ("bảo tàng" → `museum`)
- ✅ **Khách sạn/nhà hàng** - Nạp khi gõ lần đầu, thêm vào kết quả theo từ khóa
- ✅ **Keyword Fallback** - Tự chuyển sang từ khóa khi AI lỗi hoặc không có kết quả
- ✅ **Nút xóa nhanh**, tự reset khi quay lại màn hình
- ✅ **Bộ lọc ở màn Xem tất cả** - Tất cả / Tên / Địa chỉ / Mô tả
- 🧩 **Autocomplete** - API gợi ý từ khóa có sẵn, chưa gắn vào thanh tìm kiếm

### 📊 Gợi ý & Đề xuất (Recommendations)
- ✅ **SimilarItemsComponent** - Địa điểm/lễ hội tương tự dựa trên AI, hiển thị phần trăm tương đồng
- ✅ **RecommendationsWidget** - Gợi ý địa điểm trên trang chủ (khi đăng nhập)
- 🧩 **User Memory** - Bảng `user_memories` và API có sẵn nhưng chưa có luồng ghi sở thích, nên gợi ý hiện là các mục phổ biến

### 👤 Hồ sơ (Profile)
- ✅ Thông tin cá nhân, đổi ảnh đại diện, đổi mật khẩu
- ✅ Đăng xuất và xóa tài khoản (có xác nhận mật khẩu)
- ✅ FAQ, Chính sách & Điều khoản, Giới thiệu ứng dụng
- ✅ Lối vào Chatbot, Ủng hộ
- 🧩 Gọi khẩn cấp (SOS): đang gọi một số cố định trong code
- 🧩 Cài đặt: thông báo đẩy, dịch vụ vị trí, tự động đồng bộ, chế độ tối, xóa bộ nhớ đệm mới là giao diện (chỉ lưu công tắc)
- 🧩 Màn Giới thiệu: link website/mạng xã hội/Play Store là URL mẫu

### 🌐 Đa ngôn ngữ (i18n)
- ✅ Hỗ trợ tiếng Việt và tiếng Anh
- ✅ Chuyển đổi ngôn ngữ real-time, lưu ngôn ngữ ưa thích
- ✅ Nội dung địa điểm/lễ hội/khách sạn có bản tiếng Anh (`content_en`, dịch sẵn và lưu ở database); trường chưa dịch hiển thị tiếng Việt
- ✅ Nhãn loại địa điểm (94 loại) có tên vi/en

---

## 🛠️ Công nghệ sử dụng

### 📱 Frontend (Mobile App)

#### Core Technologies
- **React Native** `0.74.2` - Framework chính
- **TypeScript** `5.0` - Type safety
- **React Navigation** `6.x` - Stack + bottom tabs
- **React Native Paper** `5.12.5` - Material Design UI Components

#### Maps & Location
- **@rnmapbox/maps** `10.1.31` - Mapbox integration
- **@react-native-community/geolocation** `3.4.0` - GPS
- **react-native-tts** `4.1.1` - Đọc thuyết minh

#### Camera & Media
- **react-native-vision-camera** `4.5.2` - Camera API
- **react-native-image-picker** `7.1.2` - Chọn ảnh từ gallery
- **react-native-image-viewing** `0.2.2` - Xem ảnh với zoom
- **react-native-youtube-iframe** `2.3.0` - Phát video YouTube (cần `react-native-webview`)
- **react-native-qrcode-svg** `6.3.15` - Mã QR thanh toán

#### Storage & Network
- **@react-native-async-storage/async-storage** `1.23.1` - Local storage (token, hồ sơ, ngôn ngữ, phiên chat)
- **axios** `1.5.0` - HTTP client (timeout 12 s, retry GET)
- **rn-fetch-blob** `0.12.0` - Upload ảnh nhận diện

#### UI & Animation
- **react-native-reanimated** `3.12.1` - Animations
- **react-native-gesture-handler** `2.17.1` - Gesture handling
- **react-native-svg** `15.3.0` + **react-native-svg-transformer** - SVG
- **react-native-vector-icons** `10.2.0` - Icon library
- **react-native-markdown-display** `7.0.2` - Hiển thị Markdown (Camera, Chatbot)

#### Utilities
- **i18next** + **react-i18next** - Đa ngôn ngữ
- **moment** `2.30.1` - Date/time
- **react-native-toast-message** `2.2.1` - Toast notifications
- **Jest** + **@testing-library/react-native** - Kiểm thử

### 🖥️ Backend (API Server)

#### Core Technologies
- **FastAPI** - Python web framework
- **Python** `3.12`
- **Uvicorn** - ASGI server (1 worker trên Cloud Run)
- **Pydantic** `2` - Data validation
- **psycopg 3** + **psycopg-pool** - PostgreSQL

#### AI & Machine Learning
- **OpenAI** (REST) - `gpt-4o-mini` cho chatbot/nhận diện, `text-embedding-3-small` cho tìm kiếm
- **FAISS** (`faiss-cpu`) - Vector similarity search (cosine similarity)
- **SerpAPI** - Google Lens cho nhận diện ảnh

#### Payment & Services
- **PayOS** (REST, kiểm chữ ký HMAC-SHA256)
- **Google Cloud Storage** - Lưu ảnh upload
- **Google Secret Manager** - Lưu key
- **SendGrid** - Email OTP (Nợ N1, đang tắt)

### 🗄️ Database & Storage

- **Neon PostgreSQL** (Singapore) - Toàn bộ dữ liệu: địa điểm, lễ hội, khách sạn, hiện vật, tài khoản, giao dịch, đánh giá, bộ nhớ AI
- **Google Cloud Storage** - Ảnh đánh giá/ảnh đại diện (public), ảnh nhận diện tạm (`tmp/`, xóa sau 1 ngày)
- **FAISS index** - Dựng từ Neon mỗi lần build image backend
- **AsyncStorage** - Local storage trên mobile

### 🌐 External Services

- **Mapbox API** - Bản đồ, chỉ đường (app gọi trực tiếp bằng token public `pk.`)
- **OpenAI API** - Chatbot, nhận diện, embeddings (chỉ backend gọi)
- **SerpAPI** - Google Lens (chỉ backend gọi; gói miễn phí 250 lượt/tháng)
- **PayOS** - Payment gateway (VN)
- **Google Cloud** - Cloud Run, Cloud Build, Artifact Registry, Cloud Storage, Secret Manager
- **Neon** - PostgreSQL serverless
- **SendGrid** - Email OTP (khi bật N1)

---

## 📋 Yêu cầu hệ thống

### Frontend (Mobile App)
- **Node.js** 22 (CI dùng 22) và **npm**
- **React Native CLI** (dùng qua `npx react-native`)
- **Android Studio**
  - Android SDK Platform 34 (minSdk 23)
  - Android SDK Build-Tools, Platform-Tools
  - Android Emulator hoặc thiết bị thật
- **JDK** 17
- **Xcode** >= 14 + CocoaPods (iOS — có thư mục `ios/` nhưng hiện chỉ kiểm thử trên Android)

### Backend (API Server)
- **Python** 3.12
- **pip** + **venv**
- **Git**
- **Google Cloud SDK** (`gcloud`) - khi build/deploy

### Development Tools (Khuyến nghị)
- **VS Code** với extensions:
  - React Native Tools
  - Python
  - ESLint
  - Prettier
- **Reactotron** - Debugging tool cho React Native
- **Postman** hoặc Swagger `/docs` của backend - API testing
- **Android Device** - Testing trên thiết bị thật

### External Services (Cần đăng ký)
- **Mapbox Account** - Access token `pk.` + download token `sk.`
- **Neon Account** - PostgreSQL database
- **Google Cloud Project** - Cloud Run, Storage, Secret Manager (có billing guard)
- **OpenAI Account** - API key cho AI features
- **SerpAPI Account** - Google Lens
- **PayOS Account** - Payment gateway credentials
- **SendGrid Account** - Email OTP (khi bật quên mật khẩu)

---

## 📂 Cấu trúc Repository

Dự án Travel App được chia thành **2 repositories riêng biệt**:

### 1️⃣ Frontend Repository (Mobile App)
```
📁 https://github.com/lekhanhdat/Travel
├── 📁 src/
│   ├── 📁 assets/              # Hình ảnh, SVG, fonts (GoogleSans)
│   ├── 📁 common/              # colors, fonts, sizes, types, constants, AppStyle, TextBase
│   ├── 📁 component/           # Reusable UI components
│   │   ├── HeaderBase.tsx, Page.tsx, BottomSheet.tsx, InputBase.tsx
│   │   ├── BigItemLocation.tsx, LargeItemLocation.tsx, LargeItemFestival.tsx
│   │   ├── FloatingChatBubble.tsx          # Bong bóng chat nổi, kéo thả
│   │   ├── SemanticSearchBarComponent.tsx  # Thanh tìm kiếm AI + từ khóa
│   │   ├── RecommendationsWidget.tsx       # Gợi ý cho bạn
│   │   ├── SimilarItemsComponent.tsx       # Địa điểm tương tự
│   │   ├── ReviewItem.tsx, CameraResultModal.tsx, CatalogStatus.tsx, CachedImage.tsx
│   │   └── LanguageDropdown.tsx
│   ├── 📁 config/
│   │   └── featureFlags.ts     # Công tắc tính năng ENABLE_*
│   ├── 📁 container/           # Screens & navigation
│   │   ├── AppContainer.tsx    # Stack + 6 tab
│   │   └── screens/
│   │       ├── Home/           # Trang chủ, Chi tiết, Xem tất cả, Ảnh, Video
│   │       ├── Maps/           # Bản đồ (MapScreen, Mapbox), Lời khuyên
│   │       ├── Camera/         # Camera AI, Xem trước ảnh
│   │       ├── Login/          # Đăng nhập, Đăng ký, Quên mật khẩu (tắt)
│   │       ├── Profile/        # Hồ sơ, Cá nhân, Cài đặt, FAQ, Chính sách, Giới thiệu, Chatbot, Ủng hộ
│   │       ├── NewFeed/        # Bảng tin
│   │       └── Festival/       # Lễ hội
│   ├── 📁 context/ 📁 hoc/ 📁 hooks/  # TranslationContext, withTranslation, useTranslation
│   ├── 📁 i18n/                # Đa ngôn ngữ
│   │   └── locales/{vi,en}/common.json
│   ├── 📁 res/                 # images.tsx, strings.tsx
│   ├── 📁 services/            # API services
│   │   ├── catalog.client.ts, catalog.adapter.ts, catalogRepository.ts  # Catalog + cache
│   │   ├── api.client.ts       # Axios + JWT, lỗi tiếng Việt
│   │   ├── auth.api.ts         # Authentication API
│   │   ├── locations.api.ts, festivals.api.ts, reviews.api.ts
│   │   ├── detect.api.ts       # Camera AI
│   │   ├── semantic.api.ts     # Semantic search, similar, recommendations, RAG
│   │   ├── chatbot.api.ts      # Chatbot
│   │   ├── payment.api.ts      # Payment API
│   │   └── mapbox.api.ts       # Mapbox API
│   ├── 📁 types/               # env.d.ts, declarations
│   └── 📁 utils/               # Utility functions
│       ├── env.ts              # Biến môi trường public
│       ├── nearby.ts, haversineDistance.ts  # Gần bạn: khoảng cách Haversine
│       ├── catalogSearch.ts    # Tìm kiếm không dấu
│       ├── translationHelpers.ts, catalogDisplay.ts, requireLogin.ts
│       ├── apiUsageTracker.ts  # API usage monitoring
│       └── LocalStorageCommon.tsx
├── 📁 android/                 # Android native code
├── 📁 ios/                     # iOS native code
├── 📁 __tests__/               # Unit tests (Jest) — services, components, i18n, màn hình
├── 📁 scripts/android-fresh.js # Khởi động lạnh emulator + chạy app
├── 📁 .github/workflows/ci.yml # CI: Jest + tsc
├── App.tsx                     # Root component (+ FloatingChatBubble)
├── babel.config.js             # Allowlist biến .env public
├── MIGRATION_TASKLIST.md, MIGRATION_AUDIT.md  # Kế hoạch + lịch sử migration
└── README.md                   # Documentation (file này)
```

### 2️⃣ Backend Repository (API Server)
```
📁 https://github.com/lekhanhdat/Travel_BE
├── app.py                      # FastAPI app, bật module theo APP_FEATURES, health
├── 📁 core_api/                # catalog, auth, security, email, uploads, reviews, detect, payments, openai_http
├── 📁 routers/                 # search, chat, memory, recommendations
├── 📁 services/                # embedding, faiss, rag, memory (Neon)
├── 📁 models/                  # Pydantic models của AI
├── 📁 utils/                   # startup_indexer (dựng FAISS từ Neon)
├── 📁 scripts/                 # build_faiss_index.py, configure_cost_guard.py
├── 📁 db/                      # schema/NNN_*.sql (migration), permissions/ (quyền runtime)
├── 📁 deploy/                  # cloudbuild.yaml, service.yaml, container_smoke.py, billing_guard/
├── 📁 tests/                   # check_*.py (fake DB/provider, chạy trong CI)
├── Dockerfile
├── requirements.txt
├── .env                        # Biến môi trường local (không commit)
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt

### 📋 Tổng quan quy trình cài đặt

1. **Setup Frontend** → Mặc định app dùng backend production trên Cloud Run, không cần chạy backend local
2. **Setup Backend (tùy chọn)** → Khi cần sửa/chạy API local
3. **Configure Services** → Cấu hình các dịch vụ bên ngoài
4. **Test & Run** → Kiểm tra và chạy ứng dụng

---

### 🖥️ PHẦN 1: Cài đặt Backend (API Server — tùy chọn)

#### Bước 1: Clone Backend Repository

```bash
git clone https://github.com/lekhanhdat/Travel_BE.git
cd Travel_BE
```

#### Bước 2: Tạo Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

#### Bước 3: Cài đặt Dependencies

```bash
pip install -r requirements.txt -r tests/requirements.txt
```

**Dependencies chính:**
- `fastapi`, `uvicorn`, `pydantic` - Web framework
- `psycopg[binary]`, `psycopg-pool` - PostgreSQL (Neon)
- `faiss-cpu`, `numpy` - Vector search
- `python-multipart` - Upload file
- OpenAI, SerpAPI, PayOS, Cloud Storage gọi qua HTTP chuẩn (không cần SDK)

#### Bước 4: Cấu hình Environment Variables

Tạo file `.env` trong thư mục backend (không commit):

```bash
# ============================================
# Database (Neon)
# ============================================
DATABASE_URL=postgresql://travel_runtime:<password>@<host>-pooler.<region>.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_URL_UNPOOLED=postgresql://<owner>:<password>@<host>.<region>.aws.neon.tech/neondb?sslmode=require   # chỉ dùng chạy migration

# ============================================
# Modules + secrets (giống secret cấu hình trên Secret Manager)
# ============================================
APP_FEATURES=auth,uploads,reviews,detect,ai,payments   # bỏ trống = chỉ catalog
APP_CONFIG_JSON={"JWT_SECRET":"...","LEGACY_PASSWORD_SALT":"...","OPENAI_API_KEY":"sk-...","SERPAPI_KEY":"...","PAYOS_CLIENT_ID":"...","PAYOS_API_KEY":"...","PAYOS_CHECKSUM_KEY":"..."}
UPLOAD_BUCKET=<ten-bucket-anh>                       # khi bật uploads/detect
```

Mỗi module cần các key liệt kê trong `FEATURE_SECRETS` (`core_api/config.py`); thiếu key thì backend báo lỗi ngay khi khởi động.

#### Bước 5: Dựng FAISS index (khi bật module `ai`)

```bash
python scripts/build_faiss_index.py --out faiss_indexes
```

Đọc địa điểm/lễ hội/hiện vật từ Neon, tạo embeddings (~0,002 USD mỗi lần).

#### Bước 6: Chạy Backend Server

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8080
```

#### Bước 7: Kiểm tra Backend

Mở browser và truy cập:
- **Health Check**: http://localhost:8080/health
- **Readiness (DB)**: http://localhost:8080/health/ready
- **API Docs**: http://localhost:8080/docs

---

### 📱 PHẦN 2: Cài đặt Frontend (Mobile App)

#### Bước 1: Clone Frontend Repository

```bash
git clone https://github.com/lekhanhdat/Travel.git
cd Travel
```

#### Bước 2: Cài đặt Dependencies

```bash
npm ci
```

**Lưu ý**: Quá trình này có thể mất 5-10 phút tùy vào tốc độ mạng.

#### Bước 3: Cấu hình Environment Variables

Tạo file `.env` ở thư mục gốc (không commit). App **chỉ** đọc 3 biến public này (allowlist trong `babel.config.js`, giá trị được đóng gói vào app):

```bash
CATALOG_API_URL=https://<url-backend-cloud-run>
API_BASE_URL=https://<url-backend-cloud-run>
# Hoặc backend local trên emulator Android: http://10.0.2.2:8080
MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token
```

Không đặt key trả phí (OpenAI, SerpAPI, PayOS, SendGrid…) vào `.env` của app: các key đó chỉ nằm ở backend.

#### Bước 4: Cấu hình Android

**Mapbox download token** (để Gradle tải SDK Mapbox) — thêm vào `~/.gradle/gradle.properties`, không đặt trong repo:
```bash
MAPBOX_DOWNLOADS_TOKEN=sk.your-mapbox-download-token
```

**Cấu hình Android SDK:**
1. Mở Android Studio
2. SDK Manager → Android SDK → Chọn Android 14 (API 34)
3. SDK Tools → Chọn:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

**Cấu hình Environment Variables (Windows):**
```bash
ANDROID_HOME=C:\Users\<YourUsername>\AppData\Local\Android\Sdk
```

```bash
# Reverse port cho Reactotron (debugging tool)
npm run reactotron

# Reverse port cho Metro bundler (khi test trên thiết bị thật)
npm run realDevice
```

#### Bước 5: Cấu hình iOS (chỉ macOS)

```bash
cd ios
pod install
cd ..
```

**Lưu ý**:
- Cần Xcode >= 14
- iOS chưa được kiểm thử ở đợt migration (chỉ Android)

---

### ⚙️ PHẦN 3: Cấu hình External Services

#### 1. Neon (PostgreSQL)

1. Tạo project tại https://neon.tech (region Singapore)
2. Tạo schema bằng các file `db/schema/NNN_*.sql` của backend theo thứ tự, bằng role owner
3. Tạo role runtime `travel_runtime` và cấp quyền bằng `db/permissions/*.sql`
4. Backend dùng URL **pooled** của `travel_runtime`; URL owner chỉ dùng khi chạy migration

Chi tiết: `Travel_BE/db/README.md`.

#### 2. Mapbox Setup

1. Đăng ký tại https://www.mapbox.com/
2. Tạo Access Token (public, `pk.`) tại https://account.mapbox.com/access-tokens/ → `.env` của app
3. Tạo Secret token `sk.` với scope `DOWNLOADS:READ` → `~/.gradle/gradle.properties`

#### 3. OpenAI Setup

1. Đăng ký tại https://platform.openai.com/
2. Tạo API Key, nạp credits (tối thiểu $5)
3. Đưa key vào secret cấu hình (Secret Manager) hoặc `APP_CONFIG_JSON` khi chạy local — **không** đưa vào app

#### 4. SerpAPI Setup

1. Đăng ký tại https://serpapi.com/ (gói miễn phí 250 lượt/tháng)
2. Đưa `SERPAPI_KEY` vào secret cấu hình

#### 5. PayOS Setup

1. Đăng ký tại https://my.payos.vn/
2. Tạo payment channel
3. Lấy credentials: Client ID, API Key, Checksum Key → secret cấu hình
4. Cấu hình Webhook URL:
   - URL: URL backend + đường dẫn webhook PayOS (xem Swagger `/docs`)
   - Method: POST

#### 6. Google Cloud Setup

1. Một GCP project (region Singapore `asia-southeast1`)
2. Cloud Storage bucket ảnh (public-read, lifecycle xóa `tmp/` sau 1 ngày)
3. Secret Manager: một secret URL database + một secret JSON cấu hình (key các dịch vụ)
4. Billing guard ngắt billing khi chi phí GCP vượt 26.000 VND/tháng

Chi tiết: `Travel_BE/deploy/README.md`.

#### 7. SendGrid Setup (cho OTP email — khi bật Nợ N1)

1. Đăng ký tại https://sendgrid.com/, verify sender email
2. Đưa `SENDGRID_API_KEY` + `EMAIL_FROM` vào secret cấu hình, bật module `email`

---

## 🎯 Hướng dẫn sử dụng

### 🚀 Chạy Backend Server (local, tùy chọn)

```bash
cd Travel_BE
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

uvicorn app:app --reload --host 127.0.0.1 --port 8080
# API Docs: http://localhost:8080/docs
```

**Kiểm tra backend hoạt động:**
```bash
curl http://localhost:8080/health
# Danh sách API: http://localhost:8080/docs
```

---

### 📱 Chạy Mobile App

#### Development Mode

```bash
# Khởi động lạnh emulator + build + cài app (khuyên dùng)
npm run android:fresh

# Hoặc khi emulator/thiết bị đã chạy sẵn
npm start            # Terminal 1: Metro bundler
npm run android      # Terminal 2: Chạy trên Android
```

**Chạy trên Android Emulator:**
1. Mở Android Studio
2. Device Manager → Create Virtual Device (ví dụ: Pixel 8)
3. Chọn system image (Android 14, API 34)
4. Start emulator
5. Chạy `npm run android`
6. GPS giả: `adb emu geo fix 108.2270 16.0611`

**Chạy trên Android Device (thiết bị thật):**
1. Bật Developer Options trên điện thoại
2. Bật USB Debugging
3. Kết nối điện thoại với máy tính qua USB
4. Chạy `adb devices` để kiểm tra
5. Chạy `npm run realDevice` để reverse port
6. Chạy `npm run android`

---

### 🔨 Build Production

#### Build Android APK

```bash
cd android
./gradlew clean
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

**Lưu ý**: File APK/AAB/bundle không commit vào git (đã có trong `.gitignore`). Ký release và Play App Signing làm ở phase P14.

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

# Run tests (danh sách suite CI ở .github/workflows/ci.yml)
npm test

# Kiểm tra TypeScript
npx tsc --noEmit

# Generate image resources từ assets
npm run genimg

# Generate SVG resources
npm run genimgsvg

# Reset Metro cache (sau khi sửa .env)
npm start -- --reset-cache

# Clean Android build
cd android && ./gradlew clean && cd ..
```

#### Backend Scripts

```bash
# Run development server
uvicorn app:app --reload

# Run tests (fake DB, không cần mạng)
for f in tests/check_*.py; do python "$f"; done

# Dựng FAISS index từ Neon
python scripts/build_faiss_index.py --out faiss_indexes
```

---

## 🌐 API Documentation

Danh sách endpoint, request/response đầy đủ xem bằng **Swagger** khi chạy backend local: `http://localhost:8080/docs` (xem [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)). README không liệt kê đường dẫn API và URL production.

**Nguyên tắc chung**
- Mọi API trả JSON; danh sách có phân trang (`limit` ≤ 100, `offset`), catalog có gzip + ETag.
- API cần đăng nhập nhận header `Authorization: Bearer <JWT>`; danh tính luôn lấy từ token, không lấy `user_id` trên URL/body.
- Lỗi trả mã HTTP chuẩn (401 chưa đăng nhập, 403 không có quyền, 413/415 ảnh sai, 429 hết lượt trong ngày, 502 dịch vụ ngoài lỗi, 503 database lỗi) kèm thông báo tiếng Việt.
- Module nào tắt (`APP_FEATURES`) thì API của module đó không tồn tại.

**Theo module**

| Module | Chức năng | Cần đăng nhập | Giới hạn |
|---|---|---|---|
| catalog | Danh sách địa điểm, lễ hội, khách sạn (kèm `rating`, `review_count`, `content_en`) | Không | Cache 5 phút |
| health | Trạng thái process, module, index FAISS; kiểm tra database | Không | — |
| auth | Đăng ký, đăng nhập, xem/sửa hồ sơ, đổi mật khẩu, xóa tài khoản | Trừ đăng ký/đăng nhập | Giới hạn đăng nhập sai |
| uploads | Upload ảnh JPEG/PNG/WebP ≤ 2 MB → Cloud Storage, trả URL | Có | 20 ảnh/người/ngày |
| reviews | Xem đánh giá theo địa điểm/lễ hội; viết, xóa, báo cáo đánh giá | Viết/xóa/báo cáo | ≤ 5 ảnh, ≤ 2000 ký tự |
| detect | Nhận diện hiện vật từ ảnh (≤ 8 MB) → tên + mô tả Markdown | Có | 5/người/ngày, 8/ngày toàn hệ thống |
| ai | Tìm kiếm ngữ nghĩa, gợi ý từ khóa, địa điểm tương tự, gợi ý cá nhân, chatbot RAG, bộ nhớ người dùng | Chatbot, gợi ý cá nhân, bộ nhớ | Chatbot 30 câu/người/ngày |
| payments | Tạo link + QR PayOS, xem trạng thái giao dịch của mình, webhook PayOS (bắt buộc chữ ký) | Có (trừ webhook) | 1.000–50.000.000 VND |
| email | Quên mật khẩu qua OTP (Nợ N1, đang tắt) | — | — |

**Dịch vụ ngoài mà app gọi trực tiếp:** chỉ Mapbox (bản đồ; Directions với `steps`, `alternatives`, `geojson` — `src/services/mapbox.api.ts`) bằng token public `pk.`. App chỉ gọi Directions khi đã có GPS thật, mỗi lần chọn địa điểm một request.

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
│ - auth.api.login()              │
└──────┬──────────────────────────┘
       │
       │ HTTPS (đăng nhập)
       ▼
┌─────────────────────────────────┐
│ Backend (core_api/auth.py)      │
│ - Tìm tài khoản trong Neon      │
│ - Kiểm mật khẩu (scrypt)        │
│ - Ký access 1h + refresh 60 ngày│
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend Response Handler       │
│ - Lưu token + hồ sơ AsyncStorage│
│ - Quay lại màn trước / Home     │
└─────────────────────────────────┘
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
│ - Capture / pick image          │
│ - detect.api.detectImage()      │
└──────┬──────────────────────────┘
       │
       │ HTTPS (nhận diện, JWT)
       │ multipart/form-data
       ▼
┌─────────────────────────────────┐
│ Backend (core_api/detect.py)    │
│ - Lưu ảnh tạm Cloud Storage     │
│ - Google Lens (SerpAPI)         │
│ - OpenAI chọn tên hiện vật      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Bảng objects (Neon)             │
│ - Khớp tên/tên khác (aliases)   │
│ - Lấy mô tả đã kiểm chứng       │
│ - Không khớp → OpenAI viết      │
└──────┬──────────────────────────┘
       │
       │ JSON Response
       ▼
┌─────────────────────────────────┐
│ Frontend Response Handler       │
│ - Hiện tên hiện vật             │
│ - Mô tả Markdown                │
└─────────────────────────────────┘
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
│ - payment.api.createDonation()  │
└──────┬──────────────────────────┘
       │
       │ Tạo giao dịch (JWT)
       ▼
┌─────────────────────────────────┐
│ Backend (core_api/payments.py)  │
│ - Ghi giao dịch PENDING (Neon)  │
│ - Tạo link PayOS (ký HMAC)      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ PayOS API                       │
│ - Return payment link & QR      │
└──────┬──────────────────────────┘
       │
       │ Return to Frontend
       ▼
┌─────────────────────────────────┐
│ Frontend Display                │
│ - Show QR code                  │
│ - Hỏi trạng thái định kỳ        │
│ - User scans & pays             │
└─────────────────────────────────┘
       │
       │ After payment
       ▼
┌─────────────────────────────────┐
│ PayOS Webhook                   │
│ (gọi về backend, có chữ ký)     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Backend (core_api/payments.py)  │
│ - Verify signature (bắt buộc)   │
│ - PAID + cộng số dư (1 lần)     │
└─────────────────────────────────┘
```

---

## 📊 Database Schema

### Neon PostgreSQL Tables

Schema quản lý bằng migration trong `Travel_BE/db/schema/` (`001`–`013`); backend chỉ dùng role `travel_runtime` với quyền tối thiểu (`db/permissions/`).

#### Table: accounts

Lưu trữ thông tin tài khoản người dùng.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | BIGINT | ID tự động tăng | Primary Key |
| user_name | TEXT | Tên đăng nhập | Unique, Required |
| password_hash | TEXT | `scrypt$…` (hash cũ `sha256salt$…` tự nâng cấp khi đăng nhập) | Required |
| full_name, email, phone, gender, birthday, address | TEXT | Hồ sơ | Email unique (không phân biệt hoa thường) |
| avatar | TEXT | URL ảnh đại diện | Optional |
| balance | BIGINT | Số dư (VND) | Default: 0 |
| token_version | INTEGER | Thu hồi JWT khi đổi mật khẩu/xóa tài khoản | Default: 0 |
| deleted_at | TIMESTAMPTZ | Thời điểm xóa (dữ liệu cá nhân bị xóa trắng) | Optional |
| created_at, updated_at | TIMESTAMPTZ | | Auto |

---

#### Table: locations / hotels

Địa điểm du lịch (123) và khách sạn/nhà hàng/quán (82).

| Column | Type | Description |
|--------|------|-------------|
| id, record_id | BIGINT, TEXT | Khóa PostgreSQL và khóa nguồn ổn định |
| name, description, long_description | TEXT | Tên, mô tả ngắn, mô tả dài |
| types | JSONB (array) | Loại (slug, ví dụ `museum`, `beach`) |
| images, videos, advise | JSONB (array) | URL ảnh, id video YouTube, lời khuyên |
| website, phone, ticket_info, opening_hours, address, avatar | TEXT | Thông tin chi tiết |
| lat, long | DOUBLE PRECISION | Tọa độ (cùng null hoặc cùng có) |
| publishable | BOOLEAN | Hiện marker trên bản đồ |
| category | TEXT | Chỉ hotels |
| content_en | JSONB (object) | Bản tiếng Anh theo tên trường |

`rating` và `review_count` không lưu ở bảng này mà tính từ bảng `reviews` (migration 013 đã bỏ cột `rating`/`reviews` cũ).

---

#### Table: festivals

49 lễ hội: cùng nhóm cột nội dung như locations, thêm `event_time` (TEXT) và `location_id` (FK nullable → locations.id).

---

#### Table: objects

11 hiện vật dùng cho Camera AI và làm ngữ cảnh chatbot (không hiện thành màn hình riêng trong app).

| Column | Type | Description |
|--------|------|-------------|
| id, record_id | BIGINT, TEXT | Khóa |
| title, content | TEXT | Tên và mô tả đã kiểm chứng |
| images, video | JSONB, TEXT | Ảnh, video YouTube |
| location_id | BIGINT | FK nullable → locations.id |
| aliases | JSONB (array) | Tên khác để khớp kết quả nhận diện |
| content_en | JSONB | Bản tiếng Anh |

---

#### Table: reviews / review_reports

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | BIGINT | | Primary Key |
| account_id | BIGINT | Người viết | FK → accounts.id |
| location_id / festival_id | BIGINT | Đúng một trong hai | FK |
| rating | SMALLINT | Số sao | 1–5 |
| content | TEXT | Nội dung | 1–2000 ký tự |
| images | JSONB | URL ảnh do chính người viết upload | ≤ 5 ảnh |
| status | TEXT | `visible` / `hidden` | Ẩn khi đủ 3 báo cáo |
| created_at | TIMESTAMPTZ | | Auto |

`review_reports` (review_id, account_id, reason): mỗi người báo cáo một đánh giá một lần.

---

#### Table: transactions (cho Payment)

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | BIGINT | | Primary Key |
| account_id | BIGINT | Người ủng hộ | FK → accounts.id |
| user_name | TEXT | Tên đăng nhập lúc giao dịch | Optional |
| amount | BIGINT | Số tiền (VND) | > 0 |
| order_code | BIGINT | Mã đơn PayOS | Unique |
| payment_link_id | TEXT | ID link thanh toán | Unique |
| status | TEXT | PENDING, PAID, CANCELLED, EXPIRED | Default PENDING |
| description | TEXT | Mô tả | Optional |
| created_at, updated_at | TIMESTAMPTZ | | Auto |

---

#### Table: user_memories / conversations (AI)

- `user_memories`: account_id, memory_type (`preference`, `interest`, `visited`, `dislike`, `context`), content, confidence, metadata
- `conversations`: session_id, account_id, role (`user`/`assistant`), content — dùng cho lịch sử chat và quota/ngày

Xóa tài khoản xóa luôn hai bảng này của người dùng.

---

## 🚢 Deployment

### Backend Deployment (Google Cloud Run)

Hướng dẫn đầy đủ (lệnh PowerShell, rollback): `Travel_BE/deploy/README.md`.

#### Bước 1: Migration database (nếu có)

Chạy file `db/schema/NNN_*.sql` mới bằng role owner (`DATABASE_URL_UNPOOLED`) **trước** khi deploy code cần nó.

#### Bước 2: Build image bằng Cloud Build

`deploy/cloudbuild.yaml` gồm 3 bước:
1. Dựng FAISS index từ Neon (`scripts/build_faiss_index.py`)
2. `docker build`
3. Smoke test container (`deploy/container_smoke.py`): DB lỗi → 503, Neon thật → đủ số bản ghi

Build service account chỉ được cấp quyền đọc secret trong lúc build, thu hồi ngay sau đó.

#### Bước 3: Deploy

1. Lấy digest image vừa build, ghi vào `deploy/service.yaml`
2. Ghi lại revision đang chạy (để rollback)
3. `gcloud run services replace deploy/service.yaml`

#### Bước 4: Kiểm tra

Kiểm tra health, readiness và catalog trên URL Cloud Run mới (lệnh trong `Travel_BE/deploy/README.md`).

**Cấu hình Cloud Run** (`deploy/service.yaml`): min 0 / max 1 instance, 1 vCPU / 1 GiB, concurrency 4, timeout 60 s, `APP_FEATURES=auth,uploads,reviews,detect,ai,payments`, secret URL database + secret JSON cấu hình.

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
   - Privacy policy URL, link xóa tài khoản
   - Data safety, khai báo nội dung người dùng tạo (UGC)
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

### CI/CD Setup

#### GitHub Actions cho Frontend

`.github/workflows/ci.yml` chạy mỗi lần push/PR:
- `npm ci`
- Jest các suite trong danh sách (không gọi mạng)
- `tsc --noEmit` không vượt ngưỡng lỗi hiện có

#### GitHub Actions cho Backend

`Travel_BE/.github/workflows/ci.yml` chạy toàn bộ `tests/check_*.py` với DB và nhà cung cấp giả (không cần secret).

Deploy backend làm thủ công theo `deploy/README.md` (Cloud Build + `gcloud run services replace`).

---

## 🔮 Chức năng có thể mở rộng

### Hoàn thiện các phần đang dở (đã có giao diện hoặc API)

| # | Chức năng | Hiện trạng | Hướng làm |
|---|---|---|---|
| R1 | Gợi ý cá nhân hóa thật | Chưa có luồng ghi `user_memories` → luôn hiện mục phổ biến | Ghi sở thích khi xem chi tiết, đánh giá ≥ 4 sao, chủ đề hỏi chatbot |
| R2 | Gợi ý từ khóa khi gõ (autocomplete) | API gợi ý từ khóa + `debouncedGetSuggestions` có sẵn | Gắn vào `SemanticSearchBarComponent` |
| R3 | Tìm kiếm bằng ảnh | Nhánh `search_type=image` luôn lỗi (không có CLIP) | Dùng lại pipeline nhận diện hoặc thêm embeddings ảnh |
| R4 | Cài đặt hoạt động thật | Công tắc chỉ được lưu | Xóa bộ nhớ đệm thật, mở cài đặt quyền vị trí, thông báo đẩy (FCM), chế độ tối |
| R5 | Lịch sử giao dịch | Chỉ có kiểu `ITransaction` | API lịch sử giao dịch (chỉ của user trong JWT) + màn hình trong Hồ sơ |
| R6 | SOS và màn Giới thiệu | Số điện thoại cố định, URL mẫu | Số khẩn cấp (112/113/114/115) hoặc cấu hình; URL thật |
| R7 | Đăng ký lại webhook PayOS | Thao tác tay qua API PayOS | Script `confirm-webhook` khi đổi URL backend |
| N1 | Quên mật khẩu qua email | Code có, module `email` tắt | Thêm key SendGrid, bật module, mở màn hình |

### Ý tưởng mới

- 🗓️ **Lễ hội theo thời gian** - Lọc theo tháng, lịch sự kiện, nhắc lịch trước ngày diễn ra
- ❤️ **Yêu thích** - Lưu địa điểm/lễ hội, danh sách "Đã lưu" (đã có chuỗi i18n `bookmark`)
- 🔗 **Chia sẻ** - Chia sẻ địa điểm/đánh giá qua mạng xã hội, deep link mở thẳng màn chi tiết
- 🧭 **Lập lịch trình** - Gợi ý lịch trình nhiều điểm trong ngày, tối ưu đường đi bằng Mapbox
- 🔔 **Cảnh báo giọng nói khi tới gần** - Bật lại khối `BackgroundGeolocation` (cần quyền vị trí nền)
- 🗺️ **Bản đồ nâng cao** - Gom cụm marker, bản đồ offline, lọc marker theo loại
- 📴 **Chế độ offline** - Lưu catalog và ảnh đã xem để dùng khi mất mạng
- 🏨 **Khách sạn đầy đủ** - Đánh giá, chỉ đường, tương tự cho khách sạn/nhà hàng
- 🧑‍💼 **Trang quản trị** - Quản lý nội dung, duyệt đánh giá bị báo cáo, hiện vật
- 🌏 **Thêm ngôn ngữ** - Dịch nội dung bằng script (như tiếng Anh), dịch đánh giá người dùng
- 🍎 **iOS** - Kiểm thử và phát hành bản iOS

---

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
[![Facebook](https://img.shields.io/badge/Facebook-LeKhanhDat09-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/LeKhanhDat09/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-lekhanhdat-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lekhanhdat/)
[![Email](https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:lekhanhdat03@gmail.com)

</div>

### Repositories

- **Frontend**: [Travel](https://github.com/lekhanhdat/Travel)
- **Backend**: [Travel_BE](https://github.com/lekhanhdat/Travel_BE)

### Skills & Technologies

- **Mobile**: React Native, TypeScript, iOS, Android
- **Backend**: Python, FastAPI, Node.js
- **Database**: PostgreSQL (Neon)
- **AI/ML**: OpenAI, FAISS, RAG, Computer Vision
- **Cloud**: Google Cloud (Cloud Run, Cloud Storage, Secret Manager)
- **Tools**: Git, Docker, CI/CD

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
- **Facebook**: https://www.facebook.com/LeKhanhDat09/
- **LinkedIn**: https://www.linkedin.com/in/lekhanhdat/

---

<div align="center">

## ⭐ Nếu bạn thấy dự án hữu ích, hãy cho một star! ⭐

[![GitHub stars](https://img.shields.io/github/stars/lekhanhdat/Travel?style=social)](https://github.com/lekhanhdat/Travel/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/lekhanhdat/Travel?style=social)](https://github.com/lekhanhdat/Travel/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/lekhanhdat/Travel?style=social)](https://github.com/lekhanhdat/Travel/watchers)

---

**Travel App** - Khám phá Đà Nẵng thông minh hơn

---

*Last updated: 3 November 2026*

</div>
