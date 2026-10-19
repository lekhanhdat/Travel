# Travel Recovery — Tasklist

Cập nhật: **19/10/2026 — Asia/Saigon**. Giữ lịch sử P0–P1; **P2 Completed, 6/6 task**, service FE đọc đủ 124 Locations/43 Festivals từ Cloud Run, 38 tests pass. Dừng P2; P3 chưa triển khai.

Phạm vi/contract/file/tiêu chí chi tiết: [RECOVERY_PLAN.md](RECOVERY_PLAN.md).

## Quy ước thực hiện

- Trạng thái: **Pending / In Progress / Completed / Blocked**.
- `[x]` chỉ dùng cho Completed có bằng chứng. `[ ]` không đồng nghĩa Blocked; đọc cột trạng thái.
- Chỉ một phase được In Progress. Chỉ triển khai phase người dùng yêu cầu, cập nhật kết quả rồi dừng; không tự chạy phase sau.
- Owner `Agent`: tự làm trong phase được yêu cầu. `User`: cần thao tác/quyết định người dùng. `Agent+User`: Agent chuẩn bị, người dùng hỗ trợ điều kiện ngoài môi trường.
- Không cài package/sửa source/config/deploy trước yêu cầu triển khai. Không log/copy secret vào tasklist.
- Tạm bỏ qua chức năng: giữ code trong comment để khôi phục, không xóa implementation. Trước báo cáo phải dọn file tạm do Agent tạo; giữ source/tests, tài liệu tổng hợp và artifact kết quả được yêu cầu.

## Tổng tiến độ

| Phase | Mục tiêu | Phụ thuộc | Trạng thái | Task Completed |
|---|---|---|---|---|
| P0 | Khảo sát và lập tài liệu | Không | Completed | 5/5 |
| P1 | Build/open Android guest, gate tích hợp phụ | P0 + yêu cầu P1 | Completed | 6/6 |
| P2 | Catalog Cloud Run và adapter/phân trang | P1 + yêu cầu P2 | Completed | 6/6 |
| P3 | UI đúng dữ liệu, null/ID/bản dịch/review | P2 + yêu cầu P3 | Pending | 0/6 |
| P4 | Nghiệm thu Android core | P3 + yêu cầu P4 | Pending | 0/6 |
| P5 | Mapbox/GPS tùy chọn | P4 + yêu cầu P5 + điều kiện map | Pending | 0/5 |

Mốc core: **12/24 task triển khai P1–P4**, 2/4 phase triển khai hoàn thành. P0 là khảo sát, P5 không tính vào mốc core. P1 đạt gate build + launch Guest; P2 đạt gate service + live contract; P3–P5 giữ Pending.

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
| [x] | P1.1 | Baseline Git; chọn lockfile; kiểm tra Node/JDK/SDK/adb/device; cài dependencies khi được yêu cầu P1 | Agent+User | Completed | Git sạch lúc bắt đầu, safe.directory chỉ theo lệnh; Node 20.19.4, npm 10.8.2, JDK 17.0.12. Chọn package-lock.json; node_modules đã có, npm ls --depth=0 đủ package. Không đổi lock/dependencies. SDK ban đầu thiếu; sau User cài, tìm thấy C:/Android/Sdk và AVD Pixel_Test, đã gỡ B01 |
| [x] | P1.2 | Gắn flags recovery thật; guest; không sử dụng phiên legacy để gọi account API | Agent | Completed | Flags dùng ở Home, route, search, Axios và Azure; bỏ đọc phiên Home, không xóa AsyncStorage. Catalog từ chối trước cache/NocoDB; interceptor chặn legacy read/write/upload trước adapter. Guest tests kiểm chứng không gọi account/GPS/network |
| [x] | P1.3 | Gate route/tab/bubble/nút phụ và import/khởi tạo Mapbox không cần thiết | Agent | Completed | Chỉ Home/Festival tabs; giữ Location/Festival list/detail và local routes. Theo quy ước bổ sung, import/tab/route phụ và bubble được giữ trong comment để khôi phục; directions/recommendation/similar AI vẫn có guard. AI Search ở hai màn ViewAll đã gate UI, route params và toggle; 9 tests P1 chạy lại pass sau đổi sang comment |
| [x] | P1.4 | Keyword search, UI local, bypass Azure; Home không chờ GPS, có trạng thái lỗi catalog | Agent | Completed | 9/9 tests P1 pass; emulator xác nhận Home/Festival, retry, local vi/en, keyword results rỗng không AI toggle, restart giữ ngôn ngữ. CatalogStatus hiển thị rõ kết nối tạm tắt + Thử lại. Không Cloud Run/mock data/GPS giả. Xem docs/recovery/p1/README.md |
| [x] | P1.5 | Build debug, sửa lỗi dependency/native được tái hiện, loại log nhạy cảm tại code chạm tới | Agent | Completed | assembleDebug exit 0, BUILD SUCCESSFUL in 11m21s, 648 tasks; APK mới 219407632 bytes, đã install Success trên emulator-5554. SDK C:/Android/Sdk, NDK/CMake/Platform 35 được Gradle cài; chỉ sửa sdk.dir local, không đổi dependency/native. Mapbox compile thành công, giữ autolink. Log key/OTP đã bỏ ở đợt P1 trước |
| [x] | P1.6 | Chạy thiết bị/emulator xác nhận Home guest mở được; cập nhật tracking rồi dừng | Agent+User | Completed | Pixel_Test / emulator-5554, Android 14 API 34 x86_64; install Success, am start Status ok / COLD. Home/Festival, Retry, vi/en, search/View All và restart pass. Audit 16:53–16:58: 70 records, external fetch/XHR=0, không fatal/JS errors. Tổng hợp và giới hạn ở docs/recovery/p1/README.md; raw log/audit/ảnh kiểm thử đã dọn. Đã đóng các tiến trình kiểm thử do Agent tạo, giữ app data/APK. Dừng P1 |

