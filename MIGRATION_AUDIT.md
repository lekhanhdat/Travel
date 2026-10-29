# Migration Audit — Travel App

Ngày audit: **29/10/2026 (Asia/Saigon)**. Người thực hiện: Claude Code (vai trò Technical Auditor).
Phạm vi: `D:\Project\Travel\Travel_BE`, `D:\Project\Travel\Travel_FE\Travel`, dữ liệu nguồn `D:\Project\Travel\Travel_FE\data`, backend live `https://travel-api-u2xcse44ca-as.a.run.app`.

> Audit **chỉ đọc**. Không sửa source/config, không ghi DB, không deploy, không gọi API ghi. Chỉ tạo file này.
> Mọi secret đều được che; báo cáo không chứa giá trị `.env`, token hay mật khẩu.

---

## 0. Phương pháp và mức độ tin cậy

| Ký hiệu | Ý nghĩa |
|---|---|
| **[VERIFIED]** | Tự kiểm chứng trong lần audit này (đọc code, chạy test, GET live, so dữ liệu) |
| **[DOC]** | Chỉ có trong tài liệu Codex, chưa kiểm chứng lại (thiếu credentials/môi trường) |
| **[RISK]** | Rủi ro có căn cứ nhưng chưa tái hiện được lỗi |
| **[SUGGEST]** | Đề xuất tối ưu, không phải lỗi |

Đã làm:
- Đọc 4 tài liệu tracking (`DEPLOYMENT_TASKLIST.md`, `DEPLOYMENT_PROGRESS.md`, `RECOVERY_PLAN.md`, `RECOVERY_TASKLIST.md`) và source thực tế FE/BE.
- GET chỉ đọc tới backend live: `/`, `/health`, `/health/ready`, `/openapi.json`, đọc toàn bộ phân trang `/locations`, `/festivals`, `/hotels`.
- So dữ liệu live với `data/processed/*.json` (bản đã import) và dữ liệu thô `data/danang_*.json`, `Location.csv`.
- Chạy `jest` 4 suite recovery (không bật live) và `tsc --noEmit`.
- Kiểm tra git history/remote, `.gitignore`, cấu hình Android, babel/dotenv.

Không làm được (cần User/credentials): truy vấn Neon trực tiếp, đọc IAM/Cloud Run config/billing guard, build APK/chạy emulator, kiểm tra tính hợp lệ của key, xác minh trạng thái host DigitalOcean (curl từ môi trường audit trả mã `000`, có thể do mạng sandbox — **chưa kết luận**).

---

## 1. Tổng quan và tiến độ thực tế

### 1.1 Kiến trúc hiện tại (đã kiểm chứng)

```
React Native app (Android, guest mode)
   ├─ catalog.client.ts ──HTTPS GET──► Cloud Run travel-api (FastAPI core, 1 instance max)
   │                                        └─ psycopg pool (read-only, role travel_runtime) ─► Neon PostgreSQL (Singapore)
   └─ axios.ts (legacy NocoDB) ──► BỊ CHẶN bởi interceptor + FEATURE_FLAGS
```

- BE live: chỉ 6 route GET (`/`, `/health`, `/health/ready`, `/locations`, `/festivals`, `/hotels`) **[VERIFIED]**.
- Toàn bộ auth, ghi review/upload, AI/semantic/RAG, PayOS, camera detect, email: **chưa có trên BE mới** (code còn trong comment) **[VERIFIED]**.

### 1.2 Đánh giá lại tiến độ (không mặc định 70%)

| Hạng mục | Tài liệu nói | Thực tế audit | Ghi chú |
|---|---|---|---|
| DB migration (schema + catalog) | DONE 124/43/82 | **~80%** | Schema/dữ liệu catalog có trên Neon, nhưng dữ liệu đã bị sửa ngoài tài liệu (C2), không còn backup local, nội dung bị cắt nhiều so với nguồn cũ (H1), Accounts/Transactions **không được migrate** (H6) |
| BE core trên Cloud Run | DONE Phase 0–8 | **100% phạm vi core** | Live 200, contract đúng. Nhưng bộ test core đã bị xóa (H2) |
| BE tương đương hệ thống cũ (auth, write, AI, payment) | Hoãn | **~20%** | Chỉ còn đọc catalog |
| FE recovery core (P1–P4) | P1+P2 done, 12/24 | **~45%** | P2 đạt ở tầng service, nhưng UI hiển thị **sai tên/mô tả** (C1) → người dùng chưa thấy dữ liệu đúng |
| FE tương đương app cũ (map, auth, feed, AI, donation) | Backlog | **~25%** | Chỉ Home/Festival guest |

