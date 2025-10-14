# 🚀 Tính năng Navigation nâng cao

## 📋 Tổng quan

Đã thêm 3 tính năng nâng cao cho chức năng Chỉ đường:

1. **Hiển thị khoảng cách & thời gian** - Distance & Duration
2. **Turn-by-turn navigation** - Hướng dẫn từng bước
3. **Alternative routes** - Nhiều tuyến đường thay thế

---

## ✨ Tính năng 1: Hiển thị khoảng cách & thời gian

### **Giao diện**

Khi ấn "Chỉ đường", một card sẽ hiển thị ở phía trên bản đồ với:
- 📍 **Khoảng cách**: Tự động format (1.5 km hoặc 500 m)
- ⏱️ **Thời gian**: Tự động format (1 giờ 30 phút hoặc 45 phút)

### **Code implementation**

#### **A. Helper functions trong `mapbox.api.ts`:**

```typescript
formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${hours} giờ`;
  }
  
  if (minutes > 0) {
    return `${minutes} phút`;
  }
  
  return `${Math.round(seconds)} giây`;
}
```

#### **B. State trong MapScreenV2:**

```typescript
const [routeDistance, setRouteDistance] = useState<number>(0); // meters
const [routeDuration, setRouteDuration] = useState<number>(0); // seconds
```

#### **C. Lấy data từ Mapbox response:**

```typescript
const mainRoute = response.routes[0];
setRouteDistance(mainRoute.distance); // meters
setRouteDuration(mainRoute.duration); // seconds
```

#### **D. UI hiển thị:**

```typescript
{routeDistance > 0 && routeDuration > 0 && (
  <View style={{ position: 'absolute', top: 80, left: 10, right: 10, ... }}>
    <TextBase>📍 {mapboxApi.formatDistance(routeDistance)}</TextBase>
    <TextBase>⏱️ {mapboxApi.formatDuration(routeDuration)}</TextBase>
  </View>
)}
```

---

## ✨ Tính năng 2: Alternative Routes (Nhiều tuyến đường)

### **Giao diện**

- Hiển thị số lượng tuyến đường có sẵn (ví dụ: "3 tuyến đường")
- Buttons để chọn từng tuyến: "Tuyến 1: 5.2 km", "Tuyến 2: 6.1 km", "Tuyến 3: 5.8 km"
- Tuyến đang chọn sẽ có màu contained, các tuyến khác là outlined

### **Code implementation**

#### **A. Bật alternatives trong API request:**

```typescript
const response = await mapboxApi.getDirections({
  profile: 'driving',
  coordinates,
  geometries: 'geojson',
  overview: 'full',
  alternatives: true, // ✅ Bật alternative routes
});
```

#### **B. State để lưu tất cả routes:**

```typescript
interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: {latitude: number; longitude: number}[];
}

const [routes, setRoutes] = useState<RouteInfo[]>([]);
const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
```

#### **C. Lưu tất cả routes từ response:**

```typescript
const allRoutes: RouteInfo[] = response.routes.map((route: any) => {
  const geoJsonCoordinates = route.geometry.coordinates;
  const points = mapboxApi.convertGeoJSONToCoordinates(geoJsonCoordinates);
  
  return {
    distance: route.distance,
    duration: route.duration,
    coordinates: points,
  };
});

