# Migration Audit — Travel App (cập nhật sau đợt merge dữ liệu)

Ngày: **29/10/2026**. Mục tiêu: app Android chạy ổn định với **Location + Festival** trên Cloud Run/Neon, **chỉ dùng dữ liệu từ cloud**, kiến trúc gọn. Giao diện tiếng Việt trước; tiếng Anh cho nội dung catalog và Hotel (search) để sau.
Tasklist chi tiết: [MIGRATION_TASKLIST.md](MIGRATION_TASKLIST.md).

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

Nguyên tắc: không dữ liệu fix cứng; nội dung chỉ từ API; một khóa `id`; giữ `catalog.client`/adapter, repository là lớp mỏng; mỗi phase có test, `tsc` ≤ 63, CI xanh.

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

---

## 6. Nhật ký thực thi

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
