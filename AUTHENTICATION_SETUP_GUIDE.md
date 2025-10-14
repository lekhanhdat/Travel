# 🔐 HƯỚNG DẪN THIẾT LẬP HỆ THỐNG AUTHENTICATION

## 🎉 **CẬP NHẬT MỚI NHẤT**

### **✅ ĐÃ TÍCH HỢP SENDGRID VÀ BCRYPT**

1. **SendGrid Email Service** ✅
   - Gửi OTP thật qua email
   - API Key đã được cấu hình
   - Email template đẹp với HTML

2. **Bcrypt Password Hashing** ✅
   - Mật khẩu được hash trước khi lưu
   - Salt rounds: 10
   - An toàn hơn nhiều so với plain text

3. **OTP Expiry & Rate Limiting** ✅
   - OTP hết hạn sau 5 phút
   - Giới hạn 3 lần gửi trong 10 phút
   - Tự động xóa OTP đã sử dụng hoặc hết hạn

4. **Profile Screen Updates** ✅
   - Hiển thị ProfileSvg khi chưa có avatar
   - Hiển thị fullName thay vì userName
   - Hiển thị đầy đủ thông tin: Họ tên, Username, Email

---

## ✅ ĐÃ HOÀN THÀNH

### 1. **Tạo API Service** ✅
**File: `Travel/src/services/auth.api.ts`**

Đã tạo đầy đủ các API functions:
- ✅ `getAccounts()` - Lấy danh sách accounts từ NocoDB
- ✅ `login()` - Xác thực đăng nhập
- ✅ `signUp()` - Đăng ký tài khoản mới
- ✅ `checkEmailExists()` - Kiểm tra email tồn tại
- ✅ `updatePassword()` - Cập nhật mật khẩu mới
- ✅ `generateOTP()` - Tạo mã OTP 6 số
- ✅ `sendOTPEmail()` - Gửi OTP qua email (mock)

**Table ID đã được cấu hình:** `mad8fvjhd0ba1bk`

---

### 2. **Cập nhật Interface IAccount** ✅
**File: `Travel/src/common/types.tsx`**

```typescript
export interface IAccount {
  Id?: number; // NocoDB primary key
  userName: string;
  password: string;
  fullName?: string; // Họ và tên đầy đủ
  email?: string; // Email for password recovery
  avatar?: string; // Avatar URL (optional, default to ProfileSvg)
  CreatedAt?: string; // Timestamp
}
```

---

### 3. **Cập nhật LoginScreen** ✅
**File: `Travel/src/container/screens/Login/LoginScreen.tsx`**

**Thay đổi:**
- ✅ Xóa import `accounts` từ `authConstants`
- ✅ Thay thế hardcoded authentication bằng `authApi.login()`
- ✅ Thêm loading state với ActivityIndicator
- ✅ Xử lý lỗi kết nối server
- ✅ Hiển thị toast messages rõ ràng

**Tính năng:**
- Không còn sử dụng data cứng
- Nếu server lỗi → Hiển thị thông báo lỗi kết nối
- Không có fallback tài khoản backup

---

### 4. **Tạo SignUpScreen Mới** ✅
**File: `Travel/src/container/screens/Login/SignUpScreen.tsx`**

**Các trường input:**
- ✅ Họ và tên (fullName)
- ✅ Tên đăng nhập (userName)
- ✅ Email
- ✅ Mật khẩu (password)
- ✅ Xác nhận mật khẩu (confirmPassword)

**Validation:**
- ✅ Kiểm tra đầy đủ thông tin
- ✅ Kiểm tra mật khẩu trùng khớp
- ✅ Kiểm tra độ dài mật khẩu (≥6 ký tự)
- ✅ Kiểm tra email hợp lệ (regex)
- ✅ Kiểm tra username/email đã tồn tại (từ API)

**UI:**
- ✅ Illustration ở đầu trang
- ✅ Loading indicator khi đang xử lý
- ✅ Link quay lại đăng nhập

---

### 5. **Tạo ForgotPasswordScreen Mới** ✅
**File: `Travel/src/container/screens/Login/ForgotPasswordScreen.tsx`**

**Flow 3 bước:**

#### **Bước 1: Nhập Email**
- Input: Email
- Validation: Email hợp lệ và tồn tại trong hệ thống
- Action: Gửi OTP qua email

