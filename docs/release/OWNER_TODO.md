# Danavi — Việc chủ sở hữu phải tự làm trước khi lên Google Play

> Claude/Codex không được (và không thể) làm các việc dưới đây: cần tài khoản, khóa ký, quyết định kinh doanh/pháp lý của anh/chị. Làm theo thứ tự. Khi xong mục nào, báo lại để Claude cập nhật mã/kiểm tra.
> Cập nhật: 2026-11-12 01:50. Mã nguồn sẵn sàng ở nhánh `release/rn-upgrade` (commit cục bộ `ec4ec0a`, **chưa push**). Ứng dụng hỗ trợ Android 7.0 trở lên.

## 0. Git (anh/chị cho phép thì Claude làm)
- Duyệt rồi cho phép **push** nhánh `release/rn-upgrade` (gồm cả commit `ecd6861` từ `dev`) và tạo PR vào `main`.

## A. Quyết định (làm trước tiên — ảnh hưởng mã nguồn)

| # | Việc | Vì sao | Sau khi quyết, Claude làm gì |
|---|---|---|---|
| A1 | **Chốt package name**: giữ `com.travel` hay đổi (vd. `vn.danavi.app`) | Không đổi được sau lần upload đầu; `com.travel` rất chung, có thể đã có người dùng → Play từ chối | Nếu đổi: giao Codex đổi `applicationId` (giữ namespace Kotlin), kiểm tra Mapbox/backend không phụ thuộc package |
| A2 | **Tính năng Ủng hộ (donate)**: ẩn trong bản phát hành (khuyến nghị) hay làm bằng Google Play Billing | Thanh toán ngoài cho nội dung số/ủng hộ dev dễ bị từ chối | Hiện đã ẩn khi `ENABLE_PAYMENT=false` (đợt E). Nếu muốn giữ → dự án riêng tích hợp Billing |
| A3 | **React Navigation v7** để xử lý 9 cảnh báo bảo mật mức High còn lại của npm | Lỗi nằm trong thư viện điều hướng v6; nâng v7 là thay đổi lớn | Giao Codex trên nhánh riêng, test lại toàn bộ màn hình |
| A4 | **Độ tuổi mục tiêu** (đề xuất 18+) | Ảnh hưởng chính sách Gia đình / xếp hạng | Cập nhật PLAY_STORE_LISTING, chính sách |

## B. Tài khoản & khóa ký

| # | Việc | Ghi chú |
|---|---|---|
| B1 | Có **tài khoản Google Play Console** (phí 25 USD một lần), xác minh danh tính | Nếu là **tài khoản cá nhân tạo sau 13/11/2023**: Google bắt buộc **thử nghiệm kín với ≥12 người trong ≥14 ngày liên tục** trước khi được xin phát hành Production. Tài khoản tổ chức cần số D-U-N-S |
| B2 | **Tạo upload key mới** (keystore cũ có mật khẩu từng lộ trong lịch sử git) | Ví dụ: `keytool -genkeypair -v -storetype PKCS12 -keystore danavi-upload.keystore -alias danavi-upload -keyalg RSA -keysize 2048 -validity 10000`. **Lưu keystore + mật khẩu ở nơi an toàn, KHÔNG để trong repo** |
| B3 | Khai báo khóa trong `~/.gradle/gradle.properties` (máy của anh/chị, không phải repo): `MYAPP_RELEASE_STORE_FILE`, `MYAPP_RELEASE_STORE_PASSWORD`, `MYAPP_RELEASE_KEY_ALIAS`, `MYAPP_RELEASE_KEY_PASSWORD` | Sau đó chạy `cd android && gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`. Báo Claude để kiểm tra AAB |
| B4 | Bật **Play App Signing** khi tạo app trong Play Console (mặc định) | Google giữ khóa ký thật, anh/chị chỉ giữ upload key |
| B5 | **Giới hạn Mapbox token** trong tài khoản Mapbox: token `pk.` chỉ cho scope cần thiết, theo dõi usage; **thu hồi/đổi** token `sk.` (download) nếu từng chia sẻ | Token `pk.` nằm trong app, ai cũng trích được |
| B6 | Đổi các mật khẩu/API key từng lộ trong lịch sử git (danh sách trong `docs/release/SECURITY_AUDIT.md` ở lịch sử git, commit 9c4afa9) | Che trong tài liệu không xóa được khỏi lịch sử git |

