# Migration Tasklist — Travel App

Theo [MIGRATION_AUDIT.md](MIGRATION_AUDIT.md): quyết định (mục 2), kiểm kê F01–F38 (mục 3), kiến trúc đích (mục 5), danh sách Clean CF/CB (mục 6), chi phí + key (mục 7). Mỗi phase chỉ bắt đầu khi User duyệt; xong thì tick và ghi một dòng nhật ký.

**Thứ tự:** P0–P12 ✅ (N2 PayOS bật cùng P10) → P13 nghiệm thu Android → P14 phát hành. Sau đó: Nợ N1–N4. Refactor/tối ưu: Backlog.

**Quy tắc:** dùng lại / mở comment code có sẵn, không viết lại tính năng tương tự. Không xóa code/tài liệu có sẵn trước P12. Không dữ liệu fix cứng, không secret trong repo. Dịch vụ bên thứ ba chỉ gọi qua BE, key ở Secret Manager `travel-app-config`. NocoDB → Neon, DigitalOcean → Cloud Run, sau migration không còn dính dáng (P12.9). Không copy dữ liệu export vào repo.

**Gate mỗi phase:**
- FE: jest nhóm CI (`.github/workflows/ci.yml`, thêm test mới vào danh sách) pass; `tsc` ≤ 55 (từ P12); eslint không lỗi mới.
- BE: toàn bộ `tests/check_*.py` (fake DB/provider) pass.
- CI xanh 2 repo; diff không secret, không URL NocoDB/DO mới; app không gọi thẳng OpenAI/SerpAPI/SendGrid/PayOS.
- Neon chỉ đổi qua migration mới trong `Travel_BE/db/schema/` (User chạy); deploy theo `Travel_BE/deploy/README.md` (User chạy).
- File tạm của phase (script một lần, bundle/index thử, file duyệt) xóa trước khi đóng phase.

## P0–P4 — Guest catalog + Map ✅
- [x] P0 Baseline 123/82/49, test core + contract BE/FE, CI 2 repo
- [x] P1 Bỏ dữ liệu fix cứng (constants, bản dịch catalog theo ID), empty state
- [x] P2 `catalogRepository` (1 lượt tải, chỉ mục), thống nhất `id`, timeout/retry; BE gzip + ETag (payload ~125 KB)
- [x] P3 "Gần bạn" (xin quyền khi bấm), search bỏ dấu, liên kết festival ↔ location, pull-to-refresh
- [x] P4 Map: marker `publishable`, định vị Fused, chỉ đường 1 request, popup, Advise. P4.4 (gỡ code comment) bỏ qua theo User

## P5 — Nền BE: key, secret, auth + accounts ✅
- [x] P5.1 Kiểm tra key bằng endpoint miễn phí (kết quả: audit mục 7.1)
- [x] P5.2 FE chỉ đọc 3 biến public từ `.env` (`babel.config.js` allowlist, `env.ts`); bundle không còn key; CI tsc ≤ 62
- [x] P5.3 BE module qua `APP_FEATURES`, secret JSON `APP_CONFIG_JSON` (Secret Manager `travel-app-config`)
- [x] P5.4 Migration `007_auth.sql` + quyền `002_auth.sql`; import seed 3 accounts + 7 transactions
- [x] P5.5 `core_api/auth.py`: signup, login (hash cũ → scrypt), `/me` xem/sửa/xóa, đổi mật khẩu; JWT 30 ngày + `token_version`; rate limit
- [x] P5.6 `core_api/email.py` (quên mật khẩu) — có code, module tắt (Nợ N1)
- [x] P5.7 Test `check_auth.py`, hợp đồng auth trong `check_contract.py`, `__tests__/env.test.js`

**Nghiệm thu:** deploy `sha256:d06a0c3c…` — `/health` báo `auth: operational`, catalog bình thường; User đăng nhập tài khoản seed bằng mật khẩu cũ thành công (30/10).