**Kết luận:**
- Để đạt mốc “app Android chạy ổn định với dữ liệu thật (core)”: khoảng **55%**.
- Để khôi phục tương đương app trước migration: khoảng **35%**.
- Con số 70% là **đánh giá cao hơn thực tế**, chủ yếu vì tính BE core là “xong” trong khi FE chưa hiển thị đúng và các tính năng chính còn hoãn.

---

## 2. Phần đã hoàn thành và đã xác minh

| # | Nội dung | Bằng chứng |
|---|---|---|
| V1 | BE live khỏe: `/health` 200 (0.33s), `/health/ready` 200 `{status: ready}`, `/` version 2.0.0 | **[VERIFIED]** GET 29/10 |
| V2 | OpenAPI chỉ có 6 route GET; không có route ghi/payment/AI | **[VERIFIED]** |
| V3 | Contract phân trang `{items, limit, offset, has_more}`, đọc hết trang thành công | **[VERIFIED]** locations 118, festivals 43, hotels 82 |
| V4 | BE code core gọn, đúng hướng: pool nhỏ, transaction read-only, timeout theo transaction (tương thích PgBouncer), allowlist cột SQL, lỗi DB trả 503 chung không lộ chi tiết | **[VERIFIED]** `core_api/*.py`, `app.py:68-73`, `app.py:209-226` |
| V5 | `Settings` ép Neon dùng pooled URL, TLS, `channel_binding=require`, role `travel_runtime` | **[VERIFIED]** `core_api/config.py:29-38` |
| V6 | Docker image tối giản, chạy non-root, `.dockerignore`/`.gcloudignore` dạng allowlist (không upload `.env`, key) | **[VERIFIED]** `Dockerfile`, ignore files |
| V7 | `service.yaml` ghim image theo digest, secret theo version, probe dùng `/health` (không restart khi DB lỗi) | **[VERIFIED]** `deploy/service.yaml` |
| V8 | FE có catalog client riêng, không gửi `xc-token`, timeout + retry có giới hạn, kiểm tra contract chặt, cache chống race | **[VERIFIED]** `src/services/catalog.client.ts`, `catalog.adapter.ts` |
| V9 | Client NocoDB legacy bị chặn trước khi gửi request (interceptor) | **[VERIFIED]** `src/services/axios.ts:15-21` |
| V10 | Tests recovery: **4 suites, 37 pass / 1 skipped (live)** | **[VERIFIED]** chạy jest 29/10 |
| V11 | `tsc --noEmit`: **63 lỗi**, khớp số Codex ghi (lỗi tồn đọng cũ) | **[VERIFIED]** |
| V12 | Runtime DB role chỉ đọc, IAM tách runtime/build, budget/cap | **[DOC]** — không có credentials để kiểm lại |
| V13 | Android debug build + Home guest trên emulator (P1) | **[DOC]** — không build lại trong audit |

---

## 3. Danh sách vấn đề

Thang mức độ: **Critical** (sai dữ liệu người dùng thấy / mất an toàn / mất khả năng phục hồi), **High** (chặn mục tiêu khôi phục hoặc rủi ro lớn khi phát hành), **Medium** (ảnh hưởng ổn định/bảo trì), **Low** (dọn dẹp/tối ưu).

### 3.1 Critical

#### C1 — UI ghi đè tên/mô tả catalog bằng bản dịch cũ theo ID số **[VERIFIED]**
- **File:** `src/utils/translationHelpers.ts:11-37`; call site: `src/component/BigItemLocation.tsx:22-28`, `src/component/LargeItemLocation.tsx:24-27`, `src/component/LargeItemFestival.tsx`, `src/container/screens/Home/DetailLocation.tsx`, `src/container/screens/Festival/DetailFestival.tsx`, `src/container/screens/Maps/MapScreenV2.tsx`.
- **Nguyên nhân:** `translateLocationField(t, id, 'name', fallback)` tra key `locations:loc_${id}`. File `src/i18n/locales/vi/locations.json` có 187 key `loc_1…` từ dữ liệu NocoDB cũ. ID PostgreSQL mới không trùng thứ tự cũ.
- **Bằng chứng:** live `id=1` = “An Phú Farm”, nhưng `loc_1` = “Khu du lịch Bà Nà – Núi Chúa”; `fest_1` = DIFF trong khi live festival id=1 là biểu diễn nghệ thuật Chăm. Vì key tồn tại cho mọi id 1–124 và 1–43, **gần như mọi card/detail đang hiển thị sai danh tính**, không chỉ một bản ghi.
- **Tác động:** P2 “Completed” ở tầng service nhưng người dùng thấy dữ liệu sai; search (dùng field API) và card (dùng bản dịch) không khớp nhau.
- **Hướng xử lý:** đúng P3.1 trong plan: ở chế độ recovery, trả thẳng field API cho nội dung catalog (bỏ qua `loc_/fest_`), giữ i18n cho UI chung. Sửa tập trung trong `translationHelpers.ts` (một chỗ) và giữ chữ ký hàm để không phải sửa hàng loạt call site. Bản dịch catalog nếu cần sau này phải theo `record_id`.

