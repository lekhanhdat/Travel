# Migration Tasklist — toàn app (Location + Festival → đủ tính năng)

Theo [MIGRATION_AUDIT.md](MIGRATION_AUDIT.md) (kiểm kê F01–F38 ở mục 6, Clean ở mục 9, chi phí ở mục 10, quyết định Q1–Q17 ở mục 11, **kết quả chốt ở mục 11.1**). Mỗi phase chỉ bắt đầu khi User duyệt; cập nhật dấu tick và nhật ký cuối file.

**Thứ tự:** P0–P4 (đã xong) → **P5** nền BE: key + auth + import accounts → **P6** FE auth/Profile → **P7** upload (imgbb) + reviews + Bảng tin → **P8** `objects` + Camera → **P9** AI → **P10** payment sang Neon/Cloud Run (giữ tắt) → **P11** i18n + dịch nội dung một lần + Hotels → **P12** CLEAN + xác nhận sạch NocoDB/DO → **P13** nghiệm thu Android (P5 cũ) → **P14** phát hành (P6 cũ, Login lên đầu). Sau migration: mục **Nợ** (email quên mật khẩu, PayOS, i18n nâng cao). Refactor/tối ưu để Backlog.

**Quy tắc cho P5–P14:** dùng lại hoặc mở comment code đã có, không viết lại tính năng tương tự (mục "Dùng lại" trong mỗi task). Không xóa code/tài liệu có sẵn trước P12. Không dữ liệu fix cứng. Không secret trong repo. Tích hợp bên thứ ba chỉ gọi qua BE, key nằm ở Secret Manager. NocoDB → Neon, DigitalOcean → Cloud Run, sau migration **không còn dính dáng** (P12.9). Không copy dữ liệu export NocoDB vào repo.

Gate chung cho mọi phase có sửa code (P0–P4 dùng bản cũ: jest nhóm recovery, `tsc` ≤ 63):
- **FE:** jest nhóm CI trong `.github/workflows/ci.yml` pass (test mới của phase phải được thêm vào danh sách đó); `tsc --noEmit` **≤ 62** (baseline sau P2, không được vượt); eslint không thêm lỗi mới.
- **BE:** `tests/check_core_api.py`, `tests/check_contract.py` và test mới của phase (`tests/check_*.py`, fake DB + fake provider, không cần key thật) pass trong CI Python 3.12.
- **CI xanh cả 2 repo** trên PR của phase.
- Diff không có secret, không có URL NocoDB/DigitalOcean mới, không dữ liệu cứng mới; app không gọi thẳng OpenAI/SerpAPI/SendGrid/Azure/PayOS.
- Thay đổi Neon chỉ qua file migration mới trong `Travel_BE/db/schema/`; User chạy bằng owner role (U22). Deploy BE theo `Travel_BE/deploy/README.md` (U23).
- **Không để rác:** file tạm do phase tạo ra (script import một lần, file duyệt dịch, index/bundle/APK build thử, report, log) phải xóa trước khi đóng phase; số liệu cần giữ thì ghi vào nhật ký. `git status --ignored` của 2 repo không có file lạ.

## P0 — Baseline, test, CI
- [x] P0.1 `Travel_BE/deploy/container_smoke.py`: festivals 43 → 49; commit cùng digest mới trong `service.yaml` — đã có sẵn ở BE `64d4110` (smoke 123/49/82, digest `f152d07…`)
- [x] P0.2 Baseline 123/82/49 + schema 001–006 trong `Travel_BE/db/README.md`, `deploy/README.md`; đánh dấu `RECOVERY_PLAN.md`/`RECOVERY_TASKLIST.md` đã được thay bằng file này
- [x] P0.3 Khôi phục `tests/check_core_api.py` (+ `tests/requirements.txt`) từ `47ededb`; sửa theo model mới (không `verification_status`, festival 17 trường, `location_id`); chạy không cần Neon thật
- [x] P0.4 Test contract mới: BE (OpenAPI/response đúng tập trường từng model) và FE (`catalog.adapter` từ chối trường đã bỏ/thiếu)
- [x] P0.5 GitHub Actions FE: cài deps, chạy nhóm test recovery + catalog, `tsc` không vượt baseline
- [x] P0.6 GitHub Actions BE: chạy test core + contract (Python 3.12), không cần secret

## P1 — Bỏ toàn bộ dữ liệu fix cứng
- [x] P1.1 `translationHelpers.ts`: `translateLocationField`/`translateFestivalField` trả thẳng giá trị API (giữ chữ ký, sau đó gỡ dần call site); test "id trùng key cũ vẫn hiện đúng tên API"
- [x] P1.2 Xóa `i18n/locales/{vi,en}/locations.json`, `festivals.json`; bỏ namespace khỏi `i18n/index.ts`, `types.d.ts`
- [x] P1.3 Xóa `src/common/authConstants.tsx`, `locationConstants.tsx`, `reviewsConstants.tsx` và mọi import (`DetailLocation`, `NewFeedScreen`) + fallback đã comment trong `MapScreenV2.tsx`, `HomeScreen.tsx`
- [x] P1.4 Rà lại toàn bộ `src` không còn mảng dữ liệu cứng (location/festival/review/account/item)
- [x] P1.5 Empty state: không rating/review/video/ảnh (fallback ảnh); festival không có địa điểm thì ẩn dòng địa điểm

**Nghiệm thu P1:** tiếng Việt: card/detail/search khớp API cho mọi id; không crash với null/mảng rỗng.

## P2 — Data layer
- [x] P2.1 `src/services/catalogRepository.ts`: tải locations + festivals song song, TTL 10 phút, `refresh()`; chỉ mục `locationById`, `festivalById`, `festivalsByLocationId`, `mapMarkers` (`isMapLocationVisible`); `festival.location` lấy từ chỉ mục
- [x] P2.2 Chuyển màn hình sang repository: `HomeScreen`, `ViewAllLocation`, `DetailLocation`, `FestivalsScreen`, `ViewAllFestivals`, `DetailFestival`, `MapScreenV2`, `SimilarItemsComponent`; bỏ `getLocations(true)` ở Home
- [x] P2.3 Thống nhất `id`: bỏ `Id` khỏi adapter, `IFestival`, `ILocation`, ~107 chỗ dùng trong UI/navigation params
- [x] P2.4 `catalog.client.ts`: timeout 12 s, retry 1 lần (timeout/5xx/429), deadline tổng 30 s; test
- [x] P2.5 BE: `GZipMiddleware` + `Cache-Control: public, max-age=300` + `ETag` cho 3 endpoint catalog; test; deploy (build → replace → kiểm tra) — deploy 29/10 digest `6ece2540…`: gzip + `cache-control` + ETag, If-None-Match → 304, đủ 123/49/82
- [x] P2.6 Test repository: 1 lần fetch cho nhiều màn hình, chỉ mục đúng, lỗi mạng giữ cache cũ

**Nghiệm thu P2:** Home → Festival → Detail → Map chỉ 1 lượt `/locations` + `/festivals`; không còn `Id`; payload nén ~125 KB (User chấp nhận, U9).

## P3 — Home / Festival / Search
- [x] P3.1 "Gần bạn": xin quyền vị trí khi cần, khoảng cách bằng `haversineDistance`; từ chối quyền vẫn hiện list
- [x] P3.2 Search cục bộ (bỏ dấu) trên tên/mô tả/loại của location + festival
- [x] P3.3 Liên kết hai chiều: Detail location → festival tại đây; Detail festival → mở location
- [x] P3.4 Pull-to-refresh gọi `catalogRepository.refresh()`; lỗi có nút Thử lại

## P4 — Map
- [x] P4.1 `.env`: Mapbox public token `pk.` (D3); bật `ENABLE_MAP`
- [x] P4.2 Marker từ `catalogRepository.mapMarkers` (29 = `publishable` + GPS hợp lệ); popup: tên, ảnh, festival tại địa điểm
- [x] P4.3 Chỉ đường (Mapbox Directions) chỉ khi có vị trí người dùng + marker hợp lệ; không background location
- [ ] P4.4 Gỡ code GPS/NocoDB cũ đã comment trong `MapScreenV2.tsx` — **bỏ qua theo chỉ đạo User 30/10: giữ nguyên mọi code đã comment, tái sử dụng thay vì viết lại**

## P5 — Nền BE: key, Secret Manager, auth + accounts (F09–F14 phía BE, D2)
Phụ thuộc: — (Q2, Q3, Q12, Q17 đã chốt). Ước lượng: L (BE) + S (FE).
- [x] **P5.1 Kiểm tra key + báo biểu phí** _(lượt 2 lúc 14:0x 30/10: OpenAI 200, SerpAPI Free 250 còn 250, SendGrid 200, PayOS xác thực qua, imgbb vẫn 103 → P7.0)_ — _lượt đầu đã chạy 30/10 (audit mục 10.1): OpenAI, SerpAPI, Mapbox, SendGrid, PayOS, NocoDB còn sống; imgbb bị chặn → chờ key mới (U31); Azure/Firebase/DigitalOcean đã chết → xóa (U20)._ Khi vào P5: chạy lại cùng cách kiểm cho key mới/key sắp đưa lên Secret Manager (endpoint miễn phí, không in giá trị, script tạm ngoài repo, xóa sau khi chạy), ghi kết quả vào nhật ký.
  | Key | Cách kiểm (miễn phí) | Dùng ở | Biểu phí tham khảo |
  |---|---|---|---|
  | `OPENAI_API_KEY` | `GET https://api.openai.com/v1/models` → 200/401 | P8, P9, P11 | gpt-4o-mini 0,15/0,60 USD mỗi 1M token vào/ra; text-embedding-3-small 0,02 USD/1M |
  | `SERPAPI_KEY` | `GET https://serpapi.com/account.json` → gói, `plan_searches_left` (không tốn lượt) | P8 (Lens), P9 (ảnh chatbot nếu dùng) | free ~100–250 lượt/tháng; gói trả phí từ ~75 USD/tháng |
  | `IMGBB_API_KEY` | upload ảnh PNG 1×1 với `expiration=60` (miễn phí) | P7, P8 | miễn phí |
  | `MAPBOX_ACCESS_TOKEN` (`pk.`) | `GET https://api.mapbox.com/tokens/v2?access_token=…` | đang chạy | 25.000 MAU, 100.000 Directions/tháng free |
  | `SENDGRID_API_KEY`, `PAYOS_*` | chỉ ghi nhận (Nợ); SendGrid có thể kiểm `GET /v3/scopes` nếu User muốn | Nợ | — |
  | `NOCODB_TOKEN`/`NOCODB_API_TOKEN`, `AZURE_TRANSLATOR_KEY`, `UNSPLASH_ACCESS_KEY`, `FIREBASE_*` | không kiểm — bỏ hẳn; User thu hồi ở trang nhà cung cấp (U20) | — | — |
