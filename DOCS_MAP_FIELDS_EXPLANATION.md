# 📍 Tài liệu giải thích các trường data trong chức năng Map

## 📋 Tổng quan về Interface ILocation

```typescript
export interface ILocation {
  Id?: number; // Optional vì data có cả 'id' và 'Id'
  id?: number; // Optional vì data có cả 'id' và 'Id'
  name: string;
  avatar: string;
  address: string;
  description: string;
  lat: number;
  long: number;
  haveVoice?: boolean; // ⚠️ DƯ THỪA - chỉ cần check voiceName
  reviews: IReview[];
  recommendation?: string; // ⚠️ KHÔNG ĐƯỢC SỬ DỤNG - nên là optional
  icon?: any;
  voiceName?: string;
  advise?: string | string[];
  images?: any[];
  videos?: string[];
  relatedKeyWord?: string;
}
```

---

## 🔍 Giải thích chi tiết các trường

### 1. **`recommendation`** (string - optional) ⚠️ **KHÔNG ĐƯỢC SỬ DỤNG**
- **Mục đích**: Lưu thông tin gợi ý/đề xuất về địa điểm
- **Kiểu dữ liệu**: `string?` (optional)
- **Cách hoạt động**: ❌ **KHÔNG được sử dụng ở bất kỳ đâu trong code**
- **Trạng thái**: Có thể là trường dự phòng cho tương lai hoặc đã bị bỏ quên
- **Khuyến nghị**: Có thể xóa hoặc giữ lại cho tương lai
- **Ví dụ**:
  ```typescript
  recommendation: "Nên đến vào buổi sáng sớm để tránh đông người"
  ```

---

### 2. **`haveVoice`** (boolean - optional) ⚠️ **DƯ THỪA**
- **Mục đích**: Đánh dấu địa điểm có hỗ trợ giọng nói hướng dẫn hay không
- **Kiểu dữ liệu**: `boolean?` (optional)
- **Cách hoạt động**:
  - ❌ **KHÔNG được sử dụng trong logic** - Code chỉ check `voiceName`
  - Logic thực tế: `if (selectedLocation.voiceName) { ... }`
- **Trạng thái**: **DƯ THỪA** - Có thể xóa bỏ
- **Khuyến nghị**: Xóa trường này và chỉ dùng `voiceName`
- **Ví dụ**:
  ```typescript
  haveVoice: true  // ← Không cần thiết!
  ```

---

### 3. **`voiceName`** (string - optional)
- **Mục đích**: Tên file âm thanh (không bao gồm extension .mp3)
- **Kiểu dữ liệu**: `string?` (optional)
- **Cách hoạt động**: 
  - Khi người dùng ấn vào marker trên bản đồ và chọn "Xem"
  - Hệ thống sẽ tự động load và phát file âm thanh
  
  **Code xử lý** (trong MapScreenV2.tsx):
  ```typescript
  const onPressView = () => {
    if (selectedLocation) {
      if (selectedLocation.voiceName) {
        SoundPlayer.stop();
        SoundPlayer.loadSoundFile(selectedLocation.voiceName, 'mp3');
      }
      setVisibleSecondModal(true);
    }
  };
  ```

- **Ví dụ**:
  ```typescript
  voiceName: 'nhavanhoasontra'  // Sẽ load file: nhavanhoasontra.mp3
  ```

---

### 4. **`advise`** (string | string[] - optional)
- **Mục đích**: Lưu các quy tắc ứng xử văn minh tại địa điểm
- **Kiểu dữ liệu**: `string | string[]` (có thể là string hoặc array of strings)
- **Cách hoạt động**: 
  - Hiển thị trong màn hình "Quy tắc ứng xử văn minh" (Advise.tsx)
  - Hỗ trợ cả 2 định dạng:
    - **String với newline**: `"Quy tắc 1\nQuy tắc 2\nQuy tắc 3"`
    - **Array of strings**: `["Quy tắc 1", "Quy tắc 2", "Quy tắc 3"]`