## P6 — FE: Đăng nhập, Đăng ký, Profile, Hồ sơ, Settings ✅
- [x] P6.1 `src/services/api.client.ts` (base `API_BASE_URL`, timeout 12 s, chỉ GET retry 1 lần, lỗi tiếng Việt từ BE); `auth.api.ts` gọi BE, giữ tên hàm; app chỉ lưu `AUTH_TOKEN` + hồ sơ `AVT`, không lưu mật khẩu; token bị từ chối (401 + `WWW-Authenticate`) → tự đăng xuất, sai mật khẩu thì không
- [x] P6.2 `IAccount`: `id`, bỏ `password`; sửa `HomeScreen`, `Personal`, `Donation`, `ForgotPasswordScreen`
- [x] P6.3 Mở route `LoginScreen`, `SignUpScreen`, `Personal` + tab Profile; `ENABLE_AUTH = true`; Login xong quay lại màn trước (hoặc Home); "Quên mật khẩu" báo "sắp có" (`ForgotPasswordScreen` giữ comment — Nợ N1)
- [x] P6.4 `Personal`: sửa hồ sơ, đổi mật khẩu (lưu token mới), xóa ảnh đại diện; đổi ảnh tắt theo `ENABLE_UPLOAD` tới P7.4
- [x] P6.5 Xóa tài khoản: nút trong `Personal` → modal cảnh báo + mật khẩu → `DELETE /me` → Home. Còn: link web xóa tài khoản trong `Policy.tsx` (P14.5)
- [x] P6.6 `src/utils/requireLogin.ts` (guest → thông báo + Login); Profile: "Thông tin tài khoản" mời đăng nhập, nút Đăng nhập/Đăng xuất theo trạng thái, đăng xuất xong về Home; Chatbot (P9) và Ủng hộ (N2) báo "sắp có" thay vì điều hướng tới route chưa có
- [x] P6.7 Settings/FAQ/Policy/About có lối vào qua tab Profile; đổi ngôn ngữ UI dùng `LanguageDropdown` sẵn có
- [x] Test: `__tests__/services/auth.api.test.js` (11), `__tests__/authFlow.test.js` (9), `guestNavigation` (route + tab Profile), `guestMode` (Home chỉ đọc hồ sơ local); đã thêm vào CI

**Nghiệm thu:** User thử trên emulator 30/10 — đăng ký, đăng nhập (cả tài khoản seed), sửa hồ sơ, đổi mật khẩu, đăng xuất (về Home), đổi ngôn ngữ, xóa tài khoản; guest vẫn xem catalog/map: pass.

## P7 — Upload ảnh + reviews ghi qua BE + Bảng tin (F15–F18) ✅
Phụ thuộc: P6. Ước lượng: BE M + FE M.
- [x] **P7.0 Chốt nhà cung cấp ảnh.** imgbb trả 103 cả từ Cloud Run Singapore (30/10, chặn theo tài khoản) → **GCS** bucket `travel2026-511805-uploads` (`us-central1`, Always Free; public-read; runtime SA ghi bằng ADC, không key; lifecycle xóa `tmp/` sau 1 ngày cho detect P8).
- [x] **P7.1 BE `POST /uploads`** (JWT, `image/jpeg|png|webp` theo chữ ký file, ≤ 2 MB, 20 ảnh/user/ngày) → trả `{url}`.
  - `core_api/uploads.py`: `store_image` dùng chung cho upload + detect P8 (`temporary=True` → `tmp/`, thay tham số `expiration` của imgbb); GCS JSON API bằng urllib + token metadata (không thêm `requests`); bỏ comment `python-multipart`. Module `uploads` + env `UPLOAD_BUCKET`.
  - Test: `tests/check_uploads.py` (415, 413, 401, 429, nhà cung cấp lỗi → 502).
- [x] **P7.2 Migration `008_reviews.sql`** (`reviews`, `review_reports`, index `location_id`/`festival_id`, quyền runtime). Bảng bắt đầu rỗng.
- [x] **P7.3 BE reviews + rating.**
  - Endpoint: `GET /reviews?location_id|festival_id&limit&offset` (công khai, không email), `POST /reviews` (JWT, 1–5 sao, giới hạn độ dài, ảnh phải từ `/uploads`), `DELETE /reviews/{id}` (chủ review), `POST /reviews/{id}/report`; rate limit.
  - Catalog: `rating` = AVG review hiển thị + `review_count`; mảng `reviews` trả `[]` tới khi bỏ cột ở P12.
  - Dùng lại: shape `IReview`/`IFestivalReview`, `calculateAverageRating`, `core_api/catalog.py` (ETag).
  - Test: `tests/check_reviews.py` (tạo/đọc/xóa/report, rating đúng, review ẩn không tính, ETag đổi); `check_contract.py` thêm `review_count`.
- [x] **P7.4 FE service:** `locations.api.getReviews/createReview/uploadImage`, `festivals.api.addReview` gọi BE (giữ chữ ký); adapter thêm `review_count`; mở nút đổi avatar (`Personal`).
- [x] **P7.5 FE Bảng tin + Detail.**
  - Sửa: `AppContainer.tsx:26,258-274` (mở `NewFeedScreen` + tab Feed), `ENABLE_FEED`, `ENABLE_UPLOAD`; `DetailLocation`/`DetailFestival` đọc `GET /reviews`; nút "Báo cáo" trong `ReviewItem`.
  - Dùng lại: toàn bộ `NewFeedScreen` (BottomSheet, sao, `launchImageLibrary`, lọc địa điểm).
  - Nghiệm thu: review có ảnh hiện ở Feed + Detail, rating cập nhật; guest đọc được, viết thì mời đăng nhập.
  - Test: `__tests__/newFeed.test.js`; `guestNavigation.test.js` (tab Feed).

