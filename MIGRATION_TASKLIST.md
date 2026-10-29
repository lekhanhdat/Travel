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
- [ ] P1.1 `translationHelpers.ts`: `translateLocationField`/`translateFestivalField` trả thẳng giá trị API (giữ chữ ký, sau đó gỡ dần call site); test "id trùng key cũ vẫn hiện đúng tên API"
- [ ] P1.2 Xóa `i18n/locales/{vi,en}/locations.json`, `festivals.json`; bỏ namespace khỏi `i18n/index.ts`, `types.d.ts`
- [ ] P1.3 Xóa `src/common/authConstants.tsx`, `locationConstants.tsx`, `reviewsConstants.tsx` và mọi import (`DetailLocation`, `NewFeedScreen`) + fallback đã comment trong `MapScreenV2.tsx`, `HomeScreen.tsx`
- [ ] P1.4 Rà lại toàn bộ `src` không còn mảng dữ liệu cứng (location/festival/review/account/item)
- [ ] P1.5 Empty state: không rating/review/video/ảnh (fallback ảnh); festival không có địa điểm thì ẩn dòng địa điểm

**Nghiệm thu P1:** tiếng Việt: card/detail/search khớp API cho mọi id; không crash với null/mảng rỗng.

## P2 — Data layer
- [ ] P2.1 `src/services/catalogRepository.ts`: tải locations + festivals song song, TTL 10 phút, `refresh()`; chỉ mục `locationById`, `festivalById`, `festivalsByLocationId`, `mapMarkers` (`isMapLocationVisible`); `festival.location` lấy từ chỉ mục
- [ ] P2.2 Chuyển màn hình sang repository: `HomeScreen`, `ViewAllLocation`, `DetailLocation`, `FestivalsScreen`, `ViewAllFestivals`, `DetailFestival`, `MapScreenV2`, `SimilarItemsComponent`; bỏ `getLocations(true)` ở Home
- [ ] P2.3 Thống nhất `id`: bỏ `Id` khỏi adapter, `IFestival`, `ILocation`, ~107 chỗ dùng trong UI/navigation params
- [ ] P2.4 `catalog.client.ts`: timeout 12 s, retry 1 lần (timeout/5xx/429), deadline tổng 30 s; test
- [ ] P2.5 BE: `GZipMiddleware` + `Cache-Control: public, max-age=300` + `ETag` cho 3 endpoint catalog; test; deploy (build → replace → kiểm tra)
- [ ] P2.6 Test repository: 1 lần fetch cho nhiều màn hình, chỉ mục đúng, lỗi mạng giữ cache cũ

**Nghiệm thu P2:** Home → Festival → Detail → Map chỉ 1 lượt `/locations` + `/festivals`; không còn `Id`; payload nén < 120 KB.

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
| 29/10/2026 | P0 | BE `7e0c1d6`: docs baseline 123/82/49 + 001–006; `tests/check_core_api.py` (fake DB, không cần Neon) + `check_contract.py`; CI Python 3.12. FE: `catalog.contract.test.js`, adapter từ chối 11 trường đã bỏ; CI Node 22 (jest nhóm recovery+catalog, tsc ≤ 63). Jest 88 pass/1 skip; tsc 63; BE PASS. Chưa chạy CI thật (chưa push) |
