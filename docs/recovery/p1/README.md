# P1 Android Guest Mode — bằng chứng

Ngày: **19/10/2026 — Asia/Saigon**. Kết quả: **P1 Completed, 6/6 task**.

## Build và môi trường

- SDK: `C:/Android/Sdk`; sửa riêng `sdk.dir` trong `android/local.properties` (ignored), giữ các giá trị local khác. Không sửa env global.
- Node 20.19.4, Java 17.0.12, Gradle 8.8, AGP 8.5.0. Giữ nguyên package/lock/native/autolink.
- Gradle cài NDK 26.1.10909125, CMake 3.22.1 và SDK Platform 35 bằng licenses đã có.
- `android/gradlew.bat assembleDebug --console=plain`: exit 0, `BUILD SUCCESSFUL in 11m 21s`; 648 tasks, 544 executed / 104 up-to-date. Build xác nhận sau sửa JS: exit 0, 21s; 38 executed / 610 up-to-date.
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 219407632 bytes.
- SHA-256: `5B7DCC6DE3BE05F5573B31EEF549262DB52D97EACF4ECC2A6C7289351B9F8D4B`.
- `adb -s emulator-5554 install -r ...`: Success; không uninstall/clear app data.
- `adb -s emulator-5554 shell am start -W -n com.travel/.MainActivity`: Status ok, LaunchState COLD.
- AVD `Pixel_Test`, emulator-5554, Android 14/API 34/x86_64, 320×640. Debug chạy bằng Metro hiện hành ở port 8081; APK này chưa phải bản release độc lập Metro.

## Smoke trên emulator

| Bước | Kết quả |
|---|---|
| Mở app | Home Guest, không login hoặc yêu cầu GPS; chỉ tab Home/Festival |
| Home/Festival Retry | Thông báo catalog tạm tắt vẫn rõ ràng; không loading treo/crash |
| Chuyển Việt → Anh | Nội dung UI/error/retry đổi bằng chuỗi local |
| Cold restart | Home mở lại, giữ ngôn ngữ English đã chọn; sau test khôi phục tiếng Việt |
| Search `danang` | 0 results đúng với catalog đang tắt; không dữ liệu mẫu |
| View All Festivals | 0 results; chỉ keyword, không nút AI Search |
| AI toggle còn sót | Phát hiện khi chạy thật; đã gate cả hai màn ViewAll và test lại |

Ảnh kiểm thử và raw audit tạm đã được dọn theo yêu cầu; bảng trên giữ kết quả đã quan sát, không còn link tới file tạm.

## Network/runtime

Audit đã kiểm tra trước khi dọn có 70 records, 16:53:01–16:58:57. Observer chỉ đếm fetch/XMLHttpRequest trước entry app, giữ nguyên hành vi request; mọi snapshot ghi `xhrExternal=0`, `fetchExternal=0`. Không log URL/header/body/credential. Không fatal/JS errors theo các mẫu FATAL EXCEPTION, Invariant Violation, TypeError, ReferenceError trong log thu. Raw audit đã xóa, không còn artifact để xem lại từng bản ghi.

Observer/config tạm đã được dọn. Metro/AVD do Agent khởi động đã đóng để giải phóng log; không xóa dữ liệu AVD/app. Native sockets, WebSocket và image loader không nằm trong phép đo; không tuyên bố mọi luồng hoặc runtime Mapbox đã nghiệm thu.

## Kiểm tra code và giới hạn

- Tests P1: 3 suites / **9 tests pass** (`guestMode`, `guestNavigation`, `guestTranslation`).
- ESLint hai màn ViewAll và test sửa: exit 0, **0 errors / 4 warnings**.
- Typecheck toàn repo: exit 2, **66 diagnostics**, bằng số lượng đợt P1 trước; không sửa rộng các lỗi ngoài scope. Full Jest toàn repo còn các lỗi đã ghi trong tasklist ở đợt trước, không được coi là đã pass.
- `git diff --check`: pass. Không commit/deploy.
- Chưa nối Cloud Run, chưa test list/detail với dữ liệu thật; không tạo catalog giả. Các phần đó giữ ở P2–P4 và chỉ triển khai khi được yêu cầu.

Theo quy ước bổ sung, code import/tab/route phụ, bubble, GPS/nearby và renderer Items được giữ trong comment để khôi phục sau này. Tests P1 chạy lại 9/9 pass; ESLint 4 file sửa 0 errors/14 warnings. Không rebuild Android trong đợt đổi cách giữ code này; kết quả build/smoke phía trên thuộc phiên P1 trước đó.

Đã dọn raw build/test/Metro/logcat/UI XML, bundle và observer riêng của P1; giữ source/tests, tài liệu tổng hợp và APK build kết quả. Không thay index Git đã được User stage.