#### C2 — Dữ liệu Neon production đã thay đổi sau mốc nghiệm thu, không có ghi chép, không còn backup local **[VERIFIED]**
- **Bằng chứng (GET live 29/10 so với `data/processed/locations.json` và tài liệu):**
  - Locations: **118** bản ghi (tài liệu: 124). Thiếu `id` **19, 26, 39, 54, 99, 113** (6 record_id có trong processed nhưng không còn trên live: Bảo tàng Đà Nẵng – Cơ sở 2, Bảo tàng Ký ức điêu khắc đá Non Nước, Trung tâm Văn hóa Nghệ thuật Đà Nẵng, Cây đa nghìn năm, Cụm KDL sinh thái xã Hòa Bắc, Vườn tượng APEC).
  - **118/118** location đã có GPS (tài liệu FE/BE: 124/124 `lat=null`). Các field khác cũng đã đổi: address 43, opening_hours 33, ticket_info 27, long_description 13, advise 12, website 12, phone 9, images 5, avatar 5, description 3, name 1.
  - `publishable=true`: 27 (tài liệu 28). Hotels 82/12, Festivals 43/14 không đổi về số lượng.
- **Nguyên nhân:** chưa xác định — có thể User/công cụ khác đã sửa trực tiếp Neon sau 19/10. Commit cuối của BE là 19/10 12:41; `data/processed` cuối là 16/10. Không có migration/script nào trong repo phản ánh thay đổi này.
- **Tác động:**
  - Tài liệu không còn là nguồn sự thật (124/lat null, blocker B03 “không có GPS” không còn đúng).
  - Đợt dọn 19/10 đã xóa toàn bộ dump/backup local → **nếu thay đổi này ngoài ý muốn, hiện không có bản để khôi phục** ngoài PITR/history của Neon (chưa xác minh gói Neon và thời gian lưu).
  - ID có lỗ hổng → càng làm C1 tệ hơn; test live không hardcode count nên vẫn pass (đúng thiết kế), nhưng nghiệm thu “124/43” trong docs đã sai.
- **Hướng xử lý:** (1) User xác nhận thay đổi là chủ động hay không; (2) tạo backup mới ngay từ Neon (`pg_dump` bằng role owner, hoặc Neon branch snapshot) và ghi lại nơi lưu; (3) kiểm tra Neon history retention; (4) cập nhật baseline số liệu trong 4 tài liệu; (5) đặt quy ước: mọi thay đổi dữ liệu production phải có script/migration hoặc ghi chú trong `db/`.