- [x] **P5.2 Chặn key bị nhúng vào APK (G1).** _(xong 30/10: bundle release thử không chứa key nào; xem nhật ký)_
  - Sửa: FE `babel.config.js` (`allowlist`: `CATALOG_API_URL`, `API_BASE_URL`, `MAPBOX_ACCESS_TOKEN`); `src/utils/env.ts`, `src/types/env.d.ts`, `src/types/env.mock.ts` (giữ kiểu `AppEnv`, key bí mật không còn đọc từ `.env`, giá trị `''`); thêm `API_BASE_URL` (mặc định = Cloud Run như `catalog.client.ts:4-5`). `.github/workflows/ci.yml`: hạ ngưỡng `tsc` 63 → 62 (U10).
  - Dùng lại: cấu trúc `env.ts`; mặc định URL kiểu `catalog.client`.
  - Nghiệm thu: bundle debug tạo ra để kiểm (`npx react-native bundle` vào thư mục tạm, **xóa sau khi kiểm**) không chứa key (grep `sk-`, `SG.`, độ dài key); guest + map chạy như P4.
  - Test: `__tests__/env.test.js` (chỉ 3 biến public được đọc; key bí mật = `''`).
- [x] **P5.3 Secret Manager + cấu hình module.** _(code xong; tạo secret `travel-app-config` = U21)_
  - Secret: `travel-app-config` (JSON: `JWT_SECRET`, `LEGACY_PASSWORD_SALT`, `OPENAI_API_KEY`, `SERPAPI_KEY`, `IMGBB_API_KEY`; sau này thêm SendGrid/PayOS khi hoàn thiện Nợ) + `travel-database-url` hiện có. ≤ 6 version đang hoạt động (miễn phí); hủy version cũ sau khi đổi.
  - Sửa: `core_api/config.py` (giữ `profile=core`; module bật qua env `APP_FEATURES=auth,…`; đọc JSON secret; thiếu key bắt buộc của module → khởi động báo lỗi rõ, không in giá trị); `DISABLED_SERVICES` tính từ module (bỏ `nocodb`, `firebase`); `/health` báo module bật; `deploy/service.yaml` (env + secret ref); `Dockerfile` COPY module của phase.
  - Dùng lại: `Settings`, `DISABLED_SERVICES`, `/health` (`app.py:194-209`).
  - Nghiệm thu: không bật module → hành vi = hiện tại (smoke 123/49/82); bật `auth` thiếu secret → lỗi rõ.
  - Test: `check_core_api.py` thêm ca bật/tắt module, secret thiếu.
- [x] **P5.4 Migration `007_auth.sql` + quyền + import.** _(file xong + dry-run trên export; áp dụng/import = U22; xóa script sau khi đối chiếu)_
  - Sửa: `db/schema/007_auth.sql` (`accounts.token_version`, `accounts.deleted_at`; `password_hash` có tiền tố thuật toán); `db/permissions/002_auth.sql` (runtime: SELECT/INSERT/UPDATE cột cần của `accounts` trừ `balance`; SELECT `transactions` của chính user; USAGE sequence); `db/README.md`.
  - Import một lần (script ngoài image, đọc trực tiếp từ `C:\Users\lekha\Downloads\DATA NOCODB`, không copy dữ liệu vào repo): `accounts.json` → `accounts` **3 tài khoản** có hash (`password_hash = 'sha256salt$' + hash`, giữ `balance`); **bỏ tài khoản mật khẩu rỗng** (Q17, không có giao dịch, số dư 0); `transactions.csv` → `transactions` (7 dòng PAID, map `accountId` cũ qua `userName` — cả 7 đều map được). Dữ liệu này là seeding của User.
  - Nghiệm thu: Neon có đúng 3 accounts và 7 transactions; tổng `amount` khớp file; `email` không trùng. **Xóa script import sau khi đối chiếu xong** (ghi số liệu vào nhật ký).
  - Test: test schema/SQL trong `tests/check_schema_auth.py`; script import có chế độ dry-run in số dòng, chạy trên dữ liệu giả trong test rồi mới chạy thật.
- [x] **P5.5 Router auth `core_api/auth.py`.** _(code + test fake xong; thử tài khoản import bằng mật khẩu cũ sau deploy = U23)_
  - Endpoint: `POST /auth/signup`, `POST /auth/login`, `GET/PATCH /me`, `POST /me/change-password`, `DELETE /me` (F14: xóa/ẩn danh dữ liệu cá nhân, giữ `transactions` ẩn danh). **Không** bật forgot/reset (Nợ Q1).
  - Dùng lại: luật nghiệp vụ của `src/services/auth.api.ts` (trùng username/email, field `IAccount`), **công thức hash cũ** `SHA256(password + PASSWORD_SALT)` (`auth.api.ts:28-37`) để kiểm tài khoản import, đúng thì rehash `scrypt` (stdlib `hashlib.scrypt`); mẫu Pool/timeout của `core_api/database.py`, model Pydantic như `core_api/models.py`.
  - Bảo mật: JWT HS256 30 ngày + `token_version` (Q3); rate limit login (in-memory, max 1 instance); lỗi chung chung; hash rỗng không bao giờ khớp.
  - Nghiệm thu: tài khoản import đăng nhập được bằng mật khẩu cũ (User thử) và hash đổi sang `scrypt$`; signup → login → `/me` → đổi mật khẩu làm token cũ hết hiệu lực; `DELETE /me` xong thì login thất bại.
  - Test: `tests/check_auth.py` (fake DB): hash cũ đúng/sai, rehash, mật khẩu rỗng, 401/409/422/429, token_version.
- [x] **P5.6 Email ở BE — trạng thái Nợ.** Chuyển payload SendGrid của `auth.api.sendOTPEmail` (`auth.api.ts:371-466`) và luật OTP (5 phút, 3 lần/10 phút — `:23-25`) sang `core_api/email.py` + endpoint forgot/reset **để tắt** (module `email` không nằm trong `APP_FEATURES`), test bằng fake sender. Mục đích: FE không còn gọi SendGrid, hoàn thiện sau chỉ cần cấp key + bật module.
- [x] **P5.7 Hợp đồng API auth:** OpenAPI đủ endpoint; `tests/check_contract.py` kiểm field response (không bao giờ có `password_hash`).

**Nghiệm thu P5:** BE deploy với module `auth`; smoke catalog 123/49/82 PASS; luồng auth chạy với Neon thật; APK không còn key; báo cáo key (P5.1) có trong nhật ký.
**Cần User P5:** chạy lần lượt 3 bước dưới (U21 → U22 → U23), mỗi bước xong báo agent. Mọi lệnh chạy trong **PowerShell**, thư mục `D:\Project\Travel\Travel_BE`. Không có giá trị nào phải gõ tay hoặc copy từ chỗ khác: tên, số version, digest đều được lệnh tự lấy.

**Ba loại "số" hay bị nhầm (lỗi v1/v2/v3 hôm trước):**
| Thứ | Ví dụ | Ai đặt | Khi nào phải sửa |
|---|---|---|---|
| Version của secret | `key: '1'` trong `deploy/service.yaml` | Secret Manager tự đánh số khi tạo/thêm (1, 2, 3…) | Chỉ khi thêm version mới cho secret (đổi key) → số trong `service.yaml` phải bằng version mới. Lần đầu tạo secret luôn là `1` |
| Revision Cloud Run | `travel-api-00003-smt` | Cloud Run tự tạo mỗi lần deploy | Không bao giờ sửa; chỉ dùng để rollback — lệnh ở bước 3.1 tự ghi lại |
| Digest image | `sha256:6ece…` trong `service.yaml` | Artifact Registry, sau mỗi lần build | Mỗi lần deploy — lệnh ở bước 3.3 tự lấy và tự ghi vào `service.yaml` |

**Bước 0 (mỗi cửa sổ PowerShell mới chạy 1 lần):**
```powershell
cd D:\Project\Travel\Travel_BE
$travelGcloud = "$env:LOCALAPPDATA\TravelDeploymentTools\gcloud-589.0.0\google-cloud-sdk\bin\gcloud.cmd"
$project = "travel2026-511805"; $region = "asia-southeast1"
```

**U21 — tạo secret `travel-app-config`.** _Để làm gì:_ module đăng nhập cần 2 giá trị bí mật — `JWT_SECRET` (khóa ký "vé đăng nhập" 30 ngày; ai có khóa này giả được đăng nhập của mọi người) và `LEGACY_PASSWORD_SALT` (để kiểm mật khẩu cũ của 3 tài khoản seed). Chúng không được nằm trong code, image hay `.env` trên cloud; Cloud Run đọc chúng từ Secret Manager. Thiếu secret này, module `auth` cố ý **không khởi động**. Các phase sau (OpenAI, SerpAPI, imgbb…) thêm key vào cùng secret này (1 secret → miễn phí).
```powershell
# Tạo file JSON tạm (JWT_SECRET sinh ngẫu nhiên, không hiện ra màn hình; salt là giá trị cũ vốn đã có trong source)
.\.venv\Scripts\python.exe -c "import json,os,secrets;open(os.path.join(os.environ['TEMP'],'travel-app-config.json'),'w').write(json.dumps({'JWT_SECRET':secrets.token_urlsafe(48),'LEGACY_PASSWORD_SALT':'TravelApp_Secret_Salt_2025'}))"
& $travelGcloud secrets create travel-app-config --replication-policy=automatic --data-file="$env:TEMP\travel-app-config.json" --project=$project
Remove-Item "$env:TEMP\travel-app-config.json"
# Cho Cloud Run (runtime SA) được đọc secret
& $travelGcloud secrets add-iam-policy-binding travel-app-config --member=serviceAccount:travel-runtime@travel2026-511805.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor --project=$project --quiet
# Kiểm tra: phải thấy đúng 1 dòng, cột NAME = 1, STATE = enabled
& $travelGcloud secrets versions list travel-app-config --project=$project
```
Nếu lệnh `create` báo secret đã tồn tại: **không** tạo lại; báo agent (sẽ phải dùng version mới và sửa số `key:` tương ứng).