**Nghiệm thu P7:** luồng review đầy đủ trên emulator; không request NocoDB/Firebase — User thử emulator 30/10: pass.

**Deploy P7 (30/10):** bucket `travel2026-511805-uploads`, migration 008 + quyền 003 (kiểm live PASS); image `sha256:66e11a46…` → revision `travel-api-00006-rx4` (100% traffic); rollback về `travel-api-00005-82j`. Smoke: `uploads`/`reviews` operational, ready, `/reviews` rỗng, catalog có `review_count`.

## P8 — Bảng `objects` (Items = Objects) + Camera / nhận diện (F19, F20) ✅
Phụ thuộc: P7. Ước lượng: BE M + FE S.
- [x] **P8.1 Dữ liệu:** `009_objects.sql` (`record_id`, `title`, `content`, `images`, `video`, `location_id` FK nullable, `aliases`); script import một lần từ `objects.json` (11 bản ghi, gồm 9 của `data.py`); xóa script sau khi đối chiếu.
- [x] **P8.2 BE `GET /objects`** (phân trang, gzip/ETag; dùng lại `core_api/catalog.py`, `models.py`). Test: `check_core_api.py`, `check_contract.py`.
- [x] **P8.3 BE `/detect` bật lại.** `core_api/detect.py` (module `detect`, cần `auth` + `uploads`): port pipeline `service.get_object_name/get_full_description` (cùng prompt; Lens → OpenAI → khớp `objects` theo title/alias rồi prompt "available object" → mô tả DB, không khớp thì OpenAI viết). OpenAI/SerpAPI gọi bằng urllib (image không cần SDK/Firebase/NocoDB). Ảnh tạm `store_image(temporary=True)` → `tmp/<ngày>/` (≤ 8 MB, lifecycle 1 ngày). Quota 5/user/ngày + 8/ngày tổng (SerpAPI free 250/tháng). Key `OPENAI_API_KEY`, `SERPAPI_KEY` → `travel-app-config:2`; Cloud Run timeout 60 s.
  - Test: `tests/check_detect.py` (khớp title/alias/OpenAI → mô tả DB; không khớp → OpenAI; 404; 413/415; 429 user + tổng; lỗi nhà cung cấp/GCS → 502; key không lọt log).
- [x] **P8.4 Bỏ theo User (31/10):** `objects` là dữ liệu admin (xem trên Neon) cho `/detect` + RAG, không hiện trong app; Items/`DetailItem`/`ViewAllItem` giữ tắt (`ENABLE_ITEMS = false`). Kế hoạch cũ: ~~**FE Items:** `locations.api.getItems/getItemsWithLocationId` → `GET /objects` (nạp lười; `title`→`name`, `content`→`description`); khôi phục JSX mục Items ở `FestivalsScreen` từ `git show 3583e90^:src/container/screens/Festival/FestivalsScreen.tsx` + renderer (`:114-118`); mở route `DetailItem`, `ViewAllItem` (`AppContainer.tsx:41-42,353-358`); `ENABLE_ITEMS`; `IItem.Id` → `id`; `DetailItem.tsx:15` bỏ `DB_URL`. Test: `__tests__/items.test.js`.~~
- [x] **P8.5 FE Camera:** mở `CameraScreen`, `PreviewImage` + tab Camera (`AppContainer.tsx:28,32,289-303,337-339`); `SERVER_URL` → `API_BASE_URL` (`CameraScreen.tsx:96,186`, `PreviewImage.tsx`); gửi JWT; `ENABLE_CAMERA`. Test: `__tests__/camera.test.js`.

**Nghiệm thu P8:** chụp hiện vật → tên + mô tả (từ `objects` khi khớp) qua Cloud Run — User thử emulator 31/10: pass.

**Deploy P8 (31/10):** migration 009 + quyền 004, import 11 objects; `travel-app-config:2` (+ `OPENAI_API_KEY`, `SERPAPI_KEY`); image `sha256:c13a57a3…` → revision `travel-api-00007-68l` (100%); rollback về `travel-api-00006-rx4`.