Gate P1: build **và** Home guest mở thành công, không request tích hợp phụ. Chưa yêu cầu có dữ liệu catalog thật ở phase này.

## PHASE 2 — Kết nối catalog thật

File dự kiến: env/config, client/adapter catalog riêng, locations.api/festivals.api, types/env mock, test catalog. Không đổi request legacy cho auth/write, không sửa BE.

| Check | ID | Task | Owner | Trạng thái | Bằng chứng / điều kiện hoàn thành |
|---|---|---|---|---|---|
| [x] | P2.1 | Cấu hình Cloud Run URL và catalog client không xc-token | Agent | Completed | catalog.client.ts dùng CATALOG_API_URL tùy chọn + fallback host Cloud Run; timeout 30s, withCredentials=false. Test adapter xác nhận host/path và không xc-token/Authorization/Cookie; client legacy/flags không đổi |
| [x] | P2.2 | DTO/adapter id + alias Id nếu cần, record_id, nullable/arrays | Agent | Completed | catalog.adapter.ts đối chiếu models.py/OpenAPI live; giữ nguyên fields/arrays, alias Id=id; rating/GPS/FK/date null không ép số; contract sai bị reject; không gọi hotels/items |
| [x] | P2.3 | Chuyển location/festival sang items/offset/has_more, đọc đủ trang | Agent | Completed | getLocations/getFestivals đọc endpoint danh sách; offset += response.limit; kiểm tra offset/limit/has_more, ID trùng, trang không tiến triển, tối đa 1000 trang. Live locations 100+24, festivals 43 |
| [x] | P2.4 | Lookup/detail/related festival qua record/list/FK thật; giữ cache/refresh đúng | Agent | Completed | getLocationById/getFestivalById tra list/cache theo id; detail giữ record route, tải catalog/related và có retry. Related chỉ so FK số hợp lệ; 43/43 FK live null nên rỗng. Cache 10 phút, forceRefresh/clear/expiry, chống kết quả cũ ghi đè, refresh reviews phụ thuộc đã test |
| [x] | P2.5 | Xử lý timeout/lỗi/retry và test contract/phân trang/null/header | Agent | Completed | 38/38 tests pass (4 suites, gồm live); CatalogError phân biệt timeout/network/http/contract, tối đa 2 retry cho network/timeout/429/5xx, không retry 404. Core lint pass; tsc toàn repo 63 lỗi cũ so baseline 66, không lỗi mới; 5 lỗi lint hooks cũ ở Map/SimilarItems không đổi |
| [x] | P2.6 | So live count/ID tại thời điểm chạy; cập nhật tracking rồi dừng | Agent | Completed | 19/10/2026: service FE lấy 124 locations/43 festivals, ID và record_id duy nhất, toàn bộ record khớp GET phân trang độc lập. Location id=1 An Phú Farm; festival id=1 biểu diễn Chăm Mỹ Sơn. Xem mục 9 plan: ID nguồn, lệnh kiểm thử, giới hạn. Dừng P2 |

Gate P2: service lấy đủ data thật, đúng contract, test liên quan pass. Hotels API đã sẵn nhưng UI mới ngoài scope.