**U22 — migration + quyền + import seed.** _URL admin lấy ở đâu:_ không cần lấy — `Travel_BE/.env` đã có `DATABASE_URL_UNPOOLED` (agent kiểm 30/10: role `neondb_owner`, kết nối direct, đúng loại cần cho migration). Script tự đọc, không in ra. Nếu sau này cần lấy lại: Neon console → project `travel` → **Connect** → Role `neondb_owner`, tắt "Connection pooling" → copy chuỗi kết nối vào `.env`. Không cần cài `psql`.
```powershell
# 1) Kiểm tra dữ liệu (không ghi gì): phải thấy accounts 3, skipped 1, transactions 7, mapped 7
.\.venv\Scripts\python.exe scripts\import_seed_accounts.py "C:\Users\lekha\Downloads\DATA NOCODB"
# 2) Áp dụng 007_auth.sql + 002_auth.sql: phải thấy connected_as neondb_owner, 007 applied, 002 applied, runtime_grants ok
.\.venv\Scripts\python.exe scripts\import_seed_accounts.py "C:\Users\lekha\Downloads\DATA NOCODB" --migrate
# 3) Import: phải thấy accounts_in_db 3, transactions_in_db 7, amount_in_db 172000
.\.venv\Scripts\python.exe scripts\import_seed_accounts.py "C:\Users\lekha\Downloads\DATA NOCODB" --apply
```
Chạy lại lệnh nào cũng an toàn (đã áp dụng thì bỏ qua, đã import thì không nhân đôi). Lỗi ở bước nào thì dừng, gửi agent đúng dòng lỗi (script không in URL/mật khẩu).

**U23 — build và deploy BE.**
```powershell
# 3.1 Ghi lại revision đang chạy tốt (để rollback nếu cần)
$prev = & $travelGcloud run services describe travel-api --project=$project --region=$region --format="value(status.latestReadyRevisionName)"
"Revision tốt hiện tại: $prev"
# 3.2 Build + smoke test trong Cloud Build (cấp quyền đọc DB secret tạm thời, luôn thu hồi sau)
$imageRepo = "asia-southeast1-docker.pkg.dev/$project/travel/travel-api"
$tag = "p5-" + (Get-Date -Format "yyyyMMdd-HHmm")
& $travelGcloud secrets add-iam-policy-binding travel-database-url --member=serviceAccount:travel-build@travel2026-511805.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor --project=$project --quiet
try {
    & $travelGcloud builds submit . --config=deploy/cloudbuild.yaml --substitutions="_IMAGE=${imageRepo}:${tag}" --service-account=projects/$project/serviceAccounts/travel-build@travel2026-511805.iam.gserviceaccount.com --gcs-source-staging-dir=gs://travel2026-511805_cloudbuild/source --project=$project --region=$region
    if ($LASTEXITCODE -ne 0) { throw "Build failed; do not deploy" }
} finally {
    & $travelGcloud secrets remove-iam-policy-binding travel-database-url --member=serviceAccount:travel-build@travel2026-511805.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor --project=$project --quiet
}
# 3.3 Lấy digest của image vừa build và tự ghi vào service.yaml (không sửa tay)
$digest = & $travelGcloud artifacts docker images describe "${imageRepo}:${tag}" --format="value(image_summary.digest)"
"Digest mới: $digest"
(Get-Content deploy\service.yaml -Raw) -replace 'travel-api@sha256:[0-9a-f]{64}', "travel-api@$digest" | Set-Content deploy\service.yaml -NoNewline -Encoding ascii
Select-String -Path deploy\service.yaml -Pattern "sha256:", "APP_FEATURES", "travel-app-config"
# 3.4 Deploy
& $travelGcloud run services replace deploy\service.yaml --project=$project --region=$region --quiet
# 3.5 Kiểm tra (phải thấy auth = operational; login sai = 401)
$base = "https://travel-api-u2xcse44ca-as.a.run.app"
(Invoke-RestMethod "$base/health").services | Format-List
try { Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"user_name":"khong-ton-tai","password":"x"}' } catch { "login sai -> HTTP " + $_.Exception.Response.StatusCode.value__ }
# 3.6 Thử 1 tài khoản seed bằng mật khẩu cũ (gõ tại máy, không gửi agent): phải in ra user_name
$u = Read-Host "user_name"; $p = Read-Host "mat khau"
(Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body (@{user_name=$u; password=$p} | ConvertTo-Json)).account.user_name
Remove-Variable p
```
Nếu 3.4/3.5 lỗi → rollback về revision đã ghi ở 3.1:
```powershell
& $travelGcloud run services update-traffic travel-api --to-revisions="$prev=100" --project=$project --region=$region --quiet
```

## P6 — FE: Đăng nhập, Đăng ký, Profile, Hồ sơ, Settings (F08–F14)
Phụ thuộc: P5. Ước lượng: M.
- [ ] **P6.1 `auth.api.ts` gọi BE.**
  - Sửa: `src/services/auth.api.ts` (giữ tên hàm `login`, `signUp`, `updateProfile`, `changePassword`, `getUserById` → `/me`; `checkEmailExists`/`sendOTPEmail`/`verifyOTP`/`updatePassword` trỏ endpoint forgot/reset của BE — đang tắt, Nợ); client mới `src/services/api.client.ts` (timeout/retry như `catalog.client.ts`, header `Authorization`).
  - Dùng lại: `catalog.client`, `localStorageKey.AUTH_TOKEN` (`constants.tsx:10`), `LocalStorageCommon`.
  - Nghiệm thu: không còn `request`/NocoDB/SendGrid/crypto-js trong đường chạy auth; login sai → Toast cũ.
  - Test: `__tests__/services/auth.api.test.js` (mock fetch: lưu token, 401 → xóa phiên, không lưu mật khẩu).
- [ ] **P6.2 Adapter account:** response BE (snake_case, `id`) → `IAccount` (`id`, bỏ `Id`, bỏ `password`); sửa chỗ dùng `account.Id` (`HomeScreen.tsx:441-443`, `Donation.tsx:43`, `Personal.tsx:232,278,365,463`).
- [ ] **P6.3 Mở comment màn hình + điều hướng.**
  - Sửa: `AppContainer.tsx` — mở import + route `LoginScreen`, `SignUpScreen`, `Personal` và `Tabs.Screen` Profile (`:24,29,35,46,304-318,332-334,344-346,365-367`); `ForgotPasswordScreen` **giữ comment** (Nợ) và nút "Quên mật khẩu" ở Login hiện Toast "sắp có"; `featureFlags.ENABLE_AUTH = true`; `LoginScreen.tsx:64-66` bỏ lưu `USERNAME`/`PASSWORD` (giữ `AVT` = hồ sơ, `AUTH_TOKEN`).
  - Dùng lại: toàn bộ UI Login/SignUp/Profile/Personal; `HomeScreen.handleGetUser`.
  - Nghiệm thu: guest mở Profile → Settings/FAQ/Policy/About (G8) và nút Đăng nhập; đăng nhập xong hiện tên/avatar; đăng xuất xóa token; icon tab đúng theo `TAB_ORDER`.
  - Test: cập nhật `guestNavigation.test.js` (route mới, tab Profile); `__tests__/authFlow.test.js` (Login → Profile, SignUp, đăng xuất).
- [ ] **P6.4 Hồ sơ:** `Personal` sửa thông tin + đổi mật khẩu qua BE; nút đổi avatar ẩn tới P7.4 (không viết upload tạm).
- [ ] **P6.5 Xóa tài khoản (F14, Play):** nút trong `Personal` (xác nhận 2 bước) → `DELETE /me` → đăng xuất; `Policy.tsx:104` trỏ hướng dẫn/link web xóa tài khoản (U29).
- [ ] **P6.6 Mời đăng nhập (Q13):** guest bấm vào tính năng cần đăng nhập (viết review, upload, Camera, Chatbot, Donation) → điều hướng Login rồi quay lại màn cũ.
- [ ] **P6.7 Ngôn ngữ UI:** `Settings` + `LanguageDropdown` đổi vi/en cho chữ UI (i18n `common`).

**Nghiệm thu P6:** emulator: đăng ký → đăng nhập (cả tài khoản import) → sửa hồ sơ → đổi mật khẩu → đổi ngôn ngữ → xóa tài khoản test; guest vẫn duyệt catalog/map như P4.
**Cần User P6:** account test; thử đăng nhập tài khoản import bằng mật khẩu cũ.

## P7 — Upload ảnh (imgbb) + review ghi qua BE + Bảng tin (F15–F18)
Phụ thuộc: P5, P6, **U31 (key imgbb mới)**; Q4 = imgbb, Q5 = bảng reviews + rating tính từ reviews, Q16 = không import review cũ. Ước lượng: BE M + FE M.
- [ ] **P7.0 Chốt nhà cung cấp ảnh trước khi code P7.** Thử key imgbb từ môi trường Cloud Run/Singapore (Cloud Shell hoặc một bước Cloud Build, upload ảnh 1×1 `expiration=60`, không in key). Thành công → dùng imgbb như P7.1. Vẫn lỗi 103 → phương án dự phòng: bucket GCS trong `travel2026-511805` (dùng ADC của runtime SA, ảnh public-read, quota/user, ~7.000 VND/GB lưu+tải), sửa P7.1/P8.3 tương ứng và ghi vào nhật ký.
- [ ] **P7.1 BE `POST /uploads`** (JWT, chỉ `image/jpeg|png|webp`, ≤ 2 MB, quota/user/ngày) → imgbb (không `expiration`), trả `{url, delete_url}`.
  - Dùng lại: `service.image_to_url` (`service.py:189-210`, imgbb) — tách thành hàm dùng chung cho upload và detect (thêm tham số `expiration`); bỏ comment `python-multipart`, `requests` trong `requirements.txt`.
  - Test: `tests/check_uploads.py` (fake imgbb: sai MIME 415, quá cỡ 413, không token 401, quota 429, imgbb lỗi → 502).