- **Code xử lý** (trong Advise.tsx):
  ```typescript
  {location?.advise ? (
    (Array.isArray(location.advise)
      ? location.advise
      : location.advise.split('\n')
    ).map((item, index) => (
      <View key={index} style={styles.adviseItem}>
        <Text style={styles.adviseText}>• {item.trim()}</Text>
      </View>
    ))
  ) : (
    <Text style={styles.noContentText}>
      Không có thông tin quy tắc ứng xử
    </Text>
  )}
  ```

- **Ví dụ**:
  ```typescript
  // Cách 1: Array (khuyến nghị)
  advise: [
    'Tuân thủ, chấp hành các quy định của pháp luật',
    'Trang phục lịch sự, phù hợp',
    'Bảo vệ cảnh quan, môi trường'
  ]

  // Cách 2: String với newline
  advise: "Tuân thủ quy định\nTrang phục lịch sự\nBảo vệ môi trường"
  ```

---

### 5. **`icon`** (any - optional)
- **Mục đích**: Icon tùy chỉnh cho marker trên bản đồ
- **Kiểu dữ liệu**: `any?` (optional)
- **Cách hoạt động**: 
  - Hiển thị icon đặc biệt thay vì marker mặc định trên bản đồ
  - Có thể là local image hoặc remote URL
- **Ví dụ**:
  ```typescript
  icon: require('../assets/custom-marker.png')
  // hoặc
  icon: 'https://example.com/marker-icon.png'
  ```

---

### 6. **`images`** (any[] - optional)
- **Mục đích**: Danh sách hình ảnh của địa điểm
- **Kiểu dữ liệu**: `any[]?` (optional)
- **Cách hoạt động**: 
  - Hiển thị trong tab "Hình ảnh & Video" (LocationImage.tsx)
  - Hỗ trợ 2 định dạng:
    - **String (URL trực tiếp)**: `"https://example.com/image.jpg"`
    - **Object với path**: `{ path: "uploads/image.jpg" }`

- **Code xử lý** (trong LocationImage.tsx):
  ```typescript
  {location.images && location.images.length > 0 ? (
    location.images.map((image, index) => {
      const imageUri = typeof image === 'string' 
        ? image 
        : `${DB_URL}/${image?.path}`;
      
      return (
        <Image
          key={index}
          source={{uri: imageUri}}
          style={styles.img}
          resizeMode="cover"
        />
      );
    })
  ) : (
    <Text style={styles.noContentText}>Không có hình ảnh nào</Text>
  )}
  ```

- **Ví dụ**:
  ```typescript
  // Cách 1: Array of URLs (dùng cho data từ locationConstants.tsx)
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ]

  // Cách 2: Array of objects (dùng cho data từ database)
  images: [
    { path: 'uploads/location1/image1.jpg' },
    { path: 'uploads/location1/image2.jpg' }
  ]
  ```

---

### 7. **`videos`** (string[] - optional)
- **Mục đích**: Danh sách video YouTube của địa điểm
- **Kiểu dữ liệu**: `string[]?` (array of YouTube video IDs)
- **Cách hoạt động**: 
  - Hiển thị trong tab "Hình ảnh & Video" (LocationImage.tsx)
  - Mỗi phần tử là YouTube video ID (không phải full URL)
  - Sử dụng `react-native-youtube-iframe` để embed video

- **Code xử lý** (trong LocationImage.tsx):
  ```typescript
  {location?.videos && location.videos.length > 0 ? (
    location.videos.map((video, index) => (
      <View key={index} style={styles.videoContainer}>
        <ChildVideo videoId={video} />
      </View>
    ))
  ) : (
    <Text style={styles.noContentText}>Không có video nào</Text>
  )}
  ```

- **Ví dụ**:
  ```typescript
  videos: ['Dh6ilW6Ua0w', 'i8EnEF72fa4', '-4pBL_1Qjxw']
  
  // Lấy video ID từ YouTube URL:
  // https://www.youtube.com/watch?v=Dh6ilW6Ua0w
  //                                 ^^^^^^^^^^^^ (video ID)
  ```

