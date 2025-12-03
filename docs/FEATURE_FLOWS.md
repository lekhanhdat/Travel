# Tài Liệu Chi Tiết Luồng Hoạt Động Các Tính Năng - Travel App

---

## Mục Lục

1. [Tổng Quan Ứng Dụng](#1-tổng-quan-ứng-dụng)
2. [HomeScreen - Màn Hình Chính](#2-homescreen---màn-hình-chính)
3. [FestivalsScreen - Màn Hình Lễ Hội](#3-festivalsscreen---màn-hình-lễ-hội)
4. [NewFeedScreen - Màn Hình Bảng Tin](#4-newfeedscreen---màn-hình-bảng-tin)
5. [MapScreenV2 - Màn Hình Bản Đồ](#5-mapscreenv2---màn-hình-bản-đồ)
6. [CameraScreen - Màn Hình Camera](#6-camerascreen---màn-hình-camera)
7. [ProfileScreen - Màn Hình Cá Nhân](#7-profilescreen---màn-hình-cá-nhân)
8. [Luồng Xác Thực](#8-luồng-xác-thực)
9. [API Services](#9-api-services)

---

## 1. Tổng Quan Ứng Dụng

### 1.1 Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRAVEL APP ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐         ┌──────────────────────────────────────┐  │
│  │   MOBILE APP         │         │   BACKEND SERVICES                   │  │
│  │   (React Native)     │◄───────►│                                      │  │
│  │                      │  REST   │  ┌────────────────────────────────┐  │  │
│  │  • HomeScreen        │   API   │  │  NocoDB (Database)             │  │  │
│  │  • FestivalsScreen   │         │  │  ├─ Locations                  │  │  │
│  │  • NewFeedScreen     │         │  │  ├─ Festivals                  │  │  │
│  │  • MapScreenV2       │         │  │  ├─ Accounts                   │  │  │
│  │  • CameraScreen      │         │  │  └─ Reviews                    │  │  │
│  │  • ProfileScreen     │         │  └────────────────────────────────┘  │  │
│  └──────────────────────┘         │                                      │  │
│                                   │  ┌────────────────────────────────┐  │  │
│                                   │  │  FastAPI Backend               │  │  │
│                                   │  │  ├─ Semantic Search            │  │  │
│                                   │  │  ├─ Image Detection            │  │  │
│                                   │  │  └─ RAG Chatbot                │  │  │
│                                   │  └────────────────────────────────┘  │  │
│                                   │                                      │  │
│                                   │  ┌────────────────────────────────┐  │  │
│                                   │  │  External APIs                 │  │  │
│                                   │  │  ├─ OpenAI (GPT-4o-mini)       │  │  │
│                                   │  │  ├─ Mapbox (Directions)        │  │  │
│                                   │  │  ├─ SerpAPI (Image Search)     │  │  │
│                                   │  │  └─ SendGrid (Email OTP)       │  │  │
│                                   │  └────────────────────────────────┘  │  │
│                                   └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Công Nghệ Sử Dụng

| Thành phần | Công nghệ | Mục đích |
|------------|-----------|----------|
| Framework | React Native 0.74.2 | Phát triển ứng dụng đa nền tảng |
| Ngôn ngữ | TypeScript | Type-safe JavaScript |
| Navigation | React Navigation (Stack, Bottom Tabs) | Điều hướng màn hình |
| State | AsyncStorage + LocalStorageCommon | Lưu trữ dữ liệu cục bộ |
| HTTP Client | Axios | Giao tiếp API với NocoDB |
| Maps | Mapbox GL | Hiển thị bản đồ và điều hướng |
| Camera | react-native-vision-camera | Chụp ảnh và nhận diện |
| AI Chat | OpenAI GPT-4o-mini | Trợ lý AI thông minh |

## 2. HomeScreen - Màn Hình Chính

### 2.1 Tổng Quan

**File**: `src/container/screens/Home/HomeScreen.tsx`

Màn hình chính của ứng dụng, hiển thị danh sách địa điểm du lịch với các tính năng tìm kiếm ngữ nghĩa AI, gợi ý cá nhân hóa, và hiển thị địa điểm gần đây.

### 2.2 Tính Năng & Chức Năng

| Tính năng | Mô tả | Component |
|-----------|-------|-----------|
| Tìm kiếm ngữ nghĩa | Tìm kiếm địa điểm bằng AI | `SemanticSearchBarComponent` |
| Gợi ý cá nhân hóa | Đề xuất địa điểm dựa trên lịch sử | `RecommendationsWidget` |
| Địa điểm phổ biến | Hiển thị top địa điểm | `BigItemLocation` |
| Địa điểm gần đây | Tính khoảng cách GPS | `LargeItemLocation` |
| Đa ngôn ngữ | Chuyển đổi ngôn ngữ | `LanguageDropdown` |

### 2.3 State Management

```typescript
interface IHomeScreenState {
  valueSearch: string;           // Giá trị tìm kiếm
  locations: ILocation[];        // Tất cả địa điểm
  locationsPopular: ILocation[]; // Địa điểm phổ biến
  locationsNearly: ILocation[];  // Địa điểm gần đây
  account: IAccount | null;      // Thông tin tài khoản
  currentLat: number;            // Vĩ độ hiện tại
  currentLong: number;           // Kinh độ hiện tại
  locationPermission: boolean;   // Quyền vị trí
}
```

### 2.4 Luồng Hoạt Động

#### Luồng khởi tạo màn hình:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Mở HomeScreen | Gọi `componentDidMount()` |
| 2 | Yêu cầu quyền vị trí | Hiển thị dialog xin quyền |
| 3a | Nếu được cấp quyền | Lấy vị trí GPS hiện tại |
| 3b | Nếu không được cấp | Hiển thị tất cả địa điểm (không tính khoảng cách) |
| 4 | Gọi API lấy danh sách địa điểm | `locationApi.getLocations()` |
| 5 | Tính khoảng cách Haversine | So sánh vị trí user với từng địa điểm |
| 6 | Sắp xếp địa điểm gần nhất | Cập nhật `locationsNearly` |
| 7 | Render UI | Hiển thị danh sách địa điểm |

#### Luồng tìm kiếm:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Người dùng nhập từ khóa | Cập nhật `valueSearch` |
| 2a | Chế độ Semantic Search | Gọi API `/api/v1/search/semantic` |
| 2b | Chế độ Keyword Search | Lọc local với Vietnamese normalize |
| 3 | Hiển thị kết quả | Cập nhật danh sách hiển thị |

#### Luồng xem chi tiết:

```
Nhấn địa điểm → Navigate to DetailLocationScreen (truyền location data)
```

### 2.5 Luồng Dữ Liệu Chi Tiết

#### 2.5.1 Khởi tạo màn hình

```
User Action: Mở ứng dụng
    ↓
Component: HomeScreen.componentDidMount()
    ↓
API Call: locationApi.getLocations()
    ↓
Backend: NocoDB GET /api/v2/tables/mfz84cb0t9a84jt/records
    ↓
Response: { list: ILocation[] }
    ↓
UI Update: setState({ locations, locationsPopular, locationsNearly })
```

#### 2.5.2 Tìm kiếm ngữ nghĩa

```
User Action: Nhập "bãi biển đẹp" và nhấn tìm kiếm
    ↓
Component: SemanticSearchBarComponent.handleSubmitSearch()
    ↓
API Call: searchSemantic({ query: "bãi biển đẹp", entity_types: ["location"] })
    ↓
Backend: POST /api/v1/search/semantic
    ↓
Response: { success: true, results: [...], total_count: 10 }
    ↓
UI Update: Hiển thị kết quả được sắp xếp theo score
```

### 2.6 API Request/Response

#### Lấy danh sách địa điểm

**Request:**
```typescript
// File: src/services/locations.api.ts
GET https://app.nocodb.com/api/v2/tables/mfz84cb0t9a84jt/records
Headers: {
  'xc-token': 'NOCODB_TOKEN'
}
```

**Response:**
```json
{
  "list": [
    {
      "Id": 1,
      "name": "Cầu Rồng",
      "avatar": "https://example.com/caurong.jpg",
      "address": "Đà Nẵng",
      "description": "Cầu biểu tượng của thành phố Đà Nẵng...",
      "lat": 16.0614,
      "long": 108.2278,
      "types": "Cầu, Kiến trúc",
      "reviews": 4.5,
      "voiceName": "cau_rong.mp3",
      "images": "[\"url1\", \"url2\"]",
      "videos": "[\"video_url\"]"
    }
  ]
}
```

### 2.7 Xử Lý Lỗi

| Lỗi | Nguyên nhân | Xử lý |
|-----|-------------|-------|
| Không có quyền vị trí | Người dùng từ chối | Hiển thị tất cả địa điểm, không tính khoảng cách |
| API timeout | Mạng chậm | Hiển thị Toast lỗi, cho phép thử lại |
| Không có kết quả tìm kiếm | Query không khớp | Fallback sang keyword search |

---

## 3. FestivalsScreen - Màn Hình Lễ Hội

### 3.1 Tổng Quan

**File**: `src/container/screens/Festival/FestivalsScreen.tsx`

Màn hình hiển thị danh sách các lễ hội và sự kiện văn hóa tại Đà Nẵng với tính năng tìm kiếm ngữ nghĩa.

### 3.2 Tính Năng & Chức Năng

| Tính năng | Mô tả | Component |
|-----------|-------|-----------|
| Tìm kiếm lễ hội | Tìm kiếm bằng AI hoặc keyword | `SemanticSearchBarComponent` |
| Danh sách lễ hội | Hiển thị lễ hội phổ biến | `LargeItemFestival` |
| Xem tất cả | Điều hướng đến ViewAllFestivals | Button "Xem tất cả" |
| Hiện vật lịch sử | Hiển thị các hiện vật | `HistoricalArtifact` |

### 3.3 State Management

```typescript
interface IFestivalsScreenState {
  valueSearch: string;           // Giá trị tìm kiếm
  items: IItem[];                // Danh sách hiện vật
  festivals: IFestival[];        // Danh sách lễ hội
  FESTIVALS_POPULAR: IFestival[]; // Lễ hội phổ biến (filtered)
}
```

### 3.4 Luồng Hoạt Động

#### Luồng khởi tạo màn hình:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Mở FestivalsScreen | Gọi `componentDidMount()` |
| 2 | Gọi song song 2 API | `festivalsApi.getFestivals()` + `locationApi.getItems()` |
| 3 | Lưu dữ liệu vào state | `festivals`, `items` |
| 4 | Lọc lễ hội phổ biến | Cập nhật `FESTIVALS_POPULAR` |
| 5 | Render UI | Hiển thị danh sách lễ hội và hiện vật |

#### Luồng tìm kiếm:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Người dùng nhập từ khóa | Cập nhật `valueSearch` |
| 2a | Chế độ Semantic | Gọi `searchSemantic` với `entity_type: festival` |
| 2b | Chế độ Keyword | Lọc local theo tên lễ hội |
| 3 | Hiển thị kết quả | Cập nhật danh sách |

#### Luồng điều hướng:

```
Nhấn lễ hội → Navigate to DetailFestivalScreen
Nhấn "Xem tất cả" → Navigate to ViewAllFestivals
```

### 3.5 API Request/Response

#### Lấy danh sách lễ hội

**Request:**
```typescript
// File: src/services/festivals.api.ts
GET https://app.nocodb.com/api/v2/tables/mktzgff8mpu2c32/records
Headers: {
  'xc-token': 'NOCODB_TOKEN'
}
```

**Response:**
```json
{
  "list": [
    {
      "Id": 1,
      "name": "Lễ hội pháo hoa quốc tế Đà Nẵng",
      "types": "Lễ hội, Văn hóa",
      "description": "Lễ hội pháo hoa lớn nhất Việt Nam...",
      "event_time": "Tháng 6 hàng năm",
      "location": "Bờ sông Hàn",
      "price_level": "Miễn phí - 500.000đ",
      "rating": 4.8,
      "reviews": 1250,
      "images": "[\"url1\", \"url2\"]"
    }
  ]
}
```

---

## 4. NewFeedScreen - Màn Hình Bảng Tin

### 4.1 Tổng Quan

**File**: `src/container/screens/NewFeed/NewFeedScreen.tsx`

Màn hình mạng xã hội cho phép người dùng xem và đăng đánh giá về các địa điểm du lịch.

### 4.2 Tính Năng & Chức Năng

| Tính năng | Mô tả | Component |
|-----------|-------|-----------|
| Xem đánh giá | Danh sách review từ người dùng | `ReviewItem` |
| Đăng đánh giá | Thêm review mới với ảnh | `BottomSheet` |
| Chọn địa điểm | Modal chọn địa điểm để review | `Modal` |
| Upload ảnh | Chọn và upload nhiều ảnh | `ImagePicker` |
| Lọc theo địa điểm | Xem review của địa điểm cụ thể | `FilterDropdown` |
| Đánh giá sao | Chọn số sao (1-5) | `StarRating` |

### 4.3 State Management

```typescript
interface INewFeedScreenState {
  reviews: IReview[];              // Danh sách đánh giá
  avt: string;                     // Avatar người dùng
  star: number;                    // Số sao đánh giá (1-5)
  content: string;                 // Nội dung đánh giá
  location: ILocation | null;      // Địa điểm được chọn
  selectedImages: Asset[];         // Ảnh đã chọn
  uploading: boolean;              // Trạng thái upload
  locationSearchQuery: string;     // Tìm kiếm địa điểm
  filterLocationId: number | null; // Lọc theo địa điểm
  showLocationModal: boolean;      // Hiển thị modal chọn địa điểm
  showAddReviewSheet: boolean;     // Hiển thị bottom sheet
}
```

### 4.4 Luồng Hoạt Động

#### Luồng khởi tạo màn hình:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Mở NewFeedScreen | Gọi `componentDidMount()` |
| 2 | Lấy thông tin user | Đọc từ LocalStorage |
| 3 | Gọi API lấy reviews | `locationApi.getReviews()` |
| 4 | Render UI | Hiển thị danh sách review |

#### Luồng đăng đánh giá mới:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Nhấn nút "Thêm đánh giá" | Mở BottomSheet |
| 2 | Chọn địa điểm | Mở Modal danh sách địa điểm |
| 3 | Nhập nội dung đánh giá | Cập nhật `content` |
| 4 | Chọn số sao (1-5) | Cập nhật `star` |
| 5 | Chọn ảnh (tùy chọn) | Mở Image Picker, cập nhật `selectedImages` |
| 6 | Nhấn "Đăng" | Kiểm tra có ảnh hay không |
| 7a | Nếu có ảnh | Upload ảnh → `locationApi.uploadImage()` |
| 7b | Nếu không có ảnh | Bỏ qua bước upload |
| 8 | Tạo review | `locationApi.createReview()` |
| 9 | Refresh danh sách | Gọi lại API, đóng BottomSheet |

#### Luồng lọc theo địa điểm:

```
Chọn bộ lọc địa điểm → Cập nhật filterLocationId → Lọc reviews → Hiển thị reviews đã lọc
```

### 4.5 Luồng Dữ Liệu Chi Tiết

#### 4.5.1 Đăng đánh giá mới

```
User Action: Nhấn nút "Đăng" sau khi điền thông tin
    ↓
Component: NewFeedScreen.handleSubmitReview()
    ↓
Step 1: Upload ảnh (nếu có)
    API Call: locationApi.uploadImage(formData)
    Backend: POST /api/v2/storage/upload
    Response: { path: "uploaded_image_url" }
    ↓
Step 2: Tạo review
    API Call: locationApi.createReview(reviewData)
    Backend: POST /api/v2/tables/{reviews_table}/records
    ↓
Response: { Id: 123, ... }
    ↓
UI Update: Thêm review mới vào đầu danh sách, đóng BottomSheet
```

### 4.6 API Request/Response

#### Tạo đánh giá mới

**Request:**
```typescript
// File: src/services/locations.api.ts
POST https://app.nocodb.com/api/v2/tables/{reviews_table}/records
Headers: {
  'xc-token': 'NOCODB_TOKEN',
  'Content-Type': 'application/json'
}
Body: {
  "content": "Địa điểm rất đẹp, view tuyệt vời!",
  "star": 5,
  "locationId": 1,
  "userId": 123,
  "userName": "NguyenVanA",
  "userAvatar": "https://example.com/avatar.jpg",
  "images": "[\"url1\", \"url2\"]",
  "createdAt": "2025-12-02T10:00:00Z"
}
```

**Response:**
```json
{
  "Id": 456,
  "content": "Địa điểm rất đẹp, view tuyệt vời!",
  "star": 5,
  "locationId": 1,
  "userId": 123,
  "userName": "NguyenVanA",
  "userAvatar": "https://example.com/avatar.jpg",
  "images": "[\"url1\", \"url2\"]",
  "createdAt": "2025-12-02T10:00:00Z"
}
```

### 4.7 Xử Lý Lỗi

| Lỗi | Nguyên nhân | Xử lý |
|-----|-------------|-------|
| Upload ảnh thất bại | File quá lớn hoặc mạng lỗi | Toast lỗi, cho phép thử lại |
| Chưa chọn địa điểm | Validation | Hiển thị thông báo yêu cầu chọn |
| Nội dung trống | Validation | Disable nút Đăng |

---

## 5. MapScreenV2 - Màn Hình Bản Đồ

### 5.1 Tổng Quan

**File**: `src/container/screens/Maps/MapScreenV2.tsx`

Màn hình bản đồ tương tác với tính năng điều hướng turn-by-turn, hiển thị địa điểm và hỗ trợ offline.

### 5.2 Tính Năng & Chức Năng

| Tính năng | Mô tả | Component |
|-----------|-------|-----------|
| Bản đồ Mapbox | Hiển thị bản đồ với nhiều style | `MapboxGL.MapView` |
| Điều hướng | Chỉ đường turn-by-turn | `mapboxApi.getDirections` |
| Marker địa điểm | Hiển thị vị trí các địa điểm | `MapboxGL.PointAnnotation` |
| Vị trí hiện tại | Marker xanh cho GPS | `MapboxGL.PointAnnotation` |
| Chuyển đổi style | Satellite, Outdoors, Dark, Terrain | `StyleSelector` |
| Lớp giao thông | Hiển thị tình trạng giao thông | `TrafficLayer` |
| Text-to-Speech | Đọc mô tả địa điểm | `TTS` |
| Chế độ offline | Hoạt động khi mất mạng | `OfflineManager` |

### 5.3 State Management

```typescript
interface IMapScreenV2State {
  currentLat: number;              // Vĩ độ hiện tại
  currentLong: number;             // Kinh độ hiện tại
  routeCoordinates: number[][];    // Tọa độ tuyến đường
  routes: any[];                   // Các tuyến đường thay thế
  selectedRouteIndex: number;      // Tuyến đường được chọn
  routeDistance: number;           // Khoảng cách (km)
  routeDuration: number;           // Thời gian (phút)
  routeSteps: IRouteStep[];        // Các bước điều hướng
  selectedLocation: ILocation | null; // Địa điểm được chọn
  currentMapStyle: string;         // Style bản đồ hiện tại
  showTraffic: boolean;            // Hiển thị giao thông
  isOffline: boolean;              // Chế độ offline
  locations: ILocation[];          // Danh sách địa điểm
  zoomLevel: number;               // Mức zoom
}
```

### 5.4 Luồng Hoạt Động

#### Luồng khởi tạo màn hình:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Mở MapScreenV2 | Gọi `componentDidMount()` |
| 2 | Yêu cầu quyền vị trí | Hiển thị dialog xin quyền |
| 3 | Lấy vị trí GPS hiện tại | Cập nhật `currentLat`, `currentLong` |
| 4 | Gọi API lấy địa điểm | `locationApi.getLocations()` |
| 5 | Render bản đồ | Hiển thị markers cho từng địa điểm |

#### Luồng chỉ đường:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Nhấn marker địa điểm | Hiển thị thông tin địa điểm |
| 2 | Nhấn "Chỉ đường" | Gọi `mapboxApi.getDirections()` |
| 3 | Nhận response | Decode polyline geometry |
| 4 | Vẽ tuyến đường | Hiển thị đường trên bản đồ |
| 5 | Hiển thị thông tin | Khoảng cách (km), Thời gian (phút) |

#### Các chức năng khác:

```
Nhấn nút TTS → Đọc mô tả địa điểm bằng giọng nói
Chọn style bản đồ → Thay đổi MapStyle (Satellite/Outdoors/Dark/Terrain)
Bật Traffic Layer → Hiển thị lớp giao thông thời gian thực
```

### 5.5 Luồng Dữ Liệu Chi Tiết

#### 5.5.1 Lấy chỉ đường

```
User Action: Nhấn "Chỉ đường" đến địa điểm
    ↓
Component: MapScreenV2.getDirections()
    ↓
API Call: mapboxApi.getDirections(origin, destination)
    ↓
Backend: GET https://api.mapbox.com/directions/v5/mapbox/driving/{coordinates}
    ↓
Response: { routes: [...], waypoints: [...] }
    ↓
Processing: Decode polyline, tính khoảng cách, thời gian
    ↓
UI Update: Vẽ đường trên bản đồ, hiển thị thông tin
```

### 5.6 API Request/Response

#### Lấy chỉ đường Mapbox

**Request:**
```typescript
// File: src/services/mapbox.api.ts
GET https://api.mapbox.com/directions/v5/mapbox/driving/{lng1},{lat1};{lng2},{lat2}
Params: {
  access_token: 'MAPBOX_ACCESS_TOKEN',
  geometries: 'geojson',
  overview: 'full',
  steps: true,
  alternatives: true,
  language: 'vi'
}
```

**Response:**
```json
{
  "routes": [
    {
      "geometry": {
        "coordinates": [[108.2278, 16.0614], [108.2300, 16.0620], ...],
        "type": "LineString"
      },
      "legs": [
        {
          "steps": [
            {
              "maneuver": {
                "instruction": "Đi thẳng trên đường Bạch Đằng",
                "type": "depart"
              },
              "distance": 500,
              "duration": 60
            }
          ],
          "distance": 5000,
          "duration": 600
        }
      ],
      "distance": 5000,
      "duration": 600
    }
  ],
  "waypoints": [
    {"location": [108.2278, 16.0614], "name": "Điểm xuất phát"},
    {"location": [108.2500, 16.0800], "name": "Cầu Rồng"}
  ]
}
```

### 5.7 Map Styles

| Style | URL | Mô tả |
|-------|-----|-------|
| Satellite | `mapbox://styles/mapbox/satellite-streets-v12` | Ảnh vệ tinh với đường phố |
| Outdoors | `mapbox://styles/mapbox/outdoors-v12` | Bản đồ ngoài trời |
| Dark | `mapbox://styles/mapbox/dark-v11` | Chế độ tối |
| Terrain | `mapbox://styles/mapbox/terrain-v2` | Địa hình 3D |

### 5.8 Xử Lý Lỗi

| Lỗi | Nguyên nhân | Xử lý |
|-----|-------------|-------|
| Không có GPS | Quyền bị từ chối | Hiển thị vị trí mặc định (Đà Nẵng) |
| Mapbox API lỗi | Rate limit hoặc token hết hạn | Toast lỗi, fallback offline |
| Không tìm được đường | Địa điểm không thể đến được | Thông báo cho người dùng |

---

## 6. CameraScreen - Màn Hình Camera

### 6.1 Tổng Quan

**File**: `src/container/screens/Camera/CameraScreen.tsx`

Màn hình camera cho phép chụp ảnh hoặc chọn ảnh từ thư viện để nhận diện địa điểm bằng AI.

### 6.2 Tính Năng & Chức Năng

| Tính năng | Mô tả | Component |
|-----------|-------|-----------|
| Chụp ảnh | Chụp ảnh bằng camera | `react-native-vision-camera` |
| Chọn ảnh | Chọn từ thư viện | `launchImageLibrary` |
| Flash | Bật/tắt đèn flash | `Lightning` toggle |
| Preview | Xem trước ảnh trước khi gửi | `Modal` |
| Nhận diện AI | Gửi ảnh lên server để nhận diện | `uploadImage` |
| Kết quả | Hiển thị tên và mô tả địa điểm | `CameraResultModal` |
| Test kết nối | Kiểm tra kết nối backend | `testBackendConnection` |

### 6.3 State Management

```typescript
interface ICameraScreenState {
  hasPermission: boolean;        // Quyền camera
  devices: any;                  // Danh sách camera
  device: any;                   // Camera đang dùng
  isActive: boolean;             // Camera đang hoạt động
  isLoading: boolean;            // Đang chụp ảnh
  isShowLightning: boolean;      // Trạng thái flash
  visible: boolean;              // Hiển thị modal kết quả
  resultName: string;            // Tên địa điểm nhận diện
  resultDescription: string;     // Mô tả địa điểm
  resultPhotoPath: string;       // Đường dẫn ảnh
  showPreviewModal: boolean;     // Hiển thị preview
  previewImagePath: string;      // Ảnh preview
  isDetecting: boolean;          // Đang nhận diện
}
```

### 6.4 Luồng Hoạt Động

#### Luồng khởi tạo màn hình:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Mở CameraScreen | Gọi `componentDidMount()` |
| 2 | Yêu cầu quyền Camera & Microphone | Hiển thị dialog xin quyền |
| 3a | Nếu được cấp quyền | Khởi tạo camera → Test kết nối backend → Hiển thị preview |
| 3b | Nếu không được cấp | Hiển thị màn hình trống |

#### Luồng chụp ảnh và nhận diện:

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1a | Nhấn nút chụp | Gọi `capturePhoto()` → Lưu ảnh tạm thời |
| 1b | Nhấn nút thư viện | Mở Image Picker → Chọn ảnh |
| 2 | Hiển thị Preview Modal | Xem trước ảnh đã chọn/chụp |
| 3 | Nhấn "Gửi" | Upload ảnh đến `/detect` endpoint |
| 4a | Nhận diện thành công | Hiển thị CameraResultModal với tên và mô tả |
| 4b | Nhận diện thất bại | Hiển thị Toast lỗi |

#### Chức năng Flash:

```
Nhấn nút Flash → Toggle isShowLightning (on/off)
```

### 6.5 Luồng Dữ Liệu Chi Tiết

#### 6.5.1 Nhận diện địa điểm

```
User Action: Chụp ảnh và nhấn Gửi
    ↓
Component: CameraScreen.uploadImage(filePath)
    ↓
API Call: POST {SERVER_URL}/detect
    Headers: { 'Content-Type': 'multipart/form-data' }
    Body: FormData với image_file
    ↓
Backend: FastAPI xử lý ảnh với AI model
    ↓
Response: { name: "Cầu Rồng", description: "Cầu biểu tượng..." }
    ↓
UI Update: Hiển thị CameraResultModal với kết quả
```

### 6.6 API Request/Response

#### Nhận diện ảnh

**Request:**
```typescript
// File: src/container/screens/Camera/CameraScreen.tsx
POST {SERVER_URL}/detect
Headers: {
  'Content-Type': 'multipart/form-data'
}
Body: FormData {
  image_file: File (JPEG/PNG)
}
```

**Response:**
```json
{
  "name": "Cầu Rồng",
  "description": "Cầu Rồng là một cây cầu bắc qua sông Hàn tại thành phố Đà Nẵng, Việt Nam. Cầu được thiết kế với hình dáng một con rồng khổng lồ, dài 666m và rộng 37.5m. Đây là biểu tượng du lịch nổi tiếng của thành phố."
}
```

### 6.7 Xử Lý Lỗi

| Lỗi | Nguyên nhân | Xử lý |
|-----|-------------|-------|
| Không có quyền camera | Người dùng từ chối | Hiển thị màn hình trống |
| Chụp ảnh thất bại | Lỗi camera | Toast "Không thể chụp ảnh" |
| Upload thất bại | Mạng lỗi | Toast "Không thể kết nối đến server" |
| Nhận diện thất bại | AI không nhận ra | Hiển thị "Không xác định" |

---

## 7. ProfileScreen - Màn Hình Cá Nhân

### 7.1 Tổng Quan

**File**: `src/container/screens/Profile/ProfileScreen.tsx`

Màn hình quản lý tài khoản cá nhân với các tính năng truy cập nhanh đến các chức năng của ứng dụng.

### 7.2 Tính Năng & Chức Năng

| Tính năng | Mô tả | Navigation |
|-----------|-------|------------|
| Trợ lý AI | Mở chatbot AI | `ScreenName.CHATBOT` |
| Gọi hỗ trợ SOS | Gọi điện khẩn cấp | `Linking.openURL('tel:...')` |
| Thông tin tài khoản | Xem/sửa thông tin cá nhân | `ScreenName.PERSONAL` |
| Donation | Ủng hộ ứng dụng | `ScreenName.DONATION` |
| Cài đặt | Cài đặt ứng dụng | `ScreenName.SETTINGS` |
| FAQ | Câu hỏi thường gặp | `ScreenName.FAQ` |
| Chính sách | Chính sách bảo mật | `ScreenName.POLICY` |
| Thông tin ứng dụng | Về ứng dụng | `ScreenName.ABOUT` |
| Đăng xuất | Thoát tài khoản | `ScreenName.LOGIN_SCREEN` |

### 7.3 State Management

```typescript
interface IProfileScreenState {
  account?: IAccount | null;  // Thông tin tài khoản
}
```

### 7.4 Luồng Hoạt Động

#### Luồng khởi tạo màn hình:

```
Mở ProfileScreen → componentDidMount() → handleGetUser() → Đọc LocalStorage → Hiển thị avatar và tên
```

#### Bảng điều hướng các chức năng:

| Nút bấm | Hành động | Đích đến |
|---------|-----------|----------|
| Trợ lý AI | Navigate | `ScreenName.CHATBOT` |
| Gọi hỗ trợ SOS | `Linking.openURL` | `tel:0528777528` |
| Thông tin tài khoản | Navigate | `ScreenName.PERSONAL` |
| Donation | Navigate | `ScreenName.DONATION` |
| Cài đặt | Navigate | `ScreenName.SETTINGS` |
| FAQ | Navigate | `ScreenName.FAQ` |
| Chính sách | Navigate | `ScreenName.POLICY` |
| Thông tin ứng dụng | Navigate | `ScreenName.ABOUT` |
| Đăng xuất | `NavigationService.reset` | `ScreenName.LOGIN_SCREEN` |

### 7.5 Luồng Dữ Liệu Chi Tiết

#### 7.5.1 Lấy thông tin người dùng

```
User Action: Mở ProfileScreen
    ↓
Component: ProfileScreen.handleGetUser()
    ↓
LocalStorage: LocalStorageCommon.getItem(localStorageKey.AVT)
    ↓
Response: IAccount { Id, userName, fullName, email, avatar, ... }
    ↓
UI Update: Hiển thị Avatar và tên người dùng
```

### 7.6 Xử Lý Lỗi

| Lỗi | Nguyên nhân | Xử lý |
|-----|-------------|-------|
| Không có thông tin user | LocalStorage trống | Hiển thị avatar mặc định |
| Gọi điện thất bại | Thiết bị không hỗ trợ | Log lỗi |

---

## 8. Luồng Xác Thực

### 8.1 Tổng Quan

Hệ thống xác thực bao gồm 3 màn hình chính:
- **LoginScreen**: Đăng nhập
- **SignUpScreen**: Đăng ký
- **ForgotPasswordScreen**: Quên mật khẩu (3 bước)

### 8.2 Luồng Đăng Nhập

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Mở LoginScreen | Hiển thị form đăng nhập |
| 2 | Nhập userName và password | Cập nhật state |
| 3 | Nhấn "Đăng nhập" | Gọi `authApi.login()` |
| 4 | Lấy danh sách accounts | Query từ NocoDB |
| 5 | Tìm account theo userName | So sánh trong danh sách |
| 6a | Không tìm thấy | Toast: "Tài khoản không tồn tại" |
| 6b | Tìm thấy → So sánh password | `comparePassword()` với bcrypt |
| 7a | Mật khẩu sai | Toast: "Mật khẩu không chính xác" |
| 7b | Mật khẩu đúng | Lưu vào LocalStorage → Navigate to HOME_STACK_SCREEN |

### 8.3 Luồng Đăng Ký

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Mở SignUpScreen | Hiển thị form đăng ký |
| 2 | Nhập thông tin | userName, password, email, fullName |
| 3 | Validate thông tin | Kiểm tra format email, độ dài password |
| 4a | Không hợp lệ | Disable nút "Đăng ký" |
| 4b | Hợp lệ → Nhấn "Đăng ký" | Gọi `authApi.signUp()` |
| 5 | Kiểm tra trùng lặp | userName/email đã tồn tại? |
| 6a | Đã tồn tại | Toast: "Tài khoản/Email đã tồn tại" |
| 6b | Chưa tồn tại | Hash password với bcrypt |
| 7 | Tạo account mới | Insert vào NocoDB |
| 8 | Hoàn thành | Toast: "Đăng ký thành công" → Navigate to LOGIN_SCREEN |

### 8.4 Luồng Quên Mật Khẩu

#### Step 1: Xác minh email

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Nhập email | Cập nhật state |
| 2 | Nhấn "Tiếp tục" | Gọi `authApi.checkEmailExists()` |
| 3a | Email không tồn tại | Toast: "Email không tồn tại" |
| 3b | Email tồn tại | Gửi OTP qua SendGrid → Chuyển Step 2 |

#### Step 2: Xác minh OTP

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Nhập mã OTP (6 số) | Cập nhật state |
| 2 | Nhấn "Xác nhận" | Gọi `authApi.verifyOTP()` |
| 3a | OTP sai hoặc hết hạn | Toast: "OTP không hợp lệ hoặc hết hạn" |
| 3b | OTP đúng | Chuyển Step 3 |

#### Step 3: Đặt mật khẩu mới

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| 1 | Nhập mật khẩu mới | Cập nhật state |
| 2 | Nhấn "Đặt lại mật khẩu" | Hash password mới với bcrypt |
| 3 | Cập nhật trong NocoDB | Update record |
| 4 | Hoàn thành | Toast: "Đặt lại mật khẩu thành công" → Navigate to LOGIN_SCREEN |

### 8.5 API Request/Response

#### Đăng nhập

**Request:**
```typescript
// File: src/services/auth.api.ts
// Lấy danh sách accounts
GET https://app.nocodb.com/api/v2/tables/{accounts_table}/records
Headers: {
  'xc-token': 'NOCODB_TOKEN'
}
```

**Response:**
```json
{
  "list": [
    {
      "Id": 1,
      "userName": "nguyenvana",
      "password": "$2a$10$...", // bcrypt hash
      "fullName": "Nguyễn Văn A",
      "email": "nguyenvana@email.com",
      "avatar": "https://example.com/avatar.jpg",
      "balance": 0
    }
  ]
}
```

#### Gửi OTP qua Email

**Request:**
```typescript
// File: src/services/auth.api.ts
// Sử dụng SendGrid API
POST https://api.sendgrid.com/v3/mail/send
Headers: {
  'Authorization': 'Bearer SENDGRID_API_KEY',
  'Content-Type': 'application/json'
}
Body: {
  "personalizations": [{"to": [{"email": "user@email.com"}]}],
  "from": {"email": "noreply@travelapp.com"},
  "subject": "Mã xác thực đặt lại mật khẩu",
  "content": [{"type": "text/html", "value": "Mã OTP của bạn là: 123456"}]
}
```

### 8.6 Bảo Mật

| Tính năng | Mô tả |
|-----------|-------|
| Password Hashing | Sử dụng bcrypt với salt rounds = 10 |
| OTP Expiry | OTP hết hạn sau 5 phút |
| Rate Limiting | Tối đa 3 lần gửi OTP trong 10 phút |
| Secure Storage | Lưu thông tin đăng nhập trong AsyncStorage |

---

## 9. API Services

### 9.1 Tổng Quan Các Service

| Service | File | Mục đích |
|---------|------|----------|
| `locationApi` | `src/services/locations.api.ts` | CRUD địa điểm, reviews, items |
| `festivalsApi` | `src/services/festivals.api.ts` | CRUD lễ hội |
| `authApi` | `src/services/auth.api.ts` | Xác thực, đăng ký, quên mật khẩu |
| `mapboxApi` | `src/services/mapbox.api.ts` | Chỉ đường Mapbox |
| `semanticApi` | `src/services/semantic.api.ts` | Tìm kiếm ngữ nghĩa AI |
| `chatbotApi` | `src/services/chatbot.api.ts` | Trợ lý AI ChatGPT |

### 9.2 Cấu Hình Axios

```typescript
// File: src/services/axios.ts
import axios from 'axios';
import {env} from '../utils/env';

const request = axios.create({
  baseURL: env.NOCODB_URL,
  headers: {
    'xc-token': env.NOCODB_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export default request;
```

### 9.3 Semantic Search API

```typescript
// File: src/services/semantic.api.ts

// Tìm kiếm ngữ nghĩa
export const searchSemantic = async (request: SemanticSearchRequest): Promise<SemanticSearchResponse> => {
  const response = await apiClient.post('/api/v1/search/semantic', request);
  return response.data;
};

// Lấy gợi ý cá nhân hóa
export const getRecommendations = async (userId: number, limit?: number): Promise<RecommendationsResponse> => {
  const response = await apiClient.get(`/api/v1/recommendations/${userId}`, {
    params: { limit }
  });
  return response.data;
};

// Lấy items tương tự
export const getSimilarItems = async (entityType: EntityType, entityId: number, limit?: number): Promise<SimilarItemsResponse> => {
  const response = await apiClient.get(`/api/v1/similar/${entityType}/${entityId}`, {
    params: { limit }
  });
  return response.data;
};

// Chat với RAG
export const chatWithRAG = async (request: RAGChatRequest): Promise<RAGChatResponse> => {
  const response = await apiClient.post('/api/v1/chat/rag', request);
  return response.data;
};
```

### 9.4 Chatbot API

```typescript
// File: src/services/chatbot.api.ts

// Gửi tin nhắn đến ChatGPT
export const sendChatMessage = async (
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ChatResponse> => {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      timeout: 30000,
    }
  );
  return { message: response.data.choices[0].message.content };
};

// Tìm kiếm ảnh qua SerpAPI
export const searchImage = async (query: string, count: number = 3): Promise<ImageGenerationResponse> => {
  const response = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_images',
      q: query,
      api_key: SERPAPI_KEY,
      num: count,
    },
    timeout: 10000,
  });
  return { imageUrls: response.data.images_results.map(img => img.original) };
};
```

---

## Phụ Lục

### A. Interfaces Chính

```typescript
// File: src/common/types.ts

export interface ILocation {
  Id?: number;
  name: string;
  avatar: string;
  address: string;
  description: string;
  lat: number;
  long: number;
  types: string;
  reviews: number;
  voiceName?: string;
  images?: string;
  videos?: string;
}

export interface IFestival {
  Id?: number;
  name: string;
  types: string;
  description: string;
  event_time: string;
  location: string;
  price_level: string;
  rating: number;
  reviews: number;
  images?: string;
}

export interface IAccount {
  Id?: number;
  userName: string;
  password: string;
  fullName: string;
  email: string;
  avatar?: string;
  balance?: number;
}

export interface IReview {
  Id?: number;
  content: string;
  star: number;
  locationId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  images?: string;
  createdAt: string;
}
```

### B. Constants

```typescript
// File: src/common/constants.ts

export const localStorageKey = {
  USERNAME: 'USERNAME',
  PASSWORD: 'PASSWORD',
  AVT: 'AVT',
  CHAT_HISTORY: 'CHAT_HISTORY',
  LANGUAGE: 'LANGUAGE',
};
```

### C. Haversine Distance Formula

```typescript
// File: src/container/screens/Home/HomeScreen.tsx

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Khoảng cách (km)
};
```