- [ ] **P7.2 Migration `008_reviews.sql`** (`reviews`, `review_reports`, index theo `location_id`/`festival_id`, quyền runtime). **Không import** review cũ (Q16 — 388 + 92 review seeding trong export bỏ); bảng bắt đầu rỗng.
- [ ] **P7.3 BE reviews + rating.**
  - Endpoint: `GET /reviews?location_id|festival_id&limit&offset` (công khai: tên hiển thị + avatar, không email), `POST /reviews` (JWT, 1–5 sao, độ dài nội dung giới hạn, ảnh phải là URL trả từ `/uploads`), `DELETE /reviews/{id}` (chủ review), `POST /reviews/{id}/report`; rate limit.
  - Catalog: `/locations`, `/festivals` trả `rating` = AVG review hiển thị (null nếu chưa có) + `review_count`, mảng `reviews` trả `[]` tới khi bỏ cột ở P12 (giữ contract trong giai đoạn chuyển).
  - Dùng lại: shape `IReview`/`IFestivalReview`, `calculateAverageRating` (`locations.api`) làm chuẩn tính; `core_api/catalog.py` (ETag tính lại theo dữ liệu mới).
  - Test: `tests/check_reviews.py` (tạo/đọc/xóa/report, rating trung bình đúng, review bị ẩn không tính, ETag đổi khi có review mới); `check_contract.py` thêm `review_count`.
- [ ] **P7.4 FE service:** `locations.api.getReviews/createReview/uploadImage`, `festivals.api.addReview` gọi BE (giữ chữ ký); adapter thêm `review_count`; mở nút đổi avatar ở `Personal` (P6.4).
- [ ] **P7.5 FE Bảng tin + Detail.**
  - Sửa: `AppContainer.tsx:26,258-274` (mở `NewFeedScreen` + tab Feed), `featureFlags.ENABLE_FEED`, `ENABLE_UPLOAD = true` (client mới; `axios.ts` NocoDB vẫn bị chặn); `DetailLocation`/`DetailFestival` đọc review từ `GET /reviews` (giữ `ReviewItem`, empty state P1), rating từ catalog; nút "Báo cáo" trong `ReviewItem`.
  - Dùng lại: toàn bộ `NewFeedScreen` (BottomSheet, sao, `launchImageLibrary`, lọc theo địa điểm).
  - Nghiệm thu: viết review có ảnh → hiện ở Feed + Detail, rating/số review cập nhật; guest đọc được, bấm viết thì được mời đăng nhập; báo cáo ghi nhận.
  - Test: `__tests__/newFeed.test.js` (list, lọc, tạo review, lỗi upload giữ nội dung nhập); cập nhật `guestNavigation.test.js` (tab Feed, icon đúng).

**Nghiệm thu P7:** luồng review đầy đủ trên emulator; ảnh ở imgbb; không request NocoDB/Firebase.
**Cần User P7:** key imgbb mới (U31); chạy 008 (U22); deploy (U23); quy trình xử lý review bị báo cáo (SQL thủ công).

## P8 — Bảng `objects` (Items = Objects) + Camera / nhận diện (F19, F20)
Phụ thuộc: P7 (imgbb dùng chung); Q6 = một bảng `objects`. Ước lượng: BE M + FE S.
- [ ] **P8.1 Dữ liệu objects.** `db/schema/009_objects.sql` (bảng `objects`: `record_id`, `title`, `content`, `images`, `video`, `location_id` FK nullable, `aliases`); script import một lần từ `objects.json` (11 bản ghi, gồm 9 bản của `data.py`); `images`/`location_id` để trống, User bổ sung dần.
  - Nghiệm thu: 11 bản ghi, tiêu đề không trùng, nội dung khớp file. **Xóa script import sau khi đối chiếu.**
- [ ] **P8.2 BE `GET /objects`** (phân trang, gzip/ETag như catalog).
  - Dùng lại: `core_api/catalog.py` (`CatalogPage`, Cache-Control/ETag), `core_api/models.py`.
  - Test: `check_core_api.py` + `check_contract.py` thêm `objects`.
- [ ] **P8.3 BE `/detect` bật lại.**
  - Sửa: `app.py:18,92-96` (mở import + route, JWT, quota/ngày); `service.py`: `get_available_object_titles`/`get_full_description` tra bảng `objects` thay NocoDB; ảnh tạm qua hàm imgbb chung (`expiration=600`); bỏ nhánh Firebase (`upload_file`); khởi tạo client OpenAI/SerpAPI lười; bỏ comment `openai`, `serpapi` trong `requirements.txt`.
  - Dùng lại: pipeline `get_object_name` (Lens → OpenAI → khớp tên có sẵn).
  - Test: `tests/check_detect.py` (fake Lens/OpenAI/imgbb: khớp object → mô tả từ DB; không khớp → mô tả OpenAI; hết quota 429; thiếu key → 503).
- [ ] **P8.4 FE Items.** `locations.api.getItems/getItemsWithLocationId` → `GET /objects` (nạp lười, không chặn Home; adapter `title`→`name`, `content`→`description`); khôi phục JSX mục Items ở `FestivalsScreen` từ `git show 3583e90^:src/container/screens/Festival/FestivalsScreen.tsx` + mở renderer (`FestivalsScreen.tsx:114-118`); mở route `DetailItem`, `ViewAllItem` (`AppContainer.tsx:41-42,353-358`); `ENABLE_ITEMS = true`; `IItem.Id` → `id`; `DetailItem.tsx:15` bỏ `DB_URL`.
  - Test: `__tests__/items.test.js` (Festival hiện mục Items khi có dữ liệu, ẩn khi rỗng/lỗi; mở DetailItem).
- [ ] **P8.5 FE Camera.** Mở `CameraScreen`, `PreviewImage` + tab Camera (`AppContainer.tsx:28,32,289-303,337-339`); `SERVER_URL` → `API_BASE_URL` (`CameraScreen.tsx:96,186`, `PreviewImage.tsx`); gửi JWT; chưa đăng nhập → mời đăng nhập; `ENABLE_CAMERA = true`.
  - Nghiệm thu: chụp/chọn ảnh hiện vật (ví dụ Cầu Rồng) → tên + mô tả trong `CameraResultModal`; từ chối quyền camera không crash.
  - Test: `__tests__/camera.test.js` (mock vision-camera/rn-fetch-blob: URL đúng, header token, timeout `AI_RECOGNITION_TIMEOUT`).

**Nghiệm thu P8:** Items hiển thị từ Neon; nhận diện chạy qua Cloud Run.
**Cần User P8:** chạy 009 + import (U22); deploy (U23).