## C. Nội dung pháp lý & liên hệ (gửi Claude để điền vào app)

| # | Việc |
|---|---|
| C1 | Hoàn thiện **Chính sách quyền riêng tư** từ `PRIVACY_POLICY_DRAFT.md` (điền các chỗ `[...]`, xác nhận với backend: thời hạn lưu dữ liệu, nhà cung cấp AI) → **đăng lên URL HTTPS công khai** (Google Sites/GitHub Pages/website) |
| C2 | Tạo **trang web yêu cầu xóa tài khoản** (người đã gỡ app vẫn gửi yêu cầu được) → URL. Có thể là một form/email trên cùng trang chính sách |
| C3 | Cung cấp: **email hỗ trợ** (bắt buộc trên Play), tên nhà phát triển hiển thị, website/Facebook nếu có |
| C4 | Xác nhận phía **backend** đang chạy ổn định cho production (Cloud Run, HTTPS), xóa tài khoản `DELETE /me` xóa thật dữ liệu |

→ Gửi C1–C3 cho Claude: điền `src/config/brand.ts` (`privacyPolicyUrl`, `accountDeletionUrl`, email…), link sẽ tự hiện trong màn hình Chính sách/Giới thiệu.

## D. Nội dung cửa hàng

| # | Việc |
|---|---|
| D1 | Duyệt/sửa mô tả ngắn + đầy đủ trong `PLAY_STORE_LISTING.md` |
| D2 | **Feature graphic 1024×500** (JPG/PNG, không trong suốt) |
| D3 | **Ảnh chụp màn hình** điện thoại: 4–8 ảnh (Claude có thể chụp từ máy ảo nếu anh/chị muốn — báo lại) |
| D4 | Icon cửa hàng 512×512: dùng `Danavi_Android_Icon_Kit/play-store/danavi-google-play-512-full-logo.png` |

## E. Trong Play Console (sau khi có AAB đã ký)

1. Tạo ứng dụng "Danavi", ngôn ngữ mặc định Tiếng Việt, loại: Ứng dụng, Miễn phí.
2. **App content**: Chính sách quyền riêng tư (URL C1) · Quyền truy cập ứng dụng (đa số chức năng dùng không cần đăng nhập; nếu cần, tạo tài khoản test cho reviewer) · Quảng cáo: **Không** · Xếp hạng nội dung (gợi ý trả lời trong PLAY_STORE_LISTING) · Đối tượng mục tiêu (A4) · **An toàn dữ liệu** theo `DATA_SAFETY.md` (xác nhận phần backend) · Xóa tài khoản (URL C2) · Ứng dụng tin tức/sức khỏe/chính phủ: Không.
3. Store listing: D1–D4, danh mục Du lịch & Địa phương, email C3.
4. Upload AAB lên **Internal testing** → cài thử trên điện thoại thật (kiểm tra bản đồ, máy ảnh, vị trí, đăng nhập, xóa tài khoản).
5. **Closed testing** (12 người × 14 ngày nếu tài khoản cá nhân) → **Production** → gửi duyệt (thường vài giờ đến 7 ngày).
6. Mỗi lần cập nhật sau: tăng `versionCode` trong `android/app/build.gradle`.

## Việc kỹ thuật Claude đã làm xong (để đối chiếu)
targetSdk 36 + hỗ trợ 16 KB (RN 0.81.6) · tên/biểu tượng/splash Danavi · bỏ quyền vị trí nền, exact alarm, ghi âm · chặn HTTP không mã hóa · khóa ký đọc từ biến ngoài repo · ẩn log ở bản production · xóa tài khoản trong app · ẩn Ủng hộ khi tắt thanh toán · ẩn công cụ test kết nối của dev · dọn 61 tệp thừa, 173 log gỡ lỗi, lỗi TypeScript 45→23. Chi tiết: `PROGRESS.md`.

## Claude có thể làm tiếp khi anh/chị yêu cầu
- Chụp bộ ảnh màn hình cửa hàng từ máy ảo (D3).
- Điền URL/email vào app ngay khi có C1–C3.
- Kiểm tra AAB đã ký (B3): targetSdk, 16 KB, chữ ký, quyền.
- Đổi package name (A1), nâng React Navigation v7 (A3) trên nhánh riêng.
