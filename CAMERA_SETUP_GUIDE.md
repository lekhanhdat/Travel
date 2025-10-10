# Hướng dẫn kết nối Camera với Backend API

## 🔗 Cấu hình Backend
- **URL Backend:** `https://digital-ocean-fast-api-h9zys.ondigitalocean.app`
- **Endpoint chính:** `/detect` (POST)
- **File cấu hình:** `src/utils/configs.ts`

## 📱 Chức năng Camera đã được cập nhật

### 1. Chụp ảnh từ Camera
- Sử dụng `react-native-vision-camera`
- Hỗ trợ flash on/off
- Tự động upload lên backend sau khi chụp

### 2. Chọn ảnh từ thư viện
- Sử dụng `react-native-image-picker`
- Hỗ trợ chất lượng ảnh cao (0.8)
- Tự động xử lý URI cho Android/iOS

### 3. Upload và xử lý ảnh
- Sử dụng `rn-fetch-blob` để upload
- Endpoint: `POST /detect`
- Content-Type: `multipart/form-data`
- Field name: `image_file`

### 4. Hiển thị kết quả
- Modal hiển thị ảnh đã chụp
- Tên địa điểm/đối tượng được nhận diện
- Mô tả chi tiết từ AI

## 🛠 Cải tiến đã thực hiện

### 1. Xử lý lỗi tốt hơn
- Thông báo lỗi chi tiết bằng Toast
- Logging đầy đủ cho debug
- Xử lý trường hợp không có kết quả

### 2. Test kết nối
- Nút test kết nối backend (icon wifi)
- Tự động test khi mở màn hình camera
- Thông báo trạng thái kết nối

### 3. Cải thiện UX
- Loading indicator khi xử lý
- Thông báo lỗi rõ ràng
- Xử lý URI đúng cho từng platform

## 🚀 Cách sử dụng

1. **Mở màn hình Camera**
   - App sẽ tự động test kết nối backend
   - Nếu thành công sẽ hiện thông báo xanh
   - Nếu thất bại sẽ hiện thông báo đỏ

2. **Chụp ảnh**
   - Nhấn nút camera ở giữa
   - Ảnh sẽ được upload tự động
   - Kết quả hiển thị trong modal

3. **Chọn ảnh từ thư viện**
   - Nhấn nút gallery bên trái
   - Chọn ảnh từ thư viện
   - Ảnh sẽ được upload tự động

4. **Test kết nối thủ công**
   - Nhấn nút wifi ở góc trên bên phải
   - Kiểm tra trạng thái kết nối

## 🔧 Troubleshooting

### Lỗi kết nối
- Kiểm tra internet
- Nhấn nút test kết nối
- Xem log trong console

### Lỗi upload ảnh
- Kiểm tra quyền camera
- Kiểm tra dung lượng ảnh
- Xem log chi tiết

### Lỗi hiển thị kết quả
- Kiểm tra response từ backend
- Đảm bảo format JSON đúng
- Xem log trong console

## 📝 Log quan trọng
- `Uploading image to:` - URL upload
- `Response status:` - HTTP status code
- `Response data:` - Dữ liệu trả về
- `Parsed content:` - Kết quả đã parse

## 🎯 Kết quả mong đợi
Backend sẽ trả về JSON với format:
```json
{
  "name": "Tên địa điểm/đối tượng",
  "description": "Mô tả chi tiết"
}
```
