# Migration Tasklist — Location + Festival

Theo [MIGRATION_AUDIT.md](MIGRATION_AUDIT.md). Mỗi phase làm khi User duyệt; cập nhật dấu tick và nhật ký cuối file.

Gate chung cho mọi phase có sửa code:
- CI xanh (sau P0); trước P0 chạy tay:
  `node node_modules/jest/bin/jest.js __tests__/services/catalog.api.test.js __tests__/guestMode.test.js __tests__/guestNavigation.test.js __tests__/guestTranslation.test.js --runInBand`
- `tsc --noEmit` ≤ 63 lỗi.
- Không dữ liệu fix cứng mới; không request tới NocoDB/DigitalOcean/AI/Azure/PayOS; không secret trong diff.

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
- [ ] P3.1 "Gần bạn": xin quyền vị trí khi cần, khoảng cách bằng `haversineDistance`; từ chối quyền vẫn hiện list
- [ ] P3.2 Search cục bộ (bỏ dấu) trên tên/mô tả/loại của location + festival
- [ ] P3.3 Liên kết hai chiều: Detail location → festival tại đây; Detail festival → mở location
- [ ] P3.4 Pull-to-refresh gọi `catalogRepository.refresh()`; lỗi có nút Thử lại

## P4 — Map
- [ ] P4.1 `.env`: Mapbox public token `pk.` (D3); bật `ENABLE_MAP`
- [ ] P4.2 Marker từ `catalogRepository.mapMarkers` (29 = `publishable` + GPS hợp lệ); popup: tên, ảnh, festival tại địa điểm
- [ ] P4.3 Chỉ đường (Mapbox Directions) chỉ khi có vị trí người dùng + marker hợp lệ; không background location
- [ ] P4.4 Gỡ code GPS/NocoDB cũ đã comment trong `MapScreenV2.tsx`

## P5 — Nghiệm thu Android
- [ ] P5.1 Build debug từ `.env` tối giản (`CATALOG_API_URL`, Mapbox `pk.`)
- [ ] P5.2 Cold start → Home → list → detail → festival → map → back; restart app
- [ ] P5.3 Mất mạng → thông báo ≤ 30 s; có mạng lại thì Thử lại thành công
- [ ] P5.4 Network chỉ tới Cloud Run, host ảnh, Mapbox
- [ ] P5.5 Ghi thiết bị/OS/thời điểm vào nhật ký

## P6 — Phát hành
- [ ] P6.1 Rotate key cũ trong lịch sử repo (OpenAI, SendGrid, Azure, SerpAPI, Unsplash, NocoDB, Mapbox secret); babel dotenv dùng `allowlist` (chỉ biến public)
- [ ] P6.2 Signing ra khỏi `build.gradle`; xác nhận Play App Signing
- [ ] P6.3 Bỏ `ACCESS_BACKGROUND_LOCATION`, tắt cleartext, tăng `versionCode`
- [ ] P6.4 Giữ billing guard 26.000 VND (D4); bật cảnh báo chi phí để biết trước khi chạm ngưỡng
- [ ] P6.5 Build release, phát hành; sau đó mới tắt NocoDB/DigitalOcean

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
- [ ] **U5 Mật khẩu dạng chữ trong `authConstants.tsx` vẫn còn trong lịch sử git** dù file đã xóa ở P1. Đổi/vô hiệu các tài khoản đó; gộp vào P6.1 (rotate).
- [ ] **U6 Suite test hỏng từ trước, không thuộc gate:** `App.test.tsx`, `AzureTranslatorService`, `semantic.api`, và 3 suite cần `@testing-library/react-native` (chưa cài: `languageSwitching`, `RecommendationsWidget`, `SimilarItemsComponent`). Quyết định: cài devDependency (`npm i -D @testing-library/react-native`) và sửa, hay xóa các suite thuộc tính năng đã hoãn.
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
- [ ] **U10 Commit/push FE P2** (nhánh `migration/p0-p1`, working tree chưa commit theo yêu cầu). Sau khi CI xanh có thể hạ ngưỡng tsc trong `.github/workflows/ci.yml` từ 63 xuống 62 để khóa tiến bộ.

## Backlog
- [ ] Nội dung catalog tiếng Anh (qua dữ liệu, không theo ID)
- [ ] Hotels trong search (`/hotels` vào repository, chỉ dùng cho search)
- [ ] Auth phía BE + migrate accounts/transactions/objects (D2)
- [ ] Review thật (ghi qua BE) → AI/semantic → PayOS

## Nhật ký
| Ngày | Phase | Kết quả |
|---|---|---|
| 29/10/2026 | Dữ liệu | Merge + import Neon: 123 locations, 82 hotels, 49 festivals; migration 005–006; BE deploy model mới |
| 29/10/2026 | Kế hoạch | Chốt D1–D4; audit + tasklist cập nhật |
| 29/10/2026 | P0 | BE `7e0c1d6`: docs baseline 123/82/49 + 001–006; `tests/check_core_api.py` (fake DB, không cần Neon) + `check_contract.py`; CI Python 3.12. FE: `catalog.contract.test.js`, adapter từ chối 11 trường đã bỏ; CI Node 22 (jest nhóm recovery+catalog, tsc ≤ 63). FE `0cc3cf4` (công việc `location_id` đã stage sẵn) + `7ef3fce`. Jest 88 pass/1 skip; tsc 63; BE PASS. Chưa chạy CI thật (chưa push) |
| 29/10/2026 | P1 | Helper dịch trả giá trị API; xóa 4 file `{vi,en}/{locations,festivals}.json` + namespace; xóa `authConstants`/`locationConstants`/`reviewsConstants` và fallback (NewFeed chỉ còn review API, Map bỏ fallback đã comment); `src` không còn mảng dữ liệu cứng; empty state ảnh (`catalogImage` + `CachedImage`, bỏ via.placeholder.com), review, video, địa chỉ, lời khuyên; festival không `location_id` ẩn địa điểm. Jest gate 106 pass/1 skip; tsc 63. Commit `migration P1` trên nhánh `migration/p0-p1` |
| 29/10/2026 | P2 | FE (chưa commit): `catalogRepository` tải song song locations + festivals, TTL 10 phút, `refresh()`, chỉ mục `locationById`/`festivalById`/`festivalsByLocationId`/`mapMarkers`; lỗi giữ snapshot cũ; `locations.api`/`festivals.api` và Home/Detail/Festival/Map/AI widget đọc repository; Home không còn `getLocations(true)`; bỏ `Id` catalog (adapter, `ILocation`, `IFestival`, UI); client timeout 12 s, retry 1 lần, deadline 30 s. BE (chưa commit): gzip + Cache-Control + ETag/304 + test. Jest gate 106 pass; tsc 62; BE PASS; live 123/49. Chờ deploy (U8), quyết định payload (U9) |
| 29/10/2026 | P2.5 deploy | Sự cố: traffic bị chuyển về `travel-api-00001-xlz` (không tương thích schema 005–006) → catalog 503; khôi phục về `00003-smt`, rồi deploy `6ece2540…`. Kiểm tra live: 200 gzip, `cache-control: public, max-age=300`, ETag yếu, 304, 123/49/82. README sửa hướng dẫn rollback |