## P9 — AI: semantic search, tương tự, gợi ý, chatbot RAG, bộ nhớ (F21–F26)
Phụ thuộc: P6 (user), P8 (`objects`). Ước lượng: BE L + FE M.
- [ ] **P9.1 Index FAISS từ Neon (G7, Q8).** `scripts/index_data.py` + `utils/startup_indexer.py` đọc locations/festivals/**objects** từ Neon (dùng `core_api/database.py`), `entity_id` = id Neon, `entity_type` `object` thay `item`; giữ `build_text_for_embedding`, content hash; build lúc build image (Cloud Build), không build khi startup. Bỏ comment `faiss-cpu`, `numpy`, `openai`; `Dockerfile` COPY `routers/`, `services/`, `models/`, `utils/`, index.
  - Nghiệm thu: số vector = 123 + 49 + 11; `entity_id` 1 ↔ "An Phú Farm". Index thử build ở máy local xóa sau khi kiểm.
  - Test: `tests/check_indexer.py` (fake embedding: map id đúng, bỏ record rỗng).
- [ ] **P9.2 Migration `010_ai_memory.sql`** + `services/memory_service.py` đọc/ghi Neon (giữ chữ ký `get_user_memories`, `store_conversation_message`, `get_conversation_history`…); bảng bắt đầu rỗng.
- [ ] **P9.3 Bật router.** `app.py:23,61-64` mở `search_router`, `chat_router`, `memory_router`, `recommendations_router`; `/recommendations/{user_id}` và `/memory/*` lấy user từ JWT; quota chat/user/ngày (dùng lại `max_requests_per_minute` trong `utils/config.py`); `/health` báo index (`app.py:196-207`); RAG lấy ngữ cảnh từ `objects` + catalog.
  - Test: `tests/check_ai_routes.py` (fake OpenAI/FAISS: search trả entity Neon, similar, recommendations 401 khi không token, chat có/không ảnh, quota 429).
- [ ] **P9.4 FE semantic.** `semantic.api.ts:275-276` `baseURL` → `API_BASE_URL` + token; `ENABLE_AI = true`; dùng lại `SemanticSearchBarComponent` (semantic + gợi ý), `ViewAllLocation/ViewAllFestivals` (`isSemanticSearch`), `SimilarItemsComponent` (`DetailLocation.tsx:511`), `RecommendationsWidget` (`HomeScreen.tsx:441`, `account.id`); semantic lỗi → tự về keyword (P3).
- [ ] **P9.5 Chatbot qua BE.** `chatbot.api.sendChatMessage` → `chatWithRAG` (`semantic.api.ts:380`, `image_base64`, `session_id`); `searchImage` → ảnh từ `sources` của RAG (ảnh catalog), chỉ gọi SerpAPI qua BE nếu catalog không có ảnh; mở route `ChatBotScreen` (`AppContainer.tsx:49,377-379`) và `FloatingChatBubble` (`App.tsx:53`); giữ lịch sử LocalStorage + `clearChatSession`.
  - Dùng lại: UI `ChatbotScreen` (markdown, chọn ảnh, `extractImageCount`); system prompt FE chuyển vào `rag_service._build_system_prompt`.
  - Test: `__tests__/chatbot.test.js` (gửi tin → BE đúng body, 429 hiện thông báo, không còn `api.openai.com`/`serpapi.com` trong `src`).
- [ ] **P9.6 Sửa suite hỏng từ trước (U6):** cài devDependency `@testing-library/react-native`; sửa `semantic.api.test.ts`, `RecommendationsWidget.test.tsx`, `SimilarItemsComponent.test.tsx`; thêm vào CI.

**Nghiệm thu P9:** search "biển đẹp" ra bãi biển; Detail có "tương tự"; Home có gợi ý khi đăng nhập; chatbot trả lời kèm nguồn (kể cả hỏi về hiện vật trong `objects`); chi phí OpenAI đợt thử ghi vào nhật ký.
**Cần User P9:** chạy 010 (U22); deploy (U23).

## P10 — Payment: bỏ NocoDB/DO, chuyển sang Neon/Cloud Run, giữ tắt (F27, F28 — Nợ Q9)
Phụ thuộc: P5. Ước lượng: BE S–M + FE S.
- [ ] **P10.1 Soạn `011_payments.sql`** (quyền INSERT/UPDATE `transactions`, UPDATE `accounts.balance`) — test với fake DB, **chưa áp dụng lên Neon**.
- [ ] **P10.2 Repository Neon thay NocoDB:** `create_transaction`, `get_user_by_id`, `update_user_balance` (giữ chữ ký `nocodb_service.py:145-301`) trong `core_api/payments_repo.py`; `app.py:19-20` import từ module mới.
- [ ] **P10.3 Chuẩn bị endpoint, vẫn tắt.** Code `/payments/create|status`, `/webhook/payos`, `/payment/return|cancel` (`app.py:105-189`) sửa sẵn: user từ JWT, `verify_webhook_signature` bắt buộc (`payment_service.py:28`), idempotent theo `order_code`; `PUBLIC_BASE_URL` mặc định = Cloud Run (bỏ DO ở `payment_service.py:18`, `app.py:177`); module `payments` không nằm trong `APP_FEATURES`.
  - Test: `tests/check_payments.py` (fake PayOS: chữ ký sai 401, webhook lặp không cộng 2 lần, status người khác 403, amount < 1000 → 400) chạy trong CI dù module tắt.
- [ ] **P10.4 FE:** `payment.api.ts:24` → `API_BASE_URL` + token (bỏ `PAYOS_BACKEND_URL`); `Donation` giữ comment route; mục "Ủng hộ" ở Profile hiện "sắp có".

**Nghiệm thu P10:** grep `nocodb|ondigitalocean|digital-ocean` trong code payment = 0; test payment PASS; không endpoint payment nào public.
**Cần User P10:** không (PayOS hoàn thiện ở mục Nợ).

## P11 — i18n UI, nội dung tiếng Anh (dịch một lần), Hotels trong search (F31–F33)
Phụ thuộc: P9. Ước lượng: BE S + FE M + dữ liệu S.
- [ ] **P11.1 Cột `*_en` (D1) — bản dịch nội dung lưu ở Neon, không ở source** (chữ UI vẫn ở `src/i18n/locales/{vi,en}/common.json`). `012_i18n_content.sql` (nullable: `name_en`, `description_en`, `long_description_en`, `advise_en`, `address_en`/`event_time_en`, `ticket_info_en`, `opening_hours_en`; objects: `title_en`, `content_en`); model/contract BE trả thêm `*_en`; FE `translateLocationField/translateFestivalField` (`translationHelpers.ts:6-26`) chọn `*_en` khi ngôn ngữ = en và có dữ liệu, ngược lại tiếng Việt (giữ chữ ký).
  - Test: `translationHelpers.test.ts` thêm ca en có/không `*_en`; `check_contract.py`.
- [ ] **P11.2 Script dịch một lần (Q11).** Script BE chạy local: đọc Neon → OpenAI gpt-4o-mini dịch theo lô (giữ tên riêng, không dịch URL) → in diff/CSV để User duyệt → ghi `*_en` (owner role). Ước tính ≈ 0,3 USD. Chỉ ghi ô đang trống (chạy lại an toàn). **Xóa script + file duyệt sau khi ghi xong.**
- [ ] **P11.3 i18n UI:** rà `common.json` vi/en đủ key cho mọi màn đã mở ở P6–P10 (Login, Profile, Feed, Camera, Chatbot, Items); thiếu thì bổ sung (chữ UI, không phải dữ liệu).
- [ ] **P11.4 Hotels trong search (F32).** `catalogRepository`: nạp `/hotels` lười khi mở search lần đầu (~44 KB gzip, không thuộc lượt tải Home); adapter hotel dùng lại `catalog.adapter` (shape giống location + `category`); `catalogSearch` gồm hotels; kết quả hotel mở `DetailLocation` (không lễ hội, không marker).
  - Test: `catalogSearch.test.js` + `catalog.api.test.js` (hotels chỉ fetch khi search, 1 lần).
- [ ] **P11.5 Nhãn tiếng Việt cho `types` (F33):** nhãn UI trong i18n `common` theo slug (`types.museum` = "Bảo tàng"), search khớp cả slug lẫn nhãn.
- [ ] **P11.6 Sửa suite hỏng:** `__tests__/i18n/languageSwitching.test.tsx`; thêm vào CI.

**Nghiệm thu P11:** đổi en → UI tiếng Anh, record có `*_en` hiện tiếng Anh, record thiếu hiện tiếng Việt; search tên khách sạn ra hotels; "bảo tàng" khớp `museum`.
**Cần User P11:** duyệt bản dịch; chạy 012 + ghi dữ liệu (U22); deploy (U23).

## P12 — CLEAN (chỉ xóa sau khi P5–P11 đã khôi phục; User duyệt từng mục)
Danh sách đầy đủ kèm bằng chứng: audit mục 9 (CF1–CF22, CB1–CB13). Mỗi mục một commit riêng. Không refactor kiến trúc, không tối ưu hiệu năng.
- [ ] P12.1 Rà lại bằng chứng từng mục ngay trước khi xóa (grep import/tham chiếu, `git log -S`), ghi vào nhật ký; mục còn tham chiếu thì giữ.
- [ ] P12.2 FE code chết/trùng: CF1–CF5, CF7, CF8, CF10–CF13.
- [ ] P12.3 FE bỏ NocoDB/DO/gọi thẳng bên thứ ba: CF6, CF9, CF14.
- [ ] P12.4 FE bỏ Azure: CF21 (giữ i18n, `TranslationContext`, HOC).
- [ ] P12.5 FE dependency + script: CF15, CF16 — sau mỗi lần gỡ package native: `npm ci` + build debug Android pass.
- [ ] P12.6 FE asset + file build: CF17, CF22 (thêm `android/app/release/`, `index.android.bundle` vào `.gitignore`).
- [ ] P12.7 Tài liệu: CF18, CF19, CB10; `README.md` FE/BE viết lại theo kiến trúc mục 8 (không còn hướng dẫn NocoDB/DO/Firebase/Azure).
- [ ] P12.8 BE: CB1–CB9, CB11–CB13 (CB13 = migration 013 bỏ cột `reviews`/`rating`, cùng lúc bỏ mảng `reviews` khỏi contract catalog + FE adapter).
- [ ] P12.9 **Xác nhận sạch hoàn toàn (D5):** `git grep -il "nocodb\|ondigitalocean\|digital.ocean\|digitalocean"` trên cả 2 repo = 0 (trừ `MIGRATION_AUDIT.md`, `MIGRATION_TASKLIST.md`); grep `firebase\|azure\|microsofttranslator\|unsplash\|api.openai.com\|serpapi.com\|sendgrid.com` trên `src` FE = 0; `.env` FE/BE local không còn biến NocoDB/DO/Firebase/Azure/Unsplash (U20); không còn file tạm trong 2 repo (`git status --ignored` rà thư mục lạ).
- [ ] P12.10 Lint/tsc: sửa lỗi rõ ràng (import thừa, biến không dùng, 4 lỗi `exhaustive-deps` cũ của `MapScreenV2` nếu sửa được không đổi hành vi); hạ baseline tsc trong CI theo số mới.
- **Không xóa:** khối `BackgroundGeolocation` trong `MapScreenV2.tsx` (F07, Backlog); `ForgotPasswordScreen`, `Donation`, code email/payment ở BE (Nợ); test của tính năng.

**Nghiệm thu P12:** gate chung; build debug Android pass; P12.9 = 0.
**Cần User P12:** duyệt từng mục CF/CB; chạy 013 (U22); deploy (U23).

## P13 — Nghiệm thu Android toàn app (P5 cũ, mở rộng)
- [ ] P13.1 Build debug từ `.env` tối giản (`CATALOG_API_URL`, `API_BASE_URL`, Mapbox `pk.`) _(P5.1 cũ)_
- [ ] P13.2 Cold start → Home → list → detail → festival → map → back; restart app _(P5.2 cũ)_
- [ ] P13.3 Mất mạng → thông báo ≤ 30 s; có mạng lại thì Thử lại thành công _(P5.3 cũ)_
- [ ] P13.4 Network chỉ tới Cloud Run, host ảnh (catalog + imgbb), Mapbox _(P5.4 cũ, mở rộng)_
- [ ] P13.5 Ghi thiết bị/OS/thời điểm vào nhật ký _(P5.5 cũ)_
- [ ] P13.6 Kịch bản tài khoản: đăng ký → đăng nhập (cả tài khoản import) → hồ sơ/avatar → đổi mật khẩu → đăng xuất → xóa tài khoản
- [ ] P13.7 Kịch bản nội dung: review có ảnh → Feed/Detail/rating → báo cáo; Items → DetailItem; Camera nhận diện
- [ ] P13.8 Kịch bản AI: semantic search, tương tự, gợi ý, chatbot (văn bản + ảnh)
- [ ] P13.9 Ngôn ngữ vi/en; Hotels trong search; từ chối mọi quyền (vị trí/camera/ảnh) không crash; xin vị trí chỉ khi "Gần bạn"/Bản đồ (Q15)
- [ ] P13.10 Sửa `__tests__/App.test.tsx` (render App với mock native) và đưa vào CI; full jest không còn suite hỏng
- [ ] P13.11 Ghi chi phí thực tế của đợt nghiệm thu (GCP, OpenAI, SerpAPI) vào nhật ký

## P14 — Phát hành (P6 cũ, mở rộng)
- [ ] P14.1 Rotate key cũ trong lịch sử repo **và đã nằm trong APK debug** (OpenAI, SendGrid, SerpAPI, imgbb, PayOS, Mapbox secret); thu hồi key của dịch vụ bỏ hẳn (NocoDB, Azure, Unsplash, Firebase); vô hiệu tài khoản trong `authConstants` cũ (U5) _(P6.1 cũ; babel `allowlist` đã làm ở P5.2)_
- [ ] P14.2 Signing ra khỏi `build.gradle` (`build.gradle:106-125` có `storePassword` dạng chữ); xác nhận Play App Signing _(P6.2 cũ)_
- [ ] P14.3 Bỏ quyền thừa (CF20); tắt cleartext; tăng `versionCode` _(P6.3 cũ, mở rộng)_
- [ ] P14.4 Giữ billing guard 26.000 VND (D4); bật cảnh báo chi phí GCP; theo dõi số dư OpenAI _(P6.4 cũ)_
- [ ] P14.5 Play Console: Data safety (tài khoản, ảnh, vị trí), privacy policy URL, link xóa tài khoản, khai báo UGC/kiểm duyệt, tài khoản test cho "App access" (U29)
- [ ] P14.6 Build release, phát hành; sau đó tắt NocoDB/DigitalOcean, thu hồi token NocoDB (U19) _(P6.5 cũ)_
- [ ] P14.7 **Login lên đầu (Q13):** `initialRouteName` = Login khi chưa có token (dùng lại `NavigationService.reset(ScreenName.LOGIN_SCREEN)` và `LoginScreen` sẵn có); có token → Home; bỏ lời mời đăng nhập rải rác (P6.6) hoặc giữ làm fallback; test điều hướng cập nhật

## Nợ (hoàn thiện sau migration — User chốt 30/10)
- [ ] **N1 Quên mật khẩu qua email (Q1):** chọn nhà cung cấp (SendGrid có lẽ đã ngừng; xem Gmail SMTP/Brevo), cấp key vào `travel-app-config`, bật module `email` (code BE đã chuyển ở P5.6), mở comment `ForgotPasswordScreen` + route, test với email thật. Key SendGrid hiện còn hiệu lực (scope hợp lệ, audit 10.1) nhưng chưa thử gửi.
- [ ] **N2 PayOS / Donation (Q9):** cấp 3 key PayOS, áp dụng `011_payments.sql`, bật module `payments` (code đã chuẩn bị ở P10), đặt webhook `https://travel-api-u2xcse44ca-as.a.run.app/webhook/payos` trên my.payos.vn, mở route `Donation`, giao dịch thật 1.000–2.000 VND → số dư tăng đúng 1 lần; xác nhận biểu phí PayOS.
- [ ] **N3 i18n nâng cao / dịch tự động (Q10, Q11):** phase riêng nếu cần ngôn ngữ khác hoặc nội dung người dùng tạo; Azure đã bỏ.
- [ ] **N4 Seeding tài khoản mẫu + review (D7):** sau P7, tạo vài tài khoản mẫu (mật khẩu mạnh, lưu trong Secret/ghi chú riêng của User, không ở repo) và viết review như reviewer **qua API** (`POST /auth/signup`, `POST /reviews`) — không fix cứng trong source, không SQL tay vào bảng reviews.

## Cần User
Các việc dưới đây nằm ngoài quyền của agent (push, GitHub, cloud, dữ liệu) hoặc cần User quyết định.

- [x] **U1 Push 2 nhánh và mở PR để CI chạy lần đầu (P0.5/P0.6).** Lý do: agent không được push. Workflow chỉ đọc code, không cần secret.
  ```bash
  git -C D:/Project/Travel/Travel_FE/Travel push -u origin migration/p0-p1
  git -C D:/Project/Travel/Travel_BE push -u origin migration/p0-p1
  ```
  Sau đó mở PR `migration/p0-p1` → `improve` (FE) và → `main` (BE). Nếu tab Actions chưa chạy: GitHub → Settings → Actions → General → "Allow all actions", rồi bấm "Enable workflows" trong tab Actions. Nghiệm thu P0 = 2 workflow xanh.
- [ ] **U2 (tuỳ chọn) Kiểm tra chỉ đọc với Neon thật.** Lý do: theo yêu cầu, test mặc định chạy fake DB; chế độ `--neon` chỉ SELECT bằng `DATABASE_URL` runtime trong `Travel_BE/.env`.
  ```bash
  cd D:/Project/Travel/Travel_BE && PYTHONIOENCODING=utf-8 .venv/Scripts/python.exe tests/check_core_api.py --neon
  ```
- [ ] **U3 Không cần build/deploy cho P0–P1.** BE chỉ đổi docs/test/CI (image không COPY `tests/`); `container_smoke.py` = 49 đã có trong digest `f152d07…` đang chạy. Lần build kế tiếp (P2.5) làm theo `Travel_BE/deploy/README.md` mục "Build và deploy".
- [ ] **U4 `Travel_BE/db/apply_catalog_v2.py` đang bị xóa nhưng chưa commit** (thay đổi có sẵn trước phiên này, agent không đụng). Quyết định: commit xóa (`git -C D:/Project/Travel/Travel_BE rm db/apply_catalog_v2.py && git -C D:/Project/Travel/Travel_BE commit -m "chore: remove one-off catalog v2 import"`) hoặc `git restore db/apply_catalog_v2.py`. `db/README.md` đã bỏ link tới file.
- [ ] **U5 Mật khẩu dạng chữ trong `authConstants.tsx` vẫn còn trong lịch sử git** dù file đã xóa ở P1. Đổi/vô hiệu các tài khoản đó; gộp vào P6.1 (rotate). _(30/10: P6.1 cũ = **P14.1**.)_
- [x] **U6 Suite test hỏng từ trước, không thuộc gate:** `App.test.tsx`, `AzureTranslatorService`, `semantic.api`, và 3 suite cần `@testing-library/react-native` (chưa cài: `languageSwitching`, `RecommendationsWidget`, `SimilarItemsComponent`). Quyết định: cài devDependency (`npm i -D @testing-library/react-native`) và sửa, hay xóa các suite thuộc tính năng đã hoãn. _(30/10 — đề xuất theo quy tắc dùng lại: không xóa; sửa trong phase của tính năng: P9.6 `semantic.api`/`RecommendationsWidget`/`SimilarItemsComponent` (cài `@testing-library/react-native`), P11.6 `languageSwitching`/`AzureTranslatorService`, P13.10 `App.test.tsx`. User 30/10 đồng ý (không xóa, sửa trong phase); riêng `AzureTranslatorService.test.ts`, `TranslationCache.test.ts` bỏ cùng Azure (CF21).)_
- [ ] **U7 Dữ liệu:** 21 festival chưa có `location_id` (app ẩn dòng địa điểm); toàn bộ `rating = null`, `reviews = []` (app hiện "Chưa có đánh giá"). Bổ sung dần qua Neon khi muốn.
- [x] **U8 Deploy BE cho P2.5 (gzip + Cache-Control + ETag).** Lý do: agent không được build/deploy. Thay đổi nằm trong working tree `Travel_BE` (đang ở `main`, chưa commit): `app.py`, `core_api/catalog.py`, `tests/check_core_api.py`. Các bước:
  1. Tạo nhánh, commit, push, chờ CI xanh rồi merge:
     ```bash
     git -C D:/Project/Travel/Travel_BE switch -c migration/p2
     ```
  2. Build + smoke + deploy theo `Travel_BE/deploy/README.md` mục "Build và deploy phiên bản tiếp theo" (cấp quyền secret tạm thời → `builds submit` → thu hồi; sửa digest PASS vào `deploy/service.yaml`; ghi revision tốt hiện tại; `run services replace`).
  3. Kiểm tra sau deploy (phải thấy `content-encoding: gzip`, `cache-control: public, max-age=300`, `etag: W/"…"`; gửi lại `If-None-Match` thì 304):
     ```bash
     curl -s -D - -o /dev/null -H "Accept-Encoding: gzip" "https://travel-api-u2xcse44ca-as.a.run.app/locations?limit=100"
     ```
  4. Rollback nếu lỗi: `update-traffic` về revision đã ghi ở bước 2.
- [x] **U9 Quyết định mục tiêu payload nén.** → User chấp nhận ~125 KB (29/10); nghiệm thu P2 dùng mức này. Đo trên dữ liệu live với gzip level 9 (như `GZipMiddleware`): locations + festivals = 486 KB → **~125 KB** (kích thước trang 100/200/500 không đổi đáng kể: 124,5/122,8/122,8 KB), hơi vượt mục tiêu < 120 KB. Phần lớn là văn bản dài (`festivals.description` 113 KB, `locations.long_description` 96 KB thô). Lựa chọn: (a) chấp nhận ~125 KB và sửa nghiệm thu P2 (khuyến nghị — đã giảm 4 lần, giữ mô hình tải toàn bộ list); (b) bỏ `long_description` khỏi list và thêm endpoint detail — đổi contract, cần phase riêng.
- [x] **U10 Commit/push FE P2** (`da4dff1`) (nhánh `migration/p0-p1`, working tree chưa commit theo yêu cầu). Sau khi CI xanh có thể hạ ngưỡng tsc trong `.github/workflows/ci.yml` từ 63 xuống 62 để khóa tiến bộ.
- [x] **U11 Commit/push FE P3** (`040662b`) (nhánh `migration/p0-p1`, working tree chưa commit). Không có thay đổi BE; không cần deploy.
- [ ] **U12 Thử trên máy thật (gộp vào P5.2 — nay là P13.2):** Home → "Dùng vị trí của tôi" → Từ chối (vẫn thấy "Địa điểm phổ biến" + thông báo) → bấm lại → Cho phép (list gần nhất có khoảng cách); kéo xuống để làm mới ở Home/Lễ hội; Detail lễ hội → "Xem địa điểm ›".
- [ ] **U13 Commit/push FE P4** (nhánh `migration/p0-p1`, working tree chưa commit). Không đổi BE.
- [ ] **U14 Build lại Android để thử Map (gộp P5.1/P5.2 — nay là P13.1/P13.2).** _(Đã kiểm chứng trên emulator Pixel_8_API_34 ngày 30/10 với APK debug sẵn có + Metro; còn cần máy thật.)_ Lý do: Map dùng native module (`@rnmapbox/maps`, TTS, sound player) vừa được nạp lại vào navigation. `.env` đã có `MAPBOX_ACCESS_TOKEN` dạng `pk.`; `android/gradle.properties` có `MAPBOX_DOWNLOADS_TOKEN` rỗng — nếu Gradle báo lỗi tải SDK Mapbox thì cần tạo download token (`sk.`, scope `DOWNLOADS:READ`) đặt trong `~/.gradle/gradle.properties` (không commit). Kịch bản: tab Bản đồ → từ chối quyền (bản đồ hiện ở Đà Nẵng, không có "Bạn ở đây", bấm "Chỉ đường" báo cần vị trí) → cho phép → "Chỉ đường" vẽ tuyến; marker chỉ gồm địa điểm `publishable` có GPS (live: 29); popup "Lễ hội tại đây".
- [x] **U15 Quyết định:** có khôi phục các đoạn đã comment ở Home bị thay ở P3 không (khối "Nearby UI" P1 đã được mở lại thành mục "Gần bạn"; `requestLocationPermission`/`getCurrentLocation` của Home được viết lại thành bản xin quyền khi bấm). Xem nhật ký P4 trong audit. → **User 30/10 (Q15): giữ bản P3** (chỉ xin vị trí khi bấm "Gần bạn" hoặc mở Bản đồ); khối comment cũ vào Clean CF11.
- [ ] **U16 Emulator Pixel_8_API_34 kẹt "offline"** khi boot từ snapshot quickboot hỏng + GPU `lavapipe` (driver NVIDIA 551.76 < 553.35 nên emulator tắt Vulkan phần cứng). Cách chạy ổn định (boot ~35 s):
  ```bash
  emulator -avd Pixel_8_API_34 -no-snapshot-load -gpu swiftshader_indirect
  ```
  Sau đó mới chạy `npx react-native run-android`. Tùy chọn: cập nhật driver NVIDIA ≥ 553.35, hoặc trong Android Studio → Device Manager → Pixel 8 → Cold Boot Now / Wipe Data. Đặt GPS giả: `adb emu geo fix 108.2270 16.0611` (Cầu Rồng).
- [x] **U17 Quyết định: cảnh báo giọng nói khi tới gần địa điểm** → User 30/10: giữ nguyên comment, tính sau (Backlog). (khối `BackgroundGeolocation` đang comment trong `MapScreenV2.tsx` từ commit `5092f15`). Khôi phục cần package `react-native-background-geolocation` (không còn trong `package.json`, bản Android release cần license trả phí), quyền vị trí nền (trái P4.3/P6.3) và dữ liệu `voiceName`/`haveVoice` (API không có). Đề xuất: giữ comment; nếu cần thì làm bản foreground (dùng `watchPosition` sẵn có + TTS sẵn có đọc mô tả) ở phase riêng.

### Cần User — từ đợt lập lại kế hoạch 30/10 (quyết định Q1–Q17 và kết quả chốt ở audit mục 11, 11.1)
- [x] **U18 Export dữ liệu NocoDB** → User 30/10: đã export tại `C:\Users\lekha\Downloads\DATA NOCODB` — `accounts.json` (4), `objects.json` (11, đã gồm `data.py`), `transactions.csv` (7), kèm `locations.json` (187), `festivals.json` (48; review cũ: Q16) và 3 CSV. Không có user memory/conversation (bắt đầu rỗng). Agent chỉ đọc cấu trúc/số lượng, không copy vào repo.
- [ ] **U19 DigitalOcean / NocoDB:** kiểm tra app DO (`digital-ocean-fast-api-h9zys`) và NocoDB còn chạy/tính phí không; tắt sau P14.6 (Q14). Sau P14.6: thu hồi token NocoDB, xóa app DO.
- [~] **U20 Xóa key không còn dùng khỏi `.env` local** (agent đã thử xóa 30/10 nhưng bị chế độ quyền tự động chặn — User tự xóa hoặc cấp quyền cho agent). Xóa được ngay, không đổi hành vi app: `.env` FE — `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`, `AZURE_TRANSLATOR_ENDPOINT`, `UNSPLASH_ACCESS_KEY`, `SERVER_URL`, `PAYOS_BACKEND_URL`; `.env` BE — `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `PUBLIC_BASE_URL`, `ENVIRONMENT`, `PROJECT_NAME`; file `Travel_BE/privateKey.json` (key Firebase đã vô hiệu). Xóa sau P5 (khi key đã ở `travel-app-config`): `.env` FE — `OPENAI_API_KEY`, `SERPAPI_KEY`, `SENDGRID_API_KEY`, `PASSWORD_SALT`. Xóa sau khi import P5/P8 đối chiếu xong: `NOCODB_TOKEN`, `DB_URL` (FE) và 11 biến `NOCODB_*` (BE). `.env` FE cuối cùng chỉ còn `CATALOG_API_URL`, `API_BASE_URL`, `MAPBOX_ACCESS_TOKEN`; `.env` BE còn `DATABASE_URL`, `DATABASE_URL_UNPOOLED` và key chạy local (P12.9 kiểm). Thu hồi trên trang nhà cung cấp: Unsplash, NocoDB (sau P14.6). Coi OpenAI/SerpAPI/SendGrid là đã lộ (từng nằm trong APK debug) → rotate ở P14.1. _(30/10: User đã xóa nhóm "xóa được ngay" — agent kiểm: không còn Azure/Unsplash/SERVER_URL/PAYOS_BACKEND_URL ở FE, FIREBASE_*/PUBLIC_BASE_URL/ENVIRONMENT/PROJECT_NAME ở BE, `privateKey.json` đã xóa. Còn nhóm xóa sau P5 (OpenAI/SerpAPI/SendGrid/salt ở `.env` FE) và NocoDB sau import.)_
- [ ] **U21 Tạo secret** (Q12 — agent soạn lệnh, User chạy): `travel-app-config` (JSON: `JWT_SECRET`, `LEGACY_PASSWORD_SALT`, `OPENAI_API_KEY`, `SERPAPI_KEY`, `IMGBB_API_KEY`), cấp quyền đọc cho `travel-runtime` SA; giữ `travel-database-url`. Mỗi lần đổi key: thêm version mới, hủy version cũ (≤ 6 version đang hoạt động). Không dán giá trị vào chat/repo.
- [ ] **U22 Chạy migration Neon bằng owner role** cho 007–012 + file quyền, đúng thứ tự, sau khi PR của phase đã có CI xanh; ghi lại thời điểm vào nhật ký.
- [ ] **U23 Deploy BE mỗi phase** theo `Travel_BE/deploy/README.md` (cấp quyền secret tạm → build → smoke → ghi revision tốt → replace → kiểm tra → rollback nếu lỗi). Bản có AI làm image lớn hơn: kiểm tra Artifact Registry ≤ 0,5 GB (xóa image cũ).
- [x] **U24 Trần chi phí ngoài GCP (G11):** User 30/10: OpenAI đã trả trước 5 USD (Q7). Còn theo dõi: SerpAPI (giữ gói free; P5.1 đọc số lượt còn lại), Neon, Mapbox.
- [ ] **U25 BE `main` có thay đổi đã stage nhưng chưa commit:** `deploy/README.md`, `deploy/service.yaml` (G14). Commit hoặc khôi phục trước khi tạo nhánh P5.
- [ ] **U26 `privateKey.json` ở thư mục BE (không track, key đã disable):** xác nhận đã vô hiệu trên Google Cloud rồi xóa file local (CB11).
- [ ] **U27 Email (Nợ N1, Q1):** khi hoàn thiện — chọn nhà cung cấp, sender đã xác minh, hộp thư test.
- [ ] **U28 PayOS (Nợ N2, Q9):** khi hoàn thiện — 3 key, webhook `https://travel-api-u2xcse44ca-as.a.run.app/webhook/payos` trên my.payos.vn, xác nhận biểu phí.
- [ ] **U29 Play Console (P14.5):** Data safety, privacy policy URL, trang/link xóa tài khoản, khai báo nội dung người dùng tạo.
- [ ] **U30 Lịch sử git có bundle/APK cũ (G15):** `android/app/src/main/assets/index.android.bundle` và `android/app/release/app-release.apk` được track từ các commit `5a66ee2`/`ee04db7`/`e77275b`. Agent đã quét bundle hiện tại (chỉ đếm, không in): không thấy mẫu key OpenAI/SendGrid/NocoDB/private key; có 1 Mapbox `pk.` (public) và URL DigitalOcean. APK chưa quét. Quyết định: chỉ xóa khỏi cây hiện tại ở P12 (CF22), hay viết lại lịch sử git (`git filter-repo` + force-push — thao tác của User). Khuyến nghị: xóa ở P12 + rotate key ở P14.1, không viết lại lịch sử.
- [ ] **U31 Cấp lại key imgbb (bắt buộc cho P7/P8).** Key hiện tại trả lỗi code 103 "You have been forbidden to use this website" (tài khoản/key bị chặn; key giả trả code 100, nên không phải lỗi gõ). Cách làm: đăng ký/đăng nhập tài khoản mới tại imgbb.com → api.imgbb.com → "Get API key" → dán vào `IMGBB_API_KEY` trong `Travel_BE/.env` (không gửi qua chat) → báo agent kiểm lại. Nếu tài khoản mới cũng bị chặn: dùng phương án dự phòng là bucket GCS trong `travel2026-511805` (có guard, ~7.000 VND/GB lưu+tải). Các key khác hỏng sau này cũng làm theo cách này (OpenAI: platform.openai.com/api-keys; SerpAPI: serpapi.com/manage-api-key). _(13:26 30/10: User đã thay key mới (dấu vân tay khác), kiểm lại vẫn lỗi 103 → imgbb nhiều khả năng chặn theo IP/khu vực của máy này, không phải theo tài khoản. Không chặn P5. Xử lý ở P7.0.)_
- [x] **U32 Chốt Q16/Q17** → User 30/10: xóa review cũ và tài khoản mật khẩu rỗng, không import; seeding mẫu là Nợ N4.

