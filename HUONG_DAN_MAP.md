# 🗺️ Hướng dẫn sử dụng tính năng Bản đồ mới

## ✨ Tính năng mới

### 1. 🔌 Bản đồ Offline
**Vấn đề cũ**: App bị crash khi không có internet  
**Giải pháp mới**: App vẫn hoạt động bình thường, hiển thị đường đi đơn giản

#### Khi có internet (Online):
- ✅ Đường đi chi tiết theo đường thực tế
- ✅ Màu xanh dương, đường liền nét
- ✅ Có nhiều tuyến đường để chọn
- ✅ Hiển thị thời gian dự kiến
- ✅ Có hướng dẫn từng bước (turn-by-turn)

#### Khi không có internet (Offline):
- ✅ Vẫn hiển thị bản đồ
- ✅ Vẽ đường thẳng từ vị trí hiện tại đến đích
- ✅ Màu cam, đường đứt nét
- ✅ Hiển thị khoảng cách (theo đường chim bay)
- ✅ Banner cảnh báo "🔌 Chế độ Offline"
- ⚠️ Không có thời gian dự kiến
- ⚠️ Không có hướng dẫn từng bước

### 2. 🗺️ Chọn kiểu bản đồ (Layer Selector)
Bạn có thể chọn giữa 6 kiểu bản đồ khác nhau:

| Icon | Tên | Khi nào dùng |
|------|-----|--------------|
| 🛰️ | Vệ tinh | Xem ảnh thực tế từ vệ tinh |
| 🗺️ | Đường phố | Xem tên đường, địa điểm |
| 🏞️ | Ngoài trời | Đi bộ đường dài, leo núi |
| 🌙 | Tối | Dùng ban đêm, tiết kiệm pin |
| ☀️ | Sáng | Dùng ban ngày, dễ nhìn |
| ⛰️ | Địa hình | Kết hợp vệ tinh + đường phố |

---

## 📱 Cách sử dụng

### Chọn kiểu bản đồ

1. **Mở màn hình bản đồ**
2. **Nhìn góc trên bên phải** - bạn sẽ thấy một icon (mặc định là 🛰️)
3. **Nhấn vào icon** - menu sẽ hiện ra với 6 tùy chọn
4. **Chọn kiểu bạn muốn** - bản đồ sẽ tự động thay đổi
5. **Menu tự động đóng** sau khi chọn

### Sử dụng khi Offline

1. **Tắt wifi/4G** hoặc đi vào vùng không có sóng
2. **Mở bản đồ** - vẫn hoạt động bình thường
3. **Chọn địa điểm** và nhấn "Chỉ đường"
4. **Xem đường đi**:
   - Banner cam ở trên cùng: "🔌 Chế độ Offline"
   - Đường đi màu cam, đứt nét
   - Khoảng cách hiển thị (ví dụ: "2.5 km")
   - Ghi chú: "Khoảng cách theo đường chim bay"

---

## 💡 Mẹo sử dụng

### Tiết kiệm pin
- Dùng chế độ **🌙 Tối** khi dùng ban đêm (tiết kiệm pin cho màn hình OLED)
- Tắt wifi/4G khi không cần (dùng chế độ offline)

### Xem rõ hơn
- **Ban ngày**: Dùng **☀️ Sáng** hoặc **🗺️ Đường phố**
- **Ban đêm**: Dùng **🌙 Tối**
- **Ngoài trời**: Dùng **🏞️ Ngoài trời** hoặc **⛰️ Địa hình**

### Khi không có internet
- App vẫn hoạt động bình thường
- Đường đi là đường thẳng (chim bay), không phải đường thực tế
- Khoảng cách chỉ mang tính chất tham khảo
- Nên bật internet để có đường đi chính xác

---

## ❓ Câu hỏi thường gặp

### Q: Tại sao khi offline đường đi lại thẳng?
**A**: Vì không có internet để lấy dữ liệu đường đi thực tế từ Mapbox. App vẽ đường thẳng để bạn biết hướng và khoảng cách tương đối.

### Q: Khoảng cách khi offline có chính xác không?
**A**: Khoảng cách là khoảng cách theo đường chim bay (đường thẳng), không phải khoảng cách đi đường thực tế. Khoảng cách thực tế sẽ dài hơn.

### Q: Tại sao không có thời gian dự kiến khi offline?
**A**: Vì không biết đường đi thực tế nên không thể tính thời gian chính xác.

### Q: Có thể tải bản đồ về để dùng offline không?
**A**: Hiện tại chưa hỗ trợ tải bản đồ về. Tính năng này có thể được thêm vào sau.

### Q: Kiểu bản đồ nào tốt nhất?
**A**: Tùy vào mục đích:
- **Du lịch**: 🛰️ Vệ tinh hoặc ⛰️ Địa hình
- **Lái xe**: 🗺️ Đường phố
- **Leo núi**: 🏞️ Ngoài trời
- **Ban đêm**: 🌙 Tối

### Q: Tại sao đổi kiểu bản đồ lại mất vài giây?
**A**: Mapbox cần tải dữ liệu bản đồ mới. Tốc độ phụ thuộc vào internet của bạn.

---

## 🔧 Xử lý sự cố

### Bản đồ không hiển thị
1. Kiểm tra kết nối internet
2. Tắt app và mở lại
3. Kiểm tra quyền truy cập vị trí

### Đường đi không hiển thị
1. Kiểm tra internet
2. Thử chọn địa điểm khác
3. Nếu offline, đường đi sẽ là đường thẳng màu cam

### Layer selector không mở
1. Nhấn lại vào icon góc trên phải
2. Tắt app và mở lại

### Vị trí không chính xác
1. Bật GPS
2. Ra ngoài trời (tránh trong nhà)
3. Chờ vài giây để GPS định vị

---

## 📞 Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ:
- Email: support@travel-app.com
- Hoặc báo lỗi trong app

---

**Phiên bản**: 2.0  
**Cập nhật**: 2025-10-20  
**Tính năng**: Offline Maps + Layer Selector

