# Migration Audit — Travel App

Cập nhật **30/10/2026** (sau P6). Tasklist: [MIGRATION_TASKLIST.md](MIGRATION_TASKLIST.md).

---

## 1. Hiện trạng (sau P6)

```
RN app (Android) ── catalog.client / (P6) api.client ──HTTPS──► Cloud Run travel-api (FastAPI)
  guest: Home · Lễ hội · Bản đồ · Search                          ├─ catalog GET (gzip, ETag)
  key trả phí không còn trong bundle                              ├─ module auth (APP_FEATURES)
                                                                  └─ Neon PostgreSQL
```

| Hạng mục | Trạng thái |
|---|---|
| Dữ liệu Neon | locations **123** (29 `publishable`), festivals **49** (28 có `location_id`), hotels **82**; accounts **3**, transactions **7** (seed của User). `rating`/`reviews` của catalog đang trống |
| Schema | `001`–`007` (007: `token_version`, `deleted_at`, CHECK định dạng hash); quyền runtime `001_runtime`, `002_auth` |
| Backend | Cloud Run `travel-api`, image `sha256:d06a0c3c…`; module bật: `auth`. Endpoint: `GET /locations`, `/festivals`, `/hotels`; `POST /auth/signup`, `/auth/login`; `GET/PATCH/DELETE /me`; `POST /me/change-password`; `/health`, `/health/ready` |
| Secret Manager | `travel-database-url:1`, `travel-app-config:1` (`JWT_SECRET`, `LEGACY_PASSWORD_SALT`) |
| Frontend | nhánh `migration/p0-p1` (P6): guest catalog + Map; đăng nhập/đăng ký/hồ sơ/đổi mật khẩu/xóa tài khoản qua BE; `.env` chỉ được đọc 3 biến public; các tính năng khác còn tắt (mục 3) |
| Test / CI | FE jest nhóm CI 13 suite, 142 pass / 1 skip, `tsc` 62; BE `check_core_api`, `check_contract`, `check_auth` |
| Nguồn cũ | Dữ liệu NocoDB đã export (ngoài repo); app DigitalOcean đã bị xóa; code NocoDB/DO còn trong repo, dọn ở P12 |

---

## 2. Quyết định đã chốt (User)

| # | Quyết định |
|---|---|
| D1 | Tiếng Việt trước. Nội dung tiếng Anh lưu ở **Neon** (cột `*_en`), dịch một lần bằng script OpenAI (P11); chữ UI ở `src/i18n/locales/{vi,en}/common.json`. Bỏ Azure Translator |
| D2 | Accounts/transactions làm ở phase auth (P5 ✅): import 3 tài khoản seed, bỏ tài khoản mật khẩu rỗng; 7 giao dịch |
| D3 | Mapbox dùng token `pk.` |
| D4 | Billing guard 26.000 VND/tháng (tắt billing cả project, chỉ tính GCP); mọi tính năng tốn tiền phải ước tính (mục 7) |
| D5 | NocoDB → Neon, DigitalOcean → Cloud Run; sau migration không còn dính dáng (P12.9) |
| D6 | Dùng lại / mở comment code có sẵn; chỉ xóa ở P12 khi User duyệt từng mục; file tạm dọn ngay trong phase |
| D7 | Auth: hash scrypt; hash cũ `SHA256(password + salt)` tự nâng cấp khi đăng nhập; JWT 30 ngày + `token_version` |
| D8 | Ảnh: ưu tiên miễn phí, một nhà cung cấp → imgbb (máy dev bị chặn, thử từ Cloud Run ở P7.0; dự phòng GCS). Bỏ Firebase |
| D9 | Bảng `reviews` là nguồn duy nhất của review và rating (`rating` = AVG, kèm `review_count`); bỏ cột `reviews`/`rating` của catalog ở P12; không import review cũ |
| D10 | Items = Objects (+ `data.py`) → một bảng `objects`, dùng làm dữ liệu RAG |
| D11 | Bật đủ AI (OpenAI trả trước 5 USD); FAISS build lại từ Neon lúc build image |
| D12 | Nợ sau migration: email quên mật khẩu (N1), PayOS (N2), i18n nâng cao (N3), seeding tài khoản/review mẫu qua API (N4). Code của N1/N2 vẫn phải bỏ NocoDB/DO trong migration |
| D13 | Khi dev: guest xem catalog/map/search, cần đăng nhập cho review, upload, Camera, Chatbot, ủng hộ. Khi phát hành: Login lên đầu |
| D14 | Chỉ xin quyền vị trí khi bấm "Gần bạn" hoặc mở Bản đồ; cảnh báo giọng nói nền (`BackgroundGeolocation`) để Backlog |
| D15 | Secret: một JSON `travel-app-config` (+ `travel-database-url`) |

---

## 3. Kiểm kê tính năng (30/10/2026, trước P5)

_Sau P5: phía BE của F09, F10, F13, F14 đã có (auth API); F11 có code BE nhưng tắt (Nợ N1). Phần FE làm ở P6._

Nguồn: đọc code FE (`src/`, nhánh `migration/p0-p1` @ `d9d79a8` + working tree), BE (`Travel_BE` `main` @ `a663edb`), `git log/show`, GET chỉ đọc vào API live (`/health`, `/openapi.json`: chỉ có `/locations`, `/festivals`, `/hotels`, `/`, `/health`, `/health/ready`).

**Ký hiệu trạng thái:** ✅ đang chạy · 🚩 tắt bằng `FEATURE_FLAGS` · 💤 code bị comment (route/import/khối) · 🗄️ chỉ còn gọi NocoDB/DigitalOcean cũ · ⛔ chết (code còn nhưng không có đường gọi) · 🆕 chưa có code · 🅱 Backlog đã chốt.
**Commit tắt chính:** FE `1c03405` "Phase 1 - Just run app" (flags = false, comment route/tab trong `AppContainer.tsx`, chặn `axios.ts`); FE `1517037` "Phase 2" (catalog sang Cloud Run, đọc NocoDB chuyển thành comment trong `locations.api`/`festivals.api`); FE `3a5a9bd`/`3583e90` (gỡ JSX mục Items ở màn Lễ hội); FE `dbec4ea` (marker → `publishable`); BE `67d8858` "Phase 4" (comment router AI, `/detect`, payment trong `app.py`; comment dependency AI/payment trong `requirements.txt`; Dockerfile chỉ COPY `app.py` + `core_api/`).
**Công sức:** S ≤ 1 ngày · M 2–3 ngày · L 4–6 ngày (1 dev, có test).

### 3.1 Bảng kiểm kê — thành phần