#### C3 — Secret bị đóng gói vào JS bundle của APK; repo FE public có lịch sử chứa chuỗi giống token **[VERIFIED ở mức source / RISK ở mức giá trị]**
- **File:** `babel.config.js` (react-native-dotenv, `allowlist: null`), `src/utils/env.ts:10-59` import `OPENAI_API_KEY`, `SENDGRID_API_KEY`, `NOCODB_TOKEN`, `AZURE_TRANSLATOR_KEY`, `SERPAPI_KEY`, `UNSPLASH_ACCESS_KEY`, `PASSWORD_SALT`; `src/services/axios.ts:4` import `env` → module luôn nằm trong bundle dù cờ tắt.
- **Nguyên nhân:** react-native-dotenv thay giá trị vào code lúc build. `.env` FE hiện có giá trị cho các biến trên (đã kiểm tra tên biến, không đọc giá trị).
- **Bằng chứng bổ sung:** `https://github.com/lekhanhdat/Travel` trả HTTP 200 khi gọi API không xác thực → **repo FE là public**. `git log -S` tìm thấy các commit lịch sử có chuỗi dạng token Mapbox bí mật (`sk.`) trong `android/gradle.properties` và commit có gán giá trị cho `OPENAI_API_KEY`/`NOCODB_TOKEN`. Không mở giá trị để xác nhận (theo nguyên tắc không làm lộ secret). File hiện tại đã để trống token Mapbox.
- **Tác động:** bất kỳ ai có APK cũ trên CH Play hoặc clone repo có thể lấy key OpenAI/SendGrid/Azure/SerpAPI, và **NocoDB token có quyền đọc/ghi bảng Accounts cũ (hash mật khẩu)**.
- **Hướng xử lý (không cần sửa code để bắt đầu):**
  1. User thu hồi/rotate: OpenAI, SendGrid, Azure Translator, SerpAPI, Unsplash, NocoDB token, Mapbox secret token (downloads), đổi `PASSWORD_SALT` khi làm lại auth.
  2. Build APK recovery từ `.env` chỉ chứa `CATALOG_API_URL` và Mapbox public token (`pk.`) khi bật map — `allowUndefined: true` nên các biến khác thành undefined, không vỡ build.
  3. Về lâu dài: đặt `allowlist` trong babel; các key trả phí chỉ nằm phía BE (Secret Manager).
  4. Chạy công cụ quét secret (gitleaks/trufflehog) trên cả hai repo; cân nhắc xóa lịch sử hoặc chấp nhận và rotate.

### 3.2 High

#### H1 — Nội dung catalog bị cắt mạnh so với dữ liệu cũ **[VERIFIED]**
- **So sánh `data/danang_locations.json` (nguồn cũ, 125 bản) → `data/processed/locations.json` (đã import, 124 bản):** rating 87 → **0**, reviews 84 → **0**, videos 30 → **0**, images 122 → 73, address 125 → 47, GPS 125 → 0 (live hiện đã bổ sung lại GPS — xem C2). Festivals: images 48 → 8, reviews 48 → 0, rating 34 → 0.
- **Nguyên nhân:** chính sách “chỉ giữ dữ liệu có căn cứ chính thức” trong đợt làm sạch D03.x; User đã chấp nhận ở D03.3.
- **Tác động:** detail trống rating/review/video, NewFeed (dựa trên reviews) không có nội dung, trải nghiệm kém hơn app cũ dù “migration thành công”.
- **Hướng xử lý:** quyết định của User. Có thể (a) giữ nguyên và làm empty state tốt (P3), hoặc (b) lập phase riêng khôi phục có chọn lọc (ảnh/video/review) từ nguồn cũ trong `Travel_FE/data`, ghi nguồn rõ ràng. Không tự ý ghi vào Neon.

#### H2 — Bộ test core BE và công cụ import/backup đã bị xóa khi dọn dẹp **[VERIFIED]**
- **File:** `Travel_BE/tests/` chỉ còn `check_billing_guard.py`. Theo `DEPLOYMENT_PROGRESS.md` (mục dọn 19/10) đã xóa `tests/check_core_api.py`, test importer/schema, `scripts/import_catalog.py`, `backup_catalog.py`, manifest và mọi dump.
- **Tác động:** mọi thay đổi BE tiếp theo (auth, write, detail endpoint) không có lưới an toàn regression; không có công cụ backup/restore đã kiểm chứng.
- **Hướng xử lý:** khôi phục tối thiểu `tests/check_core_api.py` và `scripts/backup_catalog.py` từ git (`git show 47ededb:<path>`), không cần viết lại. Chỉ giữ những gì còn dùng.

#### H3 — Billing guard có thể tắt toàn bộ production ở mức 26.000 VND/tháng **[DOC + RISK]**
- **File:** `deploy/billing_guard/`, `DEPLOYMENT_PROGRESS.md` mục COST.
- **Nguyên nhân:** guard gỡ billing khỏi **cả project** khi budget chạm ~26.000 VND (≈1 USD), trước credits.
- **Tác động:** khi app phát hành và có traffic thật (hoặc chỉ vài lần Cloud Build + log), Cloud Run và Artifact Registry có thể bị dừng; phải khôi phục thủ công. Đây là rủi ro availability lớn nhất khi lên CH Play.
- **Hướng xử lý:** trước khi phát hành, User xem lại ngưỡng (ví dụ chỉ dùng spend cap Cloud Run, nâng guard project lên mức chấp nhận được) — quyết định chi phí của User.