## P9 — AI: semantic search, tương tự, gợi ý, chatbot RAG, bộ nhớ (F21–F26) ✅
Phụ thuộc: P6, P8. Ước lượng: BE L + FE M.
- [x] **P9.1 Index FAISS từ Neon lúc build image:** `scripts/build_faiss_index.py` + `utils/startup_indexer.build_indexes_from_database` (locations/festivals/objects, `entity_id` = id Neon, metadata có `content` + `image_url`); bước Cloud Build trước `docker build` (secret DB + `travel-app-config:2`), không build khi startup; `faiss-cpu`, `numpy` (OpenAI gọi REST qua `core_api/openai_http.py`, không SDK); Dockerfile COPY `routers/`, `services/`, `models/`, `utils/`, `faiss_indexes/`; smoke kiểm 123 + 49 + 11 vector, `location 1` = "An Phú Farm". Test: `tests/check_indexer.py`.
- [x] **P9.2 Migration `010_ai_memory.sql`** + `services/memory_service.py` đọc/ghi Neon (giữ chữ ký hàm); bảng bắt đầu rỗng.
- [x] **P9.3 Bật router** `search`, `chat`, `memory`, `recommendations` (module `ai`); search/similar công khai (rate limit/client), chat/memory/gợi ý cần JWT (user lấy từ token, user khác → 403); quota chat 30 câu/user/ngày; `/health` báo index; RAG lấy ngữ cảnh từ `objects` + catalog (ngưỡng 0.3); `objects` không bao giờ trả cho app (chỉ làm ngữ cảnh). Xóa tài khoản xóa luôn memory + hội thoại. Test: `tests/check_ai_routes.py`.
- [x] **P9.4 FE semantic:** `semantic.api.ts:275-276` → `API_BASE_URL` + token; `ENABLE_AI`; dùng lại `SemanticSearchBarComponent`, `ViewAll*` (`isSemanticSearch`), `SimilarItemsComponent`, `RecommendationsWidget`; lỗi → tự về keyword.
- [x] **P9.5 Chatbot qua BE:** `chatbot.api.sendChatMessage` → `chatWithRAG` (giữ chữ ký, session lưu máy, BE giữ lịch sử); ảnh đính kèm = URL `/uploads` của chính user; "xem ảnh" lấy ảnh catalog từ `sources` (bỏ tìm ảnh SerpAPI: 250 lượt/tháng dành cho detect); mở route `ChatBotScreen`, Profile + `FloatingChatBubble` (guest → Login); system prompt chuyển vào `rag_service`. Test: `__tests__/chatbot.test.js`.
- [x] **P9.6 Sửa suite hỏng từ trước:** `@testing-library/react-native@12.9.0` (devDependency); `semantic.api.test.ts` (mock `axios.create`, reset cache), `RecommendationsWidget.test.tsx`, `SimilarItemsComponent.test.tsx` (mock `iphone-x-helper`, `AppContainer`); cả 3 vào CI.

**Nghiệm thu P9:** search "biển đẹp" ra bãi biển; Detail có "tương tự"; Home có gợi ý khi đăng nhập; chatbot trả lời kèm nguồn; ghi chi phí OpenAI đợt thử. — User thử emulator 31/10: pass.

**Deploy P9 (31/10):** migration 010 + quyền 005; index build lúc build image (183 vector: 123 + 49 + 11); image `sha256:23aafe4d…` → revision `travel-api-00008-fxl` (100%); rollback về `travel-api-00007-68l`. Smoke: module `ai` operational, ready, "biển đẹp" → An Bàng, Thanh Bình, Bắc Mỹ An.

## P10 — Payment: bỏ NocoDB/DO, chuyển sang Neon/Cloud Run, giữ tắt (F27, F28) ✅
Phụ thuộc: P5. Ước lượng: BE S–M + FE S.
- [x] **P10.1** Quyền `db/permissions/006_payments.sql` (SELECT/INSERT/UPDATE trạng thái `transactions`, UPDATE `accounts.balance`; không đổi schema — thay cho tên `011_payments` dự kiến), test, **chưa áp dụng**.
- [x] **P10.2** `core_api/payments.py` `PaymentsRepository` (Neon) thay `create_transaction`, `get_user_by_id`, `update_user_balance` của `nocodb_service.py` (giữ chữ ký) + `mark_paid` (một transaction, khóa dòng).
- [x] **P10.3** Module `payments` (3 key PayOS, cần `auth`; **không bật** trong `service.yaml`): `/payments/create` (user từ JWT, ghi PENDING trước khi tạo link), `/payments/status/{order_code}` (chỉ chủ giao dịch), `/webhook/payos` (bắt buộc chữ ký HMAC-SHA256, idempotent theo `order_code`, sai số tiền không cộng), `/payment/return|cancel`; URL trả về = Cloud Run; SDK `payos` chỉ import khi bật. Test: `tests/check_payments.py`.
- [x] **P10.4** FE `payment.api.ts` → `apiCall` (`API_BASE_URL` + token, không gửi `userId`); `Donation` giữ comment; "Ủng hộ" vẫn báo "sắp có". Test: `__tests__/services/payment.api.test.js`.

**Nghiệm thu P10:** code payment không còn NocoDB/DO; test PASS; không endpoint payment public. — User thử emulator 31/10: tạo mã để PENDING, tạo mã mới và quét → PAID, số dư cộng đúng: pass.

**Bật N2 cùng P10 (31/10, theo User):** PayOS qua REST (không SDK), chữ ký kiểm thật (tạo link 2.000 đ rồi hủy); `travel-app-config:3` (+3 key PayOS), quyền 006; image `sha256:4899a943…` → revision `travel-api-00009-2ml` (100%), rollback về `travel-api-00008-fxl`; webhook `…/webhook/payos` đăng ký qua `confirm-webhook` (PayOS gửi thử → 200). FE mở `Donation` + mục "Ủng hộ". Còn: giao dịch thật trên emulator.