| ID | Tính năng | FE (màn hình / component / service) | BE (endpoint / router / service) | Bảng DB | Dịch vụ ngoài · secret | Trạng thái |
|---|---|---|---|---|---|---|
| F01 | Home: phổ biến + "Gần bạn" | `HomeScreen`, `LargeItemLocation`, `utils/nearby.ts`, `catalogRepository` | `GET /locations` | `locations` | — | ✅ |
| F02 | Lễ hội: list, xem tất cả, chi tiết, liên kết địa điểm | `FestivalsScreen`, `ViewAllFestivals`, `DetailFestival`, `LargeItemFestival` | `GET /festivals` | `festivals` | — | ✅ |
| F03 | Chi tiết địa điểm (+ lễ hội tại đây, review chỉ đọc) | `DetailLocation`, `ReviewItem` | `GET /locations` (`reviews` JSONB, hiện `[]`) | `locations` | — | ✅ |
| F04 | Ảnh / video địa điểm | `LocationImage`, `LocationVideo` (`react-native-youtube-iframe`) | — | `locations.images/videos` | YouTube (không key) | ✅ |
| F05 | Search từ khóa + bộ lọc ViewAll | `SemanticSearchBarComponent` (chế độ keyword), `utils/catalogSearch.ts` | — | — | — | ✅ |
| F06 | Bản đồ: marker, GPS, chỉ đường, popup, Advise, lớp giao thông, TTS đọc mô tả | `MapScreenV2`, `Advise`, `mapbox.api.ts`, `react-native-tts` | — | `locations` | Mapbox `pk.` (`MAPBOX_ACCESS_TOKEN`) | ✅ |
| F07 | Cảnh báo giọng nói khi tới gần (vị trí nền) | `MapScreenV2.tsx:370-426` (`BackgroundGeolocation`) | — | cần `voiceName` (không có) | `react-native-background-geolocation` (license trả phí) | 💤 🅱 |
| F08 | Settings (đổi ngôn ngữ UI) / FAQ / Policy / About | `Settings` + `LanguageDropdown`, `FAQ`, `Policy`, `About`, i18n `common` | — | — | — | 💤 route có đăng ký nhưng **không có lối vào** (chỉ mở từ tab Profile đang comment) |
| F09 | Đăng nhập | `LoginScreen`, `auth.api.login` (tải **toàn bộ** accounts rồi so hash SHA256 + salt ở client) | 🆕 không có router auth | `accounts` (rỗng) | NocoDB (`NOCODB_TOKEN`), `PASSWORD_SALT` | 💤 + 🗄️ |
| F10 | Đăng ký | `SignUpScreen`, `auth.api.signUp` | 🆕 | `accounts` | NocoDB | 💤 + 🗄️ |
| F11 | Quên mật khẩu (OTP email) | `ForgotPasswordScreen`, `auth.api.sendOTPEmail/verifyOTP/updatePassword` (OTP lưu RAM của app) | 🆕 | 🆕 bảng OTP | **SendGrid gọi thẳng từ app** (`SENDGRID_API_KEY`) | 💤 + 🗄️ |
| F12 | Tab Cá nhân (Profile) | `ProfileScreen` (+ lối vào Chatbot, Personal, Donation, Settings, FAQ, Policy, About, Đăng xuất) | — | — | — | 💤 |
| F13 | Hồ sơ: sửa thông tin, avatar, đổi mật khẩu | `Personal`, `auth.api.updateProfile/changePassword`, `locations.api.uploadImage` | 🆕 | `accounts` | NocoDB | 💤 + 🗄️ |
| F14 | Xóa tài khoản (bắt buộc theo chính sách Play) | chỉ có chữ ở `Policy.tsx:104` | 🆕 | `accounts` | — | 🆕 |
| F15 | Bảng tin (NewFeed): mọi review, lọc theo địa điểm | `NewFeedScreen`, `locations.api.getReviews` | 🆕 | review đang là JSONB trong `locations` | NocoDB | 💤 + 🗄️ |
| F16 | Viết review địa điểm (sao, nội dung, ảnh) | `NewFeedScreen:188-225`, `locations.api.createReview` (GET + PATCH bản ghi NocoDB) | 🆕 | 🆕 `reviews` (D9) | NocoDB | 💤 + 🗄️ |
| F17 | Review lễ hội | `festivals.api.addReview` — không có UI gọi | 🆕 | 🆕 | NocoDB | ⛔ |
| F18 | Upload ảnh | FE `locations.api.uploadImage` → NocoDB Storage (bị `axios.ts` chặn khi `ENABLE_UPLOAD=false`); BE `firestore.py` `FileUploadService`, `service.upload_file` (Firebase Storage), `service.image_to_url` (imgbb) | không có endpoint | — | Firebase (key cũ đã disable), imgbb (`IMGBB_API_KEY`) | 🚩 FE · ⛔ BE |
| F19 | Hiện vật (Items): mục ở màn Lễ hội, xem tất cả, chi tiết | `FestivalsScreen:85,114-118` (renderer comment; JSX bị gỡ ở `3583e90`), `AllItemsScreen`, `DetailItem`, `HistoricalArtifact`, `LargeItemItem`, `locations.api.getItems` | 🆕 | 🆕 `items` (Neon chưa có; NocoDB `m0s4uwjesun4rl9`, FAISS cũ có 11 item) | NocoDB | 🚩 + 💤 + 🗄️ |
| F20 | Camera + nhận diện hiện vật | `CameraScreen` (vision-camera, `POST ${SERVER_URL}/detect`), `PreviewImage`, `CameraResultModal` | `app.py:92` `/detect` (comment) → `service.py`: imgbb → SerpAPI Google Lens → OpenAI ×2 → mô tả từ NocoDB `objects` (`mj77cy6909ll2wc`) hoặc **dữ liệu cứng** `data.py` + `available_object_titles_fallback` | 🆕 `items` | OpenAI, SerpAPI, imgbb, NocoDB | 💤 + 🗄️ (DO) |
| F21 | Tìm kiếm ngữ nghĩa + gợi ý | `SemanticSearchBarComponent` (chế độ semantic), `ViewAllLocation/ViewAllFestivals` (`isSemanticSearch`), `semantic.api.searchSemantic/getSuggestions` (`baseURL: SERVER_URL` = DO) | `routers/search.py` `/api/v1/search/semantic|suggestions` (comment trong `app.py:61`) + `embedding_service`, `faiss_service` | — (FAISS file) | OpenAI embeddings (`OPENAI_API_KEY`) | 🚩 + 🗄️ (DO) |
| F22 | Địa điểm tương tự | `SimilarItemsComponent` (Detail địa điểm) | `routers/recommendations.py` `/api/v1/similar/{type}/{id}` | — | OpenAI | 🚩 + 🗄️ |
| F23 | Gợi ý cá nhân hóa | `RecommendationsWidget` (Home, cần `account.Id`) | `/api/v1/recommendations/{user_id}` + `memory_service` | 🆕 memory | OpenAI, NocoDB (memory) | 🚩 + 🗄️ |
| F24 | Chatbot (màn hình + bong bóng nổi) | `ChatbotScreen` (lịch sử ở LocalStorage, gửi ảnh), `FloatingChatBubble` (`App.tsx:53`), `chatbot.api.sendChatMessage/searchImage` | — (FE gọi thẳng) | — | **OpenAI + SerpAPI gọi thẳng từ app** | 💤 + 🚩 |
| F25 | RAG chat + bộ nhớ người dùng (BE) | `semantic.api.chatWithRAG/clearChatSession/storeMemory/getUserMemories` — không có UI gọi | `routers/chat.py` `/api/v1/chat/rag` (có `image_base64`), `routers/memory.py`, `rag_service`, `memory_service` (bảng NocoDB) | 🆕 `user_memories`, `conversations` | OpenAI, NocoDB | 💤 BE · ⛔ FE |
| F26 | Index FAISS + tự build khi khởi động | — | `utils/startup_indexer.py`, `scripts/index_data.py` (đọc NocoDB), `faiss_indexes/*` (đánh theo **ID NocoDB**: `entity_id 1` = "Bà Nà"; Neon `id 1` = "An Phú Farm") | — | OpenAI embeddings | 💤 (index lệch ID) |
| F27 | Ủng hộ (Donation) + QR + theo dõi trạng thái | `Donation` (`react-native-qrcode-svg`), `payment.api` (`PAYOS_BACKEND_URL` = DO) | `/payments/create`, `/payments/status/{code}` (comment `app.py:105-124`) | `transactions` (rỗng) | PayOS | 💤 + 🗄️ (DO) |
| F28 | Webhook PayOS + giao dịch + số dư | `IAccount.balance`, `ITransaction` (không có màn lịch sử) | `/webhook/payos` (**không kiểm chữ ký**, user lấy bằng regex trong description), `/payment/return|cancel|webhook-info`; `payment_service.py`; `nocodb_service.create_transaction/update_user_balance` | `transactions`, `accounts.balance` | PayOS (`PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`), NocoDB | 💤 + 🗄️ |
| F29 | Dịch động bằng Azure Translator | `TranslationContext`, `withAzureTranslation` (8 màn hình), `translation/*` (queue, cache) | — | — | **Azure gọi thẳng từ app** (`AZURE_TRANSLATOR_KEY`) | 🚩 `USE_AZURE_TRANSLATOR`, `ENABLE_TRANSLATION_BATCHING` |
| F30 | Cache bản dịch offline | `OfflineFallback`, `TranslationPersistentCache`, `AppContainer.tsx:433` | — | — | — | 🚩 `ENABLE_OFFLINE_CACHE` |
| F31 | Nội dung catalog tiếng Anh (D1: qua dữ liệu) | `translationHelpers` (đã trả thẳng giá trị API) | 🆕 cột/trường `*_en` | 🆕 | — | 🆕 |
| F32 | Hotels trong search | 🆕 (FE không có code hotel) | `GET /hotels` ✅ (82 bản ghi) | `hotels` | — | 🆕 FE |
| F33 | Nhãn tiếng Việt cho `types` | — | — | — | — | 🅱 🆕 |
| F34 | CRUD lễ hội phía app (create/update/getByMonth) | `festivals.api.createFestival/updateFestival/getFestivalsByMonth` — không có UI gọi | — | — | NocoDB | ⛔ |
| F35 | Firebase / Firestore | FE không dùng | `firestore.py`, `service.py:54-63` (khởi tạo `firebase_admin` khi import) | — | Firebase project `travel-app-backend-a9d5f` (key cũ đã disable; `privateKey.json` còn ở máy, không track) | ⛔ |
| F36 | Lớp NocoDB | `axios.ts` (`request`, chặn bởi `ENABLE_NOCODB`), `configs.ts DB_URL`, table ID trong `auth/locations/festivals.api` | `nocodb_service.py`, `memory_service.py`, `utils/config.py`, `scripts/get_table_ids.py`, `setup_nocodb_tables.py`, `index_data.py` | — | NocoDB Cloud | 🗄️ |
| F37 | DigitalOcean | `configs.ts:3`, `env.ts:44` (mặc định `SERVER_URL`) | `payment_service.py:18`, `app.py:177` (`PUBLIC_BASE_URL`), `Procfile` (gunicorn), `README.md` mục Deployment | — | DO App Platform | 🗄️ |
| F38 | Hạ tầng: catalog API (gzip/ETag), CI 2 repo, billing guard | `catalog.client`, `.github/workflows/ci.yml` | `core_api/*`, `deploy/billing_guard` | — | GCP | ✅ |

