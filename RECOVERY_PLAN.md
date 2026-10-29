# Kế hoạch khôi phục Travel

> **Đã được thay thế (29/10/2026)** bằng [MIGRATION_TASKLIST.md](MIGRATION_TASKLIST.md) và [MIGRATION_AUDIT.md](MIGRATION_AUDIT.md). File này chỉ còn giá trị lịch sử; số liệu 124/43 bên dưới đã lỗi thời (baseline hiện hành 123 locations / 49 festivals / 82 hotels, schema 001–006).

Ngày khảo sát: **19/10/2026 — Asia/Saigon**. Cập nhật cùng ngày: **P2 Completed, 6/6 task; service FE đã đọc đủ catalog Cloud Run, 38 tests pass**. Lịch sử khảo sát P0 và kết quả P1 được giữ lại; P3 chưa triển khai. Kết quả P2 ở mục 9.

## 1. Phạm vi và nguyên tắc

- FE: workspace `D:\Project\Travel\Travel_FE\Travel`; BE: `D:\Project\Travel\Travel_BE`.
- Backend đích: <https://travel-api-u2xcse44ca-as.a.run.app>.
- Mốc ưu tiên: app Android mở được ở chế độ khách, xem danh sách/chi tiết địa điểm và lễ hội từ backend thật, tìm kiếm từ khóa, xử lý thiếu dữ liệu và mất mạng rõ ràng.
- Android trước là giả định phù hợp với môi trường Windows; iOS cần macOS/Xcode và không chặn mốc Android.
- Trong P0 chỉ hai tài liệu recovery được tạo; không sửa source/config, cài package, chạy build, thay đổi dữ liệu, deploy hoặc gọi API ghi. P1 đã được người dùng cho phép riêng và có kết quả thực tế ở mục 8.
- Không khôi phục NocoDB như nguồn chính, không tạo endpoint giả, không nâng cấp framework/refactor rộng. Backend core đang chạy nên mặc định giữ nguyên.
- **Mỗi yêu cầu tiếp theo chỉ thực hiện một phase được chỉ định**, cập nhật tasklist, báo cáo bằng chứng và dừng. Không tự chuyển phase.
- Khi tạm bỏ qua chức năng: giữ code gốc dưới dạng comment để có thể khôi phục; không xóa implementation. Cờ vẫn bảo vệ các đường gọi còn hoạt động.
- Trước khi báo cáo: xóa file tạm do Agent tạo (log, observer, bundle audit, UI dump, ảnh kiểm thử); chỉ giữ source/tests, tài liệu tổng hợp và artifact kết quả được yêu cầu.

## 2. Hiện trạng đã kiểm tra

### FE

React Native CLI `0.74.2`, React `18.2.0`, TypeScript `4.8.4`; React Navigation stack + bottom tabs; Axios; AsyncStorage; React Native Paper. Entry: `index.js` → `App.tsx` → `src/container/AppContainer.tsx`. Route đầu là HomeStack/Home, **không bắt buộc đăng nhập để xem catalog**.

Các luồng chính:

| Luồng | Source/cấu hình thực tế |
|---|---|
| Catalog/review/items | `src/services/axios.ts` dùng `DB_URL` + header `xc-token`; `locations.api.ts`, `festivals.api.ts` gọi đường NocoDB có table ID |
| Auth/profile | `auth.api.ts` đọc/ghi Accounts NocoDB, so sánh SHA256 ở client; phiên lưu local; không có backend auth tương ứng trong profile core |
| Camera | `CameraScreen.tsx`, `PreviewImage.tsx` gửi `/detect` qua `SERVER_URL` |
| Semantic/RAG/recommendations/memory | `semantic.api.ts` dùng `SERVER_URL` và `/api/v1/...` |
| Chatbot riêng | `chatbot.api.ts` gọi OpenAI và SerpAPI trực tiếp, không đi qua Cloud Run |
| Donation | `payment.api.ts` dùng `PAYOS_BACKEND_URL`, `/payments/create`, `/payments/status/{id}` |
| Map | `MapScreenV2.tsx`, `mapbox.api.ts`; Mapbox runtime token, SDK native và GPS; `setAccessToken` chạy ở cấp module |
| Dịch | i18next JSON local; thêm TranslationContext/queue Azure. `featureFlags.ts` có khai báo nhưng tìm tham chiếu trong `src` chỉ thấy chính file này |

`.env` FE hiện đặt `SERVER_URL` và `PAYOS_BACKEND_URL` tới host DigitalOcean cũ; `DB_URL=https://app.nocodb.com`. Các biến token/key có giá trị local nhưng **chưa kiểm tra tính hợp lệ hoặc hạn dùng**; tài liệu không chép giá trị bí mật.

Môi trường khảo sát: Node `20.19.4`, Java `17.0.12`, Python sẵn có; không có `node_modules`; `adb` không tìm thấy trong PATH. Có `android/local.properties` và keystore local; chưa xác minh SDK, thiết bị, keystore hoặc quyền tải Mapbox. Có cả npm và Yarn lockfile; npm lock đang ghi RN `0.74.2`, Gradle plugin `0.75.4` (package khai báo `^0.75.3`), wrapper Gradle `8.8`. Đây là **rủi ro tương thích cần build xác minh**, chưa phải lỗi build đã tái hiện.

### BE local

- `app.py` tạo FastAPI `2.0.0`, include duy nhất `core_api.catalog.router`; `main.py` chạy uvicorn cổng 8080.
- `core_api/config.py` chỉ chấp nhận profile `core`, lấy `DATABASE_URL`; `database.py` dùng psycopg pool, transaction read-only.
- `catalog.py` đọc `locations`, `festivals`, `hotels`; trả `{items, limit, offset, has_more}`, `limit` 1–100, `offset >= 0`, đọc thêm một row để tính `has_more`.
- `models.py` định nghĩa trường public, `id`, `record_id`, JSON arrays, rating/GPS nullable; không có detail/write/auth endpoint.
- `Dockerfile` chỉ copy `app.py`, `core_api/`, chạy uvicorn; không copy các module AI/payment legacy. Requirements của các tích hợp đó đang comment. Bỏ comment router đơn thuần chưa đủ khôi phục chúng.
- Các hàm detect/payment và import/router semantic/indexer trong `app.py` đã comment đăng ký; source legacy vẫn còn trong `routers/`, `services/`, `service.py`, `payment_service.py`, `nocodb_service.py`, `firestore.py`.
- `db/README.md` xác nhận Neon là nguồn hiện hành, `record_id` là khóa nguồn ổn định, runtime chỉ đọc; accounts/transactions trống ở nghiệm thu trước. **Không truy vấn DB trực tiếp trong khảo sát này**, không coi số liệu accounts lịch sử là kiểm chứng live mới.
- `DEPLOYMENT_PROGRESS.md`, `DEPLOYMENT_TASKLIST.md` là lịch sử triển khai BE đã có; hai tài liệu recovery không reset hoặc thay thế tiến độ đó.