setRoutes(allRoutes);
```

#### **D. UI để chọn route:**

```typescript
{routes.length > 1 && (
  <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
    {routes.map((route, index) => (
      <Button
        key={index}
        mode={selectedRouteIndex === index ? 'contained' : 'outlined'}
        onPress={() => {
          setSelectedRouteIndex(index);
          setRouteCoordinates(route.coordinates);
          setRouteDistance(route.distance);
          setRouteDuration(route.duration);
        }}
      >
        Tuyến {index + 1}: {mapboxApi.formatDistance(route.distance)}
      </Button>
    ))}
  </View>
)}
```

### **Cách hoạt động**

1. Mapbox API trả về tối đa 3 routes (1 main + 2 alternatives)
2. Route đầu tiên (index 0) là fastest route
3. Alternative routes có thể dài hơn nhưng tránh traffic hoặc đường tốt hơn
4. User có thể chọn route bằng cách ấn button
5. Khi chọn route mới, bản đồ sẽ vẽ lại đường đi

---

## ✨ Tính năng 3: Turn-by-Turn Navigation

### **Giao diện**

- Button "Hướng dẫn" ở góc dưới bên trái bản đồ
- Modal hiển thị danh sách các bước từng bước
- Mỗi bước có:
  - Số thứ tự (1, 2, 3, ...)
  - Hướng dẫn (ví dụ: "Rẽ trái vào đường Nguyễn Văn Linh")
  - Khoảng cách (ví dụ: "500 m")
  - Tên đường (ví dụ: "🛣️ Nguyễn Văn Linh")

### **Code implementation**

#### **A. Bật steps trong API request:**

```typescript
const response = await mapboxApi.getDirections({
  profile: 'driving',
  coordinates,
  geometries: 'geojson',
  overview: 'full',
  steps: true, // ✅ Bật turn-by-turn steps
  banner_instructions: true,
  voice_instructions: true,
});
```

#### **B. State để lưu steps:**

```typescript
const [routeSteps, setRouteSteps] = useState<any[]>([]);
```

#### **C. Lấy steps từ response:**

```typescript
if (mainRoute.legs && mainRoute.legs[0] && mainRoute.legs[0].steps) {
  const steps = mainRoute.legs[0].steps;
  console.log('✅ Turn-by-turn steps:', steps.length);
  setRouteSteps(steps);
}
```

#### **D. UI Modal hiển thị steps:**

```typescript
<Modal visible={visible} onDismiss={() => setVisible(false)}>
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
    <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
      {/* Header */}
      <View style={{ padding: 16, borderBottomWidth: 1 }}>
        <TextBase>🧭 Hướng dẫn từng bước</TextBase>
      </View>

      {/* Steps List */}
      <ScrollView style={{ padding: 16 }}>
        {routeSteps.map((step: any, index: number) => {
          const distance = mapboxApi.formatDistance(step.distance);
          const instruction = step.maneuver?.instruction || 'Tiếp tục đi';
          
          return (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 16 }}>
              {/* Step Number */}
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary }}>
                <TextBase>{index + 1}</TextBase>
              </View>

              {/* Step Info */}
              <View style={{ flex: 1 }}>
                <TextBase>{instruction}</TextBase>
                <TextBase>📍 {distance}</TextBase>
                {step.name && <TextBase>🛣️ {step.name}</TextBase>}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  </View>
</Modal>
```

#### **E. Button để mở modal:**

```typescript
{routeSteps.length > 0 && (
  <View style={{ position: 'absolute', left: 10, bottom: 10 }}>
    <Button
      icon="directions"
      mode="contained"
      onPress={() => setVisible(true)}
    >
      Hướng dẫn
    </Button>
  </View>
)}
```

### **Cấu trúc Step object từ Mapbox**

```typescript
{
  distance: 245.6, // meters
  duration: 45.2, // seconds
  name: "Nguyễn Văn Linh", // Tên đường
  maneuver: {
    type: "turn", // depart, turn, arrive, merge, fork, etc.
    modifier: "left", // left, right, straight, slight left, sharp right, etc.
    instruction: "Rẽ trái vào đường Nguyễn Văn Linh",
    bearing_after: 125, // Hướng sau khi rẽ
    bearing_before: 45, // Hướng trước khi rẽ
    location: [108.2022, 16.0544], // [longitude, latitude]
  },
  geometry: { ... }, // GeoJSON geometry của step này
}
```

---

## 🎯 Luồng hoạt động tổng hợp

```
User ấn "Chỉ đường"
  ↓
Navigate với { locations: [location], showRoute: true }
  ↓