## Backlog
- [x] Nhãn tiếng Việt cho `types` (search "bảo tàng" khớp `museum`) — qua dữ liệu/nhãn UI, không fix cứng theo record → **P11.5**
- [x] Nội dung catalog tiếng Anh (qua dữ liệu, không theo ID) → **P11.1**
- [x] Hotels trong search (`/hotels` vào repository, chỉ dùng cho search) → **P11.4**
- [x] Auth phía BE + migrate accounts/transactions/objects (D2) → **P5, P8, P10**
- [x] Review thật (ghi qua BE) → AI/semantic → PayOS → **P7, P9, P10**
- [ ] Cảnh báo giọng nói khi tới gần địa điểm (F07, U17) — giữ comment `BackgroundGeolocation`
- [ ] Refactor kiến trúc (class component → hook, gộp `ImageSvg` hai nơi, tách `MapScreenV2` 1.900 dòng…) và tối ưu hiệu năng — sau P14
- [ ] Endpoint detail / bỏ `long_description` khỏi list (U9 phương án b)
- [ ] pgvector thay FAISS (chỉ khi FAISS-trong-image không đủ)

## Nhật ký
| Ngày | Phase | Kết quả |
|---|---|---|
| 29/10/2026 | Dữ liệu | Merge + import Neon: 123 locations, 82 hotels, 49 festivals; migration 005–006; BE deploy model mới |
| 29/10/2026 | Kế hoạch | Chốt D1–D4; audit + tasklist cập nhật |
| 29/10/2026 | P0 | BE `7e0c1d6`: docs baseline 123/82/49 + 001–006; `tests/check_core_api.py` (fake DB, không cần Neon) + `check_contract.py`; CI Python 3.12. FE: `catalog.contract.test.js`, adapter từ chối 11 trường đã bỏ; CI Node 22 (jest nhóm recovery+catalog, tsc ≤ 63). FE `0cc3cf4` (công việc `location_id` đã stage sẵn) + `7ef3fce`. Jest 88 pass/1 skip; tsc 63; BE PASS. Chưa chạy CI thật (chưa push) |
| 29/10/2026 | P1 | Helper dịch trả giá trị API; xóa 4 file `{vi,en}/{locations,festivals}.json` + namespace; xóa `authConstants`/`locationConstants`/`reviewsConstants` và fallback (NewFeed chỉ còn review API, Map bỏ fallback đã comment); `src` không còn mảng dữ liệu cứng; empty state ảnh (`catalogImage` + `CachedImage`, bỏ via.placeholder.com), review, video, địa chỉ, lời khuyên; festival không `location_id` ẩn địa điểm. Jest gate 106 pass/1 skip; tsc 63. Commit `migration P1` trên nhánh `migration/p0-p1` |
| 29/10/2026 | P2 | FE (chưa commit): `catalogRepository` tải song song locations + festivals, TTL 10 phút, `refresh()`, chỉ mục `locationById`/`festivalById`/`festivalsByLocationId`/`mapMarkers`; lỗi giữ snapshot cũ; `locations.api`/`festivals.api` và Home/Detail/Festival/Map/AI widget đọc repository; Home không còn `getLocations(true)`; bỏ `Id` catalog (adapter, `ILocation`, `IFestival`, UI); client timeout 12 s, retry 1 lần, deadline 30 s. BE (chưa commit): gzip + Cache-Control + ETag/304 + test. Jest gate 106 pass; tsc 62; BE PASS; live 123/49. Chờ deploy (U8), quyết định payload (U9) |
| 29/10/2026 | P2.5 deploy | Sự cố: traffic bị chuyển về `travel-api-00001-xlz` (không tương thích schema 005–006) → catalog 503; khôi phục về `00003-smt`, rồi deploy `6ece2540…`. Kiểm tra live: 200 gzip, `cache-control: public, max-age=300`, ETag yếu, 304, 123/49/82. README sửa hướng dẫn rollback |
| 30/10/2026 | P3 | FE (chưa commit): "Gần bạn" xin quyền khi bấm, sắp xếp `haversineDistance`, hiện khoảng cách, từ chối/không GPS vẫn giữ list; search cục bộ dùng chung `catalogSearch` (bỏ dấu, mọi từ phải khớp; name/description/types + address/venue) cho thanh search và bộ lọc ViewAll; Detail lễ hội → mở địa điểm qua `locationById`; pull-to-refresh Home + Lễ hội gọi `catalogRepository.get(true)`, lỗi giữ list + Thử lại. Jest gate 114 pass; tsc 62; eslint không lỗi mới |
| 30/10/2026 | P4 | FE (chưa commit): mở lại Map/Advise (import, tab, stack) từ các khối comment P1; `ENABLE_MAP` = true; icon tab theo tên (Map không còn nhận icon Feed); marker từ `catalog.mapMarkers`; chỉ đường chỉ khi có GPS thật (`hasUserLocation`) + đích có tọa độ hợp lệ, không vẽ từ tọa độ mặc định; ẩn "Bạn ở đây" khi chưa có GPS; ảnh popup qua `CachedImage`; sửa 2 lượt gọi Directions/1 lần bấm; Detail ẩn nút bản đồ khi thiếu GPS. P4.4 bỏ qua theo chỉ đạo User. Jest gate 116 pass; tsc 62; lint không lỗi mới |
| 30/10/2026 | P4 (sửa sau thử máy) | Định vị sai: geolocation "auto" = LocationManager, high accuracy chỉ GPS → trong nhà timeout rơi về tọa độ mặc định Ngũ Hành Sơn → dùng `playServices` + thử lại độ chính xác thường. Camera bám GPS mỗi lần cập nhật + fix đầu là vị trí cache xa (California trên emulator) → không thấy marker → camera chọn 1 lần (vị trí người dùng nếu ≤ 100 km khu catalog, nếu không thì trung tâm marker; chuyển sang người dùng 1 lần khi có fix gần). Khôi phục quy tắc gốc: luôn hiện địa điểm đang focus/chọn. Bỏ prop deprecated `onRegionDidChange`. Kiểm chứng emulator: "Bạn đang ở đây" đúng Cầu Rồng, marker publishable hiện, chỉ đường 3,4 km/2 tuyến (1 request), popup + Advise. Jest gate 119 pass; tsc 62 |
| 30/10/2026 | Kế hoạch toàn app | Kiểm kê 38 tính năng FE+BE (7 chạy, 15 comment, 7 tắt bằng flag, 2 chỉ NocoDB/DO, 3 chết, 4 chưa có code) → audit mục 6–11. Thêm phase P5 (nền BE + auth), P6 (FE auth/Profile), P7 (upload + review + Feed), P8 (Items + Camera), P9 (AI), P10 (Payment), P11 (ngôn ngữ + Hotels), P12 (CLEAN); P5/P6 cũ → P13/P14. Thêm U18–U29; Backlog cũ chuyển vào P5–P11. Chỉ sửa 2 file tài liệu, không sửa code/commit/deploy |
| 30/10/2026 | Kế hoạch (lần 2) | User chốt Q1–Q15 (audit 11.1): sạch hoàn toàn NocoDB → Neon, DigitalOcean → Cloud Run; import `accounts.json` (hash SHA256+salt cũ, rehash scrypt khi đăng nhập), `transactions.csv`, `objects.json` (Items = Objects = `data.py`, bảng `objects` làm dữ liệu RAG); chỉ dùng imgbb (bỏ Firebase); rating tính từ bảng `reviews` (bỏ cột cũ ở P12); bỏ Azure; dịch nội dung một lần bằng script OpenAI ở P11; email quên mật khẩu + PayOS thành Nợ (N1, N2) nhưng vẫn gỡ NocoDB/DO khỏi code; Login lên đầu khi phát hành (P14.7); P5.1 kiểm tra key bằng endpoint miễn phí. Phát hiện thêm: bundle/APK cũ bị track (G15, U30), 1 tài khoản mật khẩu rỗng (Q17), 480 review cũ trong export (Q16). Gate: file tạm dọn trong phase |
| 30/10/2026 | Kế hoạch (lần 3) | Kiểm tra mọi key FE/BE (audit 10.1, chỉ endpoint miễn phí, không in giá trị): còn sống OpenAI, SerpAPI (Free 250/tháng), Mapbox, SendGrid, PayOS, NocoDB, Unsplash; hỏng imgbb (bị chặn → U31), Azure, Firebase, DigitalOcean (đã xóa). Thử xóa key chết/không dùng khỏi `.env` + `privateKey.json` bị chế độ quyền chặn → U20. Chốt: rating + reviews sang bảng `reviews`; bản dịch nội dung lưu Neon `*_en` (UI ở `common.json`); không import review cũ và tài khoản mật khẩu rỗng (import 3 tài khoản + 7 giao dịch); seeding mẫu = Nợ N4 |
| 30/10/2026 13:26 | Kế hoạch | Key imgbb mới vẫn lỗi 103 (nghi chặn theo IP máy dev) → thêm P7.0 (thử từ Cloud Run, dự phòng GCS). Lịch triển khai P5: 14:02 ngày 30/10 (User) |
| 30/10/2026 | P5 (code) | FE: `babel.config.js` allowlist 3 biến public; `env.ts`/`env.d.ts`/`env.mock.ts` (key bí mật = `''`, thêm `API_BASE_URL`); `__tests__/env.test.js`; CI jest thêm env test, ngưỡng tsc 63→62. Bundle release thử: không chứa key OpenAI/SerpAPI/SendGrid/NocoDB/PayOS/imgbb. BE (working tree `main`, chưa commit): `core_api/config.py` (`APP_FEATURES`, `APP_CONFIG_JSON`), `database.py` (`read_only=False`), `security.py`, `auth.py`, `email.py` (tắt), `app.py`; `db/schema/007_auth.sql`, `db/permissions/002_auth.sql`; `scripts/import_seed_accounts.py` (một lần); `tests/check_auth.py`, `check_contract.py` (+auth), `check_core_api.py`; CI BE thêm check_auth; `deploy/service.yaml` thêm `APP_FEATURES=auth` + secret (U25: User chọn sửa luôn, không commit). Gate: FE jest 11 suite 122 pass/1 skip, tsc 62, eslint sạch; BE core/contract/auth PASS. Dry-run import: 3 accounts (bỏ 1 rỗng), 7 transactions (map 7/7), tổng giao dịch 172.000 ≠ tổng balance 167.000 (giữ nguyên dữ liệu). Chờ U21–U23 |
| 30/10/2026 | P5 (hướng dẫn) | Máy User không có `psql` và `002_auth.sql` dùng `\gexec` → đổi sang khối `DO`; script import thêm `--migrate` và tự đọc `DATABASE_URL_UNPOOLED` (owner `neondb_owner`, direct) từ `.env` BE. Viết lại hướng dẫn U21–U23 ngay dưới P5 (giải thích version secret / revision / digest; digest tự lấy và tự ghi vào `service.yaml`). U20 nhóm xóa ngay: xong |
| 30/10/2026 | P5 (U22 lần 1) | User chạy U22: dry-run đúng (3/1/7/7); `--migrate` lỗi `can't change 'autocommit' now` (script chạy `SELECT current_user` trong transaction rồi mới bật autocommit) → **không ghi gì**; `--apply` tự từ chối vì chưa migrate. Sửa: mở kết nối `autocommit=True` ngay từ đầu (`--apply` vẫn dùng `conn.transaction()` riêng). Self-test + dry-run PASS. Chờ User chạy lại bước 2–3 |
| 30/10/2026 | P5 (U22 lần 2) | `--apply` đã ghi + đối chiếu xong trong transaction (dữ liệu đã commit), nhưng lỗi khi **in** kết quả: `sum()` trả `Decimal` → `json.dumps` lỗi. Sửa: đổi kết quả sang `int` trước khi so/in. Agent thử kiểm Neon bằng truy vấn chỉ đọc → bị chế độ quyền chặn; User chạy lại `--migrate` + `--apply` (idempotent) để xem kết quả đối chiếu |
