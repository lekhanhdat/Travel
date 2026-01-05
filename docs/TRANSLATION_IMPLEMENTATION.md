# Translation System Implementation

## Overview
Hệ thống translation của ứng dụng Travel được xây dựng dựa trên `react-i18next` kết hợp với `TranslationContext` để quản lý ngôn ngữ và fallback logic. Hệ thống hỗ trợ đa ngôn ngữ (tiếng Anh và tiếng Việt) với khả năng mở rộng dễ dàng.

## Cấu trúc Files và Folders
```
Travel/
├── src/
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── en/
│   │   │   │   ├── common.json      # Common translation keys
│   │   │   │   ├── locations.json   # Location specific translations
│   │   │   │   └── festivals.json   # Festival specific translations
│   │   │   └── vi/                  # Vietnamese translations (structure mirrors en)
│   │   ├── index.ts                 # i18n configuration & initialization
│   │   └── types.d.ts               # Type definitions for keys and namespaces
│   ├── context/
│   │   └── TranslationContext.tsx   # Context provider for global language state
│   ├── hooks/
│   │   └── useTranslation.ts        # Custom hook for consuming translations
│   └── utils/
│       └── translationHelpers.ts    # Helper functions for dynamic keys
├── __tests__/
│   └── i18n/                        # Unit and integration tests
├── scripts/
│   ├── translate-i18n.ts            # Script to auto-translate JSON files
│   └── pretranslate-nocodb-to-json.ts # Script to fetch & translate data from NocoDB
└── docs/
    └── TRANSLATION_IMPLEMENTATION.md # This documentation
```

## Cách sử dụng trong Components

### 1. Basic Usage (Hooks)
Sử dụng `useTranslation` hook để lấy hàm `t` và trạng thái ngôn ngữ.
```tsx
import { useTranslation } from '../../hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();
  return <Text>{t('common:home.greeting')}</Text>;
};
```

### 2. Dynamic Keys (Helpers)
Sử dụng helpers trong `src/utils/translationHelpers.ts` để dịch dữ liệu động như Locations hoặc Festivals.
```tsx
import { translateLocationField } from '../../utils/translationHelpers';

const LocationCard = ({ location }) => {
  const { t } = useTranslation();
  const name = translateLocationField(t, location.id, 'name', location.name);
  
  return <Text>{name}</Text>;
};
```

### 3. Switching Language
Thay đổi ngôn ngữ thông qua `TranslationContext` hoặc hook.
```tsx
const { setLanguage } = useTranslation();
// Switch to Vietnamese
setLanguage('vi'); 
```

## Cách thêm Translations mới

1. **Thêm key vào JSON**: Mở `src/i18n/locales/en/common.json` (hoặc file tương ứng) và thêm key mới.
   ```json
   {
     "newFeature": {
       "title": "New Feature Title"
     }
   }
   ```
2. **Thêm bản dịch tiếng Việt**: Thêm key tương ứng vào `src/i18n/locales/vi/common.json`.
3. **Sử dụng**: Gọi `t('common:newFeature.title')` trong component.

## Scripts

### Pre-translation (Data)
Để lấy dữ liệu từ NocoDB và dịch tự động sang JSON files:
```bash
npx ts-node scripts/pretranslate-nocodb-to-json.ts
```
Script này sẽ fetch dữ liệu locations/festivals, dịch sang tiếng Anh (nếu cần), và lưu vào `src/i18n/locales`.

### UI Translation
Để dịch tự động các file i18n UI (common.json):
```bash
npx ts-node scripts/translate-i18n.ts
```

## Performance & Optimization

### Latency
- **Bundled Translations**: 0ms latency. Các bản dịch được bundle trực tiếp vào ứng dụng dưới dạng JSON, đảm bảo hiển thị tức thì khi khởi động.
- **Azure Fallback**: <300ms latency. (Nếu sử dụng Azure fallback cho dynamic content chưa có trong bundle). Hiện tại ưu tiên bundled JSON để tối ưu tốc độ.

### Bundle Size Impact
- **JSON Files**:
  - `common.json`: ~5KB (gzip)
  - `locations.json`: ~50KB (gzip) - Chứa thông tin chi tiết các địa điểm.
  - `festivals.json`: ~20KB (gzip)
- **App Bundle**: Tác động không đáng kể (<100KB tổng cộng) so với lợi ích về trải nghiệm người dùng (không cần loading state cho text).

## Troubleshooting

### Missing Translations
- Nếu thấy warning `Missing translation for key: ...` trong console (DEV mode):
  - Kiểm tra xem key có tồn tại trong cả `en` và `vi` JSON files không.
  - Kiểm tra namespace đã được load chưa (mặc định load `common`, `locations`, `festivals`).

### Language Not Persisting
- Kiểm tra `AsyncStorage`: Hệ thống lưu ngôn ngữ vào key `user_language`.
- Đảm bảo `TranslationProvider` bọc toàn bộ App (trong `AppContainer.tsx`).

### Type Errors
- Nếu gặp lỗi type với `t` function:
  - Cập nhật `src/i18n/types.d.ts` nếu thêm namespace mới.
  - Đảm bảo key string khớp với cấu trúc JSON (được hỗ trợ bởi TypeScript template literal types nếu cấu hình).