### Backend live — bằng chứng GET/HEAD chỉ đọc

Kiểm tra HTTPS trực tiếp bằng Python standard library sau khi công cụ web không truy cập được host. Không gửi credential. Thời điểm trong ngày khảo sát; kết quả có thể đổi khi service/data thay đổi.

| Request | Kết quả quan sát |
|---|---|
| `GET /` | 200; version `2.0.0`, features `[catalog]` |
| `GET /health` | 200; profile core; core operational; tích hợp phụ disabled |
| `GET /health/ready` | 200; readiness DB/schema thành công tại thời điểm gọi |
| `GET /openapi.json` | 200; chỉ 6 route nghiệp vụ/health: `/`, `/health`, `/health/ready`, `/locations`, `/festivals`, `/hotels`; tất cả chỉ GET |
| `GET /locations?limit=100&offset=...` | Đọc hết phân trang: **124** bản ghi; 28 publishable=true; **124 lat=null**; 73 bản ghi có images; 0 review, 0 video |
| `GET /festivals?limit=100&offset=...` | **43** bản ghi; 14 publishable=true; 8 bản ghi có images; 0 review, 0 video |
| `GET /hotels?limit=100&offset=...` | **82** bản ghi; 12 publishable=true; 81 lat=null; 69 bản ghi có images; 0 review, 0 video |
| `GET /locations?limit=0`, `?offset=-1` | 422 |
| `GET /locations?limit=1&offset=99999` | 200; items rỗng, has_more=false |
| `GET /locations/1` | 404; không có route detail |
| `GET /api/v2/tables/mfz84cb0t9a84jt/records` trên host Cloud Run | 404; không có proxy NocoDB |
| `GET /api/v1/search/suggestions?query=beach` | 404 |
| `GET /payments/status/1` | 404 |
| HEAD ảnh đầu tiên của địa điểm id=1 | 200, image/jpeg; chỉ xác minh **một** ảnh, không bảo đảm toàn bộ media |

Live root/health, route catalog và schema public khớp source BE local đã đọc. Không có SHA/revision trong response để chứng minh toàn bộ artifact deploy giống từng byte source local. Không thử POST/PATCH/DELETE, gửi email, tạo thanh toán, chạy AI, tải ảnh lên hoặc truy cập tài khoản NocoDB.

