# Danavi — Bản nháp khai báo "An toàn dữ liệu" (Data Safety) trên Google Play

> Soạn từ mã nguồn (`src/services/*`, `AndroidManifest.xml`) ngày 2026-11-11. Chủ sở hữu + đội backend phải xác nhận phần **phía máy chủ** (lưu trữ bao lâu, có chia sẻ bên thứ ba không, có mã hóa khi lưu không) trước khi nộp. Khai báo sai là vi phạm chính sách.

## Nơi dữ liệu được gửi tới
| Đích | Mục đích | Ghi chú |
|---|---|---|
| Backend Danavi (`API_BASE_URL`, Google Cloud Run, HTTPS) | Tài khoản, đánh giá, bảng tin, upload ảnh, nhận diện ảnh, trợ lý AI, gợi ý | Của nhà phát triển → không phải "chia sẻ" |
| Mapbox (`api.mapbox.com`, HTTPS) | Hiển thị bản đồ, chỉ đường (gửi tọa độ điểm đi/đến) | Nhà cung cấp dịch vụ (service provider) → theo định nghĩa của Google **không tính là chia sẻ**, nhưng phải nêu trong chính sách quyền riêng tư |
| PayOS / cổng thanh toán (chỉ khi bật Ủng hộ) | Thanh toán | Hiện `ENABLE_PAYMENT=false` |

Mã hóa khi truyền: **Có** (HTTPS bắt buộc, cleartext bị chặn từ đợt A).
Người dùng có thể yêu cầu xóa dữ liệu: **Có** — xóa tài khoản trong app (`DELETE /me`, màn hình Thông tin tài khoản). Google còn yêu cầu **một đường link web để yêu cầu xóa tài khoản** (người đã gỡ app) → MANUAL-13.

## Các loại dữ liệu thu thập (đề xuất khai báo)

| Loại (theo Play Console) | Thu thập? | Bắt buộc/Tùy chọn | Mục đích | Bằng chứng trong mã |
|---|---|---|---|---|
| Vị trí → Vị trí chính xác | Có | Tùy chọn | Chức năng app (địa điểm gần bạn, bản đồ, chỉ đường) | `ACCESS_FINE_LOCATION`, `preciseLocation.ts`, `mapbox.api.ts` |
| Vị trí → Vị trí gần đúng | Có | Tùy chọn | như trên | `ACCESS_COARSE_LOCATION` |
| Thông tin cá nhân → Tên | Có | Tùy chọn (chỉ khi có tài khoản) | Quản lý tài khoản | `auth.api.ts` `fullName` |
| Thông tin cá nhân → Email | Có | Tùy chọn | Quản lý tài khoản | `email` |
| Thông tin cá nhân → Số điện thoại | Có | Tùy chọn | Quản lý tài khoản | `phone` |
| Thông tin cá nhân → Thông tin cá nhân khác (giới tính, ngày sinh, tên đăng nhập) | Có | Tùy chọn | Quản lý tài khoản, cá nhân hóa | `gender`, `birthday`, `user_name` |
| Ảnh và video → Ảnh | Có | Tùy chọn | Chức năng app (nhận diện địa danh, ảnh đại diện, ảnh bài viết/đánh giá) | `detect.api.ts`, `locations.api.ts /uploads`, image picker |
| Tin nhắn → Tin nhắn khác trong ứng dụng | Có | Tùy chọn | Chức năng app (trợ lý AI); cá nhân hóa (bộ nhớ hội thoại) | `chatbot.api.ts`, `semantic.api.ts /chat/rag`, `/memory/store` |
| Hoạt động trong ứng dụng → Nội dung do người dùng tạo | Có | Tùy chọn | Chức năng app (đánh giá, bảng tin) | `reviews.api.ts` |
| Hoạt động trong ứng dụng → Lịch sử tìm kiếm trong ứng dụng | Có (gửi lên server để tìm kiếm ngữ nghĩa/gợi ý) | Tùy chọn | Chức năng app, cá nhân hóa | `semantic.api.ts /search/*`, `/recommendations` |
| Âm thanh → Ghi âm | Không — quyền `RECORD_AUDIO` đã gỡ (đợt E) | — | — | — |
| Thông tin tài chính | Không (khi ẩn Ủng hộ) | — | — | `ENABLE_PAYMENT=false` |
| Danh bạ, lịch, SMS, sức khỏe, tệp/tài liệu | Không | — | — | — |
| Mã định danh thiết bị / quảng cáo | Không (không có SDK quảng cáo/analytics) | — | — | `package.json` |
| Chẩn đoán/Crash log | Không (chưa có Crashlytics). Nếu thêm sau → khai báo bổ sung | — | — | — |

Dữ liệu được **chia sẻ** với bên thứ ba: **Không** (Mapbox là nhà cung cấp dịch vụ). Xác nhận với backend xem có gửi nội dung chat/ảnh tới nhà cung cấp AI (ví dụ OpenAI/Google) không — nếu có, đó vẫn là "service provider" nhưng phải liệt kê trong chính sách quyền riêng tư.

## Quyền Android sau đợt E (để đối chiếu)
INTERNET, ACCESS_NETWORK_STATE, CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, READ_EXTERNAL_STORAGE (≤API 32), WRITE_EXTERNAL_STORAGE (≤API 28). Thêm từ thư viện: WAKE_LOCK, ACCESS_WIFI_STATE, CHECK_LICENSE (Mapbox/Play). Không có quyền vị trí nền, không có exact alarm → không cần biểu mẫu khai báo quyền đặc biệt.