## P11 — i18n UI, nội dung tiếng Anh, Hotels trong search (F31–F33) ✅
Phụ thuộc: P9. Ước lượng: BE S + FE M + dữ liệu S.
- [x] **P11.1 Tiếng Anh ở Neon:** `012_i18n_content.sql` — một cột `content_en JSONB` (theo trường) cho locations/festivals/hotels/objects, thay vì nhiều cột `*_en`; API trả `content_en`; `translationHelpers` nhận bản ghi, chọn `content_en[field]` khi en, thiếu thì tiếng Việt. Test: `translationHelpers.test.ts`, `check_contract.py`.
- [x] **P11.2 Script dịch một lần** `scripts/translate_content.py` (gpt-4o-mini): `draft` (đọc Neon → file duyệt ngoài repo) → User duyệt → `apply` (chỉ ghi trường còn trống); xóa script + file duyệt sau khi ghi.
- [x] **P11.3 i18n UI:** ~140 chuỗi cứng của Feed, ReviewItem, Donation, Camera/Preview, Chatbot, Login, SignUp, Personal → `common:ui.*` (vi/en).
- [x] **P11.4 Hotels trong search:** `catalogRepository.getHotels()` nạp lười ở lần gõ đầu (Home); `adaptHotel` gắn `kind: 'hotel'`; semantic search không ghép id hotel (trùng id location), hotel thêm theo từ khóa; Detail của hotel không gọi review/lễ hội/tương tự. Test: `catalog.api.test.js`, `guestMode.test.js`.
- [x] **P11.5 Nhãn `types`:** 94 slug → `common:types.*` vi/en; search khớp slug + nhãn hai ngôn ngữ ("bảo tàng" → `museum`). Test: `catalogSearch.test.js`.
- [x] **P11.6** `languageSwitching.test.tsx` chạy được (thư viện test từ P9) + kiểm `ui.*` đủ vi/en; thêm vào CI.

**Nghiệm thu P11:** en → UI tiếng Anh, record có `*_en` hiện tiếng Anh; search ra hotels; "bảo tàng" khớp `museum`.

**Deploy P11:** migration 012; image `sha256:13d7999b…` → revision `travel-api-00010-bqm` (100%), rollback về `travel-api-00009-2ml`. Dịch xong 02/11: 123 locations, 49 festivals, 82 hotels, 11 objects (script + file duyệt đã xóa).

## P12 — CLEAN ✅ (User duyệt bảng rà soát 03/11; một commit mỗi repo theo User)
- [x] P12.1 Rà lại bằng chứng từng mục trước khi xóa. Giữ: `get_image_embedding` (search kiểu IMAGE vẫn gọi), CF20 (để P14), `BackgroundGeolocation`, `ForgotPasswordScreen`, email/payment.
- [x] P12.2 FE code chết/trùng + Items: CF1–CF5, CF7, CF8, CF10–CF13, CF23 (`RECOVERY_MODE`, `ENABLE_NOCODB`, `ENABLE_ITEMS` bỏ). Theo User 03/11: giữ SVG/ảnh hay dùng; xóa `ChatBubble`, `SearchBarComponent` (bản đang dùng: `FloatingChatBubble`, `SemanticSearchBarComponent`); bỏ Haversine trùng (`HomeScreen`, `MapScreen` dùng `utils/haversineDistance`); `MapScreenV2` → `MapScreen` (Map v1 Google Maps đã xóa từ `1570328`). Test mới `__tests__/floatingChatBubble.test.js` (CI).
- [x] P12.3 FE bỏ NocoDB/DO/gọi thẳng bên thứ ba: CF6, CF9 (`axios.ts`, `utils/configs.ts`; `env.ts` chỉ còn `API_BASE_URL`, `MAPBOX_ACCESS_TOKEN`), CF14.
- [x] P12.4 FE bỏ Azure: CF21 — xóa `services/translation/` + 2 test; `TranslationContext` chỉ đọc i18n; HOC đổi tên `withTranslation` (giữ logic: cấp `t`/`language` cho 8 class screen).
- [x] P12.5 FE dependency + script: CF15, CF16 (19 package, rule proguard tương ứng). **Còn: User chạy `npm ci` + `npm run android:fresh`.**
- [x] P12.6 FE asset + file build: CF17 (11 ảnh, 64 SVG, 22 font NotoSansJP/Roboto ~35 MB), CF22 (APK 89 MB, bundle, baselineProfiles khỏi cây + `.gitignore`).
- [x] P12.7 Tài liệu: CF18, CF19, CB10 xóa; `README.md` FE/BE cập nhật tại chỗ từ bản cũ (tính năng có trạng thái, kiến trúc, cài đặt, API, schema, deploy, mục "Chức năng có thể mở rộng"; bỏ code mẫu, tham khảo, đóng góp, lời cảm ơn); `deploy/README.md`, `db/README.md` viết lại ngắn.
- [x] P12.8 BE: CB1–CB9, CB14 (NocoDB/Firebase/DO/`main.py`/`Procfile`/`.do`/route chết trong `app.py`/`faiss_indexes/` khỏi git); CB13 = `013_drop_legacy_catalog_columns.sql` + bỏ `reviews` khỏi model/contract (FE vẫn nhận `reviews: []` của API cũ; thẻ lễ hội hiện `rating`/`review_count`). Migration 013 đã chạy (không còn cột cũ); deploy `:phase12`. Còn: CB12 + U20 sửa `.env`.
- [x] P12.9 Xác nhận sạch: `git grep` NocoDB/DO 2 repo = 0 (trừ MIGRATION_*, comment 2 migration đã chạy 009/010); `src` FE không còn `firebase|azure|microsofttranslator|unsplash|api.openai.com|serpapi.com|sendgrid.com`.
- [x] P12.10 Lint/tsc: `jest.setup.js` khai báo môi trường jest (`eslint .` 22 → 6 lỗi, còn exhaustive-deps cũ); tsc 62 → 55, baseline CI = 55.
- [x] P12.11 Public repo (User 03/11): README 2 repo bỏ URL production, định danh GCP/bucket/secret, chi tiết đường dẫn API (mục API = bảng theo module + Swagger local); BE `api_docs_enabled` tắt `/docs`, `/redoc`, `/openapi.json` trên Cloud Run (`K_SERVICE`), bật lại bằng `API_DOCS=on`; test trong `check_core_api.py`. Deploy `travel-api-00012-nc7` (`690141cc…`): 3 đường dẫn tài liệu 404, API 200.

