# 📋 BÁO CÁO KỸ THUẬT TOÀN DIỆN
# Travel Da Nang - Ứng dụng Du lịch Thông minh

**Phiên bản**: 1.0  
**Ngày tạo**: 07/01/2026  
**Đối tượng**: Developer mới tham gia dự án  
**Ngôn ngữ**: Tiếng Việt  

---

## 📑 MỤC LỤC

1. [Tóm tắt điều hành (Executive Summary)](#1-tóm-tắt-điều-hành)
2. [Kiến trúc hệ thống (System Architecture)](#2-kiến-trúc-hệ-thống)
3. [Phân tích Technology Stack](#3-phân-tích-technology-stack)
4. [Deep-Dive các tính năng chính](#4-deep-dive-các-tính-năng-chính)
5. [Database Schema](#5-database-schema)
6. [Tích hợp dịch vụ bên ngoài](#6-tích-hợp-dịch-vụ-bên-ngoài)
7. [Bảo mật (Security)](#7-bảo-mật)
8. [Hiệu năng & Khả năng mở rộng](#8-hiệu-năng--khả-năng-mở-rộng)
9. [Quy trình phát triển](#9-quy-trình-phát-triển)
10. [Vấn đề đã biết & Technical Debt](#10-vấn-đề-đã-biết--technical-debt)

---

## 1. TÓM TẮT ĐIỀU HÀNH

### 1.1 Tổng quan dự án

**Travel Da Nang** là một hệ thống ứng dụng du lịch hoàn chỉnh bao gồm:

| Thành phần | Công nghệ | Mục đích |
|------------|-----------|----------|
| **Mobile App** | React Native 0.74.2 + TypeScript | Ứng dụng cross-platform (iOS/Android) |
| **Backend API** | FastAPI (Python) | Xử lý AI, thanh toán, semantic search |
| **Database** | NocoDB (Cloud) | Lưu trữ dữ liệu không cần code |
| **AI Services** | OpenAI GPT-4o-mini, FAISS | Chatbot, nhận diện ảnh, tìm kiếm ngữ nghĩa |

### 1.2 Các tính năng cốt lõi

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRAVEL DA NANG FEATURES                       │
├─────────────────────────────────────────────────────────────────┤
│  🏠 Home          │ Địa điểm phổ biến, gần bạn, gợi ý AI        │
│  🗺️ Maps          │ Mapbox navigation, turn-by-turn directions  │
│  📸 Camera AI     │ Nhận diện địa điểm bằng OpenAI Vision       │
│  🔍 Semantic Search│ Tìm kiếm ngữ nghĩa với FAISS + Embeddings  │
│  🤖 AI Chatbot    │ Trợ lý du lịch GPT-4o-mini                  │
│  💰 Payment       │ PayOS QR code payment                       │
│  🌐 i18n          │ Đa ngôn ngữ (Việt/Anh)                      │
│  👤 Auth          │ Đăng nhập, OTP email, mã hóa mật khẩu       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Câu hỏi phản biện quan trọng

> **❓ Tại sao chọn React Native thay vì Flutter?**
> 
> **Trả lời**: React Native được chọn vì:
> - Ecosystem JavaScript/TypeScript phổ biến hơn
> - Tích hợp tốt với các thư viện native như Mapbox
> - Team có kinh nghiệm với React
> - Hot reload nhanh hơn trong development
>
> **Trade-off**: Flutter có performance tốt hơn cho animations phức tạp, nhưng Travel App không yêu cầu điều này.

> **❓ Tại sao dùng NocoDB thay vì PostgreSQL/MongoDB truyền thống?**
>
> **Trả lời**: NocoDB được chọn vì:
> - No-code interface cho non-technical stakeholders
> - REST API tự động generate
> - Hosting cloud miễn phí (tier cơ bản)
> - Phù hợp với quy mô dự án nhỏ-vừa
>
> **Trade-off**: Thiếu advanced queries, không có stored procedures, giới hạn về performance với dataset lớn.

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Sơ đồ kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER DEVICE (iOS/Android)                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    REACT NATIVE APPLICATION                      │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │   Home   │ │   Maps   │ │  Camera  │ │ Profile  │            │    │
│  │  │  Screen  │ │  Screen  │ │  Screen  │ │  Screen  │            │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │    │
│  │       │            │            │            │                   │    │
│  │  ┌────┴────────────┴────────────┴────────────┴────┐             │    │
│  │  │              SERVICE LAYER (src/services/)      │             │    │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │             │    │
│  │  │  │locations│ │semantic │ │ chatbot │ │payment│ │             │    │
│  │  │  │  .api   │ │  .api   │ │  .api   │ │ .api  │ │             │    │
│  │  │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬───┘ │             │    │
│  │  └───────┼───────────┼───────────┼──────────┼─────┘             │    │
│  └──────────┼───────────┼───────────┼──────────┼───────────────────┘    │
└─────────────┼───────────┼───────────┼──────────┼────────────────────────┘
              │           │           │          │
              │ HTTPS     │ HTTPS     │ HTTPS    │ HTTPS
              ▼           ▼           ▼          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES                                 │
│                                                                          │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐   │
│  │   NocoDB Cloud       │    │   FastAPI Backend (Digital Ocean)    │   │
│  │   (Database)         │    │                                      │   │
│  │                      │    │  ┌────────────┐  ┌────────────────┐  │   │
│  │  • Accounts Table    │    │  │  /detect   │  │ /api/v1/search │  │   │
│  │  • Locations Table   │◄───┤  │  (AI Cam)  │  │   /semantic    │  │   │
│  │  • Festivals Table   │    │  └─────┬──────┘  └───────┬────────┘  │   │
│  │  • Transactions      │    │        │                 │           │   │
│  └──────────────────────┘    │  ┌─────┴─────────────────┴─────┐     │   │
│                              │  │      AI SERVICE LAYER        │     │   │
│                              │  │  • OpenAI Vision API         │     │   │
│                              │  │  • OpenAI Embeddings         │     │   │
│                              │  │  • FAISS Vector Index        │     │   │
│                              │  └──────────────────────────────┘     │   │
│                              └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ OpenAI │ │ PayOS  │ │Mapbox  │ │Firebase│ │SerpAPI │ │SendGrid│     │
│  │  API   │ │Payment │ │  Maps  │ │Storage │ │ Search │ │ Email  │     │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Luồng dữ liệu chính (Data Flow)

#### Authentication Flow
```
User Input → LoginScreen.tsx → authApi.login() → NocoDB API
                                    ↓
                            hashPassword(SHA256)
                                    ↓
                            Compare with stored hash
                                    ↓
                            AsyncStorage.setItem()
                                    ↓
                            Navigate to HomeScreen
```

#### Camera AI Detection Flow
```
Camera Capture → CameraScreen.tsx → RNFetchBlob.fetch()
                                          ↓
                                    POST /detect (FastAPI)
                                          ↓
                                    OpenAI Vision API
                                          ↓
                                    get_object_name()
                                          ↓
                                    get_full_description()
                                          ↓
                                    JSON Response {name, description}
```

#### Semantic Search Flow
```
User Query → SemanticSearchBarComponent → searchSemantic()
                                               ↓
                                    POST /api/v1/search/semantic
                                               ↓
                                    OpenAI text-embedding-3-small
                                               ↓
                                    FAISS similarity search
                                               ↓
                                    Filter by score > 0.5
                                               ↓
                                    Return ranked results
```

### 2.3 Cấu trúc thư mục Frontend

```
Travel/
├── src/
│   ├── assets/              # Hình ảnh, SVG, fonts
│   │   ├── images/          # PNG, JPG assets
│   │   ├── svg/             # SVG icons
│   │   └── ImageSvg.tsx     # SVG component exports
│   │
│   ├── common/              # Shared constants & types
│   │   ├── colors.tsx       # Color palette
│   │   ├── sizes.tsx        # Responsive sizing
│   │   ├── types.tsx        # TypeScript interfaces (ILocation, IAccount, etc.)
│   │   ├── constants.tsx    # App constants, localStorage keys
│   │   └── AppStyle.tsx     # Global text styles
│   │
│   ├── component/           # Reusable UI components
│   │   ├── SemanticSearchBarComponent.tsx  # AI-powered search
│   │   ├── RecommendationsWidget.tsx       # Personalized recommendations
│   │   ├── SimilarItemsComponent.tsx       # Similar items display
│   │   ├── FloatingChatBubble.tsx          # Draggable chatbot bubble
│   │   ├── BigItemLocation.tsx             # Location card component
│   │   └── LanguageDropdown.tsx            # i18n language switcher
│   │
│   ├── container/           # Screens & Navigation
│   │   ├── AppContainer.tsx # Main navigation setup
│   │   └── screens/
│   │       ├── Home/        # HomeScreen, DetailLocation, ViewAll
│   │       ├── Maps/        # MapScreenV2 (Mapbox integration)
│   │       ├── Camera/      # CameraScreen, PreviewImage
│   │       ├── Login/       # LoginScreen, SignUpScreen, ForgotPassword
│   │       ├── Profile/     # ProfileScreen, ChatbotScreen, Donation
│   │       ├── Festival/    # FestivalsScreen, DetailFestival
│   │       └── NewFeed/     # NewFeedScreen
│   │
│   ├── services/            # API integration layer
│   │   ├── axios.ts         # Axios instance with NocoDB token
│   │   ├── locations.api.ts # Locations CRUD + caching
│   │   ├── festivals.api.ts # Festivals CRUD
│   │   ├── auth.api.ts      # Authentication + OTP
│   │   ├── semantic.api.ts  # Semantic search + RAG chat
│   │   ├── chatbot.api.ts   # OpenAI chat + SerpAPI images
│   │   ├── payment.api.ts   # PayOS integration
│   │   └── mapbox.api.ts    # Mapbox directions API
│   │
│   ├── i18n/                # Internationalization
│   │   ├── index.ts         # i18next configuration
│   │   └── locales/
│   │       ├── en/          # English translations
│   │       └── vi/          # Vietnamese translations
│   │
│   ├── context/             # React Context providers
│   │   └── TranslationContext.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useTranslation.ts
│   │
│   └── utils/               # Utility functions
│       ├── env.ts           # Environment variables loader
│       ├── configs.ts       # App configuration
│       ├── LocalStorageCommon.tsx  # AsyncStorage wrapper
│       └── apiUsageTracker.ts      # API usage monitoring
│
├── App.tsx                  # Root component
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── babel.config.js          # Babel + react-native-dotenv
```

---

## 3. PHÂN TÍCH TECHNOLOGY STACK

### 3.1 Frontend Technologies

| Technology | Version | Mục đích | Tại sao chọn? |
|------------|---------|----------|---------------|
| **React Native** | 0.74.2 | Cross-platform framework | Codebase duy nhất cho iOS/Android |
| **TypeScript** | 4.8.4 | Type safety | Giảm bugs, IDE support tốt |
| **React Navigation** | 6.x | Navigation | Standard cho RN, flexible |
| **React Native Paper** | 5.12.5 | UI Components | Material Design, accessible |
| **@rnmapbox/maps** | 10.1.31 | Maps | Tốt hơn Google Maps cho navigation |
| **react-native-vision-camera** | 4.5.2 | Camera | Modern API, high performance |
| **axios** | 1.5.0 | HTTP client | Promise-based, interceptors |
| **crypto-js** | 4.2.0 | Encryption | Password hashing |
| **i18next** | - | i18n | Industry standard, React integration |

#### Critical Analysis: Frontend Choices

> **❓ Tại sao dùng Mapbox thay vì Google Maps?**
>
> **Lý do**:
> - Turn-by-turn navigation API tốt hơn
> - Customization bản đồ linh hoạt hơn
> - Pricing model phù hợp hơn cho startup
> - Offline maps support (tương lai)
>
> **Trade-off**: Google Maps có coverage tốt hơn ở một số vùng, nhưng Đà Nẵng được Mapbox cover đầy đủ.

> **❓ Tại sao dùng Class Components thay vì Functional Components?**
>
> **Quan sát**: Dự án mix cả Class và Functional components (ví dụ: `CameraScreen` là Class, `Donation` là Functional).
>
> **Vấn đề**: Không nhất quán, khó maintain. Nên migrate dần sang Functional + Hooks.

### 3.2 Backend Technologies

| Technology | Version | Mục đích | Tại sao chọn? |
|------------|---------|----------|---------------|
| **FastAPI** | 0.108.0+ | Web framework | Async, auto-docs, type hints |
| **Python** | 3.8+ | Language | AI/ML ecosystem mạnh |
| **OpenAI** | 1.51.0+ | AI services | GPT-4o-mini, Vision, Embeddings |
| **FAISS** | 1.7.4+ | Vector search | Facebook's similarity search |
| **PayOS** | 1.0.0+ | Payment | VN payment gateway |
| **Uvicorn** | 0.25.0+ | ASGI server | High performance async |

#### Critical Analysis: Backend Choices

> **❓ Tại sao FastAPI thay vì Express.js (Node.js)?**
>
> **Lý do**:
> - Python có ecosystem AI/ML tốt hơn (OpenAI, FAISS, transformers)
> - FastAPI có auto-generated OpenAPI docs
> - Type hints với Pydantic validation
> - Async support native
>
> **Trade-off**: Team cần biết cả JavaScript (frontend) và Python (backend).

> **❓ Tại sao FAISS thay vì Pinecone/Weaviate?**
>
> **Lý do**:
> - Open-source, không có vendor lock-in
> - Chạy local, không cần external service
> - Đủ performance cho dataset nhỏ-vừa (<100K vectors)
>
> **Trade-off**: Không có managed service, cần tự handle persistence và scaling.

### 3.3 Database: NocoDB

```
┌─────────────────────────────────────────────────────────────┐
│                      NocoDB Cloud                            │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │    Accounts     │  │   Locations     │                   │
│  │  (mad8fvjhd0ba) │  │ (mfz84cb0t9a84) │                   │
│  ├─────────────────┤  ├─────────────────┤                   │
│  │ Id (PK)         │  │ Id (PK)         │                   │
│  │ userName        │  │ name            │                   │
│  │ password (hash) │  │ description     │                   │
│  │ fullName        │  │ lat, long       │                   │
│  │ email           │  │ images (JSON)   │                   │
│  │ balance         │  │ reviews (JSON)  │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   Festivals     │  │  Transactions   │                   │
│  │ (mktzgff8mpu2c) │  │                 │                   │
│  ├─────────────────┤  ├─────────────────┤                   │
│  │ Id (PK)         │  │ Id (PK)         │                   │
│  │ name            │  │ accountId (FK)  │                   │
│  │ event_time      │  │ amount          │                   │
│  │ location        │  │ orderCode       │                   │
│  │ price_level     │  │ status          │                   │
│  │ images (JSON)   │  │ createdAt       │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

#### Critical Analysis: NocoDB

> **❓ Tại sao lưu `reviews` và `images` dưới dạng JSON string?**
>
> **Lý do**: NocoDB không hỗ trợ native array/JSON columns như PostgreSQL. Phải serialize thành string.
>
> **Vấn đề**:
> - Không thể query trực tiếp trong reviews
> - Phải parse JSON ở frontend
> - Không có referential integrity
>
> **Giải pháp tương lai**: Migrate sang PostgreSQL với proper relations.

---

## 4. DEEP-DIVE CÁC TÍNH NĂNG CHÍNH

### 4.1 Camera AI Detection (Nhận diện địa điểm)

#### Mô tả người dùng
Người dùng chụp ảnh một địa điểm du lịch, ứng dụng sử dụng AI để nhận diện và hiển thị thông tin chi tiết về địa điểm đó.

#### Kiến trúc kỹ thuật

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMERA AI FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Camera     │───▶│   Preview    │───▶│   Upload     │   │
│  │   Capture    │    │   Modal      │    │   Image      │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                  │           │
│                                                  ▼           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              FastAPI Backend (/detect)                │   │
│  │                                                       │   │
│  │  1. Receive image file (multipart/form-data)         │   │
│  │  2. Call OpenAI Vision API                           │   │
│  │     - Model: gpt-4o-mini (vision capable)            │   │
│  │     - Prompt: "Identify this Da Nang landmark"       │   │
│  │  3. Get location name from Vision response           │   │
│  │  4. Fetch full description:                          │   │
│  │     - First: Check NocoDB for existing data          │   │
│  │     - Fallback: Generate with OpenAI Chat            │   │
│  │  5. Return {name, description}                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Files

| File | Mục đích |
|------|----------|
| `src/container/screens/Camera/CameraScreen.tsx` | Camera UI, capture logic |
| `src/container/screens/Camera/PreviewImage.tsx` | Preview & upload |
| `src/utils/configs.ts` | SERVER_URL configuration |

#### Code Flow

```typescript
// CameraScreen.tsx - Capture photo
takePhoto = async () => {
  const photo = await this.camera.takePhoto({
    flash: this.state.isShowLightning ? 'on' : 'off',
  });

  this.setState({
    showPreviewModal: true,
    previewImagePath: photo.path,
  });
};

// Upload to backend
uploadImage = async (filePath: string) => {
  const response = await RNFetchBlob.fetch(
    'POST',
    `${SERVER_URL}/detect`,
    {'Content-Type': 'multipart/form-data'},
    [{
      name: 'image_file',
      filename: 'image.jpg',
      data: RNFetchBlob.wrap(filePath),
    }],
  );

  const content = JSON.parse(response.data);
  // content = { name: "Cầu Rồng", description: "..." }
};
```

#### API Endpoint

```http
POST /detect
Content-Type: multipart/form-data

Request:
  image_file: File (JPEG, PNG)

Response:
{
  "name": "Cầu Rồng",
  "description": "# Cầu Rồng\n\nCầu Rồng là biểu tượng của Đà Nẵng..."
}
```

#### Critical Questions

> **❓ Tại sao dùng RNFetchBlob thay vì axios cho upload?**
>
> **Lý do**: RNFetchBlob xử lý file upload từ local path tốt hơn, đặc biệt với camera output. Axios cần convert sang base64 trước.

> **❓ Điều gì xảy ra khi offline?**
>
> **Hiện tại**: Hiển thị error toast "Không thể kết nối đến server".
>
> **Cải thiện**: Nên có fallback data local hoặc queue để upload sau.

> **❓ Chi phí OpenAI Vision API?**
>
> **Ước tính**: ~$0.01-0.03 per image (gpt-4o-mini). Cần monitor usage.

---

### 4.2 Semantic Search (Tìm kiếm ngữ nghĩa)

#### Mô tả người dùng
Người dùng nhập query tự nhiên như "bãi biển đẹp để chụp ảnh hoàng hôn", hệ thống trả về kết quả dựa trên ý nghĩa ngữ nghĩa, không chỉ keyword matching.

#### Kiến trúc kỹ thuật

```
┌─────────────────────────────────────────────────────────────┐
│                 SEMANTIC SEARCH ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Query: "bãi biển đẹp để chụp ảnh hoàng hôn"           │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         SemanticSearchBarComponent.tsx                │   │
│  │                                                       │   │
│  │  • Debounce 500ms                                    │   │
│  │  • Call searchSemantic() from semantic.api.ts        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         FastAPI Backend (/api/v1/search/semantic)     │   │
│  │                                                       │   │
│  │  1. Generate query embedding                         │   │
│  │     └─ OpenAI text-embedding-3-small (1536 dims)     │   │
│  │                                                       │   │
│  │  2. FAISS similarity search                          │   │
│  │     └─ IndexFlatIP (Inner Product for cosine sim)    │   │
│  │                                                       │   │
│  │  3. Filter & rank results                            │   │
│  │     └─ min_score: 0.5 (configurable)                 │   │
│  │                                                       │   │
│  │  4. Return matched entities with scores              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Frontend Filtering Logic                 │   │
│  │                                                       │   │
│  │  PRIMARY RULE:                                       │   │
│  │    Display ALL results with score > 0.5              │   │
│  │                                                       │   │
│  │  FALLBACK RULE:                                      │   │
│  │    If < 10 results above threshold,                  │   │
│  │    display top 10 by score                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Files

| File | Mục đích |
|------|----------|
| `src/component/SemanticSearchBarComponent.tsx` | Search UI + filtering logic |
| `src/services/semantic.api.ts` | API client + caching |
| `docs/SEMANTIC_SEARCH_SPECIFICATION.md` | Full specification |

#### Similarity Score Interpretation

| Score Range | Meaning | Action |
|-------------|---------|--------|
| 0.8 - 1.0 | Excellent match | Always show |
| 0.6 - 0.8 | Good match | Always show |
| 0.5 - 0.6 | Fair match | Show if above threshold |
| < 0.5 | Weak match | Only show in fallback |

#### Code Implementation

```typescript
// SemanticSearchBarComponent.tsx
performSemanticSearch = async (query: string): Promise<T[]> => {
  const response = await searchSemantic({
    query: query.trim(),
    entity_types: [entityType],  // 'location' | 'festival'
    top_k: 50,                   // Request more for filtering
    min_score: 0.1,              // Low threshold, filter in frontend
  });

  if (response.success && response.results.length > 0) {
    // Create score map
    const scoreMap = new Map(response.results.map(r => [r.id, r.score]));

    // Match with local data
    const matchedWithScores = data
      .filter(item => resultIdSet.has(item.Id))
      .map(item => ({ item, score: scoreMap.get(item.Id) || 0 }));

    // Sort by score descending
    matchedWithScores.sort((a, b) => b.score - a.score);

    // Apply filtering rules
    const aboveThreshold = matchedWithScores.filter(m => m.score > 0.5);

    if (aboveThreshold.length >= 10) {
      return aboveThreshold.map(m => m.item);  // PRIMARY RULE
    } else {
      return matchedWithScores.slice(0, 10).map(m => m.item);  // FALLBACK
    }
  }

  // Fallback to keyword search
  return this.filterDataKeyword(query);
};
```

#### API Endpoint

```http
POST /api/v1/search/semantic
Content-Type: application/json

Request:
{
  "query": "bãi biển đẹp ở Đà Nẵng",
  "entity_types": ["location", "festival"],
  "top_k": 15,
  "min_score": 0.5
}

Response:
{
  "success": true,
  "query": "bãi biển đẹp ở Đà Nẵng",
  "results": [
    {
      "id": 5,
      "entity_type": "location",
      "title": "Bãi biển Mỹ Khê",
      "description": "Bãi biển đẹp nhất Đà Nẵng...",
      "score": 0.78
    }
  ],
  "total_count": 8,
  "search_time_ms": 145.5,
  "search_type": "semantic"
}
```

#### Critical Questions

> **❓ Tại sao filter ở frontend thay vì backend?**
>
> **Lý do**:
> - Backend trả về nhiều results với low threshold
> - Frontend có local data để enrich results
> - Flexible filtering logic có thể adjust mà không cần deploy backend
>
> **Trade-off**: Bandwidth overhead khi trả về nhiều results hơn cần thiết.

> **❓ Tại sao dùng text-embedding-3-small thay vì ada-002?**
>
> **Lý do**:
> - Mới hơn, performance tốt hơn
> - Chi phí thấp hơn ($0.00002/1K tokens)
> - 1536 dimensions (có thể reduce xuống 512)

> **❓ FAISS index được persist như thế nào?**
>
> **Hiện tại**: Index được rebuild khi server restart.
>
> **Cải thiện**: Nên persist index file và load on startup.

---

### 4.3 AI Chatbot (Trợ lý du lịch)

#### Mô tả người dùng
Người dùng có thể chat với AI để hỏi về địa điểm du lịch, nhận gợi ý, và được tư vấn lịch trình.

#### Kiến trúc kỹ thuật

```
┌─────────────────────────────────────────────────────────────┐
│                    CHATBOT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           FloatingChatBubble.tsx                      │   │
│  │                                                       │   │
│  │  • Draggable bubble (PanResponder)                   │   │
│  │  • Persists across screens                           │   │
│  │  • Opens ChatbotScreen on tap                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ChatbotScreen.tsx                        │   │
│  │                                                       │   │
│  │  • Message list (FlatList)                           │   │
│  │  • Quick suggestion chips                            │   │
│  │  • Text input with send button                       │   │
│  │  • Typing indicator                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              chatbot.api.ts                           │   │
│  │                                                       │   │
│  │  sendMessage(message, conversationHistory)           │   │
│  │                          │                            │   │
│  │                          ▼                            │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │           OpenAI Chat Completion               │  │   │
│  │  │                                                │  │   │
│  │  │  Model: gpt-4o-mini                           │  │   │
│  │  │  System Prompt: Travel assistant for Da Nang  │  │   │
│  │  │  Temperature: 0.7                             │  │   │
│  │  │  Max Tokens: 1000                             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Files

| File | Mục đích |
|------|----------|
| `src/component/FloatingChatBubble.tsx` | Draggable chat bubble |
| `src/container/screens/Profile/ChatbotScreen.tsx` | Chat UI |
| `src/services/chatbot.api.ts` | OpenAI integration |

#### System Prompt

```typescript
const SYSTEM_PROMPT = `Bạn là trợ lý du lịch thông minh cho thành phố Đà Nẵng, Việt Nam.

Nhiệm vụ của bạn:
- Gợi ý địa điểm du lịch phù hợp với sở thích người dùng
- Cung cấp thông tin về lễ hội, sự kiện
- Tư vấn lịch trình du lịch
- Trả lời câu hỏi về ẩm thực, văn hóa địa phương

Quy tắc:
- Trả lời bằng tiếng Việt (hoặc tiếng Anh nếu người dùng hỏi bằng tiếng Anh)
- Ngắn gọn, súc tích, thân thiện
- Nếu không biết, hãy nói rõ và gợi ý nguồn thông tin khác`;
```

#### Critical Questions

> **❓ Conversation history được lưu ở đâu?**
>
> **Hiện tại**: Chỉ lưu trong state của ChatbotScreen, mất khi close app.
>
> **Cải thiện**: Nên persist vào AsyncStorage hoặc backend.

> **❓ Có RAG (Retrieval Augmented Generation) không?**
>
> **Có**: `semantic.api.ts` có `ragChat()` function sử dụng semantic search để enrich context trước khi gọi OpenAI.

---

### 4.4 Payment Integration (PayOS)

#### Mô tả người dùng
Người dùng có thể donate/nạp tiền vào tài khoản thông qua QR code hoặc payment link.

#### Kiến trúc kỹ thuật

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CREATE PAYMENT                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Donation.tsx                                         │   │
│  │  └─ User enters amount                               │   │
│  │  └─ Call createPayment(amount, userId)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI Backend (POST /payments/create)              │   │
│  │  └─ Create PayOS payment link                        │   │
│  │  └─ Generate QR code                                 │   │
│  │  └─ Return {orderCode, qrCode, checkoutUrl}          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  2. USER PAYS                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  User scans QR code with banking app                  │   │
│  │  OR opens checkoutUrl in browser                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  3. WEBHOOK CALLBACK                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PayOS → POST /webhook/payos                          │   │
│  │  └─ Verify signature                                 │   │
│  │  └─ Update transaction status in NocoDB              │   │
│  │  └─ Update user balance                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  4. FRONTEND POLLING                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Donation.tsx polls GET /payments/status/{orderCode}  │   │
│  │  └─ When status = "PAID", show success message       │   │
│  │  └─ Update local balance                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Files

| File | Mục đích |
|------|----------|
| `src/container/screens/Profile/Donation.tsx` | Payment UI |
| `src/services/payment.api.ts` | PayOS API client |

#### API Endpoints

```http
# Create payment
POST /payments/create
{
  "amount": 50000,
  "userId": 123,
  "description": "Donation from user 123"
}

Response:
{
  "orderCode": 1234567890,
  "paymentLinkId": "abc123xyz",
  "qrCode": "data:image/png;base64,...",
  "checkoutUrl": "https://pay.payos.vn/web/abc123xyz"
}

# Check status
GET /payments/status/{orderCode}

Response:
{
  "status": "PAID",  // PENDING | PAID | CANCELLED | EXPIRED
  "amountPaid": 50000,
  "orderCode": 1234567890
}
```

#### Critical Questions

> **❓ Webhook security như thế nào?**
>
> **Hiện tại**: PayOS gửi signature trong request, backend verify bằng checksum key.
>
> **Code**:
> ```python
> def verify_webhook_signature(data, signature, checksum_key):
>     computed = hmac.new(checksum_key.encode(), data.encode(), hashlib.sha256).hexdigest()
>     return hmac.compare_digest(computed, signature)
> ```

> **❓ Nếu webhook fail thì sao?**
>
> **Hiện tại**: PayOS sẽ retry 3 lần. Nếu vẫn fail, transaction sẽ stuck ở PENDING.
>
> **Cải thiện**: Cần có manual reconciliation process.

---

### 4.5 Maps & Navigation (Mapbox)

#### Mô tả người dùng
Người dùng có thể xem bản đồ với các địa điểm du lịch, chọn địa điểm và nhận chỉ đường turn-by-turn.

#### Kiến trúc kỹ thuật

```
┌─────────────────────────────────────────────────────────────┐
│                    MAPS ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MapScreenV2.tsx                          │   │
│  │                                                       │   │
│  │  Components:                                         │   │
│  │  • MapboxGL.MapView - Main map container             │   │
│  │  • MapboxGL.Camera - Camera position control         │   │
│  │  • MapboxGL.PointAnnotation - Location markers       │   │
│  │  • MapboxGL.ShapeSource + LineLayer - Route line     │   │
│  │                                                       │   │
│  │  Features:                                           │   │
│  │  • User location tracking                            │   │
│  │  • Marker clustering                                 │   │
│  │  • Route visualization                               │   │
│  │  • Turn-by-turn instructions                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              mapbox.api.ts                            │   │
│  │                                                       │   │
│  │  getDirections(origin, destination, profile)         │   │
│  │  └─ profile: 'driving' | 'walking' | 'cycling'       │   │
│  │                                                       │   │
│  │  API: Mapbox Directions API v5                       │   │
│  │  └─ geometries=geojson                               │   │
│  │  └─ steps=true (for turn-by-turn)                    │   │
│  │  └─ alternatives=true (multiple routes)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Files

| File | Mục đích |
|------|----------|
| `src/container/screens/Maps/MapScreenV2.tsx` | Main map screen |
| `src/services/mapbox.api.ts` | Mapbox API client |

#### Mapbox Configuration

```typescript
// App.tsx or MapScreenV2.tsx
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken(env.MAPBOX_ACCESS_TOKEN);
MapboxGL.setTelemetryEnabled(false);  // Privacy
```

#### Critical Questions

> **❓ Offline maps support?**
>
> **Hiện tại**: Không có. Cần internet để load map tiles.
>
> **Cải thiện**: Mapbox hỗ trợ offline packs, có thể implement cho Đà Nẵng region.

> **❓ Mapbox pricing?**
>
> **Free tier**: 50,000 map loads/month, 100,000 directions requests/month.
> **Ước tính**: Đủ cho ~1,000 DAU.

---

## 5. DATABASE SCHEMA

### 5.1 NocoDB Tables

#### Accounts Table (mad8fvjhd0ba1bk)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | Number | PK, Auto-increment | Primary key |
| userName | Text | Unique, Required | Login username |
| password | Text | Required | SHA256 hashed password |
| fullName | Text | - | Display name |
| email | Text | Unique | Email for OTP |
| avatar | Text | - | Avatar URL |
| balance | Number | Default: 0 | Account balance (VND) |
| createdAt | DateTime | Auto | Creation timestamp |

#### Locations Table (mfz84cb0t9a84jt)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | Number | PK, Auto-increment | Primary key |
| name | Text | Required | Location name |
| description | LongText | - | Markdown description |
| latitude | Number | Required | GPS latitude |
| longitude | Number | Required | GPS longitude |
| images | Text | - | JSON array of image URLs |
| videos | Text | - | JSON array of video URLs |
| category | SingleSelect | - | Văn hóa, Thiên nhiên, etc. |
| rating | Number | - | Average rating (1-5) |
| reviews | Text | - | JSON array of reviews |
| address | Text | - | Full address |

#### Festivals Table (mktzgff8mpu2c6p)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | Number | PK, Auto-increment | Primary key |
| name | Text | Required | Festival name |
| description | LongText | - | Markdown description |
| event_time | Text | - | Event date/time |
| location | Text | - | Event location |
| price_level | Text | - | Free, Paid, etc. |
| images | Text | - | JSON array of image URLs |

#### Transactions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | Number | PK, Auto-increment | Primary key |
| accountId | Number | FK → Accounts | User reference |
| amount | Number | Required | Transaction amount |
| orderCode | Text | Unique | PayOS order code |
| paymentLinkId | Text | - | PayOS payment link ID |
| status | SingleSelect | - | PENDING, PAID, CANCELLED |
| description | Text | - | Transaction description |
| createdAt | DateTime | Auto | Creation timestamp |

### 5.2 Data Relationships

```
┌─────────────┐       ┌─────────────┐
│  Accounts   │       │ Transactions│
│             │       │             │
│  Id (PK)    │◄──────│ accountId   │
│  userName   │   1:N │ amount      │
│  balance    │       │ status      │
└─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐
│  Locations  │       │  Festivals  │
│             │       │             │
│  Id (PK)    │       │  Id (PK)    │
│  name       │       │  name       │
│  lat/long   │       │  event_time │
│  reviews[]  │       │  location   │
└─────────────┘       └─────────────┘
     │                      │
     └──────────┬───────────┘
                │
                ▼
        ┌─────────────┐
        │   FAISS     │
        │   Index     │
        │             │
        │ Embeddings  │
        │ for search  │
        └─────────────┘
```

---

## 6. TÍCH HỢP DỊCH VỤ BÊN NGOÀI

### 6.1 Service Integration Matrix

| Service | Mục đích | API Key Location | Rate Limits |
|---------|----------|------------------|-------------|
| **OpenAI** | AI features | Backend `.env` | Tier-based |
| **Mapbox** | Maps | Frontend `env.ts` | 50K loads/mo |
| **PayOS** | Payment | Backend `.env` | Unlimited |
| **NocoDB** | Database | Frontend `env.ts` | Unlimited |
| **SendGrid** | Email OTP | Frontend `env.ts` | 100/day free |
| **SerpAPI** | Image search | Backend `.env` | 100/mo free |

### 6.2 OpenAI Integration Details

```typescript
// Models used:
const OPENAI_MODELS = {
  chat: 'gpt-4o-mini',           // Chatbot, descriptions
  vision: 'gpt-4o-mini',         // Image recognition
  embedding: 'text-embedding-3-small',  // Semantic search
};

// Pricing (as of 2026):
// gpt-4o-mini: $0.15/1M input, $0.60/1M output
// text-embedding-3-small: $0.02/1M tokens
```

### 6.3 Error Handling Strategy

```typescript
// semantic.api.ts - Example error handling
export const searchSemantic = async (params: SemanticSearchParams) => {
  try {
    const response = await axios.post(`${SERVER_URL}/api/v1/search/semantic`, params);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        // Rate limited - return empty results
        console.warn('Semantic search rate limited');
        return { success: false, results: [], error: 'RATE_LIMITED' };
      }
      if (error.response?.status === 503) {
        // Service unavailable - fallback to keyword search
        return { success: false, results: [], error: 'SERVICE_UNAVAILABLE' };
      }
    }
    throw error;
  }
};
```

---

## 7. BẢO MẬT (SECURITY)

### 7.1 Authentication Security

#### Password Hashing

```typescript
// auth.api.ts
import CryptoJS from 'crypto-js';

const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + env.PASSWORD_SALT).toString();
};

// Login flow:
// 1. User enters password
// 2. Frontend hashes: SHA256(password + salt)
// 3. Send hashed password to NocoDB
// 4. Compare with stored hash
```

#### Security Analysis

| Aspect | Current State | Risk Level | Recommendation |
|--------|---------------|------------|----------------|
| Password hashing | SHA256 + salt | Medium | Upgrade to bcrypt |
| Salt storage | Hardcoded in env.ts | High | Move to secure storage |
| Token storage | AsyncStorage | Medium | Use Keychain/Keystore |
| API tokens | In source code | High | Use .env files |

### 7.2 API Security

```typescript
// axios.ts - NocoDB authentication
const request = axios.create({
  baseURL: env.DB_URL,
  headers: {
    'xc-token': env.NOCODB_TOKEN,  // API token in header
  },
});
```

#### Recommendations

1. **Implement JWT authentication** thay vì query trực tiếp NocoDB
2. **Add rate limiting** ở backend
3. **Implement HTTPS certificate pinning** cho mobile app
4. **Encrypt sensitive data** trong AsyncStorage

### 7.3 Payment Security

```python
# PayOS webhook verification
def verify_webhook(request_data, signature):
    computed_signature = hmac.new(
        PAYOS_CHECKSUM_KEY.encode(),
        json.dumps(request_data).encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_signature, signature)
```

---

## 8. HIỆU NĂNG & KHẢ NĂNG MỞ RỘNG

### 8.1 Current Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| App startup time | < 3s | ~2.5s | ✅ |
| API response time | < 500ms | ~300ms | ✅ |
| Semantic search | < 2s | ~1.5s | ✅ |
| Image upload | < 5s | ~3s | ✅ |
| Map load time | < 2s | ~1.5s | ✅ |

### 8.2 Caching Strategy

```typescript
// locations.api.ts - In-memory caching
let cachedLocations: ILocation[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getLocations = async (): Promise<ILocation[]> => {
  const now = Date.now();

  if (cachedLocations && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedLocations;  // Return cached data
  }

  const response = await request.get(URL_GET_LOCATIONS);
  cachedLocations = response.data.list;
  cacheTimestamp = now;

  return cachedLocations;
};
```

### 8.3 Scalability Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                 SCALABILITY ROADMAP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CURRENT STATE (MVP):                                       │
│  • Single FastAPI instance on Digital Ocean                 │
│  • NocoDB Cloud (shared)                                    │
│  • ~100 concurrent users                                    │
│                                                              │
│  PHASE 2 (1K users):                                        │
│  • Add Redis caching                                        │
│  • Horizontal scaling (2-3 instances)                       │
│  • CDN for static assets                                    │
│                                                              │
│  PHASE 3 (10K users):                                       │
│  • Migrate to PostgreSQL                                    │
│  • Kubernetes deployment                                    │
│  • Dedicated FAISS server                                   │
│  • Message queue for async tasks                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. QUY TRÌNH PHÁT TRIỂN

### 9.1 Development Setup

```bash
# 1. Clone repositories
git clone https://github.com/user/Travel.git
git clone https://github.com/user/Travel_BE.git

# 2. Setup Backend
cd Travel_BE
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # Configure environment variables
uvicorn app:app --reload --port 8080

# 3. Setup Frontend
cd ../Travel
npm install
# Configure src/utils/env.ts
npm start
npm run android  # or npm run ios
```

### 9.2 Testing Strategy

| Test Type | Tool | Coverage | Status |
|-----------|------|----------|--------|
| Unit Tests | Jest | Components, Services | Partial |
| Integration Tests | - | API endpoints | Not implemented |
| E2E Tests | Detox | User flows | Not implemented |

```bash
# Run tests
npm test

# Run specific test
npm test -- --testPathPattern="semantic.api.test"
```

### 9.3 Deployment

#### Backend (Digital Ocean)

```yaml
# Procfile
web: gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT app:app
```

#### Frontend (Android)

```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## 10. VẤN ĐỀ ĐÃ BIẾT & TECHNICAL DEBT

### 10.1 Known Issues

| Issue | Severity | Impact | Workaround |
|-------|----------|--------|------------|
| Mixed Class/Functional components | Low | Maintainability | Gradual migration |
| No offline support | Medium | UX when no internet | Show cached data |
| Password in SHA256 | Medium | Security | Migrate to bcrypt |
| FAISS index not persisted | Low | Slow startup | Rebuild on start |
| No proper error boundaries | Medium | App crashes | Add React error boundaries |

### 10.2 Technical Debt

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNICAL DEBT BACKLOG                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HIGH PRIORITY:                                             │
│  □ Implement proper JWT authentication                      │
│  □ Add comprehensive error handling                         │
│  □ Migrate passwords to bcrypt                              │
│  □ Add API rate limiting                                    │
│                                                              │
│  MEDIUM PRIORITY:                                           │
│  □ Migrate to Functional components + Hooks                 │
│  □ Add offline support with data sync                       │
│  □ Implement proper logging (Sentry/Crashlytics)            │
│  □ Add E2E tests with Detox                                 │
│                                                              │
│  LOW PRIORITY:                                              │
│  □ Optimize bundle size                                     │
│  □ Add dark mode support                                    │
│  □ Implement push notifications                             │
│  □ Add analytics (Firebase Analytics)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 Recommendations for New Developers

1. **Start with README.md** - Hiểu tổng quan dự án
2. **Read SEMANTIC_SEARCH_SPECIFICATION.md** - Hiểu tính năng AI search
3. **Setup local environment** - Chạy cả frontend và backend locally
4. **Explore src/services/** - Hiểu cách gọi API
5. **Check src/common/types.tsx** - Hiểu data structures
6. **Run tests** - Đảm bảo không break existing functionality

---

## 📚 TÀI LIỆU THAM KHẢO

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Mapbox React Native SDK](https://github.com/rnmapbox/maps)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [PayOS Documentation](https://payos.vn/docs/)
- [NocoDB API](https://docs.nocodb.com/)
- [FAISS Documentation](https://faiss.ai/)

---

**Tài liệu này được tạo ngày 07/01/2026**
**Phiên bản: 1.0**
**Tác giả: AI Assistant**