#### **Bước 2: Nhập OTP**
- Input: Mã OTP 6 số
- Validation: OTP khớp với mã đã gửi
- Action: Xác thực và chuyển sang bước 3
- Có nút "Gửi lại mã"

#### **Bước 3: Đặt mật khẩu mới**
- Input: Mật khẩu mới + Xác nhận mật khẩu
- Validation: Mật khẩu trùng khớp và ≥6 ký tự
- Action: Cập nhật mật khẩu và navigate về login

**UI:**
- ✅ Mỗi bước có illustration riêng
- ✅ Loading indicator
- ✅ Toast messages rõ ràng

---

## 📋 CÁC BƯỚC CẦN THỰC HIỆN

### **BƯỚC 1: Kiểm tra bảng Accounts trên NocoDB** ✅

Bạn đã tạo bảng với Table ID: `mad8fvjhd0ba1bk`

Đảm bảo bảng có các fields:

| Field Name | Field Type | Required | Unique | Notes |
|------------|------------|----------|--------|-------|
| `Id` | Auto Number | Yes | Yes | Primary key |
| `userName` | SingleLineText | Yes | Yes | Tên đăng nhập |
| `password` | SingleLineText | Yes | No | Mật khẩu (plain text) |
| `fullName` | SingleLineText | Yes | No | Họ và tên |
| `email` | Email | Yes | Yes | Email |
| `avatar` | SingleLineText | No | No | URL avatar (optional) |
| `CreatedAt` | DateTime | No | No | Auto timestamp |

---

### **BƯỚC 2: Test các chức năng**

#### **Test 1: Đăng ký tài khoản mới**
1. Mở app → Click "Đăng ký"
2. Nhập đầy đủ thông tin:
   - Họ và tên: "Nguyễn Văn A"
   - Tên đăng nhập: "nguyenvana"
   - Email: "nguyenvana@gmail.com"
   - Mật khẩu: "123456"
   - Xác nhận mật khẩu: "123456"
3. Click "Đăng ký"
4. **Expected:** Toast "Đăng ký thành công!" → Navigate về login
5. **Kiểm tra NocoDB:** Tài khoản mới đã được tạo

#### **Test 2: Đăng nhập**
1. Mở app → Nhập username và password vừa tạo
2. Click "Đăng nhập"
3. **Expected:** Toast "Đăng nhập thành công!" → Navigate vào app

#### **Test 3: Quên mật khẩu**
1. Mở app → Click "Quên mật khẩu?"
2. **Bước 1:** Nhập email đã đăng ký → Click "Gửi mã xác thực"
3. **Kiểm tra console:** Xem mã OTP được log ra (vì chưa có email service thật)
   ```
   ========================================
   📧 EMAIL SENT TO: nguyenvana@gmail.com
   🔢 OTP CODE: 123456
   ⏰ Valid for: 5 minutes
   ========================================
   ```
4. **Bước 2:** Nhập mã OTP từ console → Click "Xác nhận"
5. **Bước 3:** Nhập mật khẩu mới → Click "Đặt lại mật khẩu"
6. **Expected:** Toast "Đặt lại mật khẩu thành công!" → Navigate về login
7. **Test login:** Đăng nhập với mật khẩu mới

#### **Test 4: Validation errors**
- Đăng ký với email không hợp lệ → Toast "Email không hợp lệ"
- Đăng ký với mật khẩu < 6 ký tự → Toast "Mật khẩu phải có ít nhất 6 ký tự"
- Đăng ký với mật khẩu không khớp → Toast "Mật khẩu nhập lại không khớp"
- Đăng ký với username đã tồn tại → Toast "Tên đăng nhập đã tồn tại"
- Đăng nhập sai thông tin → Toast "Tên tài khoản hoặc mật khẩu không chính xác"

#### **Test 5: Lỗi kết nối**
1. Tắt wifi/internet
2. Thử đăng nhập
3. **Expected:** Toast "Lỗi kết nối - Không thể kết nối đến server"

---

### **BƯỚC 3: Tích hợp Email Service (Optional)**

Hiện tại OTP chỉ được log ra console. Để gửi email thật, cần:

#### **Option 1: SendGrid (Recommended)**
1. Đăng ký tài khoản SendGrid: https://sendgrid.com/
2. Lấy API Key
3. Cài package:
   ```bash
   npm install @sendgrid/mail
   ```
