# Danavi — Nội dung Google Play (bản nháp, chủ sở hữu duyệt trước khi nhập vào Play Console)

> Trạng thái: NHÁP do Claude soạn 2026-11-11 dựa trên tính năng thực có trong mã nguồn. Chủ sở hữu phải đọc, sửa và tự nhập vào Play Console (MANUAL-05). Không được hứa tính năng app không có.

## Thông tin chính

| Trường | Giá trị đề xuất |
|---|---|
| Tên ứng dụng (≤30 ký tự) | **Danavi** (có thể dùng "Danavi – Du lịch Đà Nẵng", 24 ký tự) |
| Danh mục | Du lịch & Địa phương (Travel & Local) |
| Package | `com.travel` (giữ nguyên — không đổi được sau khi phát hành lần đầu; cân nhắc ở mục "Quyết định" bên dưới) |
| Biểu tượng cửa hàng | `Danavi_Android_Icon_Kit/play-store/danavi-google-play-512-full-logo.png` (512×512 PNG 32-bit, ≤1 MB) |
| Ảnh nổi bật (feature graphic) | **Chưa có** — cần 1024×500 JPG/PNG 24-bit (MANUAL-06) |
| Ảnh chụp màn hình | **Chưa có** — tối thiểu 2, khuyến nghị 4–8 ảnh điện thoại; tỉ lệ 16:9 hoặc 9:16, cạnh 320–3840 px (MANUAL-07). Gợi ý: Trang chủ, Lễ hội, Bản đồ, Máy ảnh nhận diện, Trợ lý AI, Chi tiết địa điểm |
| Email liên hệ nhà phát triển | **Bắt buộc** — chủ sở hữu cung cấp |
| Website / Chính sách quyền riêng tư | **Bắt buộc URL công khai** — xem `PRIVACY_POLICY_DRAFT.md` |

## Mô tả ngắn (≤80 ký tự)

Tiếng Việt (71 ký tự):
> Khám phá Đà Nẵng: địa điểm, lễ hội, bản đồ và trợ lý AI du lịch trong tay.

English (75 chars):
> Explore Da Nang: places, festivals, maps and an AI travel assistant in one app.

## Mô tả đầy đủ (≤4000 ký tự) — Tiếng Việt

Danavi là ứng dụng du lịch dành riêng cho Đà Nẵng, giúp bạn tìm hiểu và lên kế hoạch khám phá thành phố biển một cách dễ dàng.

🌉 KHÁM PHÁ ĐỊA ĐIỂM
• Danh sách địa điểm phổ biến kèm mô tả, hình ảnh và đánh giá từ cộng đồng
• Tìm kiếm thông minh theo tên, địa chỉ hoặc mô tả
• Gợi ý địa điểm gần bạn dựa trên vị trí hiện tại (chỉ khi bạn cho phép)

🎉 LỄ HỘI & SỰ KIỆN
• Theo dõi các lễ hội và sự kiện đang và sắp diễn ra tại Đà Nẵng

🗺️ BẢN ĐỒ TƯƠNG TÁC
• Xem địa điểm và lễ hội trên bản đồ
• Chỉ đường đến điểm đến bạn chọn

📷 NHẬN DIỆN BẰNG MÁY ẢNH
• Chụp ảnh một địa danh để nhận thông tin về địa điểm đó

🤖 TRỢ LÝ AI DU LỊCH
• Hỏi đáp về địa điểm, ẩm thực, lịch trình tại Đà Nẵng
• Hỗ trợ tiếng Việt và tiếng Anh

📰 BẢNG TIN & ĐÁNH GIÁ
• Chia sẻ trải nghiệm, xem đánh giá của du khách khác

🆘 TIỆN ÍCH
• Gọi nhanh số khẩn cấp
• Chuyển đổi ngôn ngữ Việt / Anh
• Dùng ngay không cần đăng nhập; đăng ký tài khoản để viết đánh giá và lưu thông tin cá nhân. Bạn có thể xóa tài khoản bất cứ lúc nào trong ứng dụng.

Danavi — Khám phá Đà Nẵng cùng Danavi.

## Full description — English

Danavi is a travel app dedicated to Da Nang, Vietnam, helping you discover and plan your trip around the coastal city.

🌉 DISCOVER PLACES — popular spots with descriptions, photos and community reviews; smart search; nearby suggestions based on your location (only with your permission).
🎉 FESTIVALS & EVENTS — follow current and upcoming festivals in Da Nang.
🗺️ INTERACTIVE MAP — see places and festivals on the map and get directions.
📷 CAMERA RECOGNITION — snap a landmark to learn about it.
🤖 AI TRAVEL ASSISTANT — ask about places, food and itineraries, in Vietnamese or English.
📰 FEED & REVIEWS — share your experience and read other travellers' reviews.
🆘 UTILITIES — quick emergency call, Vietnamese/English switch. Use it without signing in; create an account to post reviews. You can delete your account anytime in the app.

## Bảng câu hỏi xếp hạng nội dung (IARC) — gợi ý trả lời

- Bạo lực / tình dục / ngôn từ thô tục / ma túy / cờ bạc: **Không**
- Người dùng có thể tương tác / chia sẻ nội dung với nhau: **Có** (bảng tin, đánh giá) → cần có cơ chế báo cáo nội dung: **Có** (`/reviews/{id}/report`)
- Chia sẻ vị trí với người dùng khác: **Không**
- Mua hàng kỹ thuật số: **Không** (nếu ẩn tính năng Ủng hộ — xem PROGRESS, H7)
- Kỳ vọng: xếp hạng 3+/Mọi lứa tuổi hoặc Teen tùy nội dung do người dùng tạo.

## Đối tượng mục tiêu
- Độ tuổi: **18+** (khuyến nghị — app có nội dung do người dùng tạo, tài khoản, AI chat; tránh chính sách Gia đình).
- Không thiết kế cho trẻ em.

## Quyết định chủ sở hữu cần đưa ra
1. **Package name `com.travel`**: rất chung chung và sẽ cố định vĩnh viễn sau lần phát hành đầu. Có thể đã bị người khác đăng ký trên Google Play → upload sẽ bị từ chối. Đề xuất cân nhắc `vn.danavi.app` (hoặc tương tự) **trước** lần upload đầu tiên. Đổi là thay đổi lớn (applicationId; namespace/thư mục Kotlin có thể giữ), cần duyệt riêng.
2. Tính năng **Ủng hộ** (thanh toán ngoài qua link/QR) — ẩn trong bản phát hành hay tích hợp Google Play Billing.
