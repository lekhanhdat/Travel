# Travel Recovery — Tasklist

Cập nhật: **19/10/2026 — Asia/Saigon**. Chỉ phân tích/lập plan đã hoàn tất; **chưa triển khai phase khôi phục nào**.

Phạm vi/contract/file/tiêu chí chi tiết: [RECOVERY_PLAN.md](RECOVERY_PLAN.md).

## Quy ước thực hiện

- Trạng thái: **Pending / In Progress / Completed / Blocked**.
- `[x]` chỉ dùng cho Completed có bằng chứng. `[ ]` không đồng nghĩa Blocked; đọc cột trạng thái.
- Chỉ một phase được In Progress. Chỉ triển khai phase người dùng yêu cầu, cập nhật kết quả rồi dừng; không tự chạy phase sau.
- Owner `Agent`: tự làm trong phase được yêu cầu. `User`: cần thao tác/quyết định người dùng. `Agent+User`: Agent chuẩn bị, người dùng hỗ trợ điều kiện ngoài môi trường.
- Không cài package/sửa source/config/deploy trước yêu cầu triển khai. Không log/copy secret vào tasklist.

## Tổng tiến độ

| Phase | Mục tiêu | Phụ thuộc | Trạng thái | Task Completed |
|---|---|---|---|---|
| P0 | Khảo sát và lập tài liệu | Không | Completed | 5/5 |
| P1 | Build/open Android guest, gate tích hợp phụ | P0 + yêu cầu P1 | Pending | 0/6 |
| P2 | Catalog Cloud Run và adapter/phân trang | P1 + yêu cầu P2 | Pending | 0/6 |
| P3 | UI đúng dữ liệu, null/ID/bản dịch/review | P2 + yêu cầu P3 | Pending | 0/6 |
| P4 | Nghiệm thu Android core | P3 + yêu cầu P4 | Pending | 0/6 |
| P5 | Mapbox/GPS tùy chọn | P4 + yêu cầu P5 + điều kiện map | Pending | 0/5 |

Mốc core: **0/24 task triển khai P1–P4**, 0/4 phase triển khai hoàn thành. P0 là khảo sát, P5 không tính vào mốc core. Không có phase In Progress. Các điều kiện chưa thử không tự đánh dấu lỗi build đã xác nhận.

## PHASE 0 — Khảo sát

| Check | ID | Task | Owner | Trạng thái | Bằng chứng |
|---|---|---|---|---|---|
| [x] | P0.1 | Đọc FE: kiến trúc, env, API, navigation, native, test | Agent | Completed | RN 0.74.2, NocoDB client, host cũ, guest Home, thiếu node_modules |
| [x] | P0.2 | Đọc BE local: entry/router/schema/dependency/deploy | Agent | Completed | app.py + core_api; profile core read-only; tích hợp legacy comment |
| [x] | P0.3 | Đối chiếu endpoint live chỉ đọc | Agent | Completed | Root/health/ready/OpenAPI 200; đủ 124/43/82; invalid pagination 422; route cũ/detail 404 |
| [x] | P0.4 | Phân loại chức năng và blocker thực tế | Agent | Completed | Lệch contract, ID bản dịch cũ, null GPS, review hardcode, flags chưa sử dụng; xem plan |
| [x] | P0.5 | Tạo plan/tasklist, xác minh chỉ hai file tài liệu thay đổi | Agent | Completed | Hai file RECOVERY_*; không thay source FE/BE hoặc cloud |

## PHASE 1 — App mở được với chế độ khách

File dự kiến: flags, App/AppContainer, bubble/search, điểm gọi Home/Detail/Festival/NewFeed/Profile, TranslationContext; package/lock/native chỉ khi có lỗi build chứng minh. Xem giới hạn chi tiết trong plan.