#### H4 — Mật khẩu keystore release hardcode trong file được track ở repo public **[VERIFIED]**
- **File:** `android/app/build.gradle:106-118` (store/key password của `release.keystore`). `release.keystore` **không** bị track (tốt).
- **Tác động:** nếu file keystore rò rỉ, mật khẩu đã công khai; không thể đổi khóa upload dễ dàng nếu không dùng Play App Signing.
- **Hướng xử lý:** chuyển sang `~/.gradle/gradle.properties` hoặc biến môi trường (`MYAPP_RELEASE_*` đã có sẵn tên trong `gradle.properties`); xác nhận app dùng Play App Signing để có thể reset upload key.

#### H5 — Accounts/Transactions không được migrate; auth chưa có đường đi **[VERIFIED + DOC]**
- **Bằng chứng:** schema có bảng `accounts`/`transactions` nhưng theo tài liệu là 0 dòng; runtime chỉ được SELECT cột `id`. FE `auth.api.ts:77-120` tải **toàn bộ Accounts** về client rồi so SHA256(password + salt cố định) tại client.
- **Tác động:** người dùng cũ mất tài khoản/số dư donation khi chuyển hệ thống; mô hình auth cũ không an toàn để khôi phục nguyên trạng.
- **Hướng xử lý:** quyết định của User: có cần giữ tài khoản cũ không. Nếu có → export Accounts/Transactions từ NocoDB trước khi NocoDB/key bị thu hồi (phụ thuộc C3), sau đó thiết kế auth phía BE (hash mạnh, token phiên). Đây là phase riêng, không thuộc recovery core.

#### H6 — Phiên bản app cũ đang phát hành vẫn trỏ NocoDB/DigitalOcean **[RISK]**
- **File:** `src/utils/env.ts:43-45`, `src/utils/configs.ts:3-4`, `.env` FE (`SERVER_URL`, `PAYOS_BACKEND_URL` trỏ host DO).
- **Tác động:** người dùng bản CH Play hiện tại phụ thuộc host DO (từ môi trường audit không phản hồi — chưa kết luận) và NocoDB. Thu hồi NocoDB token (C3) sẽ làm bản cũ ngừng hoạt động.
- **Hướng xử lý:** User xác nhận trạng thái DO app và bản đang phát hành; sắp xếp thứ tự: phát hành bản mới (catalog Cloud Run) rồi mới tắt NocoDB/DO, hoặc chấp nhận gián đoạn.

### 3.3 Medium

| ID | Vấn đề | File | Nguyên nhân / tác động | Hướng xử lý |
|---|---|---|---|---|
| M1 | Thời gian chờ lỗi catalog quá dài **[VERIFIED code]** | `src/services/catalog.client.ts:10,22-37` | Timeout 30s × 3 lần + backoff ≈ ~92s/trang; locations 2 trang → người dùng có thể nhìn loading 1–3 phút khi mất mạng | Giảm timeout (ví dụ 15s), chỉ retry 1 lần khi timeout, hoặc đặt deadline tổng; giữ retry 5xx/429 |
| M2 | Tài liệu FE lệch thực tế **[VERIFIED]** | `RECOVERY_TASKLIST.md:159` vẫn ghi “P1 Completed, P2–P5 Pending”; nhật ký thiếu dòng P2; `RECOVERY_PLAN.md:21` ghi TypeScript 4.8.4 (thực tế 5.0.4); B03/P5 dựa trên “124 lat=null” đã sai | Agent đọc sai trạng thái ở phase sau | Cập nhật baseline sau khi User xác nhận C2 |
| M3 | Code hoãn trong `app.py` tham chiếu tên chưa import **[VERIFIED]** | `Travel_BE/app.py:17-19,89-186` | Bỏ comment decorator sẽ lỗi `NameError` vì import đang comment; lint F821. Cùng kiểu với lượng lớn code comment trong FE (`AppContainer.tsx`, `HomeScreen.tsx`) | Khi mở lại từng tính năng, khôi phục từ git theo phase; về lâu dài nên bỏ code comment, dựa vào git history |
| M4 | Di sản DigitalOcean còn trong BE **[VERIFIED]** | `Procfile` (gunicorn không có trong requirements), `.do/deploy.template.yaml` (git `main`, env NocoDB/PayOS) | Nếu App Platform DO còn gắn auto-deploy `main`, merge `improve → main` có thể kích hoạt deploy hỏng **[RISK]** | User kiểm tra DO app; nếu không dùng, gỡ/ghi chú deprecated trước khi merge |
| M5 | Không có CI; full test suite FE đỏ, typecheck 63 lỗi **[VERIFIED + DOC]** | `__tests__/*` (7 suite cũ fail theo docs), `tsc` | Không phát hiện regression tự động | Chạy riêng nhóm test recovery làm gate; sửa dần lỗi tsc ở file được chạm |
| M6 | Cloud Run `maxScale=1`, concurrency 4, pool 4 **[VERIFIED config]** | `deploy/service.yaml:10-16`, `core_api/database.py:22-35` | Đủ cho demo; khi phát hành, request vượt hàng chờ bị 429/timeout. FE tải toàn bộ catalog mỗi lần (2–3 request) | Đo tải trước phát hành; cân nhắc max 2–3 instance, header cache cho catalog |
| M7 | Quyền Android/Play policy **[VERIFIED config, RISK phát hành]** | `AndroidManifest.xml:8,21`; `build.gradle:92` | `ACCESS_BACKGROUND_LOCATION` cần khai báo đặc biệt với Play; `usesCleartextTraffic=true`; `versionCode 1` sẽ bị từ chối nếu bản cũ đã có versionCode ≥ 1 | Trước release: bỏ background location (code đã tắt), tắt cleartext, tăng versionCode theo bản đã phát hành |
| M8 | Firebase private key cũ: chỉ “disabled”, file vẫn ở máy, có trong lịch sử repo BE **[DOC + VERIFIED]** | `Travel_BE/privateKey.json` (ignored), commit `3353684`, `803164a`… | Repo BE trả 404 khi gọi không xác thực (có thể private) | Xóa hẳn key trên GCP thay vì disable; xóa file local khi không cần |

