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
- [x] P3.1 "Gần bạn": xin quyền vị trí khi cần, khoảng cách bằng `haversineDistance`; từ chối quyền vẫn hiện list
- [x] P3.2 Search cục bộ (bỏ dấu) trên tên/mô tả/loại của location + festival
- [x] P3.3 Liên kết hai chiều: Detail location → festival tại đây; Detail festival → mở location
- [x] P3.4 Pull-to-refresh gọi `catalogRepository.refresh()`; lỗi có nút Thử lại

## P4 — Map
- [x] P4.1 `.env`: Mapbox public token `pk.` (D3); bật `ENABLE_MAP`
- [x] P4.2 Marker từ `catalogRepository.mapMarkers` (29 = `publishable` + GPS hợp lệ); popup: tên, ảnh, festival tại địa điểm
- [x] P4.3 Chỉ đường (Mapbox Directions) chỉ khi có vị trí người dùng + marker hợp lệ; không background location
- [ ] P4.4 Gỡ code GPS/NocoDB cũ đã comment trong `MapScreenV2.tsx` — **bỏ qua theo chỉ đạo User 30/10: giữ nguyên mọi code đã comment, tái sử dụng thay vì viết lại**

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
- [x] **U10 Commit/push FE P2** (`da4dff1`) (nhánh `migration/p0-p1`, working tree chưa commit theo yêu cầu). Sau khi CI xanh có thể hạ ngưỡng tsc trong `.github/workflows/ci.yml` từ 63 xuống 62 để khóa tiến bộ.
- [x] **U11 Commit/push FE P3** (`040662b`) (nhánh `migration/p0-p1`, working tree chưa commit). Không có thay đổi BE; không cần deploy.
- [ ] **U12 Thử trên máy thật (gộp vào P5.2):** Home → "Dùng vị trí của tôi" → Từ chối (vẫn thấy "Địa điểm phổ biến" + thông báo) → bấm lại → Cho phép (list gần nhất có khoảng cách); kéo xuống để làm mới ở Home/Lễ hội; Detail lễ hội → "Xem địa điểm ›".
- [ ] **U13 Commit/push FE P4** (nhánh `migration/p0-p1`, working tree chưa commit). Không đổi BE.
- [ ] **U14 Build lại Android để thử Map (gộp P5.1/P5.2).** _(Đã kiểm chứng trên emulator Pixel_8_API_34 ngày 30/10 với APK debug sẵn có + Metro; còn cần máy thật.)_ Lý do: Map dùng native module (`@rnmapbox/maps`, TTS, sound player) vừa được nạp lại vào navigation. `.env` đã có `MAPBOX_ACCESS_TOKEN` dạng `pk.`; `android/gradle.properties` có `MAPBOX_DOWNLOADS_TOKEN` rỗng — nếu Gradle báo lỗi tải SDK Mapbox thì cần tạo download token (`sk.`, scope `DOWNLOADS:READ`) đặt trong `~/.gradle/gradle.properties` (không commit). Kịch bản: tab Bản đồ → từ chối quyền (bản đồ hiện ở Đà Nẵng, không có "Bạn ở đây", bấm "Chỉ đường" báo cần vị trí) → cho phép → "Chỉ đường" vẽ tuyến; marker chỉ gồm địa điểm `publishable` có GPS (live: 29); popup "Lễ hội tại đây".
- [ ] **U15 Quyết định:** có khôi phục các đoạn đã comment ở Home bị thay ở P3 không (khối "Nearby UI" P1 đã được mở lại thành mục "Gần bạn"; `requestLocationPermission`/`getCurrentLocation` của Home được viết lại thành bản xin quyền khi bấm). Xem nhật ký P4 trong audit.
- [ ] **U16 Emulator Pixel_8_API_34 kẹt "offline"** khi boot từ snapshot quickboot hỏng + GPU `lavapipe` (driver NVIDIA 551.76 < 553.35 nên emulator tắt Vulkan phần cứng). Cách chạy ổn định (boot ~35 s):
  ```bash
  emulator -avd Pixel_8_API_34 -no-snapshot-load -gpu swiftshader_indirect
  ```
  Sau đó mới chạy `npx react-native run-android`. Tùy chọn: cập nhật driver NVIDIA ≥ 553.35, hoặc trong Android Studio → Device Manager → Pixel 8 → Cold Boot Now / Wipe Data. Đặt GPS giả: `adb emu geo fix 108.2270 16.0611` (Cầu Rồng).
- [ ] **U17 Quyết định: cảnh báo giọng nói khi tới gần địa điểm** (khối `BackgroundGeolocation` đang comment trong `MapScreenV2.tsx` từ commit `5092f15`). Khôi phục cần package `react-native-background-geolocation` (không còn trong `package.json`, bản Android release cần license trả phí), quyền vị trí nền (trái P4.3/P6.3) và dữ liệu `voiceName`/`haveVoice` (API không có). Đề xuất: giữ comment; nếu cần thì làm bản foreground (dùng `watchPosition` sẵn có + TTS sẵn có đọc mô tả) ở phase riêng.

## Backlog
- [ ] Nhãn tiếng Việt cho `types` (search "bảo tàng" khớp `museum`) — qua dữ liệu/nhãn UI, không fix cứng theo record
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
| 30/10/2026 | P3 | FE (chưa commit): "Gần bạn" xin quyền khi bấm, sắp xếp `haversineDistance`, hiện khoảng cách, từ chối/không GPS vẫn giữ list; search cục bộ dùng chung `catalogSearch` (bỏ dấu, mọi từ phải khớp; name/description/types + address/venue) cho thanh search và bộ lọc ViewAll; Detail lễ hội → mở địa điểm qua `locationById`; pull-to-refresh Home + Lễ hội gọi `catalogRepository.get(true)`, lỗi giữ list + Thử lại. Jest gate 114 pass; tsc 62; eslint không lỗi mới |
| 30/10/2026 | P4 | FE (chưa commit): mở lại Map/Advise (import, tab, stack) từ các khối comment P1; `ENABLE_MAP` = true; icon tab theo tên (Map không còn nhận icon Feed); marker từ `catalog.mapMarkers`; chỉ đường chỉ khi có GPS thật (`hasUserLocation`) + đích có tọa độ hợp lệ, không vẽ từ tọa độ mặc định; ẩn "Bạn ở đây" khi chưa có GPS; ảnh popup qua `CachedImage`; sửa 2 lượt gọi Directions/1 lần bấm; Detail ẩn nút bản đồ khi thiếu GPS. P4.4 bỏ qua theo chỉ đạo User. Jest gate 116 pass; tsc 62; lint không lỗi mới |
| 30/10/2026 | P4 (sửa sau thử máy) | Định vị sai: geolocation "auto" = LocationManager, high accuracy chỉ GPS → trong nhà timeout rơi về tọa độ mặc định Ngũ Hành Sơn → dùng `playServices` + thử lại độ chính xác thường. Camera bám GPS mỗi lần cập nhật + fix đầu là vị trí cache xa (California trên emulator) → không thấy marker → camera chọn 1 lần (vị trí người dùng nếu ≤ 100 km khu catalog, nếu không thì trung tâm marker; chuyển sang người dùng 1 lần khi có fix gần). Khôi phục quy tắc gốc: luôn hiện địa điểm đang focus/chọn. Bỏ prop deprecated `onRegionDidChange`. Kiểm chứng emulator: "Bạn đang ở đây" đúng Cầu Rồng, marker publishable hiện, chỉ đường 3,4 km/2 tuyến (1 request), popup + Advise. Jest gate 119 pass; tsc 62 |