## P13 — Nghiệm thu Android toàn app
- [ ] P13.1 Build debug từ `.env` tối giản (`CATALOG_API_URL`, `API_BASE_URL`, Mapbox `pk.`); nếu Gradle lỗi tải SDK Mapbox: download token `sk.` (`DOWNLOADS:READ`) trong `~/.gradle/gradle.properties`
- [ ] P13.2 Cold start → Home → list → detail → festival → map → back; restart; "Gần bạn" từ chối/cho phép quyền; pull-to-refresh
- [ ] P13.3 Mất mạng → thông báo ≤ 30 s; có mạng lại thì Thử lại thành công
- [ ] P13.4 Network chỉ tới Cloud Run, host ảnh, Mapbox
- [ ] P13.5 Tài khoản: đăng ký → đăng nhập (cả seed) → hồ sơ/avatar → đổi mật khẩu → đăng xuất → xóa tài khoản
- [ ] P13.6 Nội dung: review có ảnh → Feed/Detail/rating → báo cáo; Camera nhận diện
- [ ] P13.7 AI: semantic search, tương tự, gợi ý, chatbot (văn bản + ảnh)
- [ ] P13.8 Ngôn ngữ vi/en; Hotels trong search; từ chối mọi quyền không crash
- [ ] P13.9 Sửa `__tests__/App.test.tsx` và đưa vào CI; full jest không còn suite hỏng
- [ ] P13.10 Máy thật + emulator; ghi thiết bị/OS, chi phí thực tế (GCP, OpenAI, SerpAPI) vào nhật ký

## P14 — Phát hành
- [ ] P14.1 Rotate key đã lộ (OpenAI, SendGrid, SerpAPI, imgbb, PayOS, Mapbox secret); thu hồi key dịch vụ bỏ hẳn (NocoDB, Unsplash); vô hiệu tài khoản trong `authConstants` cũ (lịch sử git)
- [ ] P14.2 Signing ra khỏi `build.gradle` (`:106-125` có `storePassword` dạng chữ); Play App Signing
- [ ] P14.3 Bỏ quyền thừa (CF20); tắt cleartext; tăng `versionCode`
- [ ] P14.4 Giữ billing guard 26.000 VND (D4); cảnh báo chi phí GCP; theo dõi số dư OpenAI
- [ ] P14.5 Play Console: Data safety, privacy policy URL, link xóa tài khoản, khai báo UGC, tài khoản test "App access"
- [ ] P14.6 Build release, phát hành; sau đó tắt NocoDB, thu hồi token NocoDB
- [ ] P14.7 Login lên đầu: chưa có token → `LoginScreen` (dùng lại `NavigationService.reset(ScreenName.LOGIN_SCREEN)`), có token → Home; cập nhật test điều hướng