### 3.2 Bảng kiểm kê — vị trí code, phụ thuộc, rủi ro, công sức

| ID | Vị trí code (file:dòng / commit) | Phụ thuộc | Rủi ro (chi phí · bảo mật · Play Store) | Công sức khôi phục |
|---|---|---|---|---|
| F01–F06 | xem nhật ký P1–P4 (`6bcf28d`…`d9d79a8`) | — | Directions/Map trong free tier Mapbox; quyền vị trí chỉ foreground | — |
| F07 | `MapScreenV2.tsx:370-426`; thêm ở `5092f15` | quyền vị trí nền, dữ liệu giọng nói | license trả phí; Play hạn chế `ACCESS_BACKGROUND_LOCATION` | — (Backlog, giữ comment) |
| F08 | `AppContainer.tsx:36-39,347-350` (route chạy), lối vào `ProfileScreen.tsx:276-366` | F12 | — | S (theo F12) |
| F09–F11 | `AppContainer.tsx:24,46-47,332-334,365-373`; `auth.api.ts:12-516` (SendGrid `:448`, OTP RAM `:69`, `verifyOTP :486`); `LoginScreen.tsx:52-66` lưu **hash mật khẩu** vào LocalStorage | BE auth (🆕), bảng OTP, email | **mật khẩu cũ dạng chữ trong lịch sử git (U5)**; client tải toàn bộ accounts; hash SHA256 không chậm; OTP sinh và kiểm ở client (bỏ qua được); key SendGrid trong bundle | BE L · FE M |
| F12–F13 | `AppContainer.tsx:29,35,304-318,344-346`; `Personal.tsx:118-463` | F09, F18 (avatar) | dữ liệu cá nhân (SĐT, ngày sinh, địa chỉ) → khai báo Data safety | FE M |
| F14 | — | F09 | Play bắt buộc xóa tài khoản trong app **và** qua link web | BE S · FE S |
| F15–F17 | `AppContainer.tsx:26,258-274`; `NewFeedScreen.tsx:88-225`; `locations.api.ts:281-400`; `festivals.api.ts:217` | F09, F18, bảng review | nội dung người dùng tạo (UGC) → Play yêu cầu cơ chế báo cáo/ẩn; spam (cần giới hạn tần suất) | BE M · FE M |
| F18 | `axios.ts:16`; `locations.api.ts:402`; BE `firestore.py`, `service.py:65-77,189-210` | F09 (chỉ user đăng nhập) | lưu trữ + băng thông GCS (có guard); ảnh không kiểm duyệt; giới hạn kích thước | BE M · FE S |
| F19 | `FestivalsScreen.tsx:85-118`; JSX ở `git show 3583e90^:src/container/screens/Festival/FestivalsScreen.tsx`; `AppContainer.tsx:41-42,353-358`; `locations.api.ts:234-280` | bảng `items` + dữ liệu đã export từ NocoDB | dữ liệu nằm ở NocoDB — mất nếu tắt NocoDB trước khi export | BE M · FE S |
| F20 | `AppContainer.tsx:28,32,289-303,337-339`; `CameraScreen.tsx:96,186-205`; `PreviewImage.tsx:45-60`; BE `app.py:92-100`, `service.py`, `data.py` | F19 (mô tả từ `items`), F18 (ảnh tạm), Secret | mỗi lần nhận diện = 1 SerpAPI + 2–3 OpenAI; quyền Camera; `data.py` là dữ liệu cứng | BE M · FE S |
| F21–F23 | flag ở `SemanticSearchBarComponent.tsx:86,122,313`, `ViewAllLocation.tsx:49,100,183`, `ViewAllFestivals.tsx:49,100,183`, `DetailLocation.tsx:511`, `HomeScreen.tsx:441`; `semantic.api.ts:275-555`; BE `app.py:23,61-64`, `routers/*`, `services/*` | F26, F09 (F23), BE deps AI | chi phí OpenAI ngoài guard; endpoint `/recommendations/{user_id}` và `/memory/user/{user_id}` tin `user_id` từ URL (phải lấy từ token) | BE M · FE S |
| F24–F25 | `AppContainer.tsx:49,377-379`; `App.tsx:53-55`; `ChatbotScreen.tsx:86-275`; `chatbot.api.ts:36-309`; BE `routers/chat.py`, `rag_service.py`, `memory_service.py` | F21/F26, F09 (memory theo user), F18 (ảnh) | **key OpenAI/SerpAPI nằm trong bundle app**; chat không giới hạn → cạn ngân sách | BE M · FE M |
| F26 | `app.py:26,36-42`; `startup_indexer.py:52` ("Rebuild all FAISS indexes from NocoDB data"); `faiss_indexes/` (247 vector) | F19 (item), Neon | build lại khi mỗi cold start = tốn OpenAI + chậm khởi động | BE M |
| F27–F28 | `AppContainer.tsx:48,374-376`; `Donation.tsx:39-83`; `payment.api.ts:24`; BE `app.py:79-189`, `payment_service.py:28` (`verify_webhook_signature` không được gọi), `nocodb_service.py:145-301` | F09, bảng `transactions` | **webhook giả có thể cộng tiền**; phí PayOS; giao dịch tiền thật | BE M · FE S |
| F29–F30 | `featureFlags.ts`; `AzureTranslatorService.ts:46,79`; `TranslationContext.tsx:97`; bật/tắt ở `1c03405` | D1 | key Azure trong bundle; F0 miễn phí 2M ký tự/tháng | BE S · FE S (nếu giữ) |
| F31 | `translationHelpers.ts:6-26` | migration cột `*_en`, nhập dữ liệu | công nhập nội dung | BE S · FE S · dữ liệu L |
| F32 | — | `catalogRepository` | +1 lượt `/hotels` (đo live 30/10: 226 KB thô → ~44 KB gzip) chỉ khi search | FE S |
| F34–F37 | xem mục 6 | — | NocoDB/DO còn chạy có thể tốn phí; URL cũ làm app gọi nhầm | Clean |