4. Cập nhật `authApi.sendOTPEmail()`:
   ```typescript
   import sgMail from '@sendgrid/mail';
   
   sendOTPEmail: async (email: string, otp: string): Promise<boolean> => {
     sgMail.setApiKey(process.env.SENDGRID_API_KEY);
     
     const msg = {
       to: email,
       from: 'noreply@yourapp.com',
       subject: 'Mã xác thực đặt lại mật khẩu',
       text: `Mã xác thực của bạn là: ${otp}`,
       html: `<strong>Mã xác thực của bạn là: ${otp}</strong>`,
     };
     
     try {
       await sgMail.send(msg);
       return true;
     } catch (error) {
       console.error('❌ SendGrid error:', error);
       return false;
     }
   }
   ```

#### **Option 2: Nodemailer với Gmail**
1. Cài package:
   ```bash
   npm install nodemailer
   ```
2. Cấu hình Gmail App Password
3. Cập nhật `authApi.sendOTPEmail()` với Nodemailer

---

### **BƯỚC 4: Cập nhật Profile Screen để hiển thị avatar mặc định**

Khi user chưa có avatar, hiển thị ProfileSvg:

**File: `Travel/src/container/screens/Personal/Personal.tsx`**

```typescript
import {ProfileSvg} from '../../../assets/ImageSvg';

// Trong render:
{account?.avatar ? (
  <Image
    source={{uri: account.avatar}}
    style={styles.avatar}
  />
) : (
  <ProfileSvg
    width={sizes._60sdp}
    height={sizes._60sdp}
    color={colors.primary}
  />
)}
```

---

## 🔒 BẢO MẬT

### **⚠️ LƯU Ý QUAN TRỌNG**

1. **Mật khẩu đang lưu plain text** ❌
   - Hiện tại mật khẩu lưu trực tiếp không mã hóa
   - **Khuyến nghị:** Sử dụng bcrypt để hash mật khẩu trước khi lưu
   
2. **OTP không có thời gian hết hạn** ❌
   - Hiện tại OTP không có expiry time
   - **Khuyến nghị:** Lưu timestamp và kiểm tra OTP hết hạn sau 5 phút

3. **Không có rate limiting** ❌
   - User có thể spam request OTP
   - **Khuyến nghị:** Giới hạn số lần gửi OTP (ví dụ: 3 lần/10 phút)

---

## 📝 CHECKLIST HOÀN THÀNH

- [x] Tạo bảng Accounts trên NocoDB
- [x] Cập nhật Table ID trong `auth.api.ts`
- [x] Cập nhật interface IAccount
- [x] Rewrite LoginScreen với API
- [x] Tạo SignUpScreen mới
- [x] Tạo ForgotPasswordScreen với OTP flow
- [ ] Test đăng ký tài khoản
- [ ] Test đăng nhập
- [ ] Test quên mật khẩu
- [ ] Test validation errors
- [ ] Test lỗi kết nối
- [ ] (Optional) Tích hợp email service
- [ ] (Optional) Cập nhật Profile screen với avatar mặc định
- [ ] (Optional) Implement password hashing
- [ ] (Optional) Implement OTP expiry
- [ ] (Optional) Implement rate limiting

---

## 🎉 KẾT QUẢ

Sau khi hoàn thành, bạn sẽ có:

✅ Hệ thống authentication hoàn chỉnh với NocoDB
✅ Đăng ký tài khoản với validation đầy đủ
✅ Đăng nhập với xác thực từ server
✅ Quên mật khẩu với OTP qua email
✅ Không còn sử dụng hardcoded data
✅ Error handling rõ ràng
✅ UI đẹp với illustrations

---

## 🐛 TROUBLESHOOTING

### **Lỗi: "Module has no default export"**
- **Nguyên nhân:** Import sai cú pháp
- **Giải pháp:** Đã sửa `import request from './axios'` → `import {request} from './axios'`

### **Lỗi: "Property 'LOGIN' does not exist"**
- **Nguyên nhân:** Sử dụng sai tên ScreenName
- **Giải pháp:** Đã sửa `ScreenName.LOGIN` → `ScreenName.LOGIN_SCREEN`

### **Lỗi: "Cannot connect to server"**
- **Nguyên nhân:** NocoDB API không khả dụng hoặc Table ID sai
- **Giải pháp:** Kiểm tra Table ID và API token trong `axios.ts`

---

**Chúc bạn thành công! 🚀**

