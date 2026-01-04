# 📋 Kế Hoạch Implement User Preferences Collection

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Phân Tích Điểm Thu Thập Dữ Liệu](#2-phân-tích-điểm-thu-thập-dữ-liệu)
3. [Thiết Kế Chiến Lược Thu Thập](#3-thiết-kế-chiến-lược-thu-thập)
4. [Danh Sách Files Cần Chỉnh Sửa](#4-danh-sách-files-cần-chỉnh-sửa)
5. [Ưu Tiên Triển Khai](#5-ưu-tiên-triển-khai)
6. [Xử Lý Edge Cases](#6-xử-lý-edge-cases)
7. [Testing Strategy](#7-testing-strategy)

---

## 1. Tổng Quan

### 1.1 Vấn Đề Hiện Tại
- Hàm `storeMemory()` đã được định nghĩa trong `semantic.api.ts` nhưng **KHÔNG ĐƯỢC GỌI** ở bất kỳ đâu trong app
- Bảng `UserMemory` trên NocoDB **TRỐNG** → Không có dữ liệu sở thích người dùng
- Hệ thống recommendation luôn **fallback về generic search** → Tất cả users nhận cùng kết quả

### 1.2 Mục Tiêu
- Thu thập user preferences từ các tương tác trong app
- Lưu trữ vào NocoDB UserMemory table
- Cải thiện chất lượng recommendations cá nhân hóa

### 1.3 Memory Types Có Sẵn
```typescript
export type MemoryType = 'preference' | 'interest' | 'visited' | 'dislike' | 'context';
```

### 1.4 API Interface
```typescript
export interface StoreMemoryRequest {
  user_id: number;
  memory_type: MemoryType;
  content: string;
  confidence?: number;  // 0.0 - 1.0
  metadata?: Record<string, any>;
}
```

---

## 2. Phân Tích Điểm Thu Thập Dữ Liệu

### 2.1 Sơ Đồ User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  HomeScreen  │───►│ ViewAllLoc   │───►│ DetailLoc    │                   │
│  │  (Search)    │    │ (Browse)     │    │ (View)       │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│        │                    │                    │                           │
│        ▼                    ▼                    ▼                           │
│   🔍 INTEREST          🔍 INTEREST          📍 VISITED                      │
│   (search query)       (click item)         (view detail)                   │
│                                                  │                           │
│                                                  ▼                           │
│                                            ┌──────────────┐                  │
│                                            │  MapScreen   │                  │
│                                            │  (Navigate)  │                  │
│                                            └──────────────┘                  │
│                                                  │                           │
│                                                  ▼                           │
│                                            📍 VISITED                        │
│                                            (get directions)                  │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐                                       │
│  │ NewFeedScreen│───►│ Submit Review│                                       │
│  │ (Reviews)    │    │ (Rate)       │                                       │
│  └──────────────┘    └──────────────┘                                       │
│                             │                                                │
│                             ▼                                                │
│                      ⭐ PREFERENCE (4-5 stars)                              │
│                      👎 DISLIKE (1-2 stars)                                 │
│                                                                              │
│  ┌──────────────┐                                                           │
│  │ ChatbotScreen│                                                           │
│  │ (AI Chat)    │                                                           │
│  └──────────────┘                                                           │
│        │                                                                     │
│        ▼                                                                     │
│   💬 CONTEXT                                                                │
│   (conversation topics)                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Chi Tiết Các Điểm Thu Thập

| # | Màn Hình | Sự Kiện | Memory Type | Tín Hiệu Sở Thích |
|---|----------|---------|-------------|-------------------|
| 1 | HomeScreen | User tìm kiếm semantic | `interest` | Query tìm kiếm cho thấy sở thích |
| 2 | HomeScreen | User submit search | `interest` | Chủ động tìm kiếm = quan tâm cao |
| 3 | DetailLocation | User xem chi tiết địa điểm | `visited` | Đã xem = có quan tâm |
| 4 | DetailLocation | User nhấn "Chỉ đường" | `visited` | Muốn đến = quan tâm rất cao |
| 5 | DetailFestival | User xem chi tiết lễ hội | `visited` | Đã xem = có quan tâm |
| 6 | NewFeedScreen | User đánh giá 4-5 sao | `preference` | Thích địa điểm này |
| 7 | NewFeedScreen | User đánh giá 1-2 sao | `dislike` | Không thích địa điểm này |
| 8 | ChatbotScreen | User hỏi về chủ đề cụ thể | `context` | Quan tâm đến chủ đề |
| 9 | RecommendationsWidget | User click vào recommendation | `interest` | Quan tâm đến loại này |
| 10 | SimilarItemsComponent | User click vào similar item | `interest` | Quan tâm đến loại tương tự |

---

## 3. Thiết Kế Chiến Lược Thu Thập

### 3.1 Chi Tiết Từng Sự Kiện

#### 📍 Event 1: Semantic Search (HomeScreen)
```typescript
// Khi user submit search
{
  user_id: userId,
  memory_type: 'interest',
  content: `User searched for: "${searchQuery}"`,
  confidence: 0.7,
  metadata: {
    event: 'semantic_search',
    query: searchQuery,
    results_count: results.length,
    timestamp: Date.now()
  }
}
```

#### 📍 Event 2: View Location Detail (DetailLocation)
```typescript
// Khi componentDidMount
{
  user_id: userId,
  memory_type: 'visited',
  content: `User viewed location: ${location.name}`,
  confidence: 0.6,
  metadata: {
    event: 'view_location',
    location_id: location.Id,
    location_name: location.name,
    location_types: location.types,
    timestamp: Date.now()
  }
}
```

#### 📍 Event 3: Get Directions (DetailLocation)
```typescript
// Khi user nhấn "Chỉ đường"
{
  user_id: userId,
  memory_type: 'visited',
  content: `User wants to visit: ${location.name}`,
  confidence: 0.9,
  metadata: {
    event: 'get_directions',
    location_id: location.Id,
    location_name: location.name,
    location_types: location.types,
    timestamp: Date.now()
  }
}
```

#### 📍 Event 4: Submit Review (NewFeedScreen)
```typescript
// Khi user submit review
{
  user_id: userId,
  memory_type: star >= 4 ? 'preference' : star <= 2 ? 'dislike' : 'context',
  content: star >= 4
    ? `User likes ${location.name} (${star} stars)`
    : star <= 2
    ? `User dislikes ${location.name} (${star} stars)`
    : `User rated ${location.name} ${star} stars`,
  confidence: star >= 4 ? 0.95 : star <= 2 ? 0.9 : 0.5,
  metadata: {
    event: 'submit_review',
    location_id: location.Id,
    location_name: location.name,
    rating: star,
    has_content: content.length > 0,
    has_images: images.length > 0,
    timestamp: Date.now()
  }
}
```

#### 📍 Event 5: View Festival Detail (DetailFestival)
```typescript
// Khi componentDidMount
{
  user_id: userId,
  memory_type: 'visited',
  content: `User viewed festival: ${festival.name}`,
  confidence: 0.6,
  metadata: {
    event: 'view_festival',
    festival_id: festival.Id,
    festival_name: festival.name,
    festival_types: festival.types,
    timestamp: Date.now()
  }
}
```

#### 📍 Event 6: Click Recommendation (RecommendationsWidget)
```typescript
// Khi user click vào item
{
  user_id: userId,
  memory_type: 'interest',
  content: `User interested in ${item.entity_type}: ${item.name}`,
  confidence: 0.75,
  metadata: {
    event: 'click_recommendation',
    entity_type: item.entity_type,
    entity_id: item.entity_id,
    entity_name: item.name,
    recommendation_reason: item.reason,
    timestamp: Date.now()
  }
}
```

### 3.2 Confidence Score Guidelines

| Confidence | Ý Nghĩa | Ví Dụ |
|------------|---------|-------|
| 0.9 - 1.0 | Rất chắc chắn | Đánh giá 5 sao, nhấn "Chỉ đường" |
| 0.7 - 0.9 | Khá chắc chắn | Đánh giá 4 sao, click recommendation |
| 0.5 - 0.7 | Trung bình | Xem chi tiết, tìm kiếm |
| 0.3 - 0.5 | Không chắc | Đánh giá 3 sao |
| 0.0 - 0.3 | Yếu | Scroll qua nhanh |

### 3.3 Memory Type Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY TYPE DECISION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Action                                                     │
│      │                                                           │
│      ├─► Đánh giá 4-5 sao ──────────────► preference            │
│      │                                                           │
│      ├─► Đánh giá 1-2 sao ──────────────► dislike               │
│      │                                                           │
│      ├─► Xem chi tiết / Chỉ đường ──────► visited               │
│      │                                                           │
│      ├─► Tìm kiếm / Click item ─────────► interest              │
│      │                                                           │
│      └─► Chat về chủ đề ────────────────► context               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Danh Sách Files Cần Chỉnh Sửa

### 4.1 Tổng Quan Files

| # | File Path | Thay Đổi | Độ Phức Tạp |
|---|-----------|----------|-------------|
| 1 | `src/services/semantic.api.ts` | Đã có `storeMemory()` - không cần sửa | ✅ Done |
| 2 | `src/container/screens/Home/HomeScreen.tsx` | Thêm tracking search | 🟡 Medium |
| 3 | `src/container/screens/Home/DetailLocation.tsx` | Thêm tracking view & directions | 🟡 Medium |
| 4 | `src/container/screens/Festival/DetailFestival.tsx` | Thêm tracking view | 🟢 Low |
| 5 | `src/container/screens/NewFeed/NewFeedScreen.tsx` | Thêm tracking review | 🟡 Medium |
| 6 | `src/component/RecommendationsWidget.tsx` | Thêm tracking click | 🟢 Low |
| 7 | `src/component/SimilarItemsComponent.tsx` | Thêm tracking click | 🟢 Low |
| 8 | `src/container/screens/Profile/ChatbotScreen.tsx` | Thêm tracking topics | 🔴 High |
| 9 | `src/utils/userPreferencesTracker.ts` | **TẠO MỚI** - Utility class | 🔴 High |

### 4.2 Chi Tiết Thay Đổi Từng File

#### 📁 File 1: `src/utils/userPreferencesTracker.ts` (TẠO MỚI)

**Mục đích**: Centralized utility để quản lý việc thu thập preferences

```typescript
// Cấu trúc đề xuất
import { storeMemory, MemoryType, StoreMemoryRequest } from '../services/semantic.api';
import LocalStorageCommon from './LocalStorageCommon';
import { localStorageKey } from '../common/constants';

class UserPreferencesTracker {
  private userId: number | null = null;
  private recentMemories: Map<string, number> = new Map(); // Để tránh spam

  // Khởi tạo với userId
  async initialize(): Promise<void>;

  // Lưu memory với debounce
  async trackPreference(request: Omit<StoreMemoryRequest, 'user_id'>): Promise<void>;

  // Các helper methods
  trackSearch(query: string, resultsCount: number): Promise<void>;
  trackViewLocation(location: ILocation): Promise<void>;
  trackGetDirections(location: ILocation): Promise<void>;
  trackViewFestival(festival: IFestival): Promise<void>;
  trackReview(location: ILocation, rating: number, hasContent: boolean): Promise<void>;
  trackClickRecommendation(item: Recommendation): Promise<void>;
  trackChatTopic(topic: string): Promise<void>;

  // Anti-spam: Kiểm tra xem đã track gần đây chưa
  private shouldTrack(key: string, cooldownMs: number): boolean;
}

export const userPreferencesTracker = new UserPreferencesTracker();
```

#### 📁 File 2: `src/container/screens/Home/HomeScreen.tsx`

**Thay đổi cần thiết**:
```typescript
// Import thêm
import { userPreferencesTracker } from '../../../utils/userPreferencesTracker';

// Trong handleSearchSubmit hoặc handleSearchWithFlag
handleSearchSubmit = async (filteredData: ILocation[], searchValue: string, isSemanticSearch: boolean) => {
  // Track search preference
  if (searchValue.trim().length > 2 && this.state.account?.Id) {
    await userPreferencesTracker.trackSearch(searchValue, filteredData.length);
  }

  // ... existing navigation code
};
```

#### 📁 File 3: `src/container/screens/Home/DetailLocation.tsx`

**Thay đổi cần thiết**:
```typescript
// Import thêm
import { userPreferencesTracker } from '../../../utils/userPreferencesTracker';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import { localStorageKey } from '../../../common/constants';

// Trong componentDidMount
async componentDidMount() {
  // ... existing code

  // Track view location
  const account = await LocalStorageCommon.getItem(localStorageKey.AVT);
  if (account?.Id) {
    await userPreferencesTracker.trackViewLocation(location);
  }
}

// Trong onPress của button "Chỉ đường"
onPress={async () => {
  // Track get directions (high intent)
  const account = await LocalStorageCommon.getItem(localStorageKey.AVT);
  if (account?.Id) {
    await userPreferencesTracker.trackGetDirections(location);
  }

  NavigationService.navigate(ScreenName.MAP_SCREEN, {
    locations: [location],
    showRoute: true,
  });
}}
```

#### 📁 File 4: `src/container/screens/Festival/DetailFestival.tsx`

**Thay đổi cần thiết**:
```typescript
// Import thêm
import { userPreferencesTracker } from '../../../utils/userPreferencesTracker';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import { localStorageKey } from '../../../common/constants';

// Trong componentDidMount
async componentDidMount() {
  // ... existing code

  // Track view festival
  const account = await LocalStorageCommon.getItem(localStorageKey.AVT);
  if (account?.Id) {
    await userPreferencesTracker.trackViewFestival(festival);
  }
}
```

#### 📁 File 5: `src/container/screens/NewFeed/NewFeedScreen.tsx`

**Thay đổi cần thiết**:
```typescript
// Import thêm
import { userPreferencesTracker } from '../../../utils/userPreferencesTracker';

// Trong handleSubmitReview, sau khi save thành công
handleSubmitReview = async () => {
  try {
    // ... existing upload & save code

    // Track review preference
    if (this.state.avt?.Id && this.state.location) {
      await userPreferencesTracker.trackReview(
        this.state.location,
        this.state.star,
        this.state.content.length > 0
      );
    }

    // ... existing success handling
  } catch (error) {
    // ... existing error handling
  }
};
```

#### 📁 File 6: `src/component/RecommendationsWidget.tsx`

**Thay đổi cần thiết**:
```typescript
// Import thêm
import { userPreferencesTracker } from '../utils/userPreferencesTracker';

// Trong handleItemPress
const handleItemPress = async (item: EnrichedRecommendation) => {
  if (!item.fullData) return;

  // Track click on recommendation
  await userPreferencesTracker.trackClickRecommendation(item);

  // ... existing navigation code
};
```

#### 📁 File 7: `src/component/SimilarItemsComponent.tsx`

**Thay đổi cần thiết**: Tương tự RecommendationsWidget

---

## 5. Ưu Tiên Triển Khai

### 5.1 Roadmap Theo Phase

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION PHASES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: Foundation (Tuần 1)                                   │
│  ├── ✅ Sửa .env (NOCODB_USER_MEMORY_TABLE_ID)                  │
│  ├── 🔨 Tạo userPreferencesTracker.ts                           │
│  └── 🔨 Test kết nối NocoDB                                     │
│                                                                  │
│  PHASE 2: High-Impact Events (Tuần 2)                           │
│  ├── 🔨 DetailLocation.tsx (view + directions)                  │
│  ├── 🔨 NewFeedScreen.tsx (reviews)                             │
│  └── 🔨 RecommendationsWidget.tsx (clicks)                      │
│                                                                  │
│  PHASE 3: Medium-Impact Events (Tuần 3)                         │
│  ├── 🔨 HomeScreen.tsx (search)                                 │
│  ├── 🔨 DetailFestival.tsx (view)                               │
│  └── 🔨 SimilarItemsComponent.tsx (clicks)                      │
│                                                                  │
│  PHASE 4: Advanced Features (Tuần 4)                            │
│  ├── 🔨 ChatbotScreen.tsx (topic extraction)                    │
│  └── 🔨 Fine-tune confidence scores                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Chi Tiết Ưu Tiên

| Priority | Event | Impact | Effort | Lý Do |
|----------|-------|--------|--------|-------|
| 🔴 P0 | Sửa .env | Critical | 1 min | Không có này thì không gì hoạt động |
| 🔴 P1 | userPreferencesTracker.ts | Critical | 2-3h | Foundation cho tất cả tracking |
| 🟠 P2 | Review tracking | High | 1h | Tín hiệu mạnh nhất (explicit feedback) |
| 🟠 P2 | Get Directions | High | 30m | Tín hiệu intent rất cao |
| 🟡 P3 | View Location | Medium | 30m | Tín hiệu implicit phổ biến |
| 🟡 P3 | Click Recommendation | Medium | 30m | Feedback loop cho recommendations |
| 🟢 P4 | Search tracking | Low | 30m | Tín hiệu yếu hơn |
| 🟢 P4 | View Festival | Low | 30m | Ít user interaction |
| 🔵 P5 | Chat topic extraction | Low | 2-3h | Phức tạp, cần NLP |

---

## 6. Xử Lý Edge Cases

### 6.1 User Chưa Đăng Nhập

```typescript
// Trong userPreferencesTracker.ts
async trackPreference(request: Omit<StoreMemoryRequest, 'user_id'>): Promise<void> {
  // Kiểm tra user đã đăng nhập chưa
  if (!this.userId) {
    await this.initialize();
  }

  // Nếu vẫn không có userId, bỏ qua tracking
  if (!this.userId) {
    console.log('⚠️ [Preferences] User not logged in, skipping tracking');
    return;
  }

  // ... continue with tracking
}
```

### 6.2 API Call Thất Bại

```typescript
async trackPreference(request: Omit<StoreMemoryRequest, 'user_id'>): Promise<void> {
  try {
    const result = await storeMemory({
      ...request,
      user_id: this.userId!,
    });

    if (!result.success) {
      console.warn('⚠️ [Preferences] Failed to store:', result.error);
      // Optionally: Queue for retry later
      await this.queueForRetry(request);
    }
  } catch (error) {
    console.error('❌ [Preferences] Error storing preference:', error);
    // Silent fail - không ảnh hưởng UX
  }
}
```

### 6.3 Tránh Spam Memory Records

```typescript
class UserPreferencesTracker {
  private recentMemories: Map<string, number> = new Map();

  // Cooldown periods (ms)
  private readonly COOLDOWNS = {
    view_location: 5 * 60 * 1000,      // 5 phút - cùng location
    view_festival: 5 * 60 * 1000,      // 5 phút - cùng festival
    search: 30 * 1000,                  // 30 giây - cùng query
    get_directions: 10 * 60 * 1000,    // 10 phút - cùng location
    review: 0,                          // Không cooldown - mỗi review là unique
    click_recommendation: 60 * 1000,   // 1 phút - cùng item
  };

  private shouldTrack(eventType: string, entityId: string | number): boolean {
    const key = `${eventType}_${entityId}`;
    const lastTracked = this.recentMemories.get(key);
    const cooldown = this.COOLDOWNS[eventType] || 60000;

    if (lastTracked && Date.now() - lastTracked < cooldown) {
      console.log(`⏳ [Preferences] Cooldown active for ${key}`);
      return false;
    }

    this.recentMemories.set(key, Date.now());
    return true;
  }
}
```

### 6.4 Giới Hạn Số Lượng Memories

```typescript
// Backend nên có logic để:
// 1. Giới hạn số memories per user (e.g., 1000)
// 2. Xóa memories cũ hơn 90 ngày
// 3. Merge duplicate memories

// Frontend có thể track số lượng
private memoryCount: number = 0;
private readonly MAX_MEMORIES_PER_SESSION = 50;

async trackPreference(request: ...): Promise<void> {
  if (this.memoryCount >= this.MAX_MEMORIES_PER_SESSION) {
    console.log('⚠️ [Preferences] Session limit reached');
    return;
  }

  // ... tracking logic
  this.memoryCount++;
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// __tests__/utils/userPreferencesTracker.test.ts

describe('UserPreferencesTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackViewLocation', () => {
    it('should store memory with correct format', async () => {
      // Mock storeMemory
      const mockStoreMemory = jest.fn().mockResolvedValue({ success: true });

      await tracker.trackViewLocation(mockLocation);

      expect(mockStoreMemory).toHaveBeenCalledWith({
        user_id: expect.any(Number),
        memory_type: 'visited',
        content: expect.stringContaining(mockLocation.name),
        confidence: 0.6,
        metadata: expect.objectContaining({
          event: 'view_location',
          location_id: mockLocation.Id,
        }),
      });
    });

    it('should respect cooldown period', async () => {
      await tracker.trackViewLocation(mockLocation);
      await tracker.trackViewLocation(mockLocation); // Same location

      expect(mockStoreMemory).toHaveBeenCalledTimes(1);
    });

    it('should skip if user not logged in', async () => {
      // Mock no user
      await tracker.trackViewLocation(mockLocation);

      expect(mockStoreMemory).not.toHaveBeenCalled();
    });
  });

  describe('trackReview', () => {
    it('should use preference type for 4-5 stars', async () => {
      await tracker.trackReview(mockLocation, 5, true);

      expect(mockStoreMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          memory_type: 'preference',
          confidence: 0.95,
        })
      );
    });

    it('should use dislike type for 1-2 stars', async () => {
      await tracker.trackReview(mockLocation, 1, true);

      expect(mockStoreMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          memory_type: 'dislike',
          confidence: 0.9,
        })
      );
    });
  });
});
```

### 7.2 Integration Tests

```typescript
// __tests__/integration/preferences.test.ts

describe('Preferences Integration', () => {
  it('should store preference in NocoDB', async () => {
    // 1. Login as test user
    // 2. View a location
    // 3. Query NocoDB to verify memory was stored
    // 4. Check recommendation endpoint returns relevant results
  });
});
```

### 7.3 Manual Testing Checklist

```markdown
## Manual Testing Checklist

### Pre-requisites
- [ ] .env đã sửa NOCODB_USER_MEMORY_TABLE_ID
- [ ] Backend đang chạy
- [ ] NocoDB accessible

### Test Cases

#### TC1: View Location
- [ ] Đăng nhập
- [ ] Vào chi tiết một địa điểm
- [ ] Kiểm tra NocoDB có record mới với memory_type='visited'
- [ ] Vào lại cùng địa điểm trong 5 phút
- [ ] Verify KHÔNG có record mới (cooldown)

#### TC2: Get Directions
- [ ] Đăng nhập
- [ ] Vào chi tiết địa điểm
- [ ] Nhấn "Chỉ đường"
- [ ] Kiểm tra NocoDB có record với confidence=0.9

#### TC3: Submit Review
- [ ] Đăng nhập
- [ ] Tạo review 5 sao
- [ ] Kiểm tra NocoDB có record memory_type='preference'
- [ ] Tạo review 1 sao
- [ ] Kiểm tra NocoDB có record memory_type='dislike'

#### TC4: Search
- [ ] Đăng nhập
- [ ] Tìm kiếm "biển đẹp"
- [ ] Kiểm tra NocoDB có record memory_type='interest'

#### TC5: Recommendations Feedback Loop
- [ ] Đăng nhập
- [ ] Tương tác với vài địa điểm biển
- [ ] Refresh recommendations
- [ ] Verify recommendations có nhiều địa điểm biển hơn
```

### 7.4 Verify Data in NocoDB

```bash
# Query NocoDB API để kiểm tra data
curl -X GET "https://app.nocodb.com/api/v2/tables/{USER_MEMORY_TABLE_ID}/records" \
  -H "xc-token: YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected response
{
  "list": [
    {
      "Id": 1,
      "userId": 123,
      "memoryType": "visited",
      "content": "User viewed location: Bà Nà Hills",
      "confidence": 0.6,
      "metadata": "{\"event\":\"view_location\",\"location_id\":8}",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 8. Tổng Kết

### 8.1 Checklist Triển Khai

```markdown
## Implementation Checklist

### Phase 1: Foundation
- [ ] Sửa .env: NOCODB_USERMEMORY_TABLE_ID → NOCODB_USER_MEMORY_TABLE_ID
- [ ] Tạo src/utils/userPreferencesTracker.ts
- [ ] Test kết nối NocoDB thành công

### Phase 2: High-Impact
- [ ] DetailLocation.tsx - trackViewLocation
- [ ] DetailLocation.tsx - trackGetDirections
- [ ] NewFeedScreen.tsx - trackReview
- [ ] RecommendationsWidget.tsx - trackClickRecommendation

### Phase 3: Medium-Impact
- [ ] HomeScreen.tsx - trackSearch
- [ ] DetailFestival.tsx - trackViewFestival
- [ ] SimilarItemsComponent.tsx - trackClickSimilar

### Phase 4: Testing
- [ ] Unit tests cho userPreferencesTracker
- [ ] Integration tests
- [ ] Manual testing theo checklist
- [ ] Verify data trong NocoDB

### Phase 5: Monitoring
- [ ] Log tracking events
- [ ] Monitor API errors
- [ ] Track memory count per user
```

### 8.2 Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 1 ngày | Foundation ready |
| Phase 2 | 2 ngày | High-impact tracking |
| Phase 3 | 1 ngày | Medium-impact tracking |
| Phase 4 | 2 ngày | Testing complete |
| **Total** | **~1 tuần** | Full implementation |

### 8.3 Success Metrics

- ✅ UserMemory table có data
- ✅ Recommendations khác nhau cho users khác nhau
- ✅ Không có spam records
- ✅ API errors < 1%
- ✅ Tracking không ảnh hưởng UX (< 100ms latency)

---

*Document created: 2026-01-03*
*Last updated: 2026-01-03*