### 3.3 Đếm theo trạng thái (trạng thái chính của từng tính năng)

| Trạng thái | Số | Tính năng |
|---|---|---|
| ✅ Đang chạy | 7 | F01–F06, F38 |
| 💤 Comment | 15 | F07 (🅱), F08, F09, F10, F11, F12, F13, F15, F16, F20, F24, F25, F26, F27, F28 |
| 🚩 Tắt bằng flag | 7 | F18, F19, F21, F22, F23, F29, F30 |
| 🗄️ Chỉ còn NocoDB/DO | 2 | F36, F37 |
| ⛔ Chết | 3 | F17, F34, F35 |
| 🆕 Chưa có code | 4 | F14, F31, F32, F33 (🅱) |
| **Tổng** | **38** | |

Trong 22 tính năng 💤/🚩, có **15** tính năng vẫn trỏ tới NocoDB hoặc DigitalOcean (F09–F11, F13, F15, F16, F18–F23, F27, F28), và **4** tính năng gọi thẳng dịch vụ trả phí từ app bằng key trong bundle (F11 SendGrid, F24 OpenAI + SerpAPI, F29 Azure, cùng `UNSPLASH_ACCESS_KEY` không ai dùng).

---

## 4. Khoảng trống còn mở

| ID | Mức | Khoảng trống | Xử lý |
|---|---|---|---|
| G4 | High | Chatbot vẫn gọi thẳng OpenAI/SerpAPI từ app (`chatbot.api.ts`, đang tắt) | P9.5 (qua `/api/v1/chat/rag`) |
| G5 | High | Router AI, `/detect` chỉ có code comment trong `app.py`; FE camera/semantic còn trỏ URL DigitalOcean cũ | P8–P9 dùng `API_BASE_URL` |
| G6 | High | Webhook PayOS không kiểm chữ ký; `user_id` lấy bằng regex trong description | P10.3 |
| G7 | High | FAISS index cũ đánh theo ID NocoDB (`entity_id 1` = "Bà Nà", Neon `id 1` = "An Phú Farm") | P9.1 |
| G8 | High | Settings/FAQ/Policy/About không có lối vào (chỉ mở từ tab Profile đang comment) | P6.3 |
| G9 | High | Chính sách Play: xóa tài khoản trong app, báo cáo nội dung người dùng, Data safety, quyền thừa (`ACCESS_BACKGROUND_LOCATION`, `USE_EXACT_ALARM`, `RECORD_AUDIO`), cleartext | P6.5, P7.5, P14 |
| G10 | Medium | Dữ liệu cứng ở BE: `data.py`, `available_object_titles_fallback` (`service.py:27-37`) | P8 → bảng `objects`, xóa ở P12 |
| G11 | Medium | Billing guard chỉ tính GCP; OpenAI/SerpAPI/Mapbox/Neon nằm ngoài | Quota trong BE + trần từng dịch vụ (mục 7) |
| G12 | Medium | Suite test hỏng từ trước: `App.test`, `semantic.api`, `RecommendationsWidget`, `SimilarItemsComponent`, `languageSwitching`, `AzureTranslatorService` | Sửa trong P9, P11, P13; Azure bỏ cùng CF21 |
| G13 | Medium | `IAccount.Id`, `IItem.Id`, `ITransaction.Id` còn khóa NocoDB | P6.2, P8.4, P10 |
| G15 | Medium | Bundle JS cũ và APK release 93 MB đang được track trong git | CF22 |
| G17 | Low | imgbb không xóa ảnh được qua API (chỉ `delete_url` dạng trang web) → xóa tài khoản không tự xóa ảnh | Lưu `delete_url`; ghi trong Policy |

---

