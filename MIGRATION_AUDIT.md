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
- **Commit:** BE `7e0c1d6` (nhánh `migration/p0-p1`); FE `0cc3cf4` (công việc `location_id` đã stage sẵn trước P0) + commit P0.
- **Cần User:** push 2 nhánh để CI chạy lần đầu (xem mục "Cần User" trong tasklist).