### 3.4 Low / tối ưu **[SUGGEST]**

| ID | Nội dung | File |
|---|---|---|
| L1 | Home gọi `getLocations(true)` mỗi lần tải → bỏ qua cache 10 phút | `HomeScreen.tsx:230` |
| L2 | Fallback URL host DO lặp ở 2 nơi; nên bỏ khi gỡ legacy | `src/utils/env.ts:44`, `src/utils/configs.ts:3` |
| L3 | BE dùng `print` thay vì logging có cấu trúc; version `2.0.0` hardcode 3 chỗ | `app.py:34,48,55,86,195` |
| L4 | Chưa có endpoint detail/search phía BE; FE tải toàn bộ list rồi lọc. Ổn với ~240 record, cần xem lại khi dữ liệu tăng | `core_api/catalog.py` |
| L5 | BE không có CORS — đúng cho app native; chỉ thêm nếu có web client | `app.py` |
| L6 | Neon: chưa xác minh gói, auto-suspend (độ trễ cold DB) và thời gian lưu PITR | Neon console |

---

## 4. Đồng bộ tài liệu ↔ source ↔ live

| Khẳng định trong tài liệu | Thực tế 29/10 | Kết luận |
|---|---|---|
| Neon 124/43/82, publishable 28/14/12 (BE docs, `deploy/README.md`) | 118/43/82, publishable 27/14/12 | **Lệch** (C2) |
| 124/124 location `lat=null`, B03 chặn map (FE docs) | 118/118 có GPS; 27 bản đủ điều kiện marker | **Lệch** — P5 không còn bị chặn bởi dữ liệu |
| Backup v4 có thể restore (Phase 8) | Dump/backup đã xóa 19/10 | **Không còn hiệu lực** |
| Test core API PASS (Phase 4–8) | File test đã xóa | **Không tái kiểm được** |
| P2 Completed, 38 tests pass | 37 pass + 1 skip (không bật live), đúng | **Khớp** |
| tsc 63 diagnostics | 63 | **Khớp** |
| OpenAPI 6 route GET | 6 route GET | **Khớp** |
| `RECOVERY_TASKLIST.md` “Điểm dừng: P1, P2–P5 Pending” | P2 đã xong | **Lệch nội bộ** (M2) |
| FE TypeScript 4.8.4 | 5.0.4 | **Lệch nhỏ** |
| Key Firebase disabled, runtime chỉ đọc, budget/guard ARMED | Không kiểm lại được | **[DOC]** |

---

## 5. Đề xuất cải thiện (theo ưu tiên)

