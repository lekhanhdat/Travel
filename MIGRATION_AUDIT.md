# Migration Audit — Travel App (cập nhật sau đợt merge dữ liệu)

Ngày: **29/10/2026**. Mục tiêu: app Android chạy ổn định với **Location + Festival** trên Cloud Run/Neon, **chỉ dùng dữ liệu từ cloud**, kiến trúc gọn. Giao diện tiếng Việt trước; tiếng Anh cho nội dung catalog và Hotel (search) để sau.
Tasklist chi tiết: [MIGRATION_TASKLIST.md](MIGRATION_TASKLIST.md).

> **Cập nhật 30/10/2026 — lập lại kế hoạch toàn app.** Mục 1–5 là audit gốc (giữ để tra lịch sử, P0–P4 đã xong). Phạm vi mới là **toàn bộ tính năng** (auth, review, upload, items/camera, AI, payment, dịch thuật, hotels) và một phase Clean riêng. Xem: kiểm kê tính năng (mục 6), khoảng trống (mục 7), kiến trúc đích toàn app (mục 8), đầu vào Clean (mục 9), chi phí (mục 10), quyết định cần User chốt (mục 11). Nhật ký chuyển thành mục 12 (nội dung giữ nguyên).

---

## 1. Hiện trạng (đã kiểm chứng 29/10)

```
RN app (guest) ── catalog.client ──HTTPS GET──► Cloud Run travel-api (FastAPI, read-only)
                                                   └─ Neon PostgreSQL (travel_runtime: SELECT)
```

| Hạng mục | Trạng thái |
|---|---|
| Dữ liệu Neon (baseline) | locations **123** (123 có GPS, 29 `publishable`), hotels **82**, festivals **49** (28 có `location_id`). `rating = null`, `reviews = []` |
| Schema | 001–006 đã áp dụng. Bỏ `verification_status` và `marker`; cờ hiện trên bản đồ là `publishable`. Festivals chỉ còn FK `location_id` |
| Backend | Đã deploy model mới; chỉ GET `/locations`, `/festivals`, `/hotels`, health. Không còn test core; không có CI |
| FE service | `catalog.client` + adapter khớp contract; festivals tra tên địa điểm từ `location_id`. Test catalog pass; `tsc` 63 lỗi cũ; không có CI |
| Tải dữ liệu | ~485 KB JSON không nén; mỗi màn hình tự gọi lại |

---

## 2. Vấn đề còn lại

| ID | Mức | Vấn đề | Bằng chứng | Hướng xử lý |
|---|---|---|---|---|
| **C1** | Critical | Tên/mô tả bị ghi đè bằng bản dịch tĩnh theo **ID số cũ**, **ảnh hưởng cả tiếng Việt**: `vi/locations.json` có `loc_1` = "Khu du lịch Bà Nà – Núi Chúa" trong khi API `id=1` = "An Phú Farm" | `utils/translationHelpers.ts`; `i18n/locales/{vi,en}/{locations,festivals}.json` (187 `loc_`, 48 `fest_`) | Không phải chạy lại i18n. Helper trả thẳng giá trị API; xóa 4 file JSON và namespace `locations`/`festivals`. i18n chỉ còn cho chữ của UI |
| **C2** | Critical | **Dữ liệu fix cứng trong source**: `authConstants` (tài khoản kèm **mật khẩu dạng chữ** trong repo public), `locationConstants` (`LOCATION_POPULAR`/`LOCATION_NEARLY`, ~2.000 dòng), `reviewsConstants` (review giả đang hiện ở Detail), bản dịch catalog (C1) | `src/common/*Constants.tsx`; `DetailLocation.tsx:15`, `NewFeedScreen.tsx:6,23-24`; fallback đã comment trong `MapScreenV2.tsx:360,919` | Xóa toàn bộ; mọi nội dung lấy từ API; thiếu dữ liệu thì hiện empty state |
| **A1** | High | Mỗi màn hình tự fetch; Home ép `forceRefresh`; Detail tải cả list để tìm 1 bản ghi; quan hệ festival ↔ location tính rải rác | `HomeScreen.tsx:230`, `DetailLocation.tsx:65-69`, `DetailFestival.tsx:62`, `MapScreenV2.tsx:306,1739` | **`catalogRepository`** duy nhất: tải 1 lần, chỉ mục `byId`, `festivalsByLocationId`, `mapMarkers` |
| **A2** | High | Lẫn `Id` (NocoDB) và `id` (API), ~107 chỗ | Adapter thêm `Id`; UI dùng cả hai | Thống nhất `id`; bỏ `Id` khỏi adapter và type |
| **A3** | Medium | Payload ~485 KB không nén, không cache HTTP | Đo GET live | BE `GZipMiddleware` + `Cache-Control`/`ETag`; giữ mô hình tải toàn bộ list |
| **M1** | Medium | Lỗi mạng chờ tới ~90 s/trang (timeout 30 s × 3) | `catalog.client.ts` | Timeout 12 s, retry 1 lần, deadline tổng 30 s |
| **M2** | Medium | Map đang tắt; dữ liệu đã đủ 29 marker; `isMapLocationVisible` (publishable + GPS hợp lệ) đã có | `featureFlags.ts`, `catalogVisibility.ts` | Bật map, marker từ repository |
| **M3** | Medium | 21 festival chưa có `location_id` | Dữ liệu live | Ẩn dòng địa điểm khi trống; User bổ sung dữ liệu dần |
| **M4** | Medium | Không test core BE, không CI cả 2 repo | `Travel_BE/tests/`; không có `.github/workflows` | Khôi phục `tests/check_core_api.py` từ `47ededb` + test contract mới; GitHub Actions chạy test recovery + catalog (FE) và test core (BE) |
| **M5** | Low | Tài liệu/smoke lệch số liệu | `container_smoke.py` (festivals 43), `db/README.md`, `deploy/README.md`, `RECOVERY_*.md` | Cập nhật baseline 123/82/49 |

---

## 3. Kiến trúc đích

```
API (Cloud Run, gzip + ETag)
   ▼
catalog.client ──► catalogRepository (cache 1 nơi, TTL 10 phút + pull-to-refresh)
                     ├─ locations[], festivals[]   (key: id)
                     ├─ locationById, festivalById, festivalsByLocationId
                     └─ mapMarkers = locations.filter(isMapLocationVisible)
   ▼
Screens (Home, ViewAll, Detail, Festival, Map, Search) — chỉ đọc repository
```

Nguyên tắc: không dữ liệu fix cứng; nội dung chỉ từ API; một khóa `id`; giữ `catalog.client`/adapter, repository là lớp mỏng; mỗi phase có test, `tsc` ≤ 63, CI xanh. _(30/10: baseline tsc hiện là 62; kiến trúc toàn app ở mục 8.)_

---

## 4. Quyết định đã chốt (User, 29/10)

| # | Quyết định |
|---|---|
| D1 | Chạy tiếng Việt trước; nội dung catalog tiếng Anh bổ sung sau qua dữ liệu (không dùng file dịch theo ID) |
| D2 | Accounts/transactions/objects hoãn tới phase auth |
| D3 | Map dùng Mapbox public token (`pk.`), vẫn dùng Mapbox API; rotate các key cũ trong lịch sử repo trước khi phát hành |
| D4 | Giữ billing guard 26.000 VND/tháng (tắt cả project). Chấp nhận rủi ro app ngừng khi vượt ngưỡng; cần theo dõi chi phí sau phát hành |

---

## 5. Phase

| Phase | Mục tiêu | Nghiệm thu |
|---|---|---|
| **P0 — Baseline, test, CI** | Baseline 123/82/49; khôi phục test core BE; test contract; CI 2 repo | CI xanh trên PR; smoke khớp live |
| **P1 — Bỏ dữ liệu fix cứng** | Xóa constants + bản dịch catalog; helper trả dữ liệu API; empty state | Không còn file dữ liệu cứng; mọi id hiển thị đúng tên như API (tiếng Việt) |
| **P2 — Data layer** | `catalogRepository`; thống nhất `id`; timeout/retry; BE gzip + ETag | 1 lượt tải cho cả app; không còn `Id`; payload nén < 120 KB; lỗi mạng báo ≤ 30 s |
| **P3 — Home/Festival/Search** | Gần bạn (GPS + quyền), search location + festival, pull-to-refresh, liên kết festival ↔ location | Từ chối quyền vẫn xem list; search khớp API |
| **P4 — Map** | Bật map, marker = `isMapLocationVisible` (29), festival tại marker, chỉ đường có guard | Marker đúng; không background location |
| **P5 — Nghiệm thu Android** | Cold start → list → detail → map → mất mạng | Chỉ gọi Cloud Run + ảnh + Mapbox; pass trên emulator và máy thật |
| **P6 — Phát hành** | Rotate key, signing, permission/cleartext/versionCode; giữ billing guard (D4) | Checklist phát hành pass |
| Backlog | Nội dung tiếng Anh → Hotels trong search → auth + accounts → review → AI → PayOS | Phase thiết kế riêng |

> Bảng trên là kế hoạch gốc 29/10. **Kế hoạch hiện hành (30/10)**: P0–P4 giữ nguyên; các mục Backlog trở thành P5–P11; Clean là P12; P5/P6 cũ (nghiệm thu, phát hành) đổi số thành **P13/P14**. Chi tiết ở mục 8.4 và trong tasklist.

---

## 6. Kiểm kê tính năng toàn app (30/10/2026)

Nguồn: đọc code FE (`src/`, nhánh `migration/p0-p1` @ `d9d79a8` + working tree), BE (`Travel_BE` `main` @ `a663edb`), `git log/show`, GET chỉ đọc vào API live (`/health`, `/openapi.json`: chỉ có `/locations`, `/festivals`, `/hotels`, `/`, `/health`, `/health/ready`).

**Ký hiệu trạng thái:** ✅ đang chạy · 🚩 tắt bằng `FEATURE_FLAGS` · 💤 code bị comment (route/import/khối) · 🗄️ chỉ còn gọi NocoDB/DigitalOcean cũ · ⛔ chết (code còn nhưng không có đường gọi) · 🆕 chưa có code · 🅱 Backlog đã chốt.
**Commit tắt chính:** FE `1c03405` "Phase 1 - Just run app" (flags = false, comment route/tab trong `AppContainer.tsx`, chặn `axios.ts`); FE `1517037` "Phase 2" (catalog sang Cloud Run, đọc NocoDB chuyển thành comment trong `locations.api`/`festivals.api`); FE `3a5a9bd`/`3583e90` (gỡ JSX mục Items ở màn Lễ hội); FE `dbec4ea` (marker → `publishable`); BE `67d8858` "Phase 4" (comment router AI, `/detect`, payment trong `app.py`; comment dependency AI/payment trong `requirements.txt`; Dockerfile chỉ COPY `app.py` + `core_api/`).
**Công sức:** S ≤ 1 ngày · M 2–3 ngày · L 4–6 ngày (1 dev, có test).

### 6.1 Bảng kiểm kê — thành phần

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
| F16 | Viết review địa điểm (sao, nội dung, ảnh) | `NewFeedScreen:188-225`, `locations.api.createReview` (GET + PATCH bản ghi NocoDB) | 🆕 | 🆕 (xem Q5) | NocoDB | 💤 + 🗄️ |
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