Nguồn kiểm chứng có thể đọc lại: [OpenAPI live](https://travel-api-u2xcse44ca-as.a.run.app/openapi.json), [health](https://travel-api-u2xcse44ca-as.a.run.app/health), [readiness](https://travel-api-u2xcse44ca-as.a.run.app/health/ready), [locations](https://travel-api-u2xcse44ca-as.a.run.app/locations?limit=100&offset=0), [festivals](https://travel-api-u2xcse44ca-as.a.run.app/festivals?limit=100&offset=0), [hotels](https://travel-api-u2xcse44ca-as.a.run.app/hotels?limit=100&offset=0).

## 3. Phân loại chức năng

Working = có bằng chứng thực thi trong khảo sát; Broken = có mâu thuẫn contract/logic cụ thể; Disabled = source không đăng ký hoặc vô hiệu hóa; Unknown = chưa chạy/xác minh. Trạng thái BE và FE được tách riêng, không suy diễn API chạy là app chạy.

| Chức năng | Trạng thái | Căn cứ và hướng xử lý |
|---|---|---|
| BE liveness/readiness/catalog | **Working** | GET 200, có dữ liệu và phân trang; giữ nguyên |
| FE hiển thị catalog qua BE đích | **Broken** | FE còn gọi NocoDB `list/pageInfo`; BE dùng route khác và `items/has_more` |
| Danh sách/chi tiết location, festival sau tích hợp | **Unknown** | Có UI nhưng chưa chạy app; phải xử lý ID, dữ liệu thiếu và bản dịch cũ |
| Nội dung dịch theo ID | **Broken** | Live location id=1 là An Phú Farm, `vi/locations.json loc_1` là Bà Nà; live festival id=1 là biểu diễn Chăm, `fest_1` là DIFF. Helper dùng ID số cũ để ghi đè fallback |
| NewFeed dữ liệu thật | **Broken** | `NewFeedScreen.tsx` trộn review hardcode, fallback local; API hiện 0 review. Luồng gửi review có thể tiếp tục thêm state sau khi ghi cloud thất bại |
| Khoảng cách/gần bạn | **Broken** với dataset hiện tại | Home đưa GPS nullable vào Haversine không kiểm tra; cả 124 location thiếu lat. Không được biến null thành 0 hoặc tự gán GPS |
| Mapbox hiển thị/chỉ đường | **Unknown** | Chưa thử SDK/token/quyền; không location nào đủ GPS để hiển thị marker. Native Mapbox vẫn có thể chặn build dù ẩn tab |
| Background geolocation cũ | **Disabled** | Khối BackgroundGeolocation trong MapScreen đã comment; GPS foreground vẫn còn |
| Đăng nhập/đăng ký/sửa profile | **Unknown** trên NocoDB; không được BE core hỗ trợ | Auth FE gọi trực tiếp Accounts. Không có token phiên backend hay route auth trong OpenAPI; dùng chế độ khách trước |
| Gửi OTP/quên mật khẩu | **Broken** trong source | `auth.api.ts` đặt `SENDGRID_API_KEY=''` dù env có biến; OTP ở memory client, có log OTP. Tạm khóa entry point |
| Review ghi/upload | **Disabled** phía BE core | Không route ghi/upload, runtime DB read-only; FE vẫn có POST/PATCH NocoDB; tạm khóa thao tác ghi |
| Items/hiện vật | **Unknown** trên NocoDB; thiếu API core | `URL_GET_ITEMS` ghi chú chưa setup; không đồng nhất hotel với IItem. Tạm ẩn entry point có gọi Items |
| Hotels | **Working** API, **Unknown/chưa có luồng FE chuyên biệt** | Không thấy service/screen hotels riêng trong FE; không thêm màn hình trong mốc core |
| Detect/semantic/RAG/recommendations/memory | **Disabled** phía BE | Decorator/include_router đã comment, không nằm trong OpenAPI; FE còn entry point/service |
| PayOS | **Disabled** phía BE | Route đã comment, status live 404; không chỉ đổi payment URL để bật lại |
| Chatbot OpenAI/SerpAPI trực tiếp | **Unknown** | Key có khai báo, chưa gọi dịch vụ; khác với RAG bị disabled. Tạm tắt |
| Azure dịch động | **Unknown** | Context gọi queue; cờ chưa được sử dụng; chưa kiểm tra key. Tạm bypass dịch mạng, giữ chuỗi UI local |
| Ảnh/video/TTS | **Unknown** toàn luồng | Một URL ảnh HEAD 200; dataset videos rỗng. Native TTS/video và toàn bộ URL chưa nghiệm thu |
| App Android/iOS, tests/lint/typecheck | **Unknown** | Chưa cài dependencies hoặc chạy build/test; iOS cần máy phù hợp |

## 4. Vấn đề và quyết định tối thiểu

1. **Sai host và API contract:** đổi `SERVER_URL` không tác động Axios catalog đang dùng `DB_URL`. Cần một client catalog trỏ Cloud Run, không đính `xc-token`; giữ client legacy riêng để không vô tình đổi hành vi auth/write. Không trỏ toàn bộ `request` NocoDB sang Cloud Run.
2. **Phân trang khác:** đọc `items`, tăng offset bằng limit tới `has_more=false`; không truy cập `pageInfo.isLastPage`. Location và festival đều phải lấy đủ trang, không âm thầm cắt 100.
3. **ID khác:** BE dùng `id`; nhiều chỗ FE dùng `Id`. Adapter có thể giữ `id` và alias `Id=id` để bảo toàn UI cũ, giữ `record_id`; không dùng ID legacy để suy đoán bản dịch hoặc quan hệ. Detail nhận record từ list/cache, chưa cần tạo `/locations/{id}`.
4. **Bản dịch sai danh tính:** ở profile recovery, nội dung catalog phải lấy trực tiếp API; giữ dịch UI qua common namespace. Không dùng `loc_N/fest_N` cũ để thay tên/mô tả; không sửa hàng loạt JSON hay gọi dịch trả phí. Nếu sau này dịch catalog, cần ánh xạ theo record_id đã xác minh.
5. **Null và dữ liệu rỗng:** GPS/rating có thể null, reviews/images/videos có thể rỗng. Cần fallback ảnh, trạng thái chưa có đánh giá/video; không coi dữ liệu thiếu là API lỗi hoặc tự tạo số liệu.
6. **Không lọc nhầm publishable:** đây chỉ là cờ marker. Danh sách/chi tiết giữ cả false; marker phải có publishable=true và GPS hợp lệ theo `catalogVisibility.ts`.
7. **Tích hợp phụ vẫn được import/gọi:** giới hạn ở UI chưa đủ nếu effect/import vẫn chạy. Phải gắn cờ thực vào các điểm gọi, dừng refresh account/AI/payment/upload không cần thiết; tránh khởi tạo module Mapbox khi màn hình tắt. Việc tải SDK native là vấn đề riêng cần build xác minh.
8. **Nội dung giả:** không merge review từ `reviewsConstants`/`locationConstants` trong recovery; lỗi API phải hiển thị lỗi + retry thay vì dữ liệu mẫu hoặc báo lưu thành công.
9. **Build chưa xác minh:** thiếu node_modules; npm/Yarn song song; version RN/plugin có khả năng lệch. Chọn một lockfile hiện có sau kiểm tra, chỉ sửa dependency/native khi có lỗi tái hiện. Không tự nâng RN lên phiên bản mới.
10. **Credential:** legacy client đang chứa đường gọi dịch vụ bằng key và có log một phần key/OTP. Recovery không cần các key này; khóa entry point và loại log nhạy cảm trên đường chạy được chạm tới. Không thử/chép secret; không mở rộng thành đợt refactor auth/security. Tính hợp lệ token vẫn Unknown.
11. **CORS:** đây là app native, chưa có bằng chứng CORS là nguyên nhân; không sửa BE thêm CORS theo suy đoán. Chỉ xem xét nếu sau này có web client thực sự.

## 5. Các phase thực hiện

Chuỗi bắt buộc: **P0 → P1 → P2 → P3 → P4**. Mốc khôi phục core hoàn thành ở P4. P5 là tùy chọn độc lập sau core, chỉ khi người dùng yêu cầu. Những thay đổi BE/DB/IAM/production chưa nằm trong các phase core.

### PHASE 0 — Khảo sát và lập kế hoạch

- Mục tiêu: có baseline source, contract live, phân loại tính năng và tracking.
- Task: đọc FE/BE; kiểm tra GET/HEAD; ghi rủi ro và các bước nghiệm thu; tạo hai tài liệu.
- File: `RECOVERY_PLAN.md`, `RECOVERY_TASKLIST.md`.
- Agent tự làm: toàn bộ khảo sát chỉ đọc và viết tài liệu. Người dùng: không có thao tác bắt buộc.
- Hoàn thành khi: có kết quả live, giới hạn xác minh, phase có file/task/tiêu chí và không đổi code/config. **Completed**.

### PHASE 1 — App Android mở được, cô lập tích hợp chưa hỗ trợ

- Mục tiêu: build debug và mở Home chế độ khách; không bị auth/AI/Mapbox/payment/email chặn startup.
- Task cụ thể:
  1. Ghi baseline Git, xác minh Node/JDK/SDK/emulator/adb và một package manager/lockfile. Khi phase được yêu cầu mới cài dependencies; không tự regenerate cả hai lockfile.
  2. Thêm cờ recovery có sử dụng thật: catalog-only, tắt semantic/recommendation/similar/RAG/chatbot/camera detect/payment/auth write/upload/items/map/dịch Azure. Đặt hành vi guest cho session legacy, không xóa dữ liệu AsyncStorage người dùng.
  3. Gắn cờ ở mount/effect/service call và navigation: Home/Festival/chi tiết còn truy cập, profile chỉ giữ nội dung local cần thiết. Các route bị hoãn không được mở từ bubble, nút chi tiết hoặc route stack còn sót.
  4. Search dùng nhánh keyword có sẵn; dịch UI common local; không chạy dịch động. Home tải catalog không cần chờ GPS; lỗi tải được hiển thị và retry. Chưa giả lập dữ liệu để lấp lỗi catalog.
  5. Build/run debug, xử lý **chỉ lỗi tái hiện** về Gradle/RN/import/native module. Nếu Mapbox tải SDK gây chặn, kiểm tra dependency resolution trước; cân nhắc loại autolink riêng Android khi map đã tắt, không gỡ hàng loạt package.
  6. Loại log key/OTP khỏi đường code được sửa; ghi rõ tích hợp nào bị tắt tạm.
- File dự kiến: `src/config/featureFlags.ts`, `App.tsx`, `src/container/AppContainer.tsx`, `src/component/FloatingChatBubble.tsx`, `src/component/SemanticSearchBarComponent.tsx`, Home/HomeScreen, Home/DetailLocation, Festival/DetailFestival, NewFeed/NewFeedScreen, Profile/ProfileScreen; `src/context/TranslationContext.tsx`. Native/package **chỉ nếu lỗi được chứng minh**: `package.json`, lockfile được chọn, `android/settings.gradle`, `android/app/build.gradle`, `react-native.config.js`. Không sửa BE.
- Agent tự làm: cấu hình cờ, gate, kiểm tra/cài dependency/build sau lệnh triển khai P1, sửa lỗi tối thiểu. Người dùng: cung cấp thiết bị/emulator nếu chưa có; nếu SDK/native download yêu cầu quyền/key thì cung cấp qua cấu hình local an toàn. Chưa cần key AI/payment/email.
- Tiêu chí: debug build thành công và có bằng chứng Home mở trên thiết bị/emulator; guest không bị yêu cầu login; không gọi API phụ hoặc NocoDB trên luồng mở app; thiếu catalog có thông báo thay vì crash. Catalog có dữ liệu thật **chưa là tiêu chí P1**.
- Nếu không có thiết bị/build tool: task liên quan Blocked, không được ghi phase Completed chỉ vì JS bundle thành công.

### PHASE 2 — Kết nối catalog Cloud Run

- Mục tiêu: location/festival lấy được dữ liệu thật qua contract đã xác minh, không đụng auth/write legacy.
- Task cụ thể:
  1. Đặt backend URL mới trong env/fallback phục vụ recovery; tạo client catalog riêng, không gửi `xc-token`, không dùng client này cho `/api/v2/...`.
  2. Định nghĩa DTO theo `core_api/models.py` và OpenAPI live; adapter giữ id/record_id, alias Id nếu cần; arrays giữ nguyên, GPS/rating giữ nullable. Không ánh xạ hotels thành items.
  3. Chuyển getLocations/getFestivals sang `/locations` và `/festivals`; đọc hết offset/has_more, bảo vệ vòng lặp bất thường; giữ public API service hiện có và cache ở mức cần thiết.
  4. Detail dùng record đã tải hoặc lookup list theo ID; getFestivalById/related festival dùng ID mới, chỉ dùng FK có thật; không gọi detail route chưa tồn tại.
  5. GET timeout phù hợp cold start, có thông báo retry; không kéo theo retry vô hạn hoặc warmup job. Giữ clear-cache/forceRefresh có ý nghĩa để nghiệm thu không bị cache cũ che lỗi.
  6. Test adapter/pagination có giá trị: hơn 100 rows, trang cuối rỗng, has_more false, null, arrays và request không có xc-token; xác minh live read-only riêng.
- File dự kiến: `.env` (local, không đưa key vào tài liệu/commit), `src/utils/env.ts`, `src/utils/configs.ts`, `src/services/catalog.client.ts` (mới), `src/services/catalog.adapter.ts` (mới nếu cần), `src/services/locations.api.ts`, `src/services/festivals.api.ts`, `src/common/types.tsx`, `src/types/env.d.ts`, `src/types/env.mock.ts`, `__tests__/services/catalog.api.test.ts` (mới). Tên module mới là đề xuất, có thể gộp nếu nhỏ hơn. Không đổi BE.
- Agent tự làm: toàn bộ tích hợp API công khai và test. Người dùng: chỉ cần can thiệp nếu host live không còn hoạt động/quyền mạng chặn.
- Tiêu chí: service trả đủ toàn bộ dataset tại thời điểm test (baseline 124/43); offset đúng, không còn list/pageInfo hoặc table URL trên luồng catalog; id/null/arrays được bảo toàn; test pass; lỗi GET được phân biệt dữ liệu rỗng. Hotels chỉ xác minh contract, chưa thêm UI.

### PHASE 3 — Hiển thị đúng dữ liệu, không trộn dữ liệu cũ

- Mục tiêu: UI danh sách/chi tiết/tìm kiếm phản ánh đúng API và không suy diễn GPS/review.
- Task cụ thể:
  1. Bypass bản dịch catalog theo ID legacy trong recovery ở helper và các call site; giữ dịch UI. Đối chiếu location id=1 và festival id=1 ở card, detail và search; kiểm tra khi chuyển vi/en vẫn không đổi danh tính.
  2. Xử lý null GPS ở type và mọi đường tính khoảng cách/sắp xếp/nút map; không tính gần bạn nếu không có GPS cặp hợp lệ. Đổi phần “gần bạn” thành trạng thái thiếu dữ liệu hoặc ẩn phần đó; Home vẫn tải danh sách ngay.
  3. Danh sách giữ publishable=false; detail giữ FK null, advise array, text rỗng. Hiển thị không có review/rating thay vì suy ra 0 điểm đánh giá; fallback ảnh có sẵn khi rỗng/lỗi; ẩn video/voice nếu không có nội dung phù hợp.
  4. Ngừng merge/fallback review hardcode trong NewFeed; dữ liệu rỗng phải hiện chưa có đánh giá. Review submit/upload/Items tiếp tục khóa theo P1, không báo thành công local như đã đồng bộ.
  5. Kiểm tra route/detail theo Id/id mới; keyword search tìm theo nội dung API, không gọi semantic. Không tạo dữ liệu mẫu mới hoặc sửa JSON dịch hàng loạt.
  6. Test tập trung: ID trùng bản dịch cũ không ghi đè tên API, null GPS không tính distance, array rỗng không crash, publishable=false vẫn có trong list.
- File dự kiến: `src/utils/translationHelpers.ts`, `src/common/types.tsx`, `src/container/screens/Home/{HomeScreen,ViewAllLocation,DetailLocation,LocationImage,LocationVideo}.tsx`, `src/container/screens/Festival/{FestivalsScreen,ViewAllFestivals,DetailFestival}.tsx`, `src/container/screens/NewFeed/NewFeedScreen.tsx`, `src/component/{BigItemLocation,LargeItemLocation,LargeItemFestival,SemanticSearchBarComponent,CachedImage}.tsx`; `src/utils/haversineDistance.ts` nếu đang được call site sử dụng; `src/i18n/locales/{vi,en}/common.json` chỉ cho thông báo mới cần thiết; tests service/helper liên quan. Chỉ sửa các file thực sự cần sau đối chiếu caller.
- Agent tự làm: adapter/UI/test theo dữ liệu sẵn có. Người dùng: không cần bổ sung GPS/review để hoàn thành core; nội dung thiếu được ghi nhận đúng.
- Tiêu chí: tên/mô tả đúng API, search và detail cùng record; location/festival đầy đủ bất kể publishable; không crash với null/rỗng, không review mẫu, không hiển thị khoảng cách giả; không request phụ ngoài phạm vi recovery.

### PHASE 4 — Nghiệm thu mốc “app chạy với dữ liệu thật”

- Mục tiêu: có bằng chứng end-to-end Android, khả năng lỗi/retry và bàn giao phần hoãn.
- Task cụ thể:
  1. Chạy tests liên quan catalog/translation/recovery, typecheck và lint. Ghi riêng lỗi tồn tại trước, không sửa toàn repo để làm sạch báo cáo; lỗi cản app recovery phải được xử lý trước nghiệm thu.
  2. Build debug, cold launch/khởi động lại app với cache rỗng theo cơ chế app (không xóa toàn bộ dữ liệu người dùng); kiểm tra Home → list → detail → back; Festival tương tự; keyword search; NewFeed rỗng.
  3. Đối chiếu tổng record service với live cùng thời điểm và vài record đầu/cuối; kiểm tra cả record publishable=false và nội dung tiếng Việt. Không cố định 124/43 nếu data live đã đổi.
  4. Tắt mạng/mở lại mạng: lỗi có thông báo, retry khôi phục; từ chối GPS không chặn catalog; ảnh lỗi/rỗng và video rỗng có fallback. Không gọi cloud write để test.
  5. Quan sát request/log từ phiên chạy: catalog chỉ gọi host Cloud Run, không NocoDB/AI/PayOS/Azure/email/upload; không log secret; không có entry point dẫn tới tính năng đã hoãn.
  6. Cập nhật hai tài liệu với kết quả, lệnh kiểm chứng, thiết bị/OS, lỗi còn lại và cách chạy tối thiểu; dừng chờ yêu cầu tiếp theo.
- File dự kiến: chủ yếu `RECOVERY_PLAN.md`, `RECOVERY_TASKLIST.md`; bổ sung test nhỏ trong `__tests__/services`/`__tests__/i18n` khi thiếu coverage hành vi. Source chỉ sửa lỗi trực tiếp phát hiện trong nghiệm thu, ghi rõ file; không deploy/release ký production.
- Agent tự làm: chạy kiểm tra và smoke test nếu thiết bị sẵn; cập nhật bằng chứng. Người dùng: cung cấp thiết bị hoặc chạy smoke test với checklist nếu Agent không truy cập được; iOS cần macOS/Xcode nếu được yêu cầu riêng.
- Tiêu chí: P1–P3 hoàn thành; build debug và smoke test core pass; dữ liệu đối chiếu đúng; không còn blocker core. Mọi kiểm tra không chạy phải ghi rõ lý do, không đánh dấu Completed nếu thiếu bằng chứng bắt buộc. **Dừng ở đây là đạt mục tiêu ưu tiên số 1.**

### PHASE 5 — Tùy chọn: Mapbox/GPS, không chặn core

- Chỉ bắt đầu khi người dùng yêu cầu P5 sau P4. Với dữ liệu hiện tại không thể nghiệm thu marker địa điểm hoặc route tới địa điểm thật vì 124 location thiếu lat.
- Mục tiêu: bật bản đồ có kiểm soát khi đủ SDK/token/GPS và giữ core chạy khi map lỗi.
- Task: xác minh quyền tải SDK và public token qua cấu hình local; bật lại map có guard; xin quyền foreground; lọc marker bằng `isMapLocationVisible`; chỉ cho chỉ đường khi cả điểm đến/đi hợp lệ; hiển thị thiếu GPS thay vì tự gán tọa độ; test từ chối quyền/mất mạng. Không bật background tracking cũ.
- File dự kiến: `src/config/featureFlags.ts`, `src/container/AppContainer.tsx`, `src/container/screens/Maps/MapScreenV2.tsx`, `src/container/screens/Home/DetailLocation.tsx`, `src/services/mapbox.api.ts`, `src/utils/catalogVisibility.ts`, `.env` local; cấu hình native Mapbox chỉ khi cần. Không sửa dữ liệu BE/DB trong phase này.
- Agent tự làm: guard, render map và test nếu có điều kiện. Người dùng: cấp token/quyền cần thiết; cung cấp nguồn GPS đã xác minh và yêu cầu riêng nếu muốn cập nhật DB production. Việc sửa GPS production cần kế hoạch/phạm vi riêng.
- Tiêu chí: map mở không ảnh hưởng core; marker/route chỉ dùng GPS thật hợp lệ; từ chối quyền không crash. Nếu không có GPS xác minh, phần nghiệm thu marker/route **Blocked**, không tự ghi hoàn thành hoặc tạo điểm giả.

## 6. Backlog hoãn và yêu cầu can thiệp

Các nhóm dưới đây **không phải phase được tự động thực hiện**. Khi người dùng chọn một nhóm, Agent phải lập phase nhỏ với contract/source mới được xác minh rồi mới triển khai theo yêu cầu; không gộp toàn bộ vào một phase khôi phục.

| Nhóm | Điều kiện mở lại / Agent có thể chuẩn bị | Người dùng cần quyết định/cung cấp |
|---|---|---|
| Auth/profile/OTP | BE core chưa có auth/session/email; không thể gọi endpoint tưởng tượng. Rà source hiện tại và thiết kế contract riêng, không tái sử dụng đọc toàn Accounts ở client như giải pháp lâu dài | Chọn phạm vi auth, tài khoản test, dịch vụ email và quyền cần thiết; chấp thuận riêng thay đổi backend/dữ liệu |
| Review/upload | Chưa có write API hoặc quyền runtime ghi; cần contract/kiểm tra lỗi và đồng bộ thật | Yêu cầu bật ghi, nơi lưu file, dữ liệu test và quyền backend/DB; chưa gửi review vào production |
| Detect/semantic/RAG/memory/recommendations | Router, dependency, index/model và Docker context đều cần xem lại; không chỉ đổi URL | Chọn từng tính năng, ngân sách/key hợp lệ qua secret store; không mặc định token đã hết hạn |
| Chatbot trực tiếp/tìm ảnh/Azure | Có đường gọi trả phí từ FE; tạm tắt trong core. Có thể giữ UI tĩnh/i18n local | Chọn có khôi phục hay không, quota/key và cách quản lý credential; không gọi dịch trả phí chỉ để kiểm tra |
| PayOS/donation | Route/webhook đang tắt; cần kế hoạch riêng về test/sandbox, credential, URL và xử lý trạng thái | Chỉ định môi trường thanh toán, quyền dashboard và cho phép test giao dịch riêng; không bật production trong recovery |
| Items/hiện vật | Không có route/dataset core tương ứng, table legacy chưa được kiểm chứng | Xác nhận còn cần chức năng và nguồn dữ liệu thật; không chuyển hotels thành items |
| Hotels UI | API đã sẵn, chưa thấy màn hình FE riêng | Quyết định có thêm luồng khách sạn; đây là mở rộng UI, không điều kiện hoàn thành core |
| iOS | Source có Podfile, chưa thử build | Máy macOS/Xcode, simulator/device; yêu cầu phase iOS riêng |

## 7. Cách tracking và kiểm chứng

- Tasklist là nguồn tiến độ triển khai; plan là phạm vi/tiêu chí. Trạng thái hợp lệ: **Pending / In Progress / Completed / Blocked**.
- Pending: chưa triển khai; In Progress: chỉ một phase đang làm; Completed: có bằng chứng đáp ứng tiêu chí; Blocked: ghi blocker cụ thể, ai xử lý, điều kiện gỡ chặn và các task không bị ảnh hưởng.
- Mỗi task giữ ID ổn định `P<n>.<m>`, owner Agent/User/Agent+User, bằng chứng ngắn. Hoàn thành task đánh `[x]`; task Blocked/Pending/In Progress giữ `[ ]` và cột trạng thái phân biệt.
- Khi được yêu cầu một phase: kiểm tra lại source/Git/live cần thiết, không ghi đè thay đổi người dùng; chỉ đổi phạm vi phase đó. Nếu cần vượt phase hoặc sửa production, ghi đề xuất cụ thể và chờ chỉ định phạm vi.
- Sau mỗi phase: cập nhật trạng thái/tổng số, liệt kê file thực đổi, kiểm tra đã chạy/chưa chạy, blockers; dừng. Không commit/deploy tự động.
- Kiểm chứng đã làm ở P0: đọc source/config có che giá trị secret, GET/HEAD live, full pagination và lỗi tham số. Git FE baseline sạch qua `git -c safe.directory=... status --short`; chỉ áp dụng safe.directory cho từng lệnh, không đổi global config.
- Tại P0 chưa chạy npm install/Jest/ESLint/tsc/Gradle/app Android/iOS hoặc BE local: nhiệm vụ chỉ lập plan, FE chưa có node_modules; không có bằng chứng UI/runtime. Kết quả P1 được bổ sung riêng bên dưới. Không dùng báo cáo nghiệm thu BE cũ để tuyên bố FE đã chạy.

## 8. Kết quả thực tế P1 — 19/10/2026

- Baseline Git sạch, dùng safe.directory theo từng lệnh. Node 20.19.4, npm 10.8.2, Java 17.0.12. `node_modules` đã có khi bắt đầu P1, `npm ls --depth=0` đủ dependencies; chọn npm/package-lock.json, giữ cả hai lockfile nguyên trạng. Không sửa package/native hoặc BE.
- Recovery flags đã được dùng thực: Home không đọc phiên legacy, xin GPS hoặc tính khoảng cách mặc định; giữ nguyên dữ liệu AsyncStorage. Chỉ Home/Festival tabs hoạt động; list/detail Location/Festival và nội dung local được giữ. Theo yêu cầu bổ sung, import/tab/route Auth/map/camera/items/payment/chatbot/profile và bubble được giữ dưới dạng comment; không khởi tạo module bị hoãn. Các guard dịch vụ/directions/recommendation/similar AI vẫn hoạt động. Code GPS/nearby và renderer Items trước đây cũng được giữ trong comment để khôi phục sau này.
- Catalog chưa kết nối ở P1: getLocations/getFestivals từ chối rõ trước cache và request NocoDB; Axios chặn legacy read/write/upload trước network adapter. Home/Festival bắt lỗi, dừng loading, có thông báo vi/en và retry. Không trả catalog giả, không sửa URL sang Cloud Run; phần đó vẫn thuộc P2.
- Keyword search dùng nhánh local, không bật lại semantic qua toggle. TranslationContext giữ UI common local và bypass Azure; dịch batch/detect Azure cũng có guard. Không pretranslate/offline warmup mạng. Đã bỏ log phần key chatbot và OTP.
- Ba suite Guest Mode cuối có **9 tests pass**: Home guest/error/retry không account/GPS/request; Festival không Items; keyword bỏ dấu; legacy request bị chặn; Azure không fetch; navigation không khởi tạo tích hợp phụ; UI vi/en local không queue dịch; thêm 2 tests buộc màn kết quả Location/Festival giữ keyword dù nhận route params semantic cũ. AI toggle còn sót được phát hiện trên emulator, đã gate UI/constructor/toggle bằng flag và kiểm tra lại.
- Lần P1 đầu: Metro Android dev bundle ghi thành công và copy 40 assets, nhưng `assembleDebug` exit 1 vì thiếu SDK. Sau User cài emulator, tìm thấy SDK ở `C:/Android/Sdk`; sửa riêng `sdk.dir` local từ đường dẫn cũ, dùng env theo tiến trình. Gradle tự cài NDK 26.1.10909125, CMake 3.22.1 và Platform 35 bằng license có sẵn. **assembleDebug exit 0**, Gradle 8.8/AGP 8.5.0, 648 tasks, 11m21s; build xác nhận sau sửa JS cũng exit 0 trong 21s. Native Mapbox compile thành công, không đổi dependency/native/autolink/lockfile. Các warning compileSdk 35/deprecated API chưa buộc nâng framework để đạt P1.
- **Pixel_Test / emulator-5554, Android 14 API 34 x86_64:** install APK Success, `am start` Status ok/COLD; Home Guest mở không login/GPS prompt. Home/Festival báo catalog tạm tắt và retry dừng loading, keyword search/View All trả rỗng không nút AI, UI vi/en local và restart giữ ngôn ngữ. Không tạo catalog giả, chưa tích hợp Cloud Run. [Báo cáo smoke tổng hợp](docs/recovery/p1/README.md); file ảnh/audit tạm đã được dọn theo yêu cầu bổ sung.
- Observer pass-through local tạm cài trước entry app: 70 bản ghi fetch/XHR từ 16:53–16:58 đều external=0; không có FATAL EXCEPTION/Invariant Violation/TypeError/ReferenceError trong log thu. Không ghi URL/header/body/key; không thay response hoặc chặn request. Giới hạn: không capture native sockets/WebSocket, không nghiệm thu luồng chưa mở. Đã dừng observer và trả Metro debug chuẩn/Home tiếng Việt, không xóa dữ liệu app.
- **P1 Completed.** Typecheck toàn repo vẫn 66 diagnostics (exit 2), full Jest có các lỗi đã ghi ở tracking từ đợt trước; tests P1 hiện 9/9 pass và lint file sửa ở đợt tiếp tục 0 errors/4 warnings. Gate P1 chỉ nghiệm thu shell Guest trên Android, không tuyên bố catalog thật hoặc toàn repo đã sạch. P2–P5 giữ Pending, không commit/deploy hoặc tự chuyển phase.
- Đợt bổ sung quy ước: phục hồi code tạm bỏ qua thành comment; chạy lại 9 tests P1 pass, ESLint 4 file chạm tới 0 errors/14 warnings. Đóng Metro/AVD do Agent khởi động để giải phóng file; dọn thư mục audit/cache riêng và raw audit, giữ APK/source/tests/tài liệu. Không thay index Git do User đã stage.

## 9. Kết quả thực tế P2 — 19/10/2026

**Completed, 6/6 task.** Baseline Git sạch, HEAD `1c03405` (Phase 1); dùng `git -c safe.directory=...` theo từng lệnh do ownership sandbox, không sửa Git config toàn máy. Đọc lại plan/tasklist, source FE, `core_api/models.py` chỉ đọc và OpenAPI live trước khi tích hợp. Không sửa BE, DB hoặc Cloud Run production.

### Thay đổi kỹ thuật

- `src/services/catalog.client.ts`: client Axios độc lập với `services/axios.ts`; dùng `CATALOG_API_URL` từ `@env` nếu có, mặc định `https://travel-api-u2xcse44ca-as.a.run.app`. Chỉ helper danh sách `/locations`, `/festivals` sử dụng client này. Không cần sửa `.env` chứa key, `SERVER_URL`, `DB_URL` hay client legacy. Bổ sung khai báo/mock env cho biến mới. Không có xc-token/Authorization/Cookie trong request kiểm thử; `withCredentials=false`.
- Timeout 30 giây mỗi request để phù hợp cold start. Tối đa 3 lần thử tổng cộng cho timeout/network/429/5xx, nghỉ 500ms rồi 1000ms; HTTP 4xx khác không retry. `CatalogError.kind` phân biệt `timeout/network/http/contract`, giữ HTTP status, không chứa URL có key/body. Lỗi được throw lên UI, không đổi thành danh sách rỗng. Chuỗi lỗi UI vi/en đã bỏ thông báo “tạm tắt Phase 1”, giữ nút Thử lại.
- `catalog.adapter.ts` mô tả đầy đủ base/location/festival DTO theo models/OpenAPI. Adapter kiểm tra kiểu dữ liệu trước khi đưa vào cache, giữ toàn bộ trường trả về, `id`, `record_id`, alias `Id=id`, JSON arrays (kể cả review JSON lồng nhau), số và null gốc. Không JSON.parse arrays backend, không tự tạo GPS/rating hoặc suy ra dữ liệu thiếu. Không ánh xạ Hotels sang Items.
- `locations.api.ts`, `festivals.api.ts`: chuyển hai luồng đọc sang client mới, giữ implementation đọc NocoDB cũ trong comment. Các constants/write/upload/items legacy vẫn ở client cũ và tiếp tục bị chặn bởi flags/interceptor P1. Phân trang kiểm tra offset khớp, limit nguyên 1–100, items không vượt limit, has_more là boolean; trang có has_more phải đủ limit; tăng offset bằng response.limit. Chấp nhận trang kết thúc rỗng; reject ID trùng/trang sai contract/không tiến triển; chặn trên 1000 trang, không âm thầm trả kết quả thiếu.
- Cache danh sách 10 phút, chia sẻ request đang tải, chỉ lưu khi hoàn tất toàn bộ trang. `forceRefresh`/clear invalidates cache và chặn request cũ ghi đè kết quả mới; lỗi refresh không bị cache cũ che. Refresh location đồng thời invalidate reviews dẫn xuất; `getReviews` truyền forceRefresh và không nuốt lỗi thành `[]`. Festivals có `clearCache` và forceRefresh mới, không đổi các lời gọi không truyền tham số.
- `getLocationById/getFestivalById` tra theo `id` trong list/cache; không gọi detail endpoint. Hai màn detail giữ record từ route và tải catalog/related qua service, có trạng thái lỗi + retry. Related chỉ so FK số nguyên thực, từ chối FK null/undefined; không dùng tên để suy luận. Retry Festival và detail ép refresh khi người dùng yêu cầu.
- `common/types.tsx` phản ánh GPS/rating nullable và record_id. Để type mới không gây lỗi ở consumer, chỉ bổ sung guard nhỏ: rating liên quan phải là số; festival SimilarItems dùng images vì backend không có avatar; Map kiểm tra GPS trước route/focus và visibility helper có type predicate sau kiểm tra GPS hiện hữu. Map/AI vẫn tắt hoàn toàn bằng flags P1; không triển khai trải nghiệm Map hoặc các hạng mục UI rộng của P3. Code cũ bị tạm bỏ qua tiếp tục được giữ trong comment.
- Test `__tests__/services/catalog.api.test.js` mới và cập nhật Guest Mode test cho kết nối P2: Home/Festival vẫn là guest, lỗi API kiểm thử được tiêm qua spy rõ ràng; giữ kiểm tra legacy chặn trước adapter, không tài khoản/GPS/AI/Azure. Fixtures trong unit test chỉ để kiểm tra contract, không đưa vào runtime hoặc fallback thay dữ liệu thật.

### Kiểm chứng live chỉ đọc

Live test gọi chính service FE qua Jest/Node HTTP adapter (Axios build Node được chọn rõ vì preset React Native chọn Axios build browser). Đối chiếu toàn bộ record với các GET phân trang độc lập, không chỉ so count. Không cần token; không gọi write, auth, AI, payment, upload, hotels hoặc NocoDB.

| Catalog | Phân trang service | Tổng/ID | Bản ghi đầu | Bản ghi cuối |
|---|---|---|---|---|
| Locations | offset 0: 100, offset 100: 24, has_more=false | **124**, id/record_id duy nhất | id=1, `location_49887776b7c7b105`, An Phú Farm | id=124, `location_9aca2ee33f365095` |
| Festivals | offset 0: 43, has_more=false | **43**, id/record_id duy nhất | id=1, `festival_7562b8e5601daf3f`, Biểu diễn nghệ thuật Chăm tại Khu đền tháp Mỹ Sơn | id=43, `festival_1c2cf56396a05611` |

Số lượng không đổi so baseline P0. **124/124 location lat=null, 124/124 location rating=null; 43/43 festival rating=null và location_id=null.** Related festivals rỗng là đúng dữ liệu hiện tại. Arrays và các trường null được so bằng deep equality với response gốc; alias Id là trường duy nhất adapter bổ sung. OpenAPI live vẫn chỉ có `/locations`, `/festivals`, `/hotels`, `/`, `/health`, `/health/ready`; không có route detail.

### Lệnh và kết quả validation

```powershell
$env:CATALOG_LIVE='1'
node node_modules/jest/bin/jest.js __tests__/services/catalog.api.test.js __tests__/guestMode.test.js __tests__/guestNavigation.test.js __tests__/guestTranslation.test.js --runInBand --silent
```

- **4 suites, 38/38 tests pass**, không skipped khi bật CATALOG_LIVE. Mặc định không đặt biến này thì riêng live test được skip để unit tests không phụ thuộc mạng. Bao phủ >100 rows cho cả hai endpoint, trang cuối rỗng/dừng has_more, null/arrays/headers, sai contract, ID trùng, 1000 trang, lỗi/retry/phục hồi, cache/TTL/race/refresh/derived reviews, lookup/FK và detail retry. Live test không hardcode count baseline làm điều kiện pass để ghi nhận được dataset mới.
- ESLint client/adapter/services/types/env/visibility helper và hai file test thay đổi: **exit 0, không lỗi/cảnh báo**. Lint toàn bộ source chạm tới còn **5 lỗi hooks, 13 warnings**; 1 lỗi ở SimilarItems, 4 lỗi ở Map đã có tại HEAD. Đã dùng ESLint API lintText source HEAD và lintFiles bản hiện tại đối chiếu rule/message: không phát sinh lint message mới ở hai file này. Không sửa dependency hooks của các tích hợp bị tắt trong P2.
- `tsc --noEmit --pretty false` toàn repo còn lỗi: đối chiếu diagnostics bằng TypeScript compiler API trên source HEAD và source hiện tại: **66 → 63 diagnostics, không diagnostic mới** (so file/code/message, bỏ qua line dịch chuyển). Không lỗi mới ở catalog hoặc consumer sau khi bổ sung guard nullable. Các lỗi có sẵn về styles, typings components, i18next, semantic/legacy vẫn ngoài scope; không tuyên bố typecheck toàn repo pass.
- `git diff --check` pass. Không thay lockfile/dependency/native/featureFlags/client legacy; không reset, stage, commit hoặc deploy. Không tạo file log/audit/bundle/test tạm trong workspace; giữ source tests và hai tài liệu tracking.

### Giới hạn và điểm dừng

FE **ở tầng service đã lấy đủ catalog thật**, đáp ứng gate P2. Lần này chưa build/cài APK hoặc chạy lại trên emulator; kết quả Android P1 là lịch sử, không dùng thay bằng chứng Android sau P2. Nội dung dịch theo ID cũ, null/fallback UI toàn diện và smoke thực tế còn ở P3/P4; chưa xác nhận UI đã hiển thị đúng mọi record. Không có blocker P2 cần User xử lý. **Dừng tại P2, P3–P5 giữ Pending.**