| Ưu tiên | Đề xuất | Lý do | Mức thay đổi |
|---|---|---|---|
| 1 | Xác nhận + backup dữ liệu Neon hiện tại, cập nhật baseline (C2) | Không có điểm phục hồi; mọi nghiệm thu sau phụ thuộc baseline đúng | Không đổi code |
| 2 | Rotate/thu hồi key, build APK từ `.env` tối giản (C3) | Rủi ro bảo mật đang tồn tại ngoài môi trường dev | Không đổi code ở bước đầu |
| 3 | Sửa hiển thị catalog theo dữ liệu API (C1) — đúng P3.1 | Lỗi người dùng nhìn thấy, chặn mục tiêu khôi phục | 1 file helper + test |
| 4 | Hoàn thiện P3 còn lại: empty state rating/review/video, fallback ảnh; **bật lại “gần bạn” có guard** vì đã có GPS | Dữ liệu thiếu nhiều (H1); GPS đã có lại | Vài màn hình, giữ cờ |
| 5 | Rút ngắn timeout/retry catalog (M1) | Trải nghiệm mất mạng | 1 file |
| 6 | Khôi phục test core BE + script backup từ git (H2) | Lưới an toàn trước khi mở rộng BE | Khôi phục file cũ, không viết mới |
| 7 | Nghiệm thu Android P4 | Chứng minh end-to-end | Không đổi code nếu pass |
| 8 | Map/GPS (P5) — nay khả thi | 27 marker hợp lệ | Theo plan P5 |
| 9 | Chuẩn bị phát hành: billing guard (H3), signing (H4), permissions/versionCode (M7), DO/NocoDB (H6, M4) | Tránh sập production và bị Play từ chối | Config, cần User quyết |
| 10 | Backlog BE: auth + migrate Accounts (H5), write review, AI, PayOS | Tương đương app cũ | Phase thiết kế riêng |

Không đề xuất: refactor kiến trúc FE, nâng RN, đổi framework BE, viết lại catalog client (phần Codex làm ở P2 là tốt, nên giữ).

---

## 6. Kế hoạch triển khai theo phase

Nguyên tắc: mỗi phase chỉ làm khi User duyệt; thay đổi nhỏ nhất có thể; không regression; cập nhật tracking sau mỗi phase.

### Phase A — Ổn định nền tảng (không sửa code app) — ưu tiên cao nhất
| Task | Owner | Nội dung |
|---|---|---|
| A1 | User | Xác nhận thay đổi dữ liệu Neon sau 19/10 (6 location bị xóa, GPS/field được sửa) là chủ động |
| A2 | User (+Agent hướng dẫn) | Tạo backup Neon hiện tại (branch snapshot hoặc `pg_dump` bằng role owner), lưu ngoài repo; kiểm tra PITR |
| A3 | User | Rotate/thu hồi key liệt kê ở C3; quyết định thời điểm tắt NocoDB (sau khi export Accounts nếu cần — H5, H6) |
| A4 | Agent | Khôi phục `tests/check_core_api.py` (và script backup nếu User muốn) từ git BE, chạy với DB local/Neon read-only |
| A5 | Agent | Cập nhật baseline trong 4 tài liệu tracking (118/43/82, GPS có, backup mới, P2 trong tasklist) |

**Nghiệm thu A:** có backup ghi rõ thời điểm; tài liệu khớp live; test core BE chạy PASS; danh sách key đã rotate (không ghi giá trị).

### Phase B — FE P3: hiển thị đúng dữ liệu
| Task | Nội dung | File chính |
|---|---|---|
| B1 | Bỏ qua bản dịch `loc_/fest_` cho nội dung catalog (C1) | `src/utils/translationHelpers.ts` (+ test) |
| B2 | Empty state rating/review/video, fallback ảnh; không hiển thị “0 sao” giả | `DetailLocation.tsx`, `DetailFestival.tsx`, `LargeItem*.tsx`, `CachedImage.tsx` |
| B3 | “Gần bạn”: chỉ tính khi có cặp GPS hợp lệ + quyền vị trí; từ chối quyền không chặn list | `HomeScreen.tsx`, `haversineDistance.ts` |
| B4 | Giữ NewFeed/review write/Items tắt; bỏ import `reviewsConstants` khỏi đường chạy | `DetailLocation.tsx`, `NewFeedScreen.tsx` |
| B5 | Điều chỉnh timeout/retry catalog (M1) | `catalog.client.ts` + test |
| B6 | Test: id trùng key dịch cũ không đổi tên; null GPS; mảng rỗng; publishable=false vẫn có trong list | `__tests__/` |

**Nghiệm thu B:** id=1 hiển thị “An Phú Farm” ở card, detail, search (cả vi/en); không crash với null/rỗng; test recovery + test mới pass; tsc không tăng lỗi (≤63).