## 5. Kiến trúc đích

```
                    ┌──────────────── RN app (Android) ────────────────┐
                    │ Dev: guest xem Home · Lễ hội · Bản đồ · Search ·  │
                    │      Profile/Settings; đăng nhập cho review,       │
                    │      upload, Camera, Chatbot, gợi ý                │
                    │ Release (P14): màn Login lên đầu                   │
                    │ catalog.client ─┐   api.client (Bearer JWT) ─┐    │
                    └─────────────────┼────────────────────────────┼────┘
             Mapbox (pk., Directions) │ HTTPS                      │ HTTPS
                                      ▼                            ▼
          ┌──────────────── Cloud Run travel-api (FastAPI, 1 instance) ───────────────┐
          │ catalog  : GET /locations /festivals /hotels /objects (gzip, ETag;        │
          │            rating + review_count tính từ bảng reviews)                    │
          │ auth     : /auth/signup|login · /me (GET/PATCH/DELETE) · đổi mật khẩu     │
          │ reviews  : GET/POST/DELETE /reviews · POST /reviews/{id}/report           │
          │ uploads  : POST /uploads → imgbb (ảnh ≤ 2 MB, chỉ user)                   │
          │ detect   : POST /detect → imgbb (tạm 600 s) → SerpAPI Lens → OpenAI       │
          │ AI       : /api/v1/search|similar|recommendations|chat|memory (router cũ) │
          │ NỢ (code đã chuyển sang Neon/Cloud Run nhưng để tắt):                     │
          │            quên mật khẩu qua email · /payments/* · /webhook/payos         │
          └──┬──────────────┬──────────────────────┬───────────────────────┬──────────┘
             │ pooled TLS   │ Secret Manager       │ HTTPS                 │ HTTPS
             ▼              ▼                      ▼                       ▼
        Neon PostgreSQL   1 secret JSON +       imgbb (ảnh)            OpenAI, SerpAPI
        (catalog, accounts, DB URL riêng
         transactions, reviews,
         objects, user_memories,
         conversations; FAISS build từ đây)
```

Không còn: NocoDB, DigitalOcean, Firebase, Azure Translator, SendGrid gọi từ app, Unsplash.

### 5.1 Nguyên tắc
- App chỉ nói chuyện với **Cloud Run**, host ảnh (catalog + imgbb), Mapbox. Mọi key trả phí chỉ nằm ở Secret Manager; `.env` của FE chỉ còn `CATALOG_API_URL`, `API_BASE_URL` (cùng URL Cloud Run), `MAPBOX_ACCESS_TOKEN` (`pk.`).
- **Dùng lại code đã có**: màn hình FE giữ nguyên, chỉ đổi phần ruột của service (`auth.api`, `locations.api` review/upload/items, `semantic.api`, `chatbot.api`, `payment.api`) sang gọi BE, giữ tên hàm. BE bật lại router/endpoint đang comment, thay lớp NocoDB bằng repository Neon cùng chữ ký hàm (`create_transaction`, `get_user_by_id`, `update_user_balance`, `MemoryService`…), thay URL DigitalOcean bằng Cloud Run.
- **NocoDB và DigitalOcean phải sạch hoàn toàn** sau migration: không còn code, biến môi trường, script, file cấu hình (`.do/`, `Procfile`), tài liệu hướng dẫn hay dữ liệu mẫu nào trỏ tới hai dịch vụ này. Ngoại lệ duy nhất: phần lịch sử trong `MIGRATION_AUDIT.md`/`MIGRATION_TASKLIST.md` và lịch sử git (tiêu chí ở P12).
- Tính năng **Nợ** (email quên mật khẩu, PayOS) vẫn phải bỏ NocoDB/DO ngay trong migration: lớp dữ liệu chuyển sang Neon, URL sang Cloud Run, nhưng endpoint/màn hình giữ tắt tới phase hoàn thiện sau.
- Danh tính lấy từ JWT, không tin `user_id` trên URL/body.
- Chống tốn tiền: quota theo user/ngày cho `/detect`, `/api/v1/chat/*`, `/uploads`; giới hạn tần suất login.
- Ghi DB: mỗi phase một file migration (`db/schema/007…`) + quyền tối thiểu cho runtime role. User chạy migration bằng owner role (`DATABASE_URL_UNPOOLED`).
- **File tạm phải dọn ngay trong phase tạo ra nó** (script import một lần sau khi đối chiếu xong, bản copy dữ liệu export, report, index thử, bundle/APK build thử). Dữ liệu export NocoDB nằm ngoài repo (`C:\Users\lekha\Downloads\DATA NOCODB`), không được copy vào repo. File có sẵn từ trước vẫn đi qua danh sách P12 để User duyệt.

### 5.2 Bảng DB mới / thay đổi (tên cuối cùng chốt khi làm)
| Migration | Phase | Nội dung | Dữ liệu import |
|---|---|---|---|
| 007_auth | P5 ✅ | `accounts`: thêm `token_version`, `deleted_at`; `password_hash` có tiền tố thuật toán (`sha256salt$…` cho hash cũ, `scrypt$…` cho hash mới); quyền runtime trên `accounts` (trừ `balance`) | `accounts.json`: **3** tài khoản có hash SHA256 (tài khoản mật khẩu rỗng bỏ — không có giao dịch, số dư 0); `transactions.csv`: 7 dòng PAID, đều map được qua `userName`. Dữ liệu seed của User |
| 008_reviews | P7 | `reviews` (account_id FK, location_id \| festival_id, rating 1–5, content, images JSONB gồm `url` + `delete_url`, status, created_at), `review_reports`; quyền runtime INSERT/UPDATE | **không import** — 388 + 92 review cũ trong export bỏ (D9). Bảng bắt đầu rỗng; review mẫu do tài khoản seeding tạo sau (Nợ N4) |
| 009_objects | P8 | bảng **`objects`** (gộp Items + Objects + `data.py`): record_id, title, content, images, video, location_id FK nullable, aliases | `objects.json` (11 bản ghi = 9 của `data.py` + "Cầu Rồng" + "Trường Đại học CNTT&TT Việt - Hàn"; chỉ có `title`, `content`) |
| 010_ai_memory | P9 | `user_memories`, `conversations` (thay bảng NocoDB) | không có (bắt đầu rỗng) |
| 011_payments | P10 | quyền INSERT/UPDATE `transactions`, UPDATE `accounts.balance` — **soạn + test, chưa áp dụng** (Nợ PayOS) | — |
| 012_i18n_content | P11 | cột `*_en` nullable cho locations/festivals/hotels/objects | script dịch một lần (OpenAI) |
| 013_drop_legacy_catalog_columns | P12 | bỏ cột `reviews` JSONB và `rating` khỏi locations/festivals/hotels (đã thay bằng bảng `reviews`) | — |