| Check | ID | Task | Owner | Trạng thái | Bằng chứng / điều kiện hoàn thành |
|---|---|---|---|---|---|
| [ ] | P1.1 | Baseline Git; chọn lockfile; kiểm tra Node/JDK/SDK/adb/device; cài dependencies khi được yêu cầu P1 | Agent+User | Pending | Ghi package manager/version, SDK/device; không regenerate lock tùy tiện |
| [ ] | P1.2 | Gắn flags recovery thật; guest; không sử dụng phiên legacy để gọi account API | Agent | Pending | Entry point/effect không gọi NocoDB/auth/payment/AI/upload/items |
| [ ] | P1.3 | Gate route/tab/bubble/nút phụ và import/khởi tạo Mapbox không cần thiết | Agent | Pending | Không route còn sót tới chức năng hoãn; giữ catalog/detail |
| [ ] | P1.4 | Keyword search, UI local, bypass Azure; Home không chờ GPS, có trạng thái lỗi catalog | Agent | Pending | Không cần key phụ/GPS để mở app; không mock dữ liệu thay backend |
| [ ] | P1.5 | Build debug, sửa lỗi dependency/native được tái hiện, loại log nhạy cảm tại code chạm tới | Agent | Pending | Log build thành công; nếu native Mapbox chặn phải ghi quyết định tối thiểu |
| [ ] | P1.6 | Chạy thiết bị/emulator xác nhận Home guest mở được; cập nhật tracking rồi dừng | Agent+User | Pending | Thiết bị/OS, kết quả launch, request quan sát; thiếu device thì Blocked |

Gate P1: build **và** Home guest mở thành công, không request tích hợp phụ. Chưa yêu cầu có dữ liệu catalog thật ở phase này.

## PHASE 2 — Kết nối catalog thật

File dự kiến: env/config, client/adapter catalog riêng, locations.api/festivals.api, types/env mock, test catalog. Không đổi request legacy cho auth/write, không sửa BE.

| Check | ID | Task | Owner | Trạng thái | Bằng chứng / điều kiện hoàn thành |
|---|---|---|---|---|---|
| [ ] | P2.1 | Cấu hình Cloud Run URL và catalog client không xc-token | Agent | Pending | Request chỉ đúng host/path; không lộ credential |
| [ ] | P2.2 | DTO/adapter id + alias Id nếu cần, record_id, nullable/arrays | Agent | Pending | Không dùng hotel làm item; không biến null thành 0 |
| [ ] | P2.3 | Chuyển location/festival sang items/offset/has_more, đọc đủ trang | Agent | Pending | Không pageInfo/list NocoDB; hơn 100 location không bị cắt |
| [ ] | P2.4 | Lookup/detail/related festival qua record/list/FK thật; giữ cache/refresh đúng | Agent | Pending | Không gọi /locations/{id}; không suy đoán location_id |
| [ ] | P2.5 | Xử lý timeout/lỗi/retry và test contract/phân trang/null/header | Agent | Pending | Tests pass cho multi-page/end/null/array; không retry vô hạn |
| [ ] | P2.6 | So live count/ID tại thời điểm chạy; cập nhật tracking rồi dừng | Agent | Pending | Baseline 124 locations/43 festivals; count mới nếu live thay đổi |

Gate P2: service lấy đủ data thật, đúng contract, test liên quan pass. Hotels API đã sẵn nhưng UI mới ngoài scope.

## PHASE 3 — UI đúng dữ liệu

File dự kiến: translationHelpers, types, Home/Festival/NewFeed screens, card/search/image components, thông báo common i18n và tests liên quan. Không chuyển đổi encoding hàng loạt hoặc sửa JSON bản dịch catalog hàng loạt.