Bằng chứng P2 và giới hạn: [RECOVERY_PLAN.md — mục 9](RECOVERY_PLAN.md#9-kết-quả-thực-tế-p2--19102026). Live test chạy service TypeScript qua Jest/Node HTTP adapter; chưa nghiệm thu lại APK/emulator trong P2. Bản dịch catalog theo ID cũ, UI null/fallback còn thuộc P3; nghiệm thu Android core thuộc P4. Không yêu cầu User xử lý blocker cho P2; không sửa BE/DB/Cloud Run, không commit/deploy; không tạo file audit/log tạm.

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

P1 đã được yêu cầu và hoàn thành. B01 đã gỡ; các phase chưa được yêu cầu giữ Pending. Các điều kiện runtime Map/GPS/iOS không thuộc gate P1.

| Mã | Điều kiện hiện tại | Ảnh hưởng | Ai xử lý / điều kiện gỡ chặn |
|---|---|---|---|
| B01 | Đã gỡ: User cài SDK C:/Android/Sdk; Agent sửa sdk.dir local từ đường dẫn cũ, boot Pixel_Test. Gradle cài NDK 26.1.10909125/CMake 3.22.1/Platform 35 bằng licenses có sẵn; build/install/launch pass | Không còn chặn P1.5/P1.6 | SDK/adb dùng đường dẫn tuyệt đối và env theo tiến trình; không sửa env global. Hướng dẫn bên dưới giữ làm lịch sử |
| B02 | Native Mapbox đã resolve/compile trong build P1 thành công; giữ autolink và dependency hiện có. Runtime map/token/GPS chưa thử vì flag tắt | Không chặn P1; P5 runtime vẫn chưa xác minh | Chỉ kiểm tra runtime map khi có yêu cầu P5; chưa coi native build pass là map hoạt động |
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
| 19/10/2026 | P1.1–P1.4 Pending → Completed; P1.5–P1.6 Pending → Blocked | Guest shell, flag/service/route gates, local search/UI, error/retry; 7 tests P1 pass; Metro ghi bundle + 40 assets. Debug build exit 1 do SDK missing | App.tsx; flags; AppContainer; Home/Festival/Detail; SemanticSearchBarComponent, CatalogStatus; TranslationContext; common vi/en JSON; axios, locations/festivals, AzureTranslatorService; bỏ log auth/chatbot; 3 guest*.test.js; RECOVERY_* | Chưa APK/launch/device request log; chưa kiểm chứng native Mapbox. Xem hướng dẫn B01 |
| 19/10/2026 | P1.5/P1.6 Blocked → In Progress → Completed | SDK mới C:/Android/Sdk; assembleDebug exit 0 (11m21s; build xác nhận sau sửa JS 21s), install Success, Home Guest mở trên Android 14. Runtime phát hiện AI toggle còn sót ở màn kết quả, đã gate và kiểm tra lại; 9/9 tests P1 pass, external fetch/XHR=0 trong phiên quan sát | android/local.properties (ignored, chỉ sdk.dir); ViewAllLocation.tsx, ViewAllFestivals.tsx; guestMode.test.js; RECOVERY_*; docs/recovery/p1 ảnh/audit | Chưa nối backend thật, chưa nghiệm thu list/detail có dữ liệu; P2/P3/P4 chưa triển khai. Typecheck toàn repo vẫn 66 diagnostics; không tuyên bố toàn repo sạch |
| 19/10/2026 | Bổ sung quy ước sau P1 | Giữ code tạm bỏ qua trong comment, phục hồi tab/route/import, bubble, loader GPS/nearby và renderer Items; 9/9 tests pass, lint 0 errors/14 warnings. Dọn file tạm, giữ tài liệu tổng hợp và APK | App.tsx, AppContainer.tsx, HomeScreen.tsx, FestivalsScreen.tsx, RECOVERY_*, docs/recovery/p1/README.md | Không rebuild Android cho thay đổi comment; không sửa index Git đã được User stage, không xóa app data |

### Bằng chứng P1 — kết quả cuối cùng

- [Báo cáo smoke tổng hợp](docs/recovery/p1/README.md): Home Guest đã mở trên Pixel_Test, Android 14/API 34/x86_64. Build debug exit 0, install Success; không login/GPS prompt, Home/Festival retry hoạt động, search và View All chỉ keyword, UI vi/en local, restart giữ ngôn ngữ. Ảnh và raw audit tạm đã được dọn theo yêu cầu bổ sung.
- Tests P1 cuối: **3 suites / 9 tests pass**, thêm 2 tests cho AI toggle còn sót tại ViewAllLocation/ViewAllFestivals. ESLint 2 màn hình và test sửa ở đợt tiếp tục: **exit 0, 0 errors / 4 warnings**. Typecheck chạy lại **exit 2 / 66 diagnostics**, cùng số lượng đợt trước; `git diff --check` pass.
- `assembleDebug --console=plain`: **exit 0, BUILD SUCCESSFUL in 11m21s**, 648 tasks (544 executed / 104 up-to-date). Build xác nhận sau sửa JS: **exit 0, 21s**, 648 tasks (38 executed / 610 up-to-date). Không nâng cấp, pin hoặc loại native module. APK debug tại `android/app/build/outputs/apk/debug/app-debug.apk`, dùng Metro hiện hành theo chế độ debug chuẩn.
- Observer local tạm chỉ đếm fetch/XHR, không thay response/chặn network: 70 records từ 16:53:01 đến 16:58:57, external=0 và không fatal/JS errors theo mẫu đã kiểm tra. Không log URL/header/body/key. Đây không phải packet capture native/WebSocket; không suy diễn runtime map hay mọi luồng chưa mở. Sau smoke đã khôi phục Metro/Home tiếng Việt; sau yêu cầu dọn dẹp đã đóng các helper và xóa file tạm, giữ nguyên app data.

### Lịch sử lần P1 đầu và hướng dẫn đã dùng để gỡ B01

- `node node_modules/jest/bin/jest.js __tests__/guestMode.test.js __tests__/guestNavigation.test.js __tests__/guestTranslation.test.js --runInBand`: **3 suites / 7 tests pass**. Mock chỉ nằm trong tests, không tạo catalog mẫu trong app.
- Metro Android dev bundle: `node node_modules/react-native/cli.js bundle --platform android --dev true --entry-file index.js --bundle-output node_modules/.cache/travel-p1/bundle/index.android.bundle --assets-dest node_modules/.cache/travel-p1/bundle/assets --max-workers 2`: ghi bundle và copy 40 assets thành công. Cần chạy ngoài sandbox khi EPERM đọc user directory; không sửa CLI/dependency để né lỗi quyền.
- `android/gradlew.bat assembleDebug --console=plain`: **exit 1**, SDK location not found. Đây là blocker môi trường, không phải bằng chứng lỗi Reanimated/Mapbox cần nâng cấp. Chưa build APK.
- ESLint các file P1 được kiểm tra: **exit 0, 0 errors, 32 warnings**; kiểm tra thêm auth/chatbot/guestTranslation không báo lỗi. Chưa tuyên bố lint toàn repo sạch. Typecheck toàn repo **exit 2**, 66 diagnostics; so compiler diagnostics với source HEAD qua readFile overlay (không đổi working tree): baseline 71, P1 66; không xuất hiện cặp file/mã lỗi mới, lỗi i18n v3/v4 cũ vẫn còn (message thay đổi theo resource JSON).
- Full Jest ở đợt P1 trước: **exit 1, 5 suites pass / 7 suites fail; 45 tests pass / 21 fail**. Các file test cũ chưa đạt: semantic API mocks, i18n, Azure (kỳ vọng gọi dịch vụ trong khi recovery tắt), App native mocks; ba suite thiếu `@testing-library/react-native`. Đợt tiếp tục chỉ chạy lại tests liên quan P1, không khẳng định đã sửa full suite.
- Raw logs/bundle/observer/UI XML trong `node_modules/.cache/travel-p1/` và raw audit trong docs đã được dọn theo yêu cầu bổ sung; chỉ giữ số liệu tổng hợp trong tài liệu, không đưa bundle chứa cấu hình local vào Git.
- User: trong **Android Studio → SDK Manager**, cài Android SDK Platform 34, Build-Tools 34.0.0, Platform-Tools, Command-line Tools và NDK 26.1.10909125 theo cấu hình hiện có; hoàn tất chấp nhận licenses. Đặt `sdk.dir` trong `android/local.properties` và `ANDROID_HOME` tới thư mục SDK thực tế (giữ credential local, không gửi token vào chat).
- Trong **Device Manager**, tạo/chạy AVD; hoặc bật USB debugging trên điện thoại và chấp nhận kết nối máy. Xác minh `<SDK>/platform-tools/adb.exe devices -l` có thiết bị `device`.
- Sau đó chạy lại `android/gradlew.bat assembleDebug`, mở Metro (`node node_modules/react-native/cli.js start`), `adb reverse tcp:8081 tcp:8081`, install APK debug và launch `com.travel`. Cần xác nhận Home guest, retry, Festival, không GPS/login và quan sát request/log trước khi đổi P1.5/P1.6 sang Completed. Chỉ tiếp tục P1, không tự chuyển P2.

Mẫu cập nhật sau mỗi phase: `Ngày | Phase/task | trạng thái trước → sau | file thực đổi | lệnh/test/thiết bị/kết quả | blocker + owner + điều kiện gỡ`. Chỉ ghi thông tin đã kiểm chứng; không chép log dài, request header credential hoặc kết quả lịch sử thành bằng chứng mới.

**Điểm dừng hiện tại:** **P1 Completed, 6/6 task**. Android debug build và Home Guest trên emulator đã được kiểm chứng. P2–P5 vẫn Pending, chờ yêu cầu riêng; không commit/deploy.