`reviews` là nguồn duy nhất của rating (D9): BE trả `rating` = AVG review đang hiển thị (null nếu chưa có) + `review_count`; catalog cache 300 s nên điểm mới hiện trễ tối đa 5 phút. Cột `rating`/`reviews` cũ trên Neon đang trống → bỏ ở P12 không mất dữ liệu.

### 5.3 Luồng chính
- **Auth:** SignUp → `POST /auth/signup` (hash scrypt ở BE) → JWT; Login → JWT lưu `localStorageKey.AUTH_TOKEN`, **không lưu mật khẩu**. Tài khoản import có hash cũ: BE kiểm bằng đúng công thức cũ `SHA256(password + PASSWORD_SALT)` (`auth.api.ts:28-33`), salt chuyển vào secret; đúng thì rehash scrypt ngay. Quên mật khẩu: **Nợ** (`ForgotPasswordScreen` giữ comment).
- **Review:** chọn ảnh → `POST /uploads` (BE đẩy lên imgbb, lưu `url` + `delete_url`) → `POST /reviews` → Feed/Detail đọc `GET /reviews?location_id=`; rating tính ở BE.
- **Detect:** Camera → `POST /detect` (multipart, JWT) → imgbb tạm 600 s → SerpAPI Lens → OpenAI → tra `objects` → `{name, description}`.
- **AI:** catalog + `objects` trong Neon → script build FAISS (OpenAI embeddings) lúc build image → `/api/v1/search|similar|recommendations`; `objects` là nguồn RAG cho search/chatbot; Chat → `/api/v1/chat/rag` (RAG + memory theo user).
- **Payment (Nợ):** code chạy trên Neon/Cloud Run nhưng endpoint tắt. Khi hoàn thiện: Donation → `POST /payments/create` → PayOS → webhook có chữ ký → PAID + cộng `balance` (idempotent theo `order_code`).

### 5.4 Thứ tự phase (theo phụ thuộc)
| Phase | Nội dung | Phụ thuộc |
|---|---|---|
| P0–P4 | Đã xong (guest catalog + map) | — |
| **P5** ✅ | Nền BE: kiểm tra key + gom vào Secret Manager, chặn lộ key ở APK, module flag, migration 007, import accounts/transactions, auth API | — |
| **P6** | FE Login/SignUp/Profile/Personal/Settings + xóa tài khoản (Forgot = Nợ) | P5 |
| **P7** | Upload (imgbb) + bảng reviews + rating tính từ reviews + Bảng tin + báo cáo review | P5, P6 |
| **P8** | Bảng `objects` + Items/Camera/detect | P7 |
| **P9** | AI: FAISS từ Neon, semantic search, tương tự, gợi ý, chatbot RAG, memory | P6, P8 |
| **P10** | Payment: bỏ NocoDB/DO khỏi code payment, chuyển sang Neon/Cloud Run, **giữ tắt** (Nợ) | P5 |
| **P11** | i18n UI vi/en, dịch nội dung một lần bằng script → cột `*_en`, Hotels trong search, nhãn `types` | P9 |
| **P12** | CLEAN (mục 6) + xác nhận sạch NocoDB/DO/Firebase/Azure | P5–P11 |
| **P13** | Nghiệm thu Android toàn app | P12 |
| **P14** | Phát hành (Login lên đầu, chính sách Play) | P13 |
| Nợ | Email quên mật khẩu; PayOS/Donation; dịch tự động/i18n nâng cao | sau P14 |
| Backlog | Refactor/tối ưu; cảnh báo giọng nói (F07) | — |

---

## 6. Đầu vào phase Clean (P12)

Mỗi mục cần User duyệt. "Bằng chứng" = kết quả grep import/tham chiếu trên `src`, `App.tsx`, `index.js`, `__tests__` (FE) hoặc `app.py` + Dockerfile (BE) ngày 30/10. Mục có điều kiện chỉ xóa khi phase ghi bên cạnh đã xong. File tạm do chính các phase P5–P11 tạo ra không nằm ở đây: dọn ngay trong phase đó (mục 5.1).