## Nợ (sau migration)
- [ ] **N1 Quên mật khẩu qua email:** chọn nhà cung cấp (key SendGrid còn hiệu lực nhưng chưa thử gửi), thêm key vào `travel-app-config`, bật module `email` (code có ở P5.6), mở `ForgotPasswordScreen` + route, test email thật.
- [x] **N2 PayOS / Donation:** 3 key PayOS vào secret, áp dụng `db/permissions/006_payments.sql`, PayOS gọi REST (không cần SDK), chữ ký kiểm bằng link thật 2.000 đ, bật module `payments`, webhook `https://travel-api-u2xcse44ca-as.a.run.app/webhook/payos` trên my.payos.vn, mở `Donation`, giao dịch thật → số dư tăng đúng 1 lần. — **Xong 31/10 cùng P10.**
- [ ] **N3 i18n nâng cao / dịch tự động** nếu cần thêm ngôn ngữ hoặc dịch nội dung người dùng.
- [ ] **N4 Seeding:** sau P7 tạo tài khoản mẫu + review như reviewer, qua API (không fix cứng, không SQL tay).

## Hoàn thiện tính năng (rà README cũ 03/11 — chờ User duyệt thứ tự)
Tính năng có giao diện/API nhưng chưa chạy thật (🧩 trong `README.md`). Không phải do P12 xóa.
- [ ] **R1 Gợi ý cá nhân hóa:** ghi sở thích vào `user_memories` (vd. xem chi tiết, đánh giá ≥ 4 sao, chủ đề hỏi chatbot) để `/api/v1/recommendations` không chỉ trả mục phổ biến. BE S + FE S.
- [ ] **R2 Gợi ý từ khóa khi gõ:** gắn `debouncedGetSuggestions` (`/api/v1/search/suggestions`) vào `SemanticSearchBarComponent`. FE S.
- [ ] **R3 Tìm bằng ảnh:** `search_type=image` luôn lỗi (image không có CLIP) — bỏ nhánh hoặc chuyển sang `/detect`. BE S.
- [ ] **R4 Cài đặt:** Xóa bộ nhớ đệm làm thật (`catalogRepository.clear` + cache ảnh); Dịch vụ vị trí → mở cài đặt quyền hệ thống; Thông báo đẩy (cần FCM), Tự động đồng bộ, Chế độ tối → làm hoặc ẩn. FE S–L.
- [ ] **R5 Lịch sử giao dịch:** `GET /payments/history` (chỉ của user trong JWT) + màn hình trong Hồ sơ. BE S + FE S.
- [ ] **R6 Giới thiệu / SOS:** URL thật (website, mạng xã hội, Play Store), nút SOS gọi số khẩn cấp thay số cá nhân cố định trong `ProfileScreen.tsx`. FE S (cùng P14).
- [ ] **R7 PayOS confirm-webhook:** `confirm_webhook` + `/payment/webhook-info` (xóa ở P12 cùng `payment_service.py`, đã dùng một lần ở N2) — viết lại thành script khi cần đổi URL webhook. BE S.
- [ ] **R8 Ý tưởng chưa có code:** lọc lễ hội theo tháng (`getFestivalsByMonth` có ở `git show 7e17613:src/services/festivals.api.ts`), lưu yêu thích, chia sẻ, nhắc lịch lễ hội, gom cụm marker, bản đồ offline.

## Cần User (còn mở)
- [ ] **U5** Đổi/vô hiệu các tài khoản từng có mật khẩu dạng chữ trong `authConstants.tsx` (lịch sử git) — cùng P14.1.
- [ ] **U7** Dữ liệu: 21 festival chưa có `location_id`; bổ sung dần trên Neon khi muốn.
- [ ] **U16** Emulator Pixel_8_API_34 kẹt "offline": chạy `emulator -avd Pixel_8_API_34 -no-snapshot-load -gpu swiftshader_indirect`, rồi `npx react-native run-android`; GPS giả `adb emu geo fix 108.2270 16.0611`.
- [ ] **U20** `.env` FE chỉ còn `CATALOG_API_URL`, `API_BASE_URL`, `MAPBOX_ACCESS_TOKEN` (hiện còn `DB_URL`, `NOCODB_TOKEN`, `SENDGRID_API_KEY`, `PASSWORD_SALT`, `OPENAI_API_KEY`, `SERPAPI_KEY` và thiếu 2 URL — code có mặc định Cloud Run). Chuyển `SENDGRID_API_KEY` sang `.env` BE nếu cần cho N1. `.env` BE: xóa `NOCODB_*` (CB12), `IMGBB_API_KEY`, `FAISS_INDEX_DIR`.
- **Mỗi phase có DB/deploy:** User chạy migration (owner `DATABASE_URL_UNPOOLED` trong `.env` BE) và deploy theo `Travel_BE/deploy/README.md`; agent soạn lệnh cụ thể khi tới phase.

## Backlog
- [ ] Cảnh báo giọng nói khi tới gần địa điểm (khối `BackgroundGeolocation` comment trong `MapScreen.tsx`)
- [ ] Refactor (class component → hook, gộp 2 `ImageSvg`, tách `MapScreen`), tối ưu hiệu năng
- [ ] Endpoint detail / bỏ `long_description` khỏi list
- [ ] pgvector thay FAISS nếu FAISS-trong-image không đủ