### 6.2 Bảng kiểm kê — vị trí code, phụ thuộc, rủi ro, công sức

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
| F19 | `FestivalsScreen.tsx:85-118`; JSX ở `git show 3583e90^:src/container/screens/Festival/FestivalsScreen.tsx`; `AppContainer.tsx:41-42,353-358`; `locations.api.ts:234-280` | bảng `items` + dữ liệu export từ NocoDB (U18) | dữ liệu nằm ở NocoDB — mất nếu tắt NocoDB trước khi export | BE M · FE S |
| F20 | `AppContainer.tsx:28,32,289-303,337-339`; `CameraScreen.tsx:96,186-205`; `PreviewImage.tsx:45-60`; BE `app.py:92-100`, `service.py`, `data.py` | F19 (mô tả từ `items`), F18 (ảnh tạm), Secret | mỗi lần nhận diện = 1 SerpAPI + 2–3 OpenAI; quyền Camera; `data.py` là dữ liệu cứng | BE M · FE S |
| F21–F23 | flag ở `SemanticSearchBarComponent.tsx:86,122,313`, `ViewAllLocation.tsx:49,100,183`, `ViewAllFestivals.tsx:49,100,183`, `DetailLocation.tsx:511`, `HomeScreen.tsx:441`; `semantic.api.ts:275-555`; BE `app.py:23,61-64`, `routers/*`, `services/*` | F26, F09 (F23), BE deps AI | chi phí OpenAI ngoài guard; endpoint `/recommendations/{user_id}` và `/memory/user/{user_id}` tin `user_id` từ URL (phải lấy từ token) | BE M · FE S |
| F24–F25 | `AppContainer.tsx:49,377-379`; `App.tsx:53-55`; `ChatbotScreen.tsx:86-275`; `chatbot.api.ts:36-309`; BE `routers/chat.py`, `rag_service.py`, `memory_service.py` | F21/F26, F09 (memory theo user), F18 (ảnh) | **key OpenAI/SerpAPI nằm trong bundle app**; chat không giới hạn → cạn ngân sách | BE M · FE M |
| F26 | `app.py:26,36-42`; `startup_indexer.py:52` ("Rebuild all FAISS indexes from NocoDB data"); `faiss_indexes/` (247 vector) | F19 (item), Neon | build lại khi mỗi cold start = tốn OpenAI + chậm khởi động | BE M |
| F27–F28 | `AppContainer.tsx:48,374-376`; `Donation.tsx:39-83`; `payment.api.ts:24`; BE `app.py:79-189`, `payment_service.py:28` (`verify_webhook_signature` không được gọi), `nocodb_service.py:145-301` | F09, bảng `transactions` | **webhook giả có thể cộng tiền**; phí PayOS; giao dịch tiền thật | BE M · FE S |
| F29–F30 | `featureFlags.ts`; `AzureTranslatorService.ts:46,79`; `TranslationContext.tsx:97`; bật/tắt ở `1c03405` | D1, Q10 | key Azure trong bundle; F0 miễn phí 2M ký tự/tháng | BE S · FE S (nếu giữ) |
| F31 | `translationHelpers.ts:6-26` | migration cột `*_en`, nhập dữ liệu | công nhập nội dung | BE S · FE S · dữ liệu L |
| F32 | — | `catalogRepository` | +1 lượt `/hotels` (đo live 30/10: 226 KB thô → ~44 KB gzip) chỉ khi search | FE S |
| F34–F37 | xem mục 9 | — | NocoDB/DO còn chạy có thể tốn phí; URL cũ làm app gọi nhầm | Clean |

### 6.3 Đếm theo trạng thái (trạng thái chính của từng tính năng)

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

## 7. Khoảng trống để app chạy hoàn chỉnh

| ID | Mức | Khoảng trống | Bằng chứng | Hướng xử lý (phase) |
|---|---|---|---|---|
| **G1** | Critical | **Key bí mật bị nhúng vào APK**: `babel.config.js` để `allowlist: null`; `env.ts:10-24` import `OPENAI_API_KEY`, `SENDGRID_API_KEY`, `SERPAPI_KEY`, `AZURE_TRANSLATOR_KEY`, `NOCODB_TOKEN`, `UNSPLASH_ACCESS_KEY`, `PASSWORD_SALT`; `.env` local đang có giá trị cho cả 7 key (chỉ kiểm độ dài, không in giá trị). Mọi APK debug đã build đều chứa các key này | `babel.config.js`, `src/utils/env.ts` | P5.1: allowlist chỉ biến public; rotate key (P14.1) |
| **G2** | Critical | BE không có auth, không có đường ghi; role `travel_runtime` chỉ SELECT; Accounts/Transactions rỗng | `db/permissions/001_runtime.sql`; `core_api/config.py` ép `APP_PROFILE=core` | P5 |
| **G3** | Critical | Dữ liệu chỉ có ở NocoDB: accounts, transactions, items (≈ 11), objects (mô tả hiện vật), review, user memory, conversation. Tắt NocoDB trước khi export là **mất dữ liệu** | `auth.api.ts:12`, `locations.api.ts:35`, `nocodb_service.py:13,141-142`, `memory_service.py:13-14` | U18 export ngay (chỉ đọc), import theo từng phase |
| **G4** | High | Tích hợp bên thứ ba gọi từ app (OpenAI, SerpAPI, SendGrid, Azure) — trái quy tắc "chỉ qua BE" | F11, F24, F29 | P5 (email), P9 (chat), P11 (dịch) |
| **G5** | High | Router AI/payment/detect chỉ có trên DigitalOcean (code còn, bị comment); FE trỏ `SERVER_URL`/`PAYOS_BACKEND_URL` = DO | `app.py:18-27,61-64,92-189`; `configs.ts:3` | P8–P10: bật lại trên Cloud Run; một base URL `API_BASE_URL` = Cloud Run |
| **G6** | High | Webhook PayOS không kiểm chữ ký; `user_id` lấy bằng regex trong description | `app.py:127-162`; `TECHNICAL_REPORT.md` §7.3 | P10 |
| **G7** | High | FAISS index lệch ID (ID NocoDB) và được build từ NocoDB | `faiss_indexes/text_id_map.json`, `startup_indexer.py:52` | P9: build lại từ Neon |
| **G8** | High | Không có lối vào Settings/FAQ/Policy/About (đổi ngôn ngữ UI không dùng được) | F08 | P6 (mở tab Profile; guest vẫn vào được) |
| **G9** | High | Chính sách Play: xóa tài khoản, UGC (báo cáo/ẩn review), Data safety, bỏ `ACCESS_BACKGROUND_LOCATION` + `USE_EXACT_ALARM` (manifest dòng 8, 12), `RECORD_AUDIO` không dùng, cleartext | `AndroidManifest.xml:3-21` | P6 (xóa TK), P7 (báo cáo review), P14 |
| **G10** | Medium | Dữ liệu cứng ở BE: `data.py` (9 hiện vật), `available_object_titles_fallback` (`service.py:27-37`) | — | P8: đưa vào bảng `items`, sau đó Clean |
| **G11** | Medium | Billing guard chỉ bảo vệ chi phí **GCP**; OpenAI/SerpAPI/SendGrid/PayOS/Azure/Mapbox/Neon nằm ngoài guard | `deploy/billing_guard/README.md` | Mỗi dịch vụ một trần riêng (mục 10, Q7) + quota trong BE |
| **G12** | Medium | 6 suite test hỏng từ trước | U6 | Sửa trong phase của tính năng tương ứng (P9, P11, P13), không xóa |
| **G13** | Medium | `IAccount.Id`/`IItem.Id`/`ITransaction.Id` còn khóa NocoDB | `types.tsx` | Adapter mới trả `id` (P6, P8, P10) |
| **G14** | Low | Thay đổi BE đã stage nhưng chưa commit trên `main`: `deploy/README.md`, `deploy/service.yaml` | `git -C Travel_BE status` | U25 |
| **G15** | Medium | Bundle JS cũ (`android/app/src/main/assets/index.android.bundle`, 11/2024, còn URL DigitalOcean) và APK release 93 MB (`android/app/release/`) **đang được track trong git** | `git ls-files android/app` | CF22 + `.gitignore`; quét key trong lịch sử (U30) |
| **G16** | Low | 1/4 tài khoản export có mật khẩu rỗng → không đăng nhập được khi chưa có quên mật khẩu (Nợ) | `accounts.json` | Q17 |
| **G17** | Low | imgbb không có API xóa ảnh bằng key (chỉ trả `delete_url` dạng trang web) → xóa tài khoản không tự xóa được ảnh đã upload | tài liệu imgbb | Lưu `delete_url`; ghi rõ trong Policy; theo dõi khi phát hành (Q4) |
| **G18** | Low | `.env` BE có `NOCODB_CONVERSATIONHISTORY_TABLE_ID` trong khi code đọc `NOCODB_CONVERSATION_TABLE_ID` → bộ nhớ hội thoại cũ vốn chưa từng chạy đúng | `memory_service.py:14` | Không ảnh hưởng (chuyển sang Neon, bảng bắt đầu rỗng) |

---

## 8. Kiến trúc đích toàn app (cập nhật theo quyết định 30/10, mục 11.1)

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

### 8.1 Nguyên tắc
- App chỉ nói chuyện với **Cloud Run**, host ảnh (catalog + imgbb), Mapbox. Mọi key trả phí chỉ nằm ở Secret Manager; `.env` của FE chỉ còn `CATALOG_API_URL`, `API_BASE_URL` (cùng URL Cloud Run), `MAPBOX_ACCESS_TOKEN` (`pk.`).
- **Dùng lại code đã có**: màn hình FE giữ nguyên, chỉ đổi phần ruột của service (`auth.api`, `locations.api` review/upload/items, `semantic.api`, `chatbot.api`, `payment.api`) sang gọi BE, giữ tên hàm. BE bật lại router/endpoint đang comment, thay lớp NocoDB bằng repository Neon cùng chữ ký hàm (`create_transaction`, `get_user_by_id`, `update_user_balance`, `MemoryService`…), thay URL DigitalOcean bằng Cloud Run.
- **NocoDB và DigitalOcean phải sạch hoàn toàn** sau migration: không còn code, biến môi trường, script, file cấu hình (`.do/`, `Procfile`), tài liệu hướng dẫn hay dữ liệu mẫu nào trỏ tới hai dịch vụ này. Ngoại lệ duy nhất: phần lịch sử trong `MIGRATION_AUDIT.md`/`MIGRATION_TASKLIST.md` và lịch sử git (tiêu chí ở P12).
- Tính năng **Nợ** (email quên mật khẩu, PayOS) vẫn phải bỏ NocoDB/DO ngay trong migration: lớp dữ liệu chuyển sang Neon, URL sang Cloud Run, nhưng endpoint/màn hình giữ tắt tới phase hoàn thiện sau.
- Danh tính lấy từ JWT, không tin `user_id` trên URL/body.
- Chống tốn tiền: quota theo user/ngày cho `/detect`, `/api/v1/chat/*`, `/uploads`; giới hạn tần suất login.
- Ghi DB: mỗi phase một file migration (`db/schema/007…`) + quyền tối thiểu cho runtime role. User chạy migration bằng owner role (U22).
- **File tạm phải dọn ngay trong phase tạo ra nó** (script import một lần sau khi đối chiếu xong, bản copy dữ liệu export, report, index thử, bundle/APK build thử). Dữ liệu export NocoDB nằm ngoài repo (`C:\Users\lekha\Downloads\DATA NOCODB`), không được copy vào repo. File có sẵn từ trước vẫn đi qua danh sách P12 để User duyệt.