### 6.1 FE — file/code
| # | Mục | Bằng chứng không dùng | Điều kiện | Lý do |
|---|---|---|---|---|
| CF1 | `src/services/AIApi.tsx` (baseURL `maps.googleapis.com`) | không file nào import | — | code chết |
| CF2 | `src/utils/decodePolyline.ts` | không import; Directions trả `geojson` | — | code chết |
| CF3 | `src/component/ButtonBase.tsx`, `ChatBubble.tsx`, `SearchBarComponent.tsx` | không import (bản dùng là `FloatingChatBubble`, `SemanticSearchBarComponent`) | — | trùng/chết |
| CF4 | `src/data/baseTranslations.ts` | không import | — | thay bằng i18n `common` |
| CF5 | `src/res/languages/{en,jp,strings}.tsx` | không import (`res/strings.tsx` vẫn dùng — giữ) | — | thay bằng i18n |
| CF6 | **NocoDB phía FE**: `src/services/axios.ts`, `DB_URL`/`NOCODB_TOKEN` trong `configs.ts`/`env.ts`, table ID (`auth.api.ts:12-16`, `locations.api.ts:34-40`, `festivals.api.ts:10-14`), chú thích nhắc NocoDB (`types.tsx`, `translationHelpers.ts:4`, `constants.tsx`, `featureFlags.ts`, `MapScreenV2.tsx:335`, `NewFeedScreen`, `ChatbotScreen`, `Donation`, `Personal`), script npm `translate:nocodb` | `git grep -il nocodb` (FE: 20 file ngoài tài liệu migration) | P10 | yêu cầu sạch NocoDB |
| CF7 | Khối comment NocoDB "P2: Original NocoDB catalog read retained" (`locations.api.ts:83-232`, `festivals.api.ts:37,79-114`), cache cũ (`locations.api.ts:44-75`) | catalog đọc qua `catalogRepository` từ P2 | P8 | code chết |
| CF8 | `festivals.api.createFestival/updateFestival/getFestivalsByMonth` (F34) | không UI gọi | P7 | chết |
| CF9 | Gọi trực tiếp dịch vụ ngoài: `chatbot.api.ts` (OpenAI/SerpAPI), biến `OPENAI_API_KEY`, `SERPAPI_KEY`, `SENDGRID_API_KEY`, `PASSWORD_SALT`, `PAYOS_BACKEND_URL`, `SERVER_URL` | sau khi ruột service chuyển sang BE (logic gửi mail đã chuyển sang BE ở trạng thái Nợ) | P9, P10 | quy tắc 3 |
| CF10 | `UNSPLASH_ACCESS_KEY` (trường rỗng trong `env.ts`) | không có nơi dùng ngoài khai báo | — | chết |
| CF11 | Khối comment "P1: Legacy GPS/nearby loader" (`HomeScreen.tsx:194-…`) | đã thay bằng loader P3 (xin quyền khi bấm); User đồng ý giữ bản P3 (D14) | — | trùng |
| CF12 | Comment trong `MapScreenV2`: lượt gọi Directions trùng (`:1475`), prop `onRegionDidChange` deprecated, rule camera cũ, comment "fetch từ NocoDB" (`:335`). **Không** gồm khối `BackgroundGeolocation` (Backlog) | P4 đã thay | — | chết |
| CF13 | `// P1: if (FEATURE_FLAGS.RECOVERY_MODE)` (`DetailLocation.tsx:60`, `DetailFestival.tsx:60`), flag `RECOVERY_MODE`, `ENABLE_NOCODB`; flag luôn `true` sau P11 (tùy User giữ làm công tắc khẩn) | — | P11 | nhánh chết |
| CF14 | `crypto-js`, `@types/crypto-js` | không còn import nào từ P6 (`auth.api.ts` hash ở BE) | — | gỡ dependency |
| CF15 | Script npm `translate:ui|nocodb|csv|all` (thư mục `scripts/` không tồn tại), `link` (RN ≥ 0.60) | `ls scripts` lỗi | — | hỏng |
| CF16 | npm không import ở đâu: `openai`, `papaparse`, `@types/papaparse`, `@types/lodash`, `i18next-http-backend`, `react-native-fs`, `@react-navigation/material-top-tabs` (+ `react-native-tab-view`, `react-native-pager-view` nếu không lib nào cần), `react-native-swipe-gestures`, `react-native-modal`, `react-native-keyboard-aware-scroll-view`, `react-native-video`, `react-native-permissions`, `metro-react-native-babel-preset`, `sharp`, `dotenv` | grep tên package trên `src`, `App.tsx`, `index.js`, config | build Android lại | giảm APK. **Giữ** `react-native-webview` (peer của youtube-iframe) |
| CF17 | Ảnh không tham chiếu: `banner`, `banner2`, `causonghan`, `vooc`, `frame`, `icon_camera`, `danang`, `danang_logo`, `chibi`, `nguhanhson`; `src/assets/svg/Frame.svg`; 41/64 SVG trong `src/assets/assets/svg`; font `NotoSansJP-*` (6) + `Roboto-*` (5) ở `src/assets/assets/fonts` **và** `android/app/src/main/assets/fonts` | grep `images.<key>`, tên SVG, tên font | sau P11 | asset thừa |
| CF18 | `RECOVERY_PLAN.md`, `RECOVERY_TASKLIST.md`, `docs/recovery/p1/README.md` | đã đánh dấu "thay thế" ở P0 | — | lỗi thời |
| CF19 | `docs/TECHNICAL_REPORT.md`, `SEMANTIC_SEARCH_SPECIFICATION.md`, `TRANSLATION_APPROACHES_RESEARCH.md`, `USER_PREFERENCES_COLLECTION_PLAN.md`; phần NocoDB/DO/Azure trong `README.md` | mô tả kiến trúc NocoDB/DO/Azure | P9, P11 | cập nhật hoặc xóa |
| CF20 | Quyền manifest: `ACCESS_BACKGROUND_LOCATION`, `USE_EXACT_ALARM`, `RECORD_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE`; `usesCleartextTraffic` | không tính năng nào cần | P14 | chính sách Play |
| CF21 | **Azure Translator (D1: bỏ)**: toàn bộ `src/services/translation/` (6 file `AzureTranslatorService`, `TranslationQueue`, `TranslationCache`, `TranslationPersistentCache`, `OfflineFallback`, `index.ts` — đều phụ thuộc Azure); nhánh "4. Use Azure Translator" trong `TranslationContext.tsx:97-110`; `offlineFallback.initialize` (`AppContainer.tsx:9,431-436`, `LanguageDropdown.tsx:13`); flag `USE_AZURE_TRANSLATOR`, `ENABLE_OFFLINE_CACHE`, `ENABLE_TRANSLATION_BATCHING`; biến `AZURE_TRANSLATOR_*`; test `AzureTranslatorService.test.ts`, `TranslationCache.test.ts`, mock `services/translation` trong `guestNavigation`/`guestTranslation`. **Giữ** `TranslationContext` + `withAzureTranslation` (đang cấp `t`, `language`, `setLanguage` qua i18n cho 8 màn hình; đổi tên HOC là refactor → Backlog) | D1 | đầu P12 | User chốt bỏ Azure |
| CF22 | **Bundle/APK cũ bị track trong git**: `android/app/src/main/assets/index.android.bundle` (11/2024, còn URL DigitalOcean), `android/app/release/app-release.apk` (93 MB, 10/2024), `android/app/release/baselineProfiles/*`, `output-metadata.json`; thêm vào `.gitignore` | được build lại mỗi lần; bundle lỗi thời | — | file build (lịch sử git vẫn giữ — U30) |

Suite test hỏng từ trước **không xóa**: sửa trong phase tính năng — `semantic.api`, `RecommendationsWidget`, `SimilarItemsComponent` (P9, cài `@testing-library/react-native`), `languageSwitching` (P11), `App.test.tsx` (P13). Riêng `AzureTranslatorService.test.ts` đi cùng CF21.

### 6.2 BE
| # | Mục | Bằng chứng | Điều kiện | Lý do |
|---|---|---|---|---|
| CB1 | `nocodb_service.py` | chỉ `service.py` + `app.py` (comment) dùng; P8/P10 thay bằng repo Neon | P10 | sạch NocoDB |
| CB2 | Phần NocoDB trong `services/memory_service.py`, `routers/memory.py`, `utils/config.py` (`nocodb_*`), `utils/startup_indexer.py`, `scripts/index_data.py`, `core_api/config.py` (`"nocodb"` trong `DISABLED_SERVICES`), `tests/check_core_api.py` | thay bằng Neon | P9 | sạch NocoDB |
| CB3 | `scripts/get_table_ids.py`, `scripts/setup_nocodb_tables.py` | chỉ phục vụ NocoDB | P9 | sạch NocoDB |
| CB4 | `data.py`, `available_object_titles_fallback` (`service.py:27-37`) | 9 bản ghi đã có trong `objects.json` → bảng `objects` | P8 | dữ liệu cứng |
| CB5 | **Firebase (D8: chỉ imgbb)**: `firestore.py`, `service.upload_file` + khởi tạo `firebase_admin` (`service.py:7,12,54-77`), `firebase-admin` (comment trong `requirements.txt`), `"firebase"` trong `DISABLED_SERVICES`, đoạn Firebase trong `deploy/README.md` | upload và ảnh tạm đều qua imgbb | P8 | một nhà cung cấp ảnh |
| CB6 | `faiss_indexes/*` hiện tại (ID NocoDB) | thay bằng index build từ Neon | P9 | sai ID |
| CB7 | **DigitalOcean**: `.do/deploy.template.yaml`, `Procfile`, mục "Digital Ocean App Platform" trong `README.md`, mặc định `PUBLIC_BASE_URL` DO (`payment_service.py:18`, `app.py:177`) | Cloud Run dùng `Dockerfile` | P10 | sạch DO |
| CB8 | `main.py` (uvicorn local) nếu không còn dùng; `/detect/test` (`app.py:98`) | Dockerfile không dùng | P8 | chết |
| CB9 | Comment dependency không còn cần (`scikit-learn`, `gunicorn`, `firebase-admin`) | — | P10 | chết |
| CB10 | `TECHNICAL_REPORT.md`, `DEPLOYMENT_PROGRESS.md`, `DEPLOYMENT_TASKLIST.md` | mô tả NocoDB/DO/Firebase, số liệu cũ | P12 | lỗi thời (viết lại ngắn theo kiến trúc mới hoặc xóa) |
| CB12 | 11 biến `NOCODB_*` trong `.env` BE local (Firebase/DO/biến không dùng đã xóa 30/10) | không code nào đọc sau P10 | P10 | sạch cấu hình |
| CB13 | Migration 013 bỏ cột `reviews`/`rating` của catalog (mục 5.2) | FE đọc `GET /reviews` từ P7 | P7 xong | một nguồn rating |