---

## 🔄 Luồng hoạt động trong Map

### 1. **Hiển thị marker trên bản đồ**
```typescript
locations.map((location, index) => (
  <MapboxGL.PointAnnotation
    key={String(index)}
    id={`marker-${index}`}
    coordinate={[location.long, location.lat]}
    title={location.name}
    onSelected={() => onMarkerPress(location)}
    onDeselected={() => setSelectedLocation(null)}>
    <MapboxGL.Callout title={location.name} />
  </MapboxGL.PointAnnotation>
))
```

### 2. **Khi người dùng ấn vào marker**
- `onMarkerPress(location)` được gọi
- `selectedLocation` được set
- Modal hiển thị với các button:
  - **Quy tắc ứng xử văn minh** → Navigate đến `Advise.tsx` (hiển thị `advise`)
  - **Thông tin chi tiết** → Navigate đến `DetailLocationScreen`
  - **Hình ảnh & Video** → Navigate đến `LocationImage.tsx` (hiển thị `images` và `videos`)
  - **Hiện vật tại đây** → Fetch items và navigate
  - **Trắc nghiệm tìm hiểu** → Mở Google Form

### 3. **Phát âm thanh (nếu có)**
```typescript
if (selectedLocation.voiceName) {
  SoundPlayer.stop();
  SoundPlayer.loadSoundFile(selectedLocation.voiceName, 'mp3');
}
```

---

## 🐛 Các lỗi đã được sửa

### ❌ **Lỗi 1: Type mismatch cho `videos`**
- **Trước**: `videos?: string` (chỉ 1 string)
- **Sau**: `videos?: string[]` (array of strings)

### ❌ **Lỗi 2: Chỉ hiển thị 1 video**
- **Trước**: 
  ```typescript
  {location?.videos && (
    <View style={styles.videoContainer}>
      <ChildVideo videoId={location?.videos as unknown as string} />
    </View>
  )}
  ```
- **Sau**: 
  ```typescript
  {location?.videos && location.videos.length > 0 ? (
    location.videos.map((video, index) => (
      <View key={index} style={styles.videoContainer}>
        <ChildVideo videoId={video} />
      </View>
    ))
  ) : (
    <Text style={styles.noContentText}>Không có video nào</Text>
  )}
  ```

### ❌ **Lỗi 3: Không xử lý được cả 2 định dạng của `advise`**
- **Trước**: Chỉ xử lý string với `.split('\n')`
- **Sau**: Xử lý cả string và array
  ```typescript
  (Array.isArray(location.advise)
    ? location.advise
    : location.advise.split('\n')
  ).map((item, index) => ...)
  ```

### ❌ **Lỗi 4: Không xử lý được cả 2 định dạng của `images`**
- **Trước**: Chỉ xử lý object với `path`
- **Sau**: Xử lý cả string URL và object
  ```typescript
  const imageUri = typeof image === 'string'
    ? image
    : `${DB_URL}/${image?.path}`;
  ```

### ❌ **Lỗi 5: `location.images.map is not a function`**
- **Nguyên nhân**:
  - Không check `Array.isArray()` trước khi gọi `.map()`
  - `location.images` có thể là `undefined` hoặc không phải array
  - `recommendation` là required nhưng nhiều location không có
- **Giải pháp**:
  1. Đổi `recommendation` thành optional
  2. Thêm check `Array.isArray()` cho cả `images` và `videos`
  3. Thêm null check cho `location`
  ```typescript
  // Trước (SAI)
  {location.images && location.images.length > 0 ? (
    location.images.map(...)
  ) : ...}

  // Sau (ĐÚNG)
  {location?.images && Array.isArray(location.images) && location.images.length > 0 ? (
    location.images.map(...)
  ) : ...}
  ```

---

## ✅ Checklist khi thêm địa điểm mới