### 8.2 Bảng DB mới / thay đổi (tên cuối cùng chốt khi làm)
| Migration | Phase | Nội dung | Dữ liệu import |
|---|---|---|---|
| 007_auth | P5 | `accounts`: thêm `token_version`, `deleted_at`; `password_hash` có tiền tố thuật toán (`sha256salt$…` cho hash cũ, `scrypt$…` cho hash mới); quyền runtime trên `accounts` (trừ `balance`) | `accounts.json`: **3** tài khoản có hash SHA256 (tài khoản mật khẩu rỗng **bỏ**, không có giao dịch/số dư — Q17); `transactions.csv`: 7 dòng PAID, đều map được qua `userName`. Đây là dữ liệu seeding của User, không phải người dùng thật |
| 008_reviews | P7 | `reviews` (account_id FK, location_id \| festival_id, rating 1–5, content, images JSONB gồm `url` + `delete_url`, status, created_at), `review_reports`; quyền runtime INSERT/UPDATE | **không import** — 388 + 92 review cũ trong export bỏ (Q16). Bảng bắt đầu rỗng; review mẫu do tài khoản seeding tạo sau (Nợ N4) |
| 009_objects | P8 | bảng **`objects`** (gộp Items + Objects + `data.py`): record_id, title, content, images, video, location_id FK nullable, aliases | `objects.json` (11 bản ghi = 9 của `data.py` + "Cầu Rồng" + "Trường Đại học CNTT&TT Việt - Hàn"; chỉ có `title`, `content`) |
| 010_ai_memory | P9 | `user_memories`, `conversations` (thay bảng NocoDB) | không có (bắt đầu rỗng) |
| 011_payments | P10 | quyền INSERT/UPDATE `transactions`, UPDATE `accounts.balance` — **soạn + test, chưa áp dụng** (Nợ PayOS) | — |
| 012_i18n_content | P11 | cột `*_en` nullable cho locations/festivals/hotels/objects | script dịch một lần (OpenAI) |
| 013_drop_legacy_catalog_columns | P12 | bỏ cột `reviews` JSONB và `rating` khỏi locations/festivals/hotels (đã thay bằng bảng `reviews`) | — |

**Trả lời câu hỏi của User ở Q5 (có nên tách cả rating sang bảng reviews?)** — Nên. Bảng `reviews` là nguồn duy nhất: mỗi review có `rating` 1–5; điểm của địa điểm/lễ hội = `AVG(rating)` của các review đang hiển thị, kèm `review_count`. BE tính khi trả catalog (subquery tổng hợp, index `reviews(location_id)`, `reviews(festival_id)`). API vẫn giữ trường `rating` (có thể null) nên FE không đổi chỗ hiển thị, thêm `review_count`; trường mảng `reviews` trong catalog bỏ, Detail/Feed đọc `GET /reviews`.
- Lợi: không có hai nguồn lệch nhau; xóa/ẩn review (xóa tài khoản, bị báo cáo) tự cập nhật điểm.
- Đánh đổi: catalog cache 300 s nên điểm mới hiện trễ tối đa 5 phút (sau khi gửi review, app tự cập nhật màn đang xem).
- Dữ liệu: trên Neon cột `rating` toàn `null`, `reviews` toàn `[]` → bỏ cột không mất gì. Bước xóa cột để ở P12 (sau khi FE đã đọc bảng mới). Hotels chưa có review → `rating` = null.

### 8.3 Luồng chính
- **Auth:** SignUp → `POST /auth/signup` (hash scrypt ở BE) → JWT; Login → JWT lưu `localStorageKey.AUTH_TOKEN`, **không lưu mật khẩu**. Tài khoản import có hash cũ: BE kiểm bằng đúng công thức cũ `SHA256(password + PASSWORD_SALT)` (`auth.api.ts:28-33` — chính là hàm hash User nhớ), salt chuyển vào secret; đúng thì rehash scrypt ngay. Quên mật khẩu: **Nợ** (`ForgotPasswordScreen` giữ comment).
- **Review:** chọn ảnh → `POST /uploads` (BE đẩy lên imgbb, lưu `url` + `delete_url`) → `POST /reviews` → Feed/Detail đọc `GET /reviews?location_id=`; rating tính ở BE.
- **Detect:** Camera → `POST /detect` (multipart, JWT) → imgbb tạm 600 s → SerpAPI Lens → OpenAI → tra `objects` → `{name, description}`.
- **AI:** catalog + `objects` trong Neon → script build FAISS (OpenAI embeddings) lúc build image → `/api/v1/search|similar|recommendations`; `objects` là nguồn RAG cho search/chatbot; Chat → `/api/v1/chat/rag` (RAG + memory theo user).
- **Payment (Nợ):** code chạy trên Neon/Cloud Run nhưng endpoint tắt. Khi hoàn thiện: Donation → `POST /payments/create` → PayOS → webhook có chữ ký → PAID + cộng `balance` (idempotent theo `order_code`).

### 8.4 Thứ tự phase (theo phụ thuộc)
| Phase | Nội dung | Phụ thuộc |
|---|---|---|
| P0–P4 | Đã xong (guest catalog + map) | — |
| **P5** | Nền BE: kiểm tra key + gom vào Secret Manager, chặn lộ key ở APK, module flag, migration 007, import accounts/transactions, auth API | — |
| **P6** | FE Login/SignUp/Profile/Personal/Settings + xóa tài khoản (Forgot = Nợ) | P5 |
| **P7** | Upload (imgbb) + bảng reviews + rating tính từ reviews + Bảng tin + báo cáo review | P5, P6 |
| **P8** | Bảng `objects` + Items/Camera/detect | P7 |
| **P9** | AI: FAISS từ Neon, semantic search, tương tự, gợi ý, chatbot RAG, memory | P6, P8 |
| **P10** | Payment: bỏ NocoDB/DO khỏi code payment, chuyển sang Neon/Cloud Run, **giữ tắt** (Nợ) | P5 |
| **P11** | i18n UI vi/en, dịch nội dung một lần bằng script → cột `*_en`, Hotels trong search, nhãn `types` | P9 |
| **P12** | CLEAN (mục 9) + xác nhận sạch NocoDB/DO/Firebase/Azure | P5–P11 |
| **P13** | Nghiệm thu Android toàn app | P12 |
| **P14** | Phát hành (Login lên đầu, chính sách Play) | P13 |
| Nợ | Email quên mật khẩu; PayOS/Donation; dịch tự động/i18n nâng cao | sau P14 |
| Backlog | Refactor/tối ưu; cảnh báo giọng nói (F07) | — |

---

## 9. Đầu vào phase Clean (P12) — chỉ xóa sau khi tính năng liên quan đã khôi phục

Mỗi mục cần User duyệt. "Bằng chứng" = kết quả grep import/tham chiếu trên `src`, `App.tsx`, `index.js`, `__tests__` (FE) hoặc `app.py` + Dockerfile (BE) ngày 30/10. Mục có điều kiện chỉ xóa khi phase ghi bên cạnh đã xong. File tạm do chính các phase P5–P11 tạo ra không nằm ở đây: dọn ngay trong phase đó (mục 8.1).

