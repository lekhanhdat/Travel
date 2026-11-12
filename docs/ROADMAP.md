# Danavi — Hướng phát triển (backlog)

Cập nhật 2026-11-12. Gom các việc **chưa làm / để lần sau** từ `REDESIGN_PLAN.md`, `REFACTOR_PLAN.md`
(thư mục `D:\Project\Travel\`), `MIGRATION_TASKLIST.md` và các phát hiện khi kiểm thử. Mã task (R-…, UX-…, D-…)
giữ nguyên như trong các plan để tra cứu.

## 1. Cần làm trước khi phát hành
| Việc | Ghi chú |
|---|---|
| Deploy Travel_BE (route `GET /api/v1/memory/conversations/latest`) | Lịch sử chat sau khi đăng nhập lại / máy khác. Trước khi deploy app dùng session id giữ lại khi đăng xuất. |
| Kiểm thử trên máy thật | Chụp ảnh camera, chọn ảnh (camera / đánh giá / chat / avatar), bản đồ (GPU thật), GPS. |
| Việc của chủ dự án | `docs/release/OWNER_TODO.md`, `docs/release/RELEASE_CHECKLIST.md`. |

## 2. Giao diện (REDESIGN_PLAN)
- **Màn Search riêng** (UX bước 2): lịch sử tìm kiếm, gợi ý, lọc theo loại; hiện tìm ở Home + danh sách "Xem tất cả".
- **Map toàn màn hình + bottom sheet** (D-6: spike kỹ thuật trước — cuộn lồng, cử chỉ với bản đồ, a11y).
- **"Lễ hội sắp tới / đang diễn ra"** trên Home — cần BE có ngày bắt đầu/kết thúc chuẩn (D-5 đã duyệt; schema chưa làm).
- **Yêu thích / Lưu địa điểm** (D-10, tuỳ chọn).
- Làm lại bố cục **Bảng tin, Hồ sơ, Cài đặt, Thông tin cá nhân, Chatbot** theo design system (hiện chỉ đổi màu/font/icon).
- Marker "Bạn đang ở đây" trên Map: thay `MarkerView` bằng location puck gốc của Mapbox (hết cảnh báo JNI legacy arch, không đè cluster).
- Dark mode (tokens đã đặt tên theo vai trò để thêm sau).
- A11y & animation (UX-6): kiểm tra font scale, TalkBack, giảm chuyển động.

## 3. Hiệu năng & dữ liệu (REFACTOR_PLAN)
- **R-PERF0** đo baseline + KPI trên release build (TTI Home, RAM, fps Map, bytes ảnh) → `docs/perf/BASELINE.md`.
- **R-IMG1** thumbnail ảnh card trên GCS (ảnh nguồn 300–600 KB/ảnh) + **R-IMG2** `RemoteImage` thay `CachedImage`.
- **R-BE1a/b** đo cold start Cloud Run (~12.8 s) từng bước, tải FAISS lười nếu đáng kể. **D-9** (`minScale`) chưa quyết.
- **R-NAV3a/b** điều hướng theo `kind:id` thay vì truyền cả object/mảng trong params (khôi phục trạng thái, dữ liệu mới).
- **R-MAP2** tách `MapScreen.tsx` (~1.9k dòng) thành hooks: vị trí, chỉ đường, dữ liệu, TTS.
- **R-FEED** Bảng tin phân trang theo BE, dùng `created_at` ISO (bỏ `moment`).

## 4. Bảo trì
- **R-ARCH1** `services/session.ts` — một nguồn tài khoản/token + subscribe.
- **R-I18N1** áp ngôn ngữ trước render đầu; **R-I18N2** một lớp i18n (bỏ dần `TranslationContext`).
- **R-API1/2** gộp semantic/detect vào `apiCall`; thay `rn-fetch-blob` (ngừng bảo trì) bằng `fetch` + `FormData`.
- **R-TS1** `tsc` về 0 lỗi (còn 10: InputBase, NavigationService, NewFeedScreen, Policy, i18n/index, LocalStorageCommon), CI chạy tsc.
- **R-DEP** gỡ gói không còn cần: `react-native-iphone-x-helper` (thay bằng safe-area), `rn-fetch-blob`,
  `react-native-root-siblings`, `react-native-reanimated` (nếu bottom sheet không dùng). Mỗi gói một commit + build release.
- npm audit: 9 high (chuỗi React Navigation v6, markdown-it) → cân nhắc nâng React Navigation v7.
- New Architecture (Fabric/TurboModules) khi các thư viện legacy-only có bản hỗ trợ.

## 5. Tính năng / nợ cũ (MIGRATION_TASKLIST)
- **N1** Quên mật khẩu qua email — code xong cả 2 đầu (BE gửi OTP qua **Gmail SMTP** + App Password, app đã mở
  lại màn `ForgotPasswordScreen`). Còn: thêm `SMTP_USER` + `SMTP_APP_PASSWORD` vào secret `travel-app-config`,
  thêm `email` vào `APP_FEATURES`. Giới hạn Gmail ~500 mail/ngày. Khi module tắt, app báo "sẽ có ở bản sau".
- Chat: danh sách nhiều cuộc trò chuyện (BE đã lưu theo `session_id`), xoá từng cuộc.
- Các nợ N2–N4 và P13/P14: xem `MIGRATION_TASKLIST.md`.

## Ghi chú môi trường
- Emulator dùng GPU phần mềm không vẽ được style Mapbox (chỉ còn nước/đất). Chạy AVD với `-gpu host`.
- Một số system image emulator không có trình chọn ảnh hệ thống; app tự chuyển sang trình chọn tệp (`ContentPickerModule`).