---

## 7. Chi phí và key (D4)

Giả định: 1 USD ≈ 26.000 VND; demo ~100 người dùng/tháng. Guard 26.000 VND (≈ 1 USD) **chỉ** tính chi phí GCP. Đơn giá theo bảng giá công khai đã biết; Trạng thái key ở mục 7.1.

| Hạng mục | Trong guard GCP? | Đơn giá / free tier | Ước tính tháng (demo) | Kiểm soát |
|---|---|---|---|---|
| Cloud Run | Có | free tier request/vCPU-s/GiB-s; min 0, max 1 | ~0 VND | không build FAISS khi startup |
| Artifact Registry | Có | 0,5 GB free, ~0,10 USD/GB-tháng | image AI ~0,6–0,8 GB → ~0–2.000 VND | giữ ≤ 2 image |
| Secret Manager | Có | 6 version free, ~0,06 USD/version-tháng | 0 VND với 1 secret JSON + DB URL | gộp key (D15) |
| imgbb (upload + ảnh tạm detect) | Không | miễn phí, ≤ 32 MB/ảnh | 0 VND | ảnh ≤ 2 MB, quota/user |
| Neon | Không | Free plan (xác nhận) | 0 VND | theo dõi dashboard |
| OpenAI | Không | gpt-4o-mini 0,15/0,60 USD mỗi 1M token vào/ra; embedding 0,02 USD/1M | chat ≈ 16 VND/tin; detect ≈ 26 VND/lần; build index ≈ 80 VND/lần; **dịch nội dung một lần (P11) ≈ 0,3 USD ≈ 8.000 VND** | User đã trả trước 5 USD (D11) |
| SerpAPI | Không | Free Plan 250 lượt/tháng | 0 VND nếu ≤ free | đếm lượt ở BE |
| Mapbox | Không | 25.000 MAU mobile, 100.000 Directions/tháng | 0 VND | — |
| SendGrid, PayOS | — | **Nợ** — không phát sinh trong migration | 0 | — |
| Azure Translator | — | **bỏ** (D1) | 0 | — |

### 7.1 Key (kiểm 30/10 bằng endpoint miễn phí, không in giá trị)

| Key | Ở đâu | Trạng thái | Xử lý |
|---|---|---|---|
| `OPENAI_API_KEY` | `.env` BE (+ bản cũ ở `.env` FE) | ✅ có `gpt-4o-mini`, `text-embedding-3-small` | Đưa vào `travel-app-config` ở P8; xóa bản ở FE |
| `SERPAPI_KEY` | `.env` BE (+ FE) | ✅ Free Plan, 250 lượt/tháng | Như trên |
| `IMGBB_API_KEY` | `.env` BE | ❌ lỗi 103 từ máy dev (cả key mới) | P7.0 thử từ Cloud Run; dự phòng GCS |
| `MAPBOX_ACCESS_TOKEN` (`pk.`) | `.env` FE | ✅ | Giữ (public) |
| `SENDGRID_API_KEY` | `.env` FE | ✅ key hợp lệ, chưa thử gửi | Giữ tới N1 |
| `PAYOS_*` (3 key) | `.env` BE | ✅ xác thực qua | Giữ tới N2 |
| `NOCODB_*` | `.env` FE + BE | ✅ | Xóa sau P8, thu hồi token sau P14 |
| `JWT_SECRET`, `LEGACY_PASSWORD_SALT` | `travel-app-config:1` | ✅ đang dùng | — |
| Azure, Unsplash, Firebase, URL DigitalOcean | — | ❌ / không dùng | Đã xóa khỏi `.env` (30/10) |

---

## 8. Nhật ký

| Ngày | Phase | Kết quả |
|---|---|---|
| 29/10 | Dữ liệu | Import Neon 123 locations / 82 hotels / 49 festivals; schema 005–006; BE deploy model mới |
| 29/10 | P0 | Test core + contract BE/FE (fake DB), CI 2 repo |
| 29/10 | P1 | Bỏ bản dịch catalog theo ID cũ (sửa lỗi hiện sai tên) và mọi dữ liệu cứng (`authConstants` có mật khẩu dạng chữ, `locationConstants`, `reviewsConstants`); empty state |
| 29/10 | P2 | `catalogRepository` (1 lượt tải, chỉ mục), một khóa `id`, timeout 12 s / retry 1 / deadline 30 s; BE gzip + ETag (486 KB → ~125 KB). Sự cố deploy: traffic về revision không tương thích → rollback `00003-smt`, rồi deploy `6ece2540…` |
| 30/10 | P3 | "Gần bạn" (xin quyền khi bấm, `haversineDistance`), search bỏ dấu, liên kết festival ↔ location, pull-to-refresh |
| 30/10 | P4 | Map: marker `publishable`, chỉ đường chỉ khi có GPS thật (1 request/lần), popup + Advise. Sửa sau thử emulator: geolocation `playServices`, camera không bám GPS liên tục |
| 30/10 | Kế hoạch | Kiểm kê 38 tính năng (mục 3); User chốt D1–D15; kiểm tra key (mục 7.1); thêm P5–P14 + Nợ |
| 30/10 | P5 | FE: `babel.config.js` allowlist 3 biến public, bundle không còn key. BE: module `APP_FEATURES` + secret JSON; `security.py` (scrypt, JWT, rate limit), `auth.py`, `email.py` (tắt); migration 007 + quyền 002; import 3 accounts + 7 transactions (tổng giao dịch 172.000 VND, tổng `balance` 167.000 VND — giữ nguyên dữ liệu seed). Deploy `d06a0c3c…`; đăng nhập tài khoản seed bằng mật khẩu cũ thành công. FE `39fc44a` |
| 30/10 | P6 | FE: `api.client.ts`, `auth.api.ts` gọi BE (giữ tên hàm, chỉ lưu token + hồ sơ); `IAccount.id`; mở Login/SignUp/Personal + tab Profile; xóa tài khoản; `requireLogin`; Chatbot/Ủng hộ báo "sắp có"; đăng xuất về Home. User nghiệm thu emulator: pass |