MapScreenV2 mount
  ↓
Get current location
  ↓
fetchRouteToLocation() với:
  - steps: true
  - alternatives: true
  - banner_instructions: true
  - voice_instructions: true
  ↓
Mapbox API response:
  - routes[0] = fastest route
  - routes[1] = alternative route 1
  - routes[2] = alternative route 2
  ↓
Lưu vào state:
  - routes = all routes
  - routeDistance = routes[0].distance
  - routeDuration = routes[0].duration
  - routeSteps = routes[0].legs[0].steps
  - routeCoordinates = routes[0].geometry.coordinates
  ↓
Hiển thị UI:
  - Card Distance & Duration (top)
  - Alternative routes buttons (trong card)
  - Route line trên bản đồ (màu xanh dương)
  - Button "Hướng dẫn" (bottom left)
  ↓
User có thể:
  - Chọn alternative route → Vẽ lại đường đi
  - Ấn "Hướng dẫn" → Xem turn-by-turn steps
```

---

## 🧪 Cách test

### **Test 1: Distance & Duration**
1. Vào Home → Chọn địa điểm → "Chỉ đường"
2. **Kết quả mong đợi**:
   - Card hiển thị ở top với distance và duration
   - Format đúng (ví dụ: "5.2 km" và "12 phút")

### **Test 2: Alternative Routes**
1. Vào Home → Chọn địa điểm xa → "Chỉ đường"
2. **Kết quả mong đợi**:
   - Hiển thị "2 tuyến đường" hoặc "3 tuyến đường"
   - Buttons "Tuyến 1", "Tuyến 2", "Tuyến 3"
   - Ấn button → Đường đi thay đổi, distance & duration cập nhật

### **Test 3: Turn-by-Turn Navigation**
1. Vào Home → Chọn địa điểm → "Chỉ đường"
2. Ấn button "Hướng dẫn" ở góc dưới trái
3. **Kết quả mong đợi**:
   - Modal hiển thị từ dưới lên
   - Danh sách các bước với số thứ tự, hướng dẫn, khoảng cách
   - Scroll được nếu có nhiều bước
   - Ấn X hoặc bên ngoài modal → Đóng modal

---

## 📊 Debug logs

Khi ấn "Chỉ đường", console sẽ hiển thị:

```
=== FETCHING ROUTE WITH MAPBOX ===
From: 16.0544 108.2022
To: Nhà Văn hóa Sơn Trà 16.0612 108.2435
Mapbox coordinates: 108.2022,16.0544;108.2435,16.0612
🗺️ Mapbox Directions API Request: https://api.mapbox.com/directions/v5/mapbox/driving/...
✅ Mapbox Directions API Response: { routes: [...] }
📊 Routes count: 2
Route 1: { distance: 5234, duration: 720, steps: 12 }
Route 2: { distance: 6102, duration: 780, steps: 15 }
✅ Total routes: 2
✅ Main route - Distance: 5234 meters
✅ Main route - Duration: 720 seconds
✅ Main route - Points: 245
✅ Turn-by-turn steps: 12
🗺️ Route coordinates count: 245
```

---

## 📝 Notes

- **Mapbox trả về tối đa 3 routes** (1 main + 2 alternatives)
- **Không phải lúc nào cũng có alternative routes** - Phụ thuộc vào địa hình
- **Steps có thể rất nhiều** - Nên dùng ScrollView
- **Distance & Duration là ước tính** - Dựa trên traffic và road conditions
- **Voice instructions** có thể dùng cho text-to-speech trong tương lai

---

## 🚀 Cải tiến trong tương lai

1. **Voice navigation**: Đọc hướng dẫn bằng giọng nói
2. **Real-time tracking**: Cập nhật vị trí real-time và re-route nếu đi sai
3. **Traffic visualization**: Hiển thị traffic trên bản đồ
4. **Save favorite routes**: Lưu các tuyến đường yêu thích
5. **Share route**: Chia sẻ route qua link hoặc QR code