### 9.1 FE — file/code
| # | Mục | Bằng chứng không dùng | Điều kiện | Lý do |
|---|---|---|---|---|
| CF1 | `src/services/AIApi.tsx` (baseURL `maps.googleapis.com`) | không file nào import | — | code chết |
| CF2 | `src/utils/decodePolyline.ts` | không import; Directions trả `geojson` | — | code chết |
| CF3 | `src/component/ButtonBase.tsx`, `ChatBubble.tsx`, `SearchBarComponent.tsx` | không import (bản dùng là `FloatingChatBubble`, `SemanticSearchBarComponent`) | — | trùng/chết |
| CF4 | `src/data/baseTranslations.ts` | không import | — | thay bằng i18n `common` |
| CF5 | `src/res/languages/{en,jp,strings}.tsx` | không import (`res/strings.tsx` vẫn dùng — giữ) | — | thay bằng i18n |
| CF6 | **NocoDB phía FE**: `src/services/axios.ts`, `DB_URL`/`NOCODB_TOKEN` trong `configs.ts`/`env.ts`/`env.d.ts`/`env.mock.ts`, table ID (`auth.api.ts:12-16`, `locations.api.ts:34-40`, `festivals.api.ts:10-14`), chú thích nhắc NocoDB (`types.tsx`, `translationHelpers.ts:4`, `constants.tsx`, `featureFlags.ts`, `MapScreenV2.tsx:335`, `NewFeedScreen`, `ChatbotScreen`, `Donation`, `Personal`), script npm `translate:nocodb` | `git grep -il nocodb` (FE: 20 file ngoài tài liệu migration) | P10 | yêu cầu sạch NocoDB |
| CF7 | Khối comment NocoDB "P2: Original NocoDB catalog read retained" (`locations.api.ts:83-232`, `festivals.api.ts:37,79-114`), cache cũ (`locations.api.ts:44-75`) | catalog đọc qua `catalogRepository` từ P2 | P8 | code chết |
| CF8 | `festivals.api.createFestival/updateFestival/getFestivalsByMonth` (F34) | không UI gọi | P7 | chết |
| CF9 | Gọi trực tiếp dịch vụ ngoài: `chatbot.api.ts` (OpenAI/SerpAPI), `auth.api.ts` (SendGrid, hash/OTP ở client, `getAccounts`); biến `OPENAI_API_KEY`, `SERPAPI_KEY`, `SENDGRID_API_KEY`, `PASSWORD_SALT`, `PAYOS_BACKEND_URL`, `SERVER_URL` | sau khi ruột service chuyển sang BE (logic gửi mail đã chuyển sang BE ở trạng thái Nợ) | P6, P9, P10 | quy tắc 3 |
| CF10 | `UNSPLASH_ACCESS_KEY` (`env.ts`, `env.d.ts`, `env.mock.ts`) | không có nơi dùng ngoài khai báo | — | chết |
| CF11 | Khối comment "P1: Legacy GPS/nearby loader" (`HomeScreen.tsx:194-…`) | đã thay bằng loader P3 (xin quyền khi bấm); User đồng ý giữ bản P3 (Q15) | — | trùng |
| CF12 | Comment trong `MapScreenV2`: lượt gọi Directions trùng (`:1475`), prop `onRegionDidChange` deprecated, rule camera cũ, comment "fetch từ NocoDB" (`:335`). **Không** gồm khối `BackgroundGeolocation` (Backlog) | P4 đã thay | — | chết |
| CF13 | `// P1: if (FEATURE_FLAGS.RECOVERY_MODE)` (`DetailLocation.tsx:60`, `DetailFestival.tsx:60`), flag `RECOVERY_MODE`, `ENABLE_NOCODB`; flag luôn `true` sau P11 (tùy User giữ làm công tắc khẩn) | — | P11 | nhánh chết |
| CF14 | `crypto-js`, `@types/crypto-js` | chỉ `auth.api.ts` dùng (hash ở client) | P6 | hash chuyển BE |
| CF15 | Script npm `translate:ui|nocodb|csv|all` (thư mục `scripts/` không tồn tại), `link` (RN ≥ 0.60) | `ls scripts` lỗi | — | hỏng |
| CF16 | npm không import ở đâu: `openai`, `papaparse`, `@types/papaparse`, `@types/lodash`, `i18next-http-backend`, `react-native-fs`, `@react-navigation/material-top-tabs` (+ `react-native-tab-view`, `react-native-pager-view` nếu không lib nào cần), `react-native-swipe-gestures`, `react-native-modal`, `react-native-keyboard-aware-scroll-view`, `react-native-video`, `react-native-permissions`, `metro-react-native-babel-preset`, `sharp`, `dotenv` | grep tên package trên `src`, `App.tsx`, `index.js`, config | build Android lại | giảm APK. **Giữ** `react-native-webview` (peer của youtube-iframe) |
| CF17 | Ảnh không tham chiếu: `banner`, `banner2`, `causonghan`, `vooc`, `frame`, `icon_camera`, `danang`, `danang_logo`, `chibi`, `nguhanhson`; `src/assets/svg/Frame.svg`; 41/64 SVG trong `src/assets/assets/svg`; font `NotoSansJP-*` (6) + `Roboto-*` (5) ở `src/assets/assets/fonts` **và** `android/app/src/main/assets/fonts` | grep `images.<key>`, tên SVG, tên font | sau P11 | asset thừa |
| CF18 | `RECOVERY_PLAN.md`, `RECOVERY_TASKLIST.md`, `docs/recovery/p1/README.md` | đã đánh dấu "thay thế" ở P0 | — | lỗi thời |
| CF19 | `docs/TECHNICAL_REPORT.md`, `SEMANTIC_SEARCH_SPECIFICATION.md`, `TRANSLATION_APPROACHES_RESEARCH.md`, `USER_PREFERENCES_COLLECTION_PLAN.md`; phần NocoDB/DO/Azure trong `README.md` | mô tả kiến trúc NocoDB/DO/Azure | P9, P11 | cập nhật hoặc xóa |
| CF20 | Quyền manifest: `ACCESS_BACKGROUND_LOCATION`, `USE_EXACT_ALARM`, `RECORD_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE`; `usesCleartextTraffic` | không tính năng nào cần | P14 | chính sách Play |
| CF21 | **Azure Translator (Q10 = bỏ)**: toàn bộ `src/services/translation/` (6 file `AzureTranslatorService`, `TranslationQueue`, `TranslationCache`, `TranslationPersistentCache`, `OfflineFallback`, `index.ts` — đều phụ thuộc Azure); nhánh "4. Use Azure Translator" trong `TranslationContext.tsx:97-110`; `offlineFallback.initialize` (`AppContainer.tsx:9,431-436`, `LanguageDropdown.tsx:13`); flag `USE_AZURE_TRANSLATOR`, `ENABLE_OFFLINE_CACHE`, `ENABLE_TRANSLATION_BATCHING`; biến `AZURE_TRANSLATOR_*`; test `AzureTranslatorService.test.ts`, `TranslationCache.test.ts`, mock `services/translation` trong `guestNavigation`/`guestTranslation`. **Giữ** `TranslationContext` + `withAzureTranslation` (đang cấp `t`, `language`, `setLanguage` qua i18n cho 8 màn hình; đổi tên HOC là refactor → Backlog) | Q10 | đầu P12 | User chốt bỏ Azure |
| CF22 | **Bundle/APK cũ bị track trong git**: `android/app/src/main/assets/index.android.bundle` (11/2024, còn URL DigitalOcean), `android/app/release/app-release.apk` (93 MB, 10/2024), `android/app/release/baselineProfiles/*`, `output-metadata.json`; thêm vào `.gitignore` | được build lại mỗi lần; bundle lỗi thời | — | file build (lịch sử git vẫn giữ — U30) |

Suite test hỏng từ trước **không xóa**: sửa trong phase tính năng — `semantic.api`, `RecommendationsWidget`, `SimilarItemsComponent` (P9, cài `@testing-library/react-native`), `languageSwitching` (P11), `App.test.tsx` (P13). Riêng `AzureTranslatorService.test.ts` đi cùng CF21.

### 9.2 BE
| # | Mục | Bằng chứng | Điều kiện | Lý do |
|---|---|---|---|---|
| CB1 | `nocodb_service.py` | chỉ `service.py` + `app.py` (comment) dùng; P8/P10 thay bằng repo Neon | P10 | sạch NocoDB |
| CB2 | Phần NocoDB trong `services/memory_service.py`, `routers/memory.py`, `utils/config.py` (`nocodb_*`), `utils/startup_indexer.py`, `scripts/index_data.py`, `core_api/config.py` (`"nocodb"` trong `DISABLED_SERVICES`), `tests/check_core_api.py` | thay bằng Neon | P9 | sạch NocoDB |
| CB3 | `scripts/get_table_ids.py`, `scripts/setup_nocodb_tables.py` | chỉ phục vụ NocoDB | P9 | sạch NocoDB |
| CB4 | `data.py`, `available_object_titles_fallback` (`service.py:27-37`) | 9 bản ghi đã có trong `objects.json` → bảng `objects` | P8 | dữ liệu cứng |
| CB5 | **Firebase (Q4 = imgbb)**: `firestore.py`, `service.upload_file` + khởi tạo `firebase_admin` (`service.py:7,12,54-77`), `firebase-admin` (comment trong `requirements.txt`), `FIREBASE_*` trong `.env` BE, `"firebase"` trong `DISABLED_SERVICES`, đoạn Firebase trong `deploy/README.md` | upload và ảnh tạm đều qua imgbb | P8 | một nhà cung cấp ảnh |
| CB6 | `faiss_indexes/*` hiện tại (ID NocoDB) | thay bằng index build từ Neon | P9 | sai ID |
| CB7 | **DigitalOcean**: `.do/deploy.template.yaml`, `Procfile`, mục "Digital Ocean App Platform" trong `README.md`, mặc định `PUBLIC_BASE_URL` DO (`payment_service.py:18`, `app.py:177`) | Cloud Run dùng `Dockerfile` | P10 | sạch DO |
| CB8 | `main.py` (uvicorn local) nếu không còn dùng; `/detect/test` (`app.py:98`) | Dockerfile không dùng | P8 | chết |
| CB9 | Comment dependency không còn cần (`scikit-learn`, `gunicorn`, `firebase-admin`) | — | P10 | chết |
| CB10 | `TECHNICAL_REPORT.md`, `DEPLOYMENT_PROGRESS.md`, `DEPLOYMENT_TASKLIST.md` | mô tả NocoDB/DO/Firebase, số liệu cũ | P12 | lỗi thời (viết lại ngắn theo kiến trúc mới hoặc xóa) |
| CB11 | `privateKey.json` (local, không track), `db/apply_catalog_v2.py` (U4) | — | khi User xác nhận | secret/tệp một lần |
| CB12 | Biến NocoDB/Firebase/DO trong `.env` BE local (`NOCODB_*` ×11, `FIREBASE_*`, `PUBLIC_BASE_URL` trỏ DO, `ENVIRONMENT`/`PROJECT_NAME` nếu không code nào đọc) | không code nào đọc sau P10 | P10 | sạch cấu hình |
| CB13 | Migration 013 bỏ cột `reviews`/`rating` của catalog (mục 8.2) | FE đọc `GET /reviews` từ P7 | P7 xong | một nguồn rating |

---

## 10. Ước tính chi phí theo tính năng (D4, cập nhật theo 11.1)

Giả định: 1 USD ≈ 26.000 VND; demo ~100 người dùng/tháng. Guard 26.000 VND (≈ 1 USD) **chỉ** tính chi phí GCP. Đơn giá theo bảng giá công khai đã biết; P5.1 kiểm tra key và đọc hạn mức thật qua endpoint miễn phí.

| Hạng mục | Trong guard GCP? | Đơn giá / free tier | Ước tính tháng (demo) | Kiểm soát |
|---|---|---|---|---|
| Cloud Run | Có | free tier request/vCPU-s/GiB-s; min 0, max 1 | ~0 VND | không build FAISS khi startup |
| Artifact Registry | Có | 0,5 GB free, ~0,10 USD/GB-tháng | image AI ~0,6–0,8 GB → ~0–2.000 VND | giữ ≤ 2 image |
| Secret Manager | Có | 6 version free, ~0,06 USD/version-tháng | 0 VND với 1 secret JSON + DB URL | gộp key (Q12) |
| imgbb (upload + ảnh tạm detect) | Không | miễn phí, ≤ 32 MB/ảnh | 0 VND | ảnh ≤ 2 MB, quota/user |
| Neon | Không | Free plan (xác nhận) | 0 VND | theo dõi dashboard |
| OpenAI | Không | gpt-4o-mini 0,15/0,60 USD mỗi 1M token vào/ra; embedding 0,02 USD/1M | chat ≈ 16 VND/tin; detect ≈ 26 VND/lần; build index ≈ 80 VND/lần; **dịch nội dung một lần (P11) ≈ 0,3 USD ≈ 8.000 VND** | User đã trả trước 5 USD (Q7) |
| SerpAPI | Không | free ~100–250 lượt/tháng (P5.1 đọc `account.json`) | 0 VND nếu ≤ free | đếm lượt ở BE |
| Mapbox | Không | 25.000 MAU mobile, 100.000 Directions/tháng | 0 VND | — |
| SendGrid, PayOS | — | **Nợ** — không phát sinh trong migration | 0 | — |
| Azure Translator | — | **bỏ** (Q10) | 0 | — |

### 10.1 Kết quả kiểm tra key (30/10/2026)

Cách kiểm: một script tạm nằm ngoài repo (đã xóa sau khi chạy) đọc `.env` FE/BE, chỉ gọi endpoint **miễn phí/chỉ đọc**, in mã trạng thái + dấu vân tay 8 ký tự (SHA-256), **không in giá trị key**. Riêng Azure: dịch 1 ký tự; imgbb: upload ảnh 1×1 tự xóa sau 60 s.