### **Trường bắt buộc:**
- [ ] `name` - Tên địa điểm
- [ ] `avatar` - Ảnh đại diện
- [ ] `address` - Địa chỉ
- [ ] `description` - Mô tả
- [ ] `lat` - Vĩ độ
- [ ] `long` - Kinh độ
- [ ] `reviews` - Mảng đánh giá (có thể là `[]`)

### **Trường optional (khuyến nghị):**
- [ ] `Id` hoặc `id` - ID của địa điểm
- [ ] `voiceName` - Tên file âm thanh (không cần `haveVoice`)
- [ ] `advise` - Quy tắc ứng xử (array hoặc string)
- [ ] `images` - Hình ảnh (array of URLs hoặc objects)
- [ ] `videos` - Videos (array of YouTube video IDs)
- [ ] `relatedKeyWord` - Từ khóa tìm kiếm hiện vật

### **Trường không nên dùng:**
- [ ] ❌ `haveVoice` - DƯ THỪA, chỉ cần `voiceName`
- [ ] ❌ `recommendation` - KHÔNG được sử dụng
- [ ] ❌ `icon` - Chưa được implement

---

## 📝 Ví dụ hoàn chỉnh

### ✅ **Ví dụ ĐÚNG (Khuyến nghị)**
```typescript
{
  Id: 1,
  name: 'Nhà Văn hóa Sơn Trà',
  avatar: 'https://example.com/avatar.jpg',
  address: 'Đà Nẵng',
  description: 'Mô tả địa điểm...',
  lat: 16.0544,
  long: 108.2022,
  voiceName: 'nhavanhoasontra', // Chỉ cần voiceName, không cần haveVoice
  advise: [
    'Tuân thủ quy định pháp luật',
    'Trang phục lịch sự',
    'Bảo vệ môi trường'
  ],
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  videos: ['Dh6ilW6Ua0w', 'i8EnEF72fa4'],
  relatedKeyWord: 'Bao Tang',
  reviews: []
}
```

### ❌ **Ví dụ CŨ (Không khuyến nghị)**
```typescript
{
  Id: 1,
  name: 'Nhà Văn hóa Sơn Trà',
  avatar: 'https://example.com/avatar.jpg',
  address: 'Đà Nẵng',
  description: 'Mô tả địa điểm...',
  lat: 16.0544,
  long: 108.2022,
  recommendation: 'Nên đến vào buổi sáng', // ❌ Không được sử dụng
  haveVoice: true, // ❌ Dư thừa
  voiceName: 'nhavanhoasontra',
  advise: [
    'Tuân thủ quy định pháp luật',
    'Trang phục lịch sự',
    'Bảo vệ môi trường'
  ],
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  videos: ['Dh6ilW6Ua0w', 'i8EnEF72fa4'],
  relatedKeyWord: 'Bao Tang',
  reviews: []
}
```

---

## 🔧 Khuyến nghị cải thiện

### 1. **Xóa trường `haveVoice`**
Trường này hoàn toàn dư thừa. Logic nên là:
```typescript
// Thay vì
if (location.haveVoice && location.voiceName) { ... }

// Chỉ cần
if (location.voiceName) { ... }
```

### 2. **Xóa hoặc implement trường `recommendation`**
Trường này không được sử dụng. Nên:
- **Option 1**: Xóa bỏ hoàn toàn
- **Option 2**: Implement hiển thị trong DetailLocation hoặc modal

### 3. **Chuẩn hóa `Id` vs `id`**
Data hiện tại có cả `Id` và `id`. Nên chọn 1 trong 2:
- **Khuyến nghị**: Dùng `id` (lowercase) theo convention JavaScript
- Hoặc: Dùng `Id` (uppercase) nhưng phải consistent

### 4. **Validate data trước khi render**
Thêm validation để tránh lỗi runtime:
```typescript
const isValidLocation = (location: ILocation): boolean => {
  return !!(
    location &&
    location.name &&
    location.lat &&
    location.long &&
    Array.isArray(location.reviews)
  );
};
```