### Phase C — FE P4: nghiệm thu Android core
- Build debug từ `.env` tối giản; cold start; Home → list → detail → back; Festival; keyword search; restart.
- Mất mạng → thông báo + Thử lại, phục hồi khi có mạng; thời gian báo lỗi ≤ ~30s.
- Quan sát network: chỉ host Cloud Run (và ảnh); không NocoDB/AI/Azure/PayOS.
- Đối chiếu tổng record UI/service với live cùng thời điểm.

**Nghiệm thu C:** checklist trên pass trên emulator/thiết bị thật, có ghi thiết bị/OS/thời điểm.

### Phase D — Map/GPS (P5, nay khả thi)
- Bật map có guard, marker = `publishable && GPS hợp lệ` (27 location hiện tại), chỉ đường khi có cả 2 điểm hợp lệ; không bật background tracking.
- Cần User: Mapbox public token (`pk.`), token downloads mới (sau rotate).

### Phase E — Chuẩn bị phát hành
- Billing guard/ngưỡng (H3), signing ngoài source (H4), permissions/cleartext/versionCode (M7), xử lý DO/NocoDB (H6, M4), cân nhắc maxScale (M6).

### Phase F — Backlog tính năng (mỗi mục một phase thiết kế riêng)
Auth + migrate Accounts/Transactions (H5) → review write/upload → PayOS → AI/semantic/chatbot → khôi phục nội dung media/review (H1) → Hotels UI → iOS.

---

## 7. Checklist việc cần làm tiếp

- [ ] A1 User xác nhận thay đổi dữ liệu Neon sau 19/10
- [ ] A2 Backup Neon mới + kiểm tra PITR
- [ ] A3 Rotate/thu hồi: OpenAI, SendGrid, Azure, SerpAPI, Unsplash, NocoDB, Mapbox secret token
- [ ] A3b Quyết định có giữ tài khoản/giao dịch cũ từ NocoDB không (export trước khi thu hồi)
- [ ] A4 Khôi phục test core BE từ git và chạy lại
- [ ] A5 Cập nhật baseline 4 tài liệu tracking
- [ ] B1–B6 FE P3 (bắt đầu bằng C1)
- [ ] C FE P4 nghiệm thu Android
- [ ] D Map/GPS
- [ ] E Rà soát phát hành (billing guard, signing, permissions, versionCode, DO/NocoDB)
- [ ] F Lập phase thiết kế cho auth/write/payment/AI theo thứ tự User chọn

---

## 8. Kiểm thử và tiêu chí nghiệm thu chung

**Lệnh kiểm tra nhanh (chỉ đọc):**

```powershell
Invoke-RestMethod https://travel-api-u2xcse44ca-as.a.run.app/health/ready
node node_modules/jest/bin/jest.js __tests__/services/catalog.api.test.js __tests__/guestMode.test.js __tests__/guestNavigation.test.js __tests__/guestTranslation.test.js --runInBand
$env:CATALOG_LIVE='1'   # bật thêm so sánh live, chỉ GET
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

**Tiêu chí chung cho mọi phase sửa code:**
1. Test recovery hiện có vẫn pass; test mới bao phủ đúng lỗi được sửa.
2. Số lỗi `tsc` không tăng so với baseline 63.
3. Không có request tới NocoDB/DigitalOcean/AI/Azure/PayOS trên luồng recovery.
4. Không ghi DB production, không deploy nếu phase không yêu cầu.
5. Không có secret mới trong diff (`git diff` sạch key), không log key/OTP.
6. Tracking cập nhật đúng số liệu live tại thời điểm nghiệm thu, ghi rõ phần chưa kiểm được.

**Mốc “app chạy ổn định với dữ liệu thật”** đạt khi Phase A + B + C pass.

---

## 9. Giới hạn của audit

- Không có quyền đọc Neon/GCP nên các kết luận về IAM, quyền DB runtime, budget/guard, cấu hình Cloud Run thực tế, PITR là **[DOC]**.
- Không build APK/chạy emulator; trạng thái Android lấy từ tài liệu P1.
- Không xác thực key còn hiệu lực; không mở giá trị secret trong lịch sử git.
- Host DigitalOcean không phản hồi từ môi trường audit (curl `000`); có thể do giới hạn mạng, chưa kết luận DO đã tắt.
- Số liệu live có thể thay đổi sau 29/10/2026.