| Key / cấu hình | Ở đâu | Cách kiểm | Kết quả | Quyết định | Chi phí / hạn mức |
|---|---|---|---|---|---|
| `OPENAI_API_KEY` | FE + BE (cùng một key) | `GET /v1/models` | ✅ 200, có `gpt-4o-mini` và `text-embedding-3-small` | **Giữ** → chuyển vào `travel-app-config`, xóa khỏi `.env` FE | gpt-4o-mini 0,15 / 0,60 USD mỗi 1M token vào/ra; embedding 0,02 USD/1M; trả trước 5 USD (Q7). Ước tính toàn bộ migration (build index vài lần, dịch một lần, thử chat/detect) < 1 USD |
| `SERPAPI_KEY` | FE + BE (cùng một key) | `GET /account.json` | ✅ 200, **Free Plan: 250 lượt/tháng, đã dùng 0** | **Giữ** (BE) cho Camera/Lens; chatbot ưu tiên ảnh catalog | 0 VND trong 250 lượt; vượt thì API từ chối (không tự tính tiền) |
| `IMGBB_API_KEY` | BE | upload 1×1 `expiration=60` | ❌ 400 code 103 "You have been forbidden to use this website" (key giả trả code 100 "Invalid key" → tài khoản/key này **bị chặn**) | **Cần key mới** (U31) — _13:26: key mới vẫn lỗi 103, nghi chặn theo IP → P7.0_. Nếu từ Cloud Run cũng bị chặn → phương án dự phòng: bucket GCS trong `travel2026-511805` (có guard) | imgbb miễn phí; GCS ~7.000 VND/GB lưu+tải |
| `MAPBOX_ACCESS_TOKEN` (`pk.`) | FE | `GET /tokens/v2` | ✅ `TokenValid` | **Giữ** (public, ở `.env` FE) | 25.000 MAU, 100.000 Directions/tháng free |
| `MAPBOX_DOWNLOADS_TOKEN` | `android/gradle.properties` | đọc độ dài | rỗng | Chỉ cần nếu Gradle báo lỗi tải SDK (U14); để ở `~/.gradle/gradle.properties`, không commit | 0 |
| `SENDGRID_API_KEY` | FE | `GET /v3/scopes` | ✅ 200, 206 scope (key còn hiệu lực; **chưa thử gửi mail**, gói tài khoản chưa rõ) | **Giữ cho Nợ N1** → chuyển vào `travel-app-config` (module `email` tắt), xóa khỏi `.env` FE | gói free của SendGrid có thể đã ngừng — kiểm khi làm N1 |
| `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` | BE | `GET /v2/payment-requests/1` (đơn không tồn tại) | ✅ xác thực qua (code `101` "Mã thanh toán không tồn tại"); checksum 64 ký tự | **Giữ cho Nợ N2** → `travel-app-config` (module `payments` tắt) | phí theo hợp đồng PayOS (xác nhận khi làm N2) |
| `NOCODB_TOKEN` (FE) / `NOCODB_API_TOKEN` (BE) | FE + BE (cùng token) | GET 1 bản ghi (bỏ nội dung) | ✅ 200 | **Xóa** sau khi P5/P8 import xong và đối chiếu số liệu; thu hồi token trên NocoDB (U19) | — |
| `DB_URL`, 11 biến `NOCODB_*` (table/base ID) | FE + BE | — | không phải secret | **Xóa** cùng token NocoDB | — |
| `AZURE_TRANSLATOR_KEY` / `_REGION` / `_ENDPOINT` | FE | dịch 1 ký tự | ❌ 401 (key không hợp lệ) | **Xóa** (Q10 bỏ Azure) | — |
| `UNSPLASH_ACCESS_KEY` | FE | `GET /photos?per_page=1` | ✅ 200 nhưng **không code nào dùng** | **Xóa**; thu hồi trên trang Unsplash nếu muốn | — |
| `privateKey.json`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` | BE | đổi token OAuth bằng service account; GET bucket | ❌ "Invalid JWT Signature" (key đã bị vô hiệu); bucket 404 | **Xóa** (Q4 bỏ Firebase) | — |
| `SERVER_URL`, `PAYOS_BACKEND_URL` (FE), `PUBLIC_BASE_URL` (BE) | FE + BE | GET `/health` | ❌ DNS không phân giải `digital-ocean-fast-api-h9zys.ondigitalocean.app` → app DO **đã bị xóa**, không còn tính phí | **Xóa**; thay bằng `API_BASE_URL` (Cloud Run) | 0 |
| `PASSWORD_SALT` | FE | so sánh | bằng giá trị mặc định đã có trong source (`TravelApp_Secret_Salt_2025`) | Chuyển thành `LEGACY_PASSWORD_SALT` trong `travel-app-config` (chỉ để kiểm hash cũ); xóa khỏi `.env` FE | — |
| `ENVIRONMENT`, `PROJECT_NAME` | BE | grep code | không code nào đọc | **Xóa** | — |
| `DATABASE_URL` | BE (+ Secret `travel-database-url`) | API live đọc được 123/49/82 | ✅ | **Giữ** | Neon Free |
| `DATABASE_URL_UNPOOLED` | BE | — (không kết nối) | kết nối direct/admin cho migration | **Giữ** ở `.env` local, không đưa lên cloud | — |

**Đã thử xóa ngay các mục "Xóa" có thể xóa an toàn** (Azure ×3, Unsplash, `SERVER_URL`, `PAYOS_BACKEND_URL` ở `.env` FE; `FIREBASE_*`, `PUBLIC_BASE_URL`, `ENVIRONMENT`, `PROJECT_NAME` ở `.env` BE; file `privateKey.json`), nhưng lệnh bị chặn bởi chế độ quyền tự động → chưa xóa. Việc này chuyển thành U20 (User tự xóa hoặc cấp quyền cho agent). Xóa các dòng này không đổi hành vi app: code đều có giá trị mặc định và các tính năng liên quan đang tắt.

---

## 11. Quyết định cần User chốt (30/10)

| # | Câu hỏi | Lựa chọn (★ = khuyến nghị) | Ưu / nhược | Chi phí |
|---|---|---|---|---|
| Q1 | Gửi email OTP | ★ (a) giữ SendGrid (chuyển code `sendOTPEmail` sang BE) nếu tài khoản còn gói free; (b) Gmail SMTP + App Password; (c) Brevo; (d) không có quên mật khẩu tự động | (a) dùng lại payload sẵn có, phải xác nhận gói; (b) miễn phí, 500 mail/ngày, dễ vào spam; (c) free 300/ngày, thêm tài khoản; (d) rẻ nhất, UX kém | 0 VND nếu free |
| Q2 | Tài khoản cũ trong NocoDB | ★ (a) bắt đầu rỗng (Neon đang rỗng); (b) import và cho đăng nhập bằng hash SHA256 cũ rồi rehash | (a) sạch, tránh mật khẩu đã lộ (U5); (b) giữ user cũ nhưng thêm code tương thích hash yếu | 0 |
| Q3 | Phiên đăng nhập | ★ (a) JWT HS256 hạn 30 ngày + `token_version` để thu hồi (đăng xuất mọi nơi, đổi mật khẩu); (b) access 1 h + refresh token lưu DB | (a) đơn giản, 1 secret; (b) an toàn hơn, thêm bảng + code | 0 |
| Q4 | Nơi lưu ảnh upload | ★ (a) bucket GCS trong `travel2026-511805`, dùng lại code `firebase_admin.storage`/`FileUploadService` với ADC (không cần key); (b) Firebase project cũ (cần key mới); (c) imgbb (đã có code, ảnh ở bên thứ ba) | (a) cùng project, có guard, tốn egress; (b) thêm project/key; (c) 0 VND, phụ thuộc bên thứ ba, có thể hết hạn | (a) ~7.000 VND/GB-lưu+tải; (c) 0 |
| Q5 | Lưu review | ★ (a) bảng `reviews` riêng, API `GET/POST /reviews`, Detail/Feed đọc từ đó; (b) ghi vào JSONB `locations.reviews` | (a) phân trang, báo cáo, xóa theo user (Play); (b) ít code, nhưng ghi đè bản ghi catalog, mất ETag/cache, khó kiểm duyệt | 0 |
| Q6 | Items vs objects | ★ (a) gộp NocoDB `items` + `objects` + `data.py` vào một bảng `items`; (b) 2 bảng | (a) 1 nguồn cho Feed/Camera/FAISS; (b) giữ cấu trúc cũ | 0 |
| Q7 | Phạm vi AI | ★ (a) bật đủ (search, tương tự, gợi ý, chatbot RAG, detect) với quota/user/ngày, OpenAI trả trước 5 USD không auto-recharge, ảnh chatbot lấy từ catalog; (b) như (a) nhưng ảnh chatbot vẫn qua SerpAPI; (c) chỉ semantic search + tương tự | (a) đủ tính năng, trần cứng; (b) giữ hành vi cũ, ăn chung quota SerpAPI với Camera; (c) rẻ nhất, thiếu chatbot | (a) ≤ ~130.000 VND/tháng (trần credit) |
| Q8 | Index FAISS | ★ (a) build bằng script từ Neon lúc build image, COPY vào image; (b) build lúc startup (code cũ); (c) lưu GCS | (a) không tốn OpenAI mỗi cold start; phải build lại khi đổi catalog; (b) đơn giản, tốn tiền + chậm mỗi cold start; (c) thêm code tải | (a) ~80 VND/lần build |
| Q9 | PayOS | (a) dùng tài khoản/kênh PayOS hiện có (cần 3 key + đặt webhook Cloud Run); (b) tạm hoãn payment tới sau phát hành | (a) đủ tính năng, cần kiểm thử tiền thật; (b) phát hành sớm hơn | phí giao dịch PayOS |
| Q10 | Azure Translator | ★ (a) bỏ dịch động; tiếng Anh = UI i18n + nội dung `*_en` trong DB (D1); code Azure vào Clean; (b) giữ qua BE `POST /translate` cho chữ chưa có bản dịch | (a) đúng D1, không phụ thuộc dịch vụ; (b) dùng lại cache/queue sẵn có, thêm endpoint + key | (a) 0; (b) 0 trong F0 |
| Q11 | Nguồn nội dung `*_en` | (a) User tự nhập; ★ (b) script một lần dịch máy (Azure F0) → lưu Neon → User duyệt; (c) chỉ dịch tên + mô tả ngắn | (b) nhanh, cần duyệt; (a) chất lượng cao, tốn công | 0 trong F0 |
| Q12 | Secret Manager | ★ (a) 1 secret JSON `travel-app-config` + DB URL riêng; (b) mỗi key một secret | (a) ≤ 6 version free; (b) rõ ràng, ~6.000 VND/tháng | (a) 0 |
| Q13 | Guest hay bắt buộc đăng nhập | ★ (a) guest xem catalog/map/search/Settings; đăng nhập cho review, upload, camera, chatbot, donation, gợi ý | (a) giữ hành vi hiện tại, giảm chi phí AI vô danh | — |
| Q14 | NocoDB / DigitalOcean | ★ export dữ liệu ngay (U18); tắt DO/NocoDB ở P14 sau khi app mới phát hành | an toàn dữ liệu; DO có thể đang tính phí — kiểm tra | — |
| Q15 | U15 (code Home viết lại ở P3) | (a) giữ bản P3, đưa khối comment cũ vào Clean CF11; (b) khôi phục bản gốc | (a) đã kiểm chứng trên emulator | — |

**Điểm chưa chắc chắn (cần User xác nhận):** tài khoản SendGrid còn gói free không; hạn mức free hiện hành của SerpAPI và Neon; phí PayOS; NocoDB và app DigitalOcean còn chạy và còn truy cập được không (để export); `items` và `objects` của NocoDB có phải cùng tập hiện vật không; project Firebase `travel-app-backend-a9d5f` còn tồn tại không (chỉ quan trọng nếu Q4 = b); `main.py` BE còn dùng để chạy local không; các key trong `.env` FE là key thật đang hoạt động (agent chỉ kiểm độ dài).

### 11.1 Kết quả chốt (User, 30/10 — lần 2)

| # | Chốt | Hệ quả trong kế hoạch |
|---|---|---|
| D5 | Mọi thứ của **NocoDB** chuyển sang Neon; mọi thứ của **DigitalOcean** chuyển sang Cloud Run; sau migration **không còn dính dáng** | Tiêu chí "sạch" ở P12.9 (grep 2 repo = 0, trừ lịch sử migration/git); CF6, CB1–CB3, CB7, CB12 |
| D6 | Dữ liệu NocoDB đã export đủ tại `C:\Users\lekha\Downloads\DATA NOCODB`: `accounts.json` (4), `objects.json` (11), `transactions.csv` (7); kèm `locations.json` (187), `festivals.json` (48) và 3 file CSV | U18 xong. Không có export user memory/conversation → bắt đầu rỗng. Export không có cột `Id` NocoDB → transactions map qua `userName` |
| Q1 | SendGrid có lẽ không còn chạy → **Nợ** chức năng quên mật khẩu qua email | P5 chỉ chuyển logic gửi mail sang BE ở trạng thái tắt; `ForgotPasswordScreen` giữ comment; mục "Nợ" trong tasklist |
| Q2 | **Import** `accounts.json` (mật khẩu đã hash) | Hash là `SHA256(password + PASSWORD_SALT)` từ `auth.api.ts:28-33` (đúng hàm User nhớ). BE kiểm hash cũ rồi rehash scrypt khi đăng nhập thành công (P5.4, P5.5) |
| Q3 | JWT 30 ngày + `token_version` | P5.4 |
| Q4 | Ưu tiên miễn phí, gộp nếu được → **chỉ dùng imgbb** | Hiện trạng: FE upload qua NocoDB Storage; BE `/detect` dùng imgbb trước, Firebase là dự phòng (key Firebase đã disable). Firebase Storage nay cần gói trả phí Blaze cho bucket mới → bỏ Firebase (CB5). imgbb dùng cho cả ảnh upload (vĩnh viễn) và ảnh tạm của detect (`expiration=600`). Rủi ro G17 | **Cập nhật kiểm key 30/10: key imgbb hiện tại bị chặn (code 103) → cần tài khoản/key mới (U31); nếu vẫn bị chặn thì dùng bucket GCS (mục 10.1).**
| Q5 | Tách bảng `reviews`; câu hỏi ngược của User → **có, rating tính từ bảng reviews** | Mục 8.2: API giữ `rating` (tính), thêm `review_count`, bỏ mảng `reviews` khỏi catalog; xóa cột cũ ở P12 (migration 013) |
| Q6 | Items = Objects; gộp cả `data.py` → bảng **`objects`** làm dữ liệu RAG | Migration 009 `objects`; endpoint `GET /objects`; FE giữ tên `IItem`/`getItems` (đổi tên là refactor) nhưng gọi `/objects`; FAISS index `objects` |
| Q7 | OpenAI đã trả trước 5 USD; cắm key dùng thoải mái, cần thì User cấp key mới | Bật đủ AI; vẫn giữ quota/user/ngày để chống lạm dụng từ bên ngoài |
| Q8 | Build lại FAISS | P9.1 (build từ Neon lúc build image) |
| Q9 | **Nợ** PayOS | P10 chỉ bỏ NocoDB/DO khỏi code payment và chuyển sang Neon/Cloud Run, endpoint + Donation giữ tắt |
| Q10 | Bỏ hẳn Azure; chỉ dùng i18n; dọn sạch Azure | CF21; P11 không còn task Azure; mục "Nợ": phase dịch nâng cao sau |
| Q11 | Nếu dịch một lần bằng script rồi dùng được ngay thì làm trong đợt này | Làm được: chữ UI đã có i18n vi/en (`common.json`); nội dung catalog dịch **một lần** bằng script OpenAI → cột `*_en` trên Neon (đúng D1: qua dữ liệu, không file dịch theo ID) → P11.1–P11.2, chi phí ≈ 8.000 VND |
| Q12 | Agent tự xử lý secret an toàn, đủ key để chạy | 1 secret JSON (`travel-app-config`) + secret DB URL hiện có; P5.1 kiểm tra từng key |
| Q13 | Dev: guest xem catalog/map, đăng nhập cho review/upload/camera/chatbot/ủng hộ. Release: Login lên đầu | P6 (guest + mời đăng nhập), P14.7 (Login lên đầu + tài khoản test cho Play review) |
| Q14 | Đã export đủ | U18 xong; tắt NocoDB/DO ở P14 |
| Q15 | Đồng ý: không xin định vị lúc mở app, chỉ xin khi xem "Gần bạn" hoặc vào Bản đồ | Đúng hành vi hiện tại (P3/P4). Khối comment cũ (tự xin quyền lúc mở Home) không cần khôi phục → Clean CF11; U15 đóng |
| Key | Chưa rõ key còn sống | P5.1: kiểm tra từng key bằng endpoint **miễn phí**, báo còn/hết hạn + biểu phí + hướng dẫn tạo key mới |
| Rác | Dọn file tạm trong lúc migration | Gate chung: file tạm dọn trong chính phase tạo ra nó (mục 8.1) |

**Chốt lần 3 (User, 30/10)**
| # | Chốt | Hệ quả |
|---|---|---|
| Q5 | Xác nhận tách `rating` và `reviews` sang bảng mới `reviews` | Như mục 8.2: rating tính từ `reviews`; migration 013 bỏ 2 cột cũ ở P12 |
| Q11 | Dùng OpenAI + script dịch một lần (chi phí OK). **Nơi lưu: Neon**, không lưu ở source | Cột `*_en` trong Neon (migration 012). Lý do: đúng D1 (nội dung qua dữ liệu, không file dịch theo ID — chính lỗi C1 đã sửa ở P1); sửa/bổ sung bản dịch không cần build lại app; record mới thêm vào Neon dịch tiếp bằng cùng script; API trả kèm trường `*_en`. **Chữ giao diện** (nút, tiêu đề, thông báo) vẫn ở source: `src/i18n/locales/{vi,en}/common.json` |
| Q16 | Review cũ trong export là seeding → **xóa, không import** | Bảng `reviews` bắt đầu rỗng; app hiện "Chưa có đánh giá" |
| Q17 | Tài khoản mật khẩu rỗng → **xóa, không import** | Import 3 tài khoản; tài khoản bị bỏ không có giao dịch, số dư 0 (đã kiểm) |
| D7 | Accounts/reviews hiện có là seeding của User. Sau này tạo vài tài khoản mẫu và review như reviewer | **Nợ N4** (seed bằng API sau khi P7 xong, không fix cứng trong source) |
| Key | Kiểm tra mọi key FE/BE; không cần thì xóa; còn chạy thì thống kê chi phí; cần mà hỏng thì yêu cầu cấp lại | Mục 10.1. Cần cấp lại: **imgbb** (U31). Xóa: Azure, Unsplash, Firebase, URL DigitalOcean, NocoDB (sau import), biến không dùng (U20) |

---

## 12. Nhật ký thực thi

### P0 — 29/10/2026
- **Đã làm:** BE docs baseline 123/82/49 + schema 001–006, digest hiện hành; `RECOVERY_*.md` đánh dấu đã thay thế. Smoke festivals=49 đã có sẵn (BE `64d4110`). Khôi phục `tests/check_core_api.py` từ `47ededb`, chạy bằng fake DB (bỏ phụ thuộc cluster/importer/manifest đã gỡ); `--neon` giữ kiểm tra chỉ đọc. Test contract BE (`tests/check_contract.py`) và FE (`__tests__/services/catalog.contract.test.js`; adapter từ chối 11 trường đã bỏ). GitHub Actions cho cả 2 repo, không cần secret.
- **Kiểm chứng:** GET live đọc đủ 123/49/82, đúng tập trường model (chỉ đọc). BE: core + contract PASS (venv 3.12, không cần pytest). FE jest gate 88 pass/1 skip; `tsc` 63 lỗi (= baseline).
- **Commit:** BE `7e0c1d6` (nhánh `migration/p0-p1`); FE `0cc3cf4` (công việc `location_id` đã stage sẵn trước P0) + `7ef3fce`.
- **Cần User:** push 2 nhánh để CI chạy lần đầu (xem mục "Cần User" trong tasklist).

### P1 — 29/10/2026
- **Đã làm:** C1 — `translateLocationField`/`translateFestivalField` trả thẳng giá trị API (giữ chữ ký); xóa 4 file dịch catalog theo ID và namespace `locations`/`festivals` (`i18n/index.ts`, `types.d.ts`, `useTranslation` của các card/Map). C2 — xóa `authConstants`, `locationConstants`, `reviewsConstants` và mọi import/fallback (`DetailLocation`, `NewFeedScreen`, comment trong `MapScreenV2`); rà `src`: không còn mảng location/festival/review/account/item cứng (chỉ còn ảnh banner trang đăng nhập và chuỗi UI). M3/empty state — ảnh lấy `avatar` → `images[0]` → placeholder cục bộ của `CachedImage` (bỏ request tới via.placeholder.com); ẩn rating khi chưa có review; "Chưa có đánh giá"; "Không có video nào"; ẩn địa chỉ/thời gian/lời khuyên rỗng; festival không `location_id` ẩn dòng địa điểm (card + detail).
- **Kiểm chứng:** test mới `catalogDisplay.test.js` (card festival có/không địa điểm), `translationHelpers.test.ts` (id 1 trùng key cũ vẫn hiện tên API, vi + en), `i18n.test.ts` (chỉ namespace `common`, mặc định `vi` — sửa assertion cũ `en` vốn fail sẵn). Gate jest + các test trên: 106 pass/1 skip. Full jest: 6 suite fail đều fail từ trước (App, Azure, semantic, 3 suite thiếu `@testing-library/react-native`). `tsc` 63. Diff không thêm URL/secret.
- **Commit:** FE `migration P1: remove hardcoded catalog data, API-only content, empty states` (nhánh `migration/p0-p1`).
- **Còn để sau:** popup Map vẫn dùng `avatar` trực tiếp (map đang tắt, làm ở P4.2); call site của helper dịch gỡ cùng P2.
- **Cần User quyết định:** mục "Cần User" trong tasklist (push/CI, file `apply_catalog_v2.py`, mật khẩu trong lịch sử git, suite test hỏng sẵn).

### P2 — 29/10/2026
- **Đã làm (FE):** `src/services/catalogRepository.ts` — một lượt tải song song `/locations` + `/festivals`, cache TTL 10 phút dùng chung, `refresh()`/`clear()`; chỉ mục `locationById`, `festivalById`, `festivalsByLocationId`, `mapMarkers` (`isMapLocationVisible`); `festival.location` lấy từ chỉ mục. `createCatalogCache`: tải lỗi không xóa dữ liệu tốt cuối cùng (refresh vẫn báo lỗi để UI có Thử lại; get sau TTL lỗi mạng thì trả snapshot cũ). `locations.api`/`festivals.api` đọc repository nên mọi màn hình dùng chung 1 lượt tải; Home, DetailLocation, DetailFestival, FestivalsScreen, MapScreenV2, SimilarItems, Recommendations đọc repository trực tiếp; Home chỉ force refresh khi bấm Thử lại. ViewAllLocation/ViewAllFestivals nhận list qua params, không tự fetch nên không đổi. A2 — bỏ `Id` khỏi adapter, `ILocation` (`id` bắt buộc), `IFestival` và UI/search (`idField="id"`); `Id` còn lại chỉ thuộc account/transaction/item NocoDB và payload ghi NocoDB cũ (hoãn theo D2). M1 — `catalog.client`: timeout 12 s/request, retry 1 lần (timeout/network/429/5xx), deadline 30 s cho cả list.
- **Đã làm (BE, chưa deploy):** `GZipMiddleware(minimum_size=1000)`; 3 endpoint catalog validate qua `CatalogPage[Model]`, trả `Cache-Control: public, max-age=300` + ETag yếu, `If-None-Match` khớp → 304; lỗi 503/422 không có header cache.
- **Kiểm chứng:** FE `catalog.api.test.js` viết lại theo repository (1 fetch mỗi list cho nhiều màn hình đọc song song, chỉ mục, refresh/clear, giữ snapshot khi lỗi, retry tối đa 1 lần, deadline 30 s). Gate jest 106 pass/1 skip; full jest chỉ còn 6 suite hỏng từ trước; `tsc` 62 (giảm 1). Live (chỉ GET): repository đọc 123 locations / 49 festivals (21 không `location_id`), khớp đọc trang độc lập. BE `check_core_api.py` (thêm gzip/ETag/304) + `check_contract.py` PASS.
- **Payload:** đo live gzip level 9: 486 KB → ~125 KB, hơi vượt mục tiêu < 120 KB (xem U9). FE chưa gửi `If-None-Match` nên 304 chỉ có lợi khi có HTTP cache/proxy.
- **Commit:** không commit theo yêu cầu User (FE nhánh `migration/p0-p1`, BE working tree trên `main`).
- **Cần User:** U8 (deploy BE), U9 (mục tiêu payload), U10 (commit/push FE).

### P3 — 30/10/2026
- **P3.1 Gần bạn:** Home không xin quyền khi mở. Mục "Địa điểm gần bạn" có nút "Dùng vị trí của tôi": Android xin `ACCESS_FINE_LOCATION` (chỉ foreground) → `getCurrentPosition` → `sortByDistance` (`src/utils/nearby.ts`, dùng `haversineDistance`, bỏ record thiếu/sai GPS, 20 gần nhất) → card hiện khoảng cách (`LargeItemLocation.distanceKm`). Từ chối quyền hoặc không lấy được GPS: hiện thông báo, các list khác giữ nguyên, có thể bấm lại. Đã gỡ việc tự xin quyền lúc mount.
- **P3.2 Search:** `src/utils/catalogSearch.ts` — chuẩn hóa bỏ dấu bằng `removeSign` sẵn có (an toàn trên Hermes, không dùng `normalize('NFD')`), mảng `types` và `_`/`-` thành chữ, mọi từ trong truy vấn phải khớp. Location: name/description/types/address; festival: name/description/types/location (tên địa điểm). Dùng chung cho `SemanticSearchBarComponent` (chế độ keyword) và bộ lọc ViewAllLocation/ViewAllFestivals. `types` là slug tiếng Anh (`museum`, `beach`…) nên khớp theo slug; nhãn tiếng Việt đưa vào Backlog.
- **P3.3 Liên kết:** Detail lễ hội: dòng địa điểm bấm được ("Xem địa điểm ›") khi `location_id` tìm thấy trong `locationById`; không có thì không bấm được/ẩn như P1. Chiều Detail địa điểm → "Lễ hội tại địa điểm" đã có từ P2 (`festivalsByLocationId`).
- **P3.4 Pull-to-refresh:** Home và Lễ hội có `RefreshControl` → `catalogRepository.get(true)`; lỗi giữ list đang hiện, `CatalogStatus` báo lỗi + "Thử lại".
- **Kiểm chứng:** `catalogSearch.test.js` (bỏ dấu, nhiều từ, types/venue, khoảng cách, bỏ GPS null) + 3 test màn hình trong `guestMode.test.js` (không xin quyền lúc mount; từ chối → list vẫn còn + thông báo; cho phép → sắp xếp gần nhất; pull-to-refresh lỗi giữ list) + liên kết festival → location. Gate jest 114 pass/1 skip; full jest chỉ 6 suite hỏng từ trước; `tsc` 62; eslint không lỗi mới; diff không thêm URL/secret. Chưa thử trên thiết bị (P5).
- **Lưu ý:** `NavigationService.navigate` tới màn đã có trong stack có thể quay lại màn đó thay vì mở mới (Detail lễ hội ↔ Detail địa điểm); kiểm tra khi nghiệm thu P5.
- **Commit:** không commit (User tự commit/push).
- **Cần User:** U11 (commit/push), U12 (thử trên máy thật).

### P4 — 30/10/2026
- **Nguyên tắc mới (User, 30/10):** tính năng đã có sẵn hoặc đang comment thì tái sử dụng/mở comment; không xóa code đã comment, không viết lại tính năng tương tự. P4 làm theo nguyên tắc này: chỉ mở các khối "P1: Temporarily disabled; retain for restoration" và vá guard trên code sẵn có. **P4.4 (gỡ code GPS/NocoDB đã comment) bỏ qua**; các khối `BackgroundGeolocation` vẫn comment nguyên trạng.
- **P4.1:** `ENABLE_MAP = true`. `.env` có `MAPBOX_ACCESS_TOKEN` dạng `pk.` (không in giá trị; `.env` bị ignore). Mở lại `MapsScreen`/`Advise` (import, `Tabs.Screen` Map, `Stack.Screen`). Tab bar tự vẽ icon theo index nên Map (index 2 khi Feed còn tắt) sẽ mang icon Feed → giữ `switch` icon cũ, chỉ truyền vị trí theo tên tab (`TAB_ORDER`).
- **P4.2:** khi mở tab Bản đồ, `setLocations(catalog.mapMarkers)` (publishable + GPS hợp lệ; live 29); render marker giữ nguyên (`filter(isMapLocationVisible)`). Popup giữ nguyên (tên, mô tả, địa chỉ, ảnh, nút "Lễ hội tại đây" dùng `festivalsByLocationId`); ảnh đổi sang `CachedImage` + `catalogImage` (fallback khi `avatar` rỗng).
- **P4.3:** thêm `hasUserLocation` (chỉ true khi `getCurrentPosition`/`watchPosition` thành công). Trước đây từ chối quyền thì tọa độ mặc định Đà Nẵng được dùng như vị trí người dùng → "Chỉ đường" vẽ từ điểm giả và hiện "Bạn ở đây" sai. Nay: tọa độ mặc định chỉ để căn camera; "Chỉ đường"/nút 📍 khi chưa có GPS → Toast + xin quyền lại; `fetchRouteToLocation` và effect vẽ tuyến yêu cầu `hasUserLocation` + đích có lat/long hữu hạn. Phát hiện mỗi lần bấm "Chỉ đường" gọi Mapbox Directions **2 lần** (gọi trực tiếp + effect) → dòng gọi trực tiếp chuyển thành comment kèm lý do. Vị trí chỉ foreground (`watchPosition`, `clearWatch` khi rời màn); manifest vẫn còn `ACCESS_BACKGROUND_LOCATION` (gỡ ở P6.3). DetailLocation ẩn nút bản đồ/chỉ đường khi địa điểm thiếu GPS.
- **Kiểm chứng:** `__tests__/mapScreen.test.js` (mock Mapbox/TTS/sound/geolocation): chỉ marker publishable có GPS; từ chối quyền → không "Bạn ở đây", không gọi Directions, có Toast; có GPS → đúng 1 lần Directions từ vị trí thật, `clearWatch` khi unmount. `guestNavigation` cập nhật: thêm route `MapsScreen`/`Advise`, tab `TabMap` (Mapbox vẫn bị chặn khởi tạo khi dựng navigation). Gate jest 116 pass/1 skip; full jest chỉ 6 suite hỏng từ trước; `tsc` 62; eslint không lỗi mới (4 lỗi `exhaustive-deps` của MapScreenV2 có từ trước). Diff không có token/URL mới. Chưa build/chạy trên Android.
- **Minh bạch về P3 (trước khi có nguyên tắc mới):** ở `HomeScreen` khối comment "P1: Nearby UI" đã được mở lại thành mục "Gần bạn" (thêm nút xin quyền), và `requestLocationPermission`/`getCurrentLocation` sẵn có đã được viết lại thành `handleUseMyLocation`/`getCurrentLocation` (xin quyền khi bấm). Khối "legacy GPS/nearby loader" vẫn còn comment nguyên. Ở P1 các fallback comment `LOCATION_POPULAR` đã bị gỡ theo yêu cầu P1.3 lúc đó.
- **Commit:** không commit (User tự commit/push).
- **Cần User:** U13 (commit/push), U14 (build Android, có thể cần Mapbox download token), U15 (khôi phục code P3 hay giữ).

### P4 — sửa sau khi User thử máy (30/10/2026)
- **Triệu chứng (User):** đã cấp quyền nhưng định vị sai; không thấy marker publishable. Ảnh snapshot emulator 10:41: map zoom sâu ở Đường Chương Dương (Ngũ Hành Sơn) = đúng tọa độ mặc định khi lỗi GPS, không có "Bạn ở đây", không marker trong khung.
- **Nguyên nhân 1 — định vị:** `@react-native-community/geolocation` 3.4 chưa cấu hình; README: *"The auto mode defaults to android"* → `LocationManager`; `enableHighAccuracy: true` chỉ dùng GPS vệ tinh, trong nhà không có fix trong 15 s → rơi về tọa độ mặc định. Sửa: `Geolocation.setRNConfiguration({locationProvider: 'playServices'})` (`play-services-location` đã có trong `build.gradle`); `getCurrentLocation` thử lại 1 lần với `enableHighAccuracy: false` trước khi dùng mặc định (không thử lại khi bị từ chối quyền).
- **Nguyên nhân 2 — marker "biến mất":** `Camera.centerCoordinate` = vị trí người dùng ở mỗi render → mỗi cập nhật `watchPosition` kéo camera về người dùng; trên emulator fix đầu tiên là vị trí cache `37.42, -122.08` (California) nên bản đồ mở xa khu marker. Sửa: điểm căn camera chọn một lần — địa điểm focus (từ Detail) → vị trí người dùng nếu ≤ 100 km trung tâm marker → trung tâm marker; chuyển sang người dùng đúng 1 lần khi có fix gần đầu tiên; nút 📍 vẫn về vị trí người dùng. Rule cũ giữ dạng comment.
- **Khôi phục hành vi gốc:** trước commit `dbec4ea` map luôn hiện địa điểm đang focus/chọn; nay: `publishable` + GPS **hoặc** đang focus/chọn có GPS (mở map từ Detail của địa điểm không publishable vẫn thấy marker). Focus listener dùng ref (trước luôn đọc `locationPermission = false` cũ). Prop deprecated `onRegionDidChange` (no-op) chuyển thành comment.
- **Tính năng map còn comment:** chỉ khối cảnh báo giọng nói `BackgroundGeolocation` (từ `5092f15`) — không khôi phục, xem U17.
- **Emulator:** kẹt "offline" do boot từ snapshot quickboot dirty + GPU `lavapipe` (driver NVIDIA cũ). Cold boot `-no-snapshot-load -gpu swiftshader_indirect` boot ~35 s (U16).
- **Kiểm chứng trên emulator Pixel_8_API_34** (APK debug sẵn có, Metro, GPS giả Cầu Rồng `16.0611, 108.2270`): log `Location updated` (cache California rồi Cầu Rồng); bản đồ mở tại trung tâm Đà Nẵng, "Bạn đang ở đây" đúng vị trí; marker publishable hiển thị (Sơn Trà, Chùa Linh Ứng, Hoàng Sa, Bảo tàng Đà Nẵng, Sun World…); bấm marker → nút Chỉ đường/Xem; Chỉ đường → 3,4 km / 9 phút, 2 tuyến, nút Guide, log chỉ 1 lần `FETCHING ROUTE`; popup đủ tên/mô tả/địa chỉ/ảnh/4 nút/TTS; Advise hiển thị lời khuyên từ API. Chưa thử máy thật.
- **Test:** `mapScreen.test.js` 5 test (marker publishable; từ chối quyền; chỉ đường 1 request từ vị trí thật; fix xa → trung tâm marker rồi chuyển 1 lần sang người dùng; focus không publishable từ Detail; `playServices` + thử lại độ chính xác thường). Gate jest 119 pass/1 skip; full jest chỉ 6 suite hỏng từ trước; `tsc` 62; eslint MapScreenV2 vẫn 4 lỗi `exhaustive-deps` cũ.
- **Commit:** không commit (User tự commit/push).

### Lập lại kế hoạch toàn app — 30/10/2026
- **Phạm vi:** chỉ phân tích, chỉ sửa `MIGRATION_AUDIT.md` và `MIGRATION_TASKLIST.md`. Không sửa code, không commit/push, không ghi Neon, không build/deploy, không gọi API trả phí. Chỉ GET `/health`, `/openapi.json`, `/locations|festivals|hotels` vào API live.
- **Kết quả:** kiểm kê 38 tính năng (mục 6): 7 đang chạy, 15 bị comment, 7 tắt bằng flag, 2 chỉ còn NocoDB/DO, 3 chết, 4 chưa có code. Khoảng trống G1–G14 (mục 7), kiến trúc đích toàn app (mục 8), đầu vào Clean CF1–CF20 / CB1–CB11 (mục 9), chi phí (mục 10), Q1–Q15 (mục 11). Tasklist có các phase mới P5–P12; nghiệm thu/phát hành đổi số thành P13/P14.
- **Phát hiện chính:** (1) key bí mật bị nhúng vào APK qua `react-native-dotenv` (G1); (2) dữ liệu accounts/items/objects/memory chỉ có ở NocoDB (G3); (3) FAISS index lệch ID (G7); (4) webhook PayOS không kiểm chữ ký (G6); (5) Settings/FAQ/Policy/About không có lối vào (G8); (6) billing guard không bao phủ OpenAI/SerpAPI/email/PayOS (G11).
- **Việc của User:** chốt Q1–Q15; U18 (export NocoDB) nên làm sớm nhất.

### Lập lại kế hoạch — lần 2 (User chốt quyết định), 30/10/2026
- **Phạm vi:** vẫn chỉ sửa 2 file tài liệu. Đọc cấu trúc file export (`C:\Users\lekha\Downloads\DATA NOCODB`): chỉ đếm bản ghi, xem tên trường, kiểm định dạng hash (64 ký tự hex); không in dữ liệu cá nhân, không copy vào repo.
- **Chốt:** mục 11.1 (D5, D6, Q1–Q15). Viết lại mục 8–10 (kiến trúc, bảng DB 007–013, Clean CF1–CF22/CB1–CB13, chi phí); thêm G15–G18; câu hỏi mới Q16 (480 review cũ) và Q17 (tài khoản mật khẩu rỗng).
- **Phát hiện thêm:** bundle JS và APK release cũ bị track trong git (G15); hash mật khẩu export khớp công thức `SHA256(password + salt)` trong `auth.api.ts`; `objects.json` = 9 bản ghi của `data.py` + 2 bản ghi mới; `.env` BE còn 11 biến NocoDB + Firebase + `PUBLIC_BASE_URL` DO (CB12).

### Hoàn chỉnh kế hoạch — lần 3, 30/10/2026
- **Kiểm tra key** (mục 10.1): script tạm ngoài repo, chỉ endpoint miễn phí/chỉ đọc, không in giá trị, đã xóa sau khi chạy. Còn sống: OpenAI (FE = BE), SerpAPI (Free 250/tháng, dùng 0), Mapbox `pk.`, SendGrid (scope hợp lệ), PayOS (xác thực qua), NocoDB, Unsplash (không dùng). Hỏng: imgbb (bị chặn, code 103), Azure (401), service account Firebase (chữ ký không hợp lệ, bucket 404), host DigitalOcean (không còn DNS → app đã xóa).
- **Thử xóa** các dòng key chết/không dùng trong `.env` FE/BE và `privateKey.json`: bị chế độ quyền tự động chặn → chưa xóa, chuyển thành U20.
- **Chốt:** rating + reviews sang bảng `reviews`; bản dịch nội dung lưu ở Neon (`*_en`), chữ UI ở `common.json`; không import review cũ và tài khoản mật khẩu rỗng (đã kiểm: tài khoản đó không có giao dịch, số dư 0); seeding tài khoản/review mẫu là Nợ N4.
- **13:26 30/10:** User thay key imgbb mới; kiểm lại vẫn lỗi 103 "forbidden" → khả năng cao imgbb chặn theo IP/khu vực của máy dev. Tasklist thêm P7.0 (thử từ Cloud Run; nếu vẫn chặn thì dùng bucket GCS). Lịch triển khai P5: 14:02 cùng ngày.

### P5 — 30/10/2026 (code xong, chờ User tạo secret / chạy migration / deploy)
- **P5.1:** kiểm lại key bằng endpoint miễn phí (script tạm ngoài repo, đã xóa): OpenAI 200; SerpAPI Free Plan, còn 250/250 lượt; SendGrid 200; PayOS xác thực qua; imgbb vẫn lỗi 103 (xử lý ở P7.0). Salt cũ = giá trị mặc định đã có trong source.
- **P5.2 (FE):** `babel.config.js` `allowlist` = `CATALOG_API_URL`, `API_BASE_URL`, `MAPBOX_ACCESS_TOKEN`; `src/utils/env.ts` chỉ đọc 2 biến public từ `@env` (+ `API_BASE_URL` mặc định Cloud Run), các trường key giữ kiểu `AppEnv` với giá trị `''` (URL NocoDB/DO cũ giữ làm mặc định tới khi caller chuyển ở P6–P10, dọn ở P12). Kiểm chứng: `npx react-native bundle` release ra thư mục tạm → không chứa giá trị nào của OpenAI, SerpAPI, SendGrid, NocoDB token, PayOS, imgbb; còn `pk.` Mapbox và hằng số đã có trong source (URL/ID bảng NocoDB, salt mặc định) → P12. Bundle tạm đã xóa.
- **P5.3 (BE):** `core_api/config.py` — module bật qua `APP_FEATURES` (`auth`, `email`), secret JSON `APP_CONFIG_JSON` (Secret Manager `travel-app-config`; local có thể dùng biến cùng tên trong `.env`), thiếu key → lỗi chỉ nêu tên key; `email` cần `auth`. `/health` báo module bật; `/` trả `features`. Không bật module → hành vi như trước (check_core_api PASS). `DISABLED_SERVICES` bỏ `nocodb`, `firebase`, thêm `auth`.
- **P5.4:** `db/schema/007_auth.sql` (`token_version`, `deleted_at`, CHECK định dạng hash, CHECK tài khoản đã xóa không giữ dữ liệu cá nhân); `db/permissions/002_auth.sql` (SELECT `accounts`; INSERT/UPDATE cột hồ sơ/mật khẩu, **không** `balance`; UPDATE `transactions.user_name`). `scripts/import_seed_accounts.py` (một lần: dry-run/self-test/`--apply` trong 1 transaction, idempotent, đối chiếu số dòng + tổng tiền, không in dữ liệu cá nhân). Dry-run trên export: 3 accounts, bỏ 1 mật khẩu rỗng, 7 transactions map 7/7; tổng giao dịch PAID 172.000 VND, tổng `balance` 167.000 VND (lệch 5.000, giữ nguyên dữ liệu seeding).
- **P5.5:** `core_api/security.py` (scrypt stdlib, kiểm hash cũ `SHA256(password + salt)` rồi rehash, JWT HS256 30 ngày bằng stdlib, rate limiter in-memory) + `core_api/auth.py` (`POST /auth/signup`, `POST /auth/login`, `GET/PATCH /me`, `POST /me/change-password`, `DELETE /me` ẩn danh hóa + `transactions.user_name = NULL`). Không thêm dependency. Login trả cùng thông báo cho user không tồn tại/sai mật khẩu (có so hash giả để cân thời gian); đổi mật khẩu/reset/xóa tăng `token_version`.
- **P5.6:** `core_api/email.py` — chuyển payload SendGrid + luật OTP của `auth.api.ts` sang BE (OTP lưu dạng hash, một lần, 5 phút, 3 lần/10 phút, chống dò email); module `email` không bật (Nợ N1). Lỗi thật phát hiện khi test: `now or time.time()` coi `now=0` là không có → đã sửa.
- **P5.7 / test:** `tests/check_auth.py` (settings, security, SQL của repository qua kết nối ghi lại, email, toàn luồng API bằng repository giả; `--database` chạy SQL thật trên DB không phải production); `check_contract.py` thêm hợp đồng auth; CI BE thêm bước check_auth.
- **Deploy chuẩn bị:** `deploy/service.yaml` thêm `APP_FEATURES=auth` + `APP_CONFIG_JSON` từ `travel-app-config:1` (U25: User chọn sửa luôn trong working tree, không commit — file vừa có phần đã stage cũ vừa có phần mới). Dockerfile không đổi (đã COPY `core_api/`); smoke container chạy không có `APP_FEATURES` nên giữ nguyên.
- **Gate:** FE jest nhóm CI 11 suite, 122 pass/1 skip; `tsc` 62; eslint file đổi sạch. BE `check_core_api`, `check_contract`, `check_auth` PASS; script import self-test PASS. Không commit; `__pycache__` do test tạo đã dọn.
- **Chưa làm (cần User):** U21 tạo secret, U22 migration + quyền + import, U23 deploy + kiểm tra; sau đó agent xóa script import và đánh dấu nghiệm thu P5.