| Check | ID | Task | Owner | Trạng thái | Bằng chứng / điều kiện hoàn thành |
|---|---|---|---|---|---|
| [ ] | P3.1 | Bypass catalog translation theo ID legacy; giữ common UI | Agent | Pending | id=1 giữ An Phú Farm và lễ hội Chăm ở list/detail/search, kể cả vi/en |
| [ ] | P3.2 | Guard GPS nullable; không distance/nearby/route giả | Agent | Pending | Dataset thiếu GPS không bị ép 0; từ chối quyền không chặn list |
| [ ] | P3.3 | Fallback ảnh, rating/review/video rỗng; giữ publishable=false trong list | Agent | Pending | Không crash/null .toFixed; chưa có review hiển thị đúng; không lọc nhầm marker flag |
| [ ] | P3.4 | Bỏ merge/fallback review mẫu; khóa review/upload/Items trong recovery | Agent | Pending | NewFeed rỗng đúng với API; không báo lưu thành công giả |
| [ ] | P3.5 | Soát route/detail Id/id, FK nullable, keyword search nội dung thật | Agent | Pending | List → detail cùng record, không gọi semantic/route chưa tồn tại |
| [ ] | P3.6 | Chạy tests hành vi UI/helper, ghi kết quả và dừng | Agent | Pending | ID collision/null GPS/empty arrays/publishable=false có bằng chứng |

Gate P3: UI không ghi đè dữ liệu API bằng nội dung cũ; đúng empty/error state, không GPS/review giả.

## PHASE 4 — Nghiệm thu core

File dự kiến: hai RECOVERY_* và test cần thiết; chỉ sửa source nếu có lỗi trực tiếp của mốc recovery.

| Check | ID | Task | Owner | Trạng thái | Bằng chứng / điều kiện hoàn thành |
|---|---|---|---|---|---|
| [ ] | P4.1 | Tests liên quan, typecheck, lint; phân biệt lỗi baseline | Agent | Pending | Ghi lệnh/exit code; không sửa rộng lỗi ngoài scope |
| [ ] | P4.2 | Build debug và smoke test Home/list/detail/back, Festival, search, NewFeed rỗng | Agent+User | Pending | Thiết bị/OS/build + bước chạy/kết quả |
| [ ] | P4.3 | Đối chiếu dataset live cùng thời điểm và record đầu/cuối/publishable=false | Agent | Pending | Tổng record + ID/nội dung thật; không dùng cache cũ làm bằng chứng |
| [ ] | P4.4 | Mất mạng → retry; từ chối GPS; ảnh/video rỗng/lỗi; restart app | Agent+User | Pending | Không crash/loading vô hạn; không xóa dữ liệu người dùng để test |
| [ ] | P4.5 | Kiểm tra request/log: không NocoDB/AI/PayOS/Azure/email/upload/secret | Agent | Pending | Bằng chứng từ phiên chạy, không chỉ nhìn flag false |
| [ ] | P4.6 | Ghi nghiệm thu, file thay đổi, việc chưa kiểm tra, phần hoãn; dừng | Agent | Pending | P1–P4 gate đạt; chưa chạy device thì không tuyên bố hoàn thành |

Gate P4: **app Android chạy với catalog thật**. Không cần auth/map/AI/payment/iOS để đạt mốc này. Không phát hành release hoặc deploy.

## PHASE 5 — Map/GPS tùy chọn

File dự kiến: map flags/navigation, MapScreenV2, DetailLocation, mapbox.api, catalogVisibility, env/native có điều kiện. Chỉ mở khi có yêu cầu P5; không sửa GPS production trong phase này.

| Check | ID | Task | Owner | Trạng thái | Bằng chứng / điều kiện hoàn thành |
|---|---|---|---|---|---|
| [ ] | P5.1 | Xác minh SDK/download permission, runtime token và thiết bị GPS | Agent+User | Pending | Key qua cấu hình local an toàn; không chép vào tracking |
| [ ] | P5.2 | Xác minh có điểm đến với GPS thật, hoặc ghi blocker dữ liệu | Agent+User | Pending | Hiện 124/124 location lat=null; không tự tạo GPS |
| [ ] | P5.3 | Bật map có guard, foreground permission, marker publishable + GPS hợp lệ | Agent | Pending | Không lọc publishable khỏi list; không bật background tracking |
| [ ] | P5.4 | Chỉ đường chỉ khi có GPS hợp lệ, test thiếu quyền/mạng/token | Agent+User | Pending | Core không crash; marker/route cần điểm đến thật |
| [ ] | P5.5 | Cập nhật nghiệm thu/blocker và dừng | Agent | Pending | Thiếu data thì phần marker/route Blocked, không đánh Completed giả |

