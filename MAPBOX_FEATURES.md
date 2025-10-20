# Tính năng MapBox mới

## 📱 Tổng quan

Đã thêm 2 tính năng chính cho MapScreenV2:

### 1. 🔌 Offline Map Support (Hỗ trợ bản đồ Offline)
### 2. 🗺️ Layer Selector (Chọn kiểu bản đồ)

---

## 🔌 Offline Map Support

### Mô tả
Khi không có kết nối internet, ứng dụng sẽ:
- ✅ **Không bị crash** - Bản đồ vẫn hiển thị bình thường
- ✅ **Vẽ đường thẳng** - Hiển thị đường đi theo đường chim bay từ vị trí hiện tại đến đích
- ✅ **Tính khoảng cách** - Sử dụng công thức Haversine để tính khoảng cách
- ✅ **Thông báo rõ ràng** - Banner màu cam thông báo đang ở chế độ offline

### Cách hoạt động

#### Khi Online (có internet):
```
📍 Vị trí hiện tại → 🌐 Mapbox API → 🛣️ Đường đi chi tiết
```
- Đường đi màu **xanh dương** (#0000FF)
- Có turn-by-turn navigation
- Có nhiều tuyến đường thay thế
- Hiển thị thời gian dự kiến

#### Khi Offline (không có internet):
```
📍 Vị trí hiện tại → 📐 Haversine Formula → ➡️ Đường thẳng
```
- Đường đi màu **cam** (#FFA500) và **đứt nét**
- Chỉ hiển thị khoảng cách (không có thời gian)
- Banner cảnh báo: "🔌 Chế độ Offline"
- Ghi chú: "Khoảng cách theo đường chim bay"

### Code Implementation

#### 1. State Management
```typescript
const [isOffline, setIsOffline] = useState(false);
```

#### 2. Error Handling trong fetchRouteToLocation
```typescript
catch (error: any) {
  // Kiểm tra lỗi network
  if (error.message?.includes('Network') || 
      error.code === 'ECONNABORTED' || 
      !error.response) {
    
    setIsOffline(true);
    
    // Vẽ đường thẳng
    const straightLineRoute: RouteInfo = {
      distance: calculateDistance(currentLat, currentLong, location.lat, location.long),
      duration: 0,
      coordinates: [
        { latitude: currentLat, longitude: currentLong },
        { latitude: location.lat, longitude: location.long },
      ],
    };
    
    setRoutes([straightLineRoute]);
    setRouteCoordinates(straightLineRoute.coordinates);
  }
}
```

#### 3. Haversine Distance Calculation
```typescript
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Bán kính trái đất (mét)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
```

#### 4. UI Changes
```typescript
// Đường đi thay đổi màu và style
<MapboxGL.LineLayer
  style={{
    lineWidth: 6,
    lineColor: isOffline ? '#FFA500' : '#0000FF',
    lineOpacity: 0.9,
    lineDasharray: isOffline ? [2, 2] : undefined, // Đứt nét khi offline
  }}
/>

// Banner cảnh báo offline
{isOffline && (
  <View style={{ backgroundColor: '#FFA500', ... }}>
    <TextBase>🔌 Chế độ Offline</TextBase>
    <TextBase>Đường đi chỉ mang tính chất tham khảo</TextBase>
  </View>
)}
```

---

## 🗺️ Layer Selector (Chọn kiểu bản đồ)

### Mô tả
Người dùng có thể chọn giữa 6 kiểu bản đồ khác nhau:

| Icon | Tên | Mô tả | MapBox Style |
|------|-----|-------|--------------|
| 🛰️ | Vệ tinh | Ảnh vệ tinh | `MapboxGL.StyleURL.Satellite` |
| 🗺️ | Đường phố | Bản đồ đường phố | `MapboxGL.StyleURL.Street` |
| 🏞️ | Ngoài trời | Bản đồ ngoài trời | `MapboxGL.StyleURL.Outdoors` |
| 🌙 | Tối | Chế độ tối | `MapboxGL.StyleURL.Dark` |
| ☀️ | Sáng | Chế độ sáng | `MapboxGL.StyleURL.Light` |
| ⛰️ | Địa hình | Vệ tinh + đường phố | `mapbox://styles/mapbox/satellite-streets-v12` |

### Cách sử dụng

1. **Mở Layer Selector**: Nhấn vào icon ở góc trên bên phải màn hình
2. **Chọn kiểu bản đồ**: Nhấn vào một trong 6 tùy chọn
3. **Bản đồ tự động cập nhật**: Không cần reload

### Code Implementation

#### 1. Type Definitions
```typescript
type MapStyle = 'satellite' | 'streets' | 'outdoors' | 'dark' | 'light' | 'terrain';

interface MapStyleOption {
  id: MapStyle;
  name: string;
  url: string;
  icon: string;
}
```

#### 2. Map Styles Configuration
```typescript
const MAP_STYLES: MapStyleOption[] = [
  { id: 'satellite', name: 'Vệ tinh', url: MapboxGL.StyleURL.Satellite, icon: '🛰️' },
  { id: 'streets', name: 'Đường phố', url: MapboxGL.StyleURL.Street, icon: '🗺️' },
  { id: 'outdoors', name: 'Ngoài trời', url: MapboxGL.StyleURL.Outdoors, icon: '🏞️' },
  { id: 'dark', name: 'Tối', url: MapboxGL.StyleURL.Dark, icon: '🌙' },
  { id: 'light', name: 'Sáng', url: MapboxGL.StyleURL.Light, icon: '☀️' },
  { id: 'terrain', name: 'Địa hình', url: 'mapbox://styles/mapbox/satellite-streets-v12', icon: '⛰️' },
];
```

#### 3. State Management
```typescript
const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>('satellite');
const [showStyleSelector, setShowStyleSelector] = useState(false);
```

#### 4. MapView Integration
```typescript
<MapboxGL.MapView
  styleURL={MAP_STYLES.find(s => s.id === currentMapStyle)?.url || MapboxGL.StyleURL.Satellite}
  ...
/>
```

#### 5. UI Component
```typescript
{/* Layer Selector Button */}
<TouchableOpacity onPress={() => setShowStyleSelector(!showStyleSelector)}>
  <TextBase>{MAP_STYLES.find(s => s.id === currentMapStyle)?.icon}</TextBase>
</TouchableOpacity>

{/* Dropdown Menu */}
{showStyleSelector && (
  <View>
    {MAP_STYLES.map((style) => (
      <TouchableOpacity
        key={style.id}
        onPress={() => {
          setCurrentMapStyle(style.id);
          setShowStyleSelector(false);
        }}
      >
        <TextBase>{style.icon} {style.name}</TextBase>
      </TouchableOpacity>
    ))}
  </View>
)}
```

---

## 🎯 Lợi ích

### Offline Support
- ✅ **Không crash app** khi mất mạng
- ✅ **Trải nghiệm người dùng tốt hơn** - vẫn có thông tin cơ bản
- ✅ **Tiết kiệm data** - không cần tải lại map tiles
- ✅ **Hoạt động ở vùng sâu vùng xa** - nơi không có internet

### Layer Selector
- ✅ **Linh hoạt** - người dùng chọn kiểu bản đồ phù hợp
- ✅ **Tiết kiệm pin** - chế độ tối giúp tiết kiệm pin OLED
- ✅ **Dễ nhìn** - chọn kiểu phù hợp với điều kiện ánh sáng
- ✅ **Chuyên nghiệp** - nhiều tùy chọn như Google Maps

---

## 🧪 Testing

### Test Offline Mode
1. Bật chế độ máy bay (Airplane mode)
2. Mở MapScreenV2
3. Chọn một địa điểm và nhấn "Chỉ đường"
4. Kiểm tra:
   - ✅ Banner "🔌 Chế độ Offline" hiển thị
   - ✅ Đường đi màu cam, đứt nét
   - ✅ Hiển thị khoảng cách
   - ✅ Không hiển thị thời gian
   - ✅ Không có alternative routes

### Test Layer Selector
1. Mở MapScreenV2
2. Nhấn vào icon ở góc trên phải
3. Thử chọn từng kiểu bản đồ:
   - ✅ Vệ tinh
   - ✅ Đường phố
   - ✅ Ngoài trời
   - ✅ Tối
   - ✅ Sáng
   - ✅ Địa hình
4. Kiểm tra bản đồ cập nhật ngay lập tức

---

## 📝 Notes

### MapBox Offline Maps (Advanced)
Hiện tại, offline mode chỉ vẽ đường thẳng. Nếu muốn **tải trước bản đồ** để dùng offline hoàn toàn:

1. Sử dụng `MapboxGL.offlineManager`
2. Tải trước map tiles cho khu vực cụ thể
3. Lưu vào local storage

**Tham khảo**: https://github.com/rnmapbox/maps/blob/main/docs/OfflineManager.md

### Performance
- Layer selector không ảnh hưởng performance
- Offline mode nhẹ hơn online mode (không cần fetch API)
- Haversine calculation rất nhanh (< 1ms)

---

## 🔧 Troubleshooting

### Bản đồ không hiển thị
- Kiểm tra MapBox Access Token
- Kiểm tra internet connection
- Xem console logs

### Offline mode không kích hoạt
- Kiểm tra error handling trong `fetchRouteToLocation`
- Xem console logs để debug

### Layer selector không hoạt động
- Kiểm tra `MAP_STYLES` array
- Kiểm tra `currentMapStyle` state
- Verify MapBox style URLs

---

## 📚 References

- [MapBox GL JS Styles](https://docs.mapbox.com/api/maps/styles/)
- [rnmapbox/maps Documentation](https://github.com/rnmapbox/maps)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