## Nhật ký
| Ngày | Phase | Kết quả |
|---|---|---|
| 29/10/2026 | P0 | Test core/contract BE + FE, CI 2 repo. FE `7ef3fce`, BE `7e0c1d6` |
| 29/10/2026 | P1 | Bỏ dữ liệu fix cứng + bản dịch catalog theo ID; empty state. FE `6bcf28d` |
| 29/10/2026 | P2 | `catalogRepository`, `id` thống nhất, timeout/retry; BE gzip + ETag deploy `6ece2540…`. FE `da4dff1` |
| 30/10/2026 | P3 | Gần bạn, search bỏ dấu, liên kết festival ↔ location, pull-to-refresh. FE `040662b` |
| 30/10/2026 | P4 | Map + sửa định vị/camera sau thử emulator. FE `d9d79a8` |
| 30/10/2026 | Kế hoạch | Kiểm kê 38 tính năng; User chốt quyết định (audit mục 2); kiểm tra key; thêm P5–P14 + Nợ |
| 30/10/2026 | P5 | Auth + accounts BE, FE chặn lộ key; migration 007 + quyền 002, import 3 accounts + 7 transactions; deploy `d06a0c3c…`; đăng nhập seed OK. FE `39fc44a` (jest 122 pass, tsc 62); BE PASS |
| 30/10/2026 | P6 | `api.client` + `auth.api` qua BE; Login/SignUp/Personal/Profile mở lại; xóa tài khoản; `requireLogin`; đăng xuất về Home. Jest CI 13 suite 142 pass, tsc 62. User nghiệm thu emulator: pass |
| 30/10/2026 | P7 | imgbb 103 cả từ Cloud Run → GCS; `/uploads`, `/reviews` (+report, ẩn sau 3 báo cáo), rating/`review_count` từ bảng reviews; migration 008 + quyền 003; Feed/Detail/avatar. Deploy `travel-api-00006-rx4` (`66e11a46…`). Jest CI 14 suite 154 pass, tsc 62; BE 6 test PASS. User nghiệm thu emulator: pass |
| 31/10/2026 | P8 | Bảng `objects` (11, admin/RAG, không hiện trong app); `/detect` port pipeline cũ (Lens → OpenAI → khớp `objects`), ảnh tạm GCS `tmp/`, quota 5/user + 8/ngày; Camera + PreviewImage qua BE (JWT). Deploy `travel-api-00007-68l` (`c13a57a3…`). Jest CI 15 suite 161 pass, tsc 62; BE 7 test PASS. User nghiệm thu emulator: pass |
| 31/10/2026 | P9 | FAISS build từ Neon lúc build image (183 vector); router search/chat/memory/recommendations (JWT, quota chat 30/ngày, objects chỉ làm ngữ cảnh RAG); memory + hội thoại trên Neon (010 + quyền 005); OpenAI qua REST; FE semantic + chatbot qua BE. Deploy `travel-api-00008-fxl` (`23aafe4d…`). Jest CI 19 suite 201 pass, tsc 62; BE 9 test PASS. User nghiệm thu emulator: pass |
| 31/10/2026 | P10 + N2 | Payment trên Neon/Cloud Run (`core_api/payments.py`): user từ JWT, webhook bắt buộc chữ ký + idempotent theo `order_code`, PayOS qua REST (không SDK); quyền 006; `travel-app-config:3`; FE `payment.api` + `Donation` mở lại. Deploy `travel-api-00009-2ml` (`4899a943…`), webhook đăng ký. Jest CI 20 suite 202 pass, tsc 62; BE 10 test PASS. User thử giao dịch thật: pass |
| 02/11/2026 | P11 | `content_en` ở Neon (012) + dịch một lần (gpt-4o-mini); helper chọn tiếng Anh theo bản ghi; ~140 chuỗi UI → `common:ui.*` vi/en; hotels nạp lười trong search (không ghép id semantic, Detail không gọi review/lễ hội); nhãn 94 `types` vi/en trong search; `languageSwitching` vào CI. Deploy `travel-api-00010-bqm`. Jest CI 21 suite 212 pass, tsc 62; BE 10 test PASS. User duyệt: done |
| 03/11/2026 | P12 | Clean CF1–CF19, CF21–CF23, CB1–CB10, CB13, CB14 (một commit mỗi repo); 19 package, APK/bundle, font/ảnh/SVG thừa, NocoDB/DO/Firebase/Azure khỏi code; migration 013. Deploy `travel-api-00011-5lb` (`fb219e59…`), rồi `travel-api-00012-nc7` (`690141cc…`, tắt Swagger production). Jest CI 22 suite 212 pass, tsc 55, eslint 6 lỗi cũ; BE 10 test PASS |