## Blocker, điều kiện chưa xác minh và can thiệp thủ công

Chưa có phase triển khai bắt đầu nên không đánh Pending thành Blocked chỉ vì đang chờ yêu cầu. Khi task thực sự không thể tiếp tục, đổi trạng thái và tham chiếu mã bên dưới.

| Mã | Điều kiện hiện tại | Ảnh hưởng | Ai xử lý / điều kiện gỡ chặn |
|---|---|---|---|
| B01 | node_modules chưa có; SDK/device chưa xác minh; adb không có trong PATH | P1 build/launch và P4 smoke | Agent kiểm tra/cài dependencies trong P1; User chuẩn bị SDK/device nếu môi trường thiếu hoặc quyền cài chặn |
| B02 | Mapbox token/download SDK chưa thử; native module vẫn được khai báo | Có thể chặn P1 build, P5 map | Agent xác minh lỗi cụ thể; cô lập native nếu phù hợp hoặc User cấp quyền tải qua local config; không yêu cầu token trước khi chứng minh cần |
| B03 | 124 location đều lat=null | P5 marker/route, tính năng gần bạn | P3 ẩn/hiển thị thiếu GPS để core không bị chặn; User cung cấp nguồn GPS xác minh + yêu cầu kế hoạch cập nhật dữ liệu riêng |
| B04 | Core thiếu auth/write/upload/AI/payment routes; runtime read-only | Các tính năng hoãn | P1 gate FE; khi User chọn tính năng mới, Agent lập phase contract/backend riêng, không tự mở quyền production |
| B05 | Hạn dùng/quota các key legacy Unknown | Tích hợp phụ | User chỉ cần kiểm tra/cấp lại khi muốn khôi phục nhóm đó; không chặn P1–P4 |
| B06 | Không có môi trường macOS/Xcode đã xác minh | iOS | User cung cấp máy/runner và yêu cầu phase iOS riêng; không chặn Android |
| B07 | Service live có thể đổi hoặc unavailable về sau | P2/P4 | Agent kiểm tra root/health/ready/catalog lại; nếu lỗi live lặp lại thì ghi response/time và User kiểm tra vận hành; không tự redeploy |

Auth/OTP, write review/upload, AI từng nhóm, PayOS, Items, Hotels UI và iOS nằm trong backlog mục 6 của plan. **Không task nào được xem là được phép triển khai chỉ vì đã liệt kê ở đây.**

## Nhật ký và bằng chứng

| Ngày | Phase | Kết quả | File thay đổi | Kiểm tra chưa chạy / lý do |
|---|---|---|---|---|
| 19/10/2026 | P0 | Khảo sát FE/BE; HTTPS GET root/health/ready/OpenAPI 200; đọc hết catalog 124/43/82; tham số sai 422; detail/NocoDB proxy/semantic suggestions/payment status 404; một ảnh HEAD 200 | RECOVERY_PLAN.md, RECOVERY_TASKLIST.md | Không install/build/Jest/lint/tsc/device/BE local vì chỉ lập plan; FE thiếu node_modules. Không gọi API ghi, dịch vụ trả phí hoặc DB trực tiếp |

Mẫu cập nhật sau mỗi phase: `Ngày | Phase/task | trạng thái trước → sau | file thực đổi | lệnh/test/thiết bị/kết quả | blocker + owner + điều kiện gỡ`. Chỉ ghi thông tin đã kiểm chứng; không chép log dài, request header credential hoặc kết quả lịch sử thành bằng chứng mới.

**Điểm dừng hiện tại:** P0 Completed. Chờ người dùng chỉ định phase cần triển khai; bước đầu đề xuất là P1.
