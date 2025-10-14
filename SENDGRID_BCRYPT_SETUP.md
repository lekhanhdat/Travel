# 🚀 CẬP NHẬT: SENDGRID + BCRYPT + OTP EXPIRY + RATE LIMITING

## ✅ ĐÃ HOÀN THÀNH

### **1. Cài đặt packages** ✅
```bash
npm install @sendgrid/mail bcryptjs
npm install --save-dev @types/bcryptjs
```

---

### **2. Cập nhật `auth.api.ts`** ✅

#### **A. Import và Configuration**
```typescript
import sgMail from '@sendgrid/mail';
import bcrypt from 'bcryptjs';

// SendGrid API Key
const SENDGRID_API_KEY = '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';
sgMail.setApiKey(SENDGRID_API_KEY);

// OTP Configuration
const OTP_EXPIRY_MINUTES = 5; // OTP hết hạn sau 5 phút
const OTP_RATE_LIMIT_COUNT = 3; // Giới hạn 3 lần gửi
const OTP_RATE_LIMIT_WINDOW_MINUTES = 10; // Trong 10 phút

// Bcrypt salt rounds
const SALT_ROUNDS = 10;
```

#### **B. OTP Storage (In-Memory)**
```typescript
interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: number; // Timestamp
  attempts: number;
  lastAttemptAt: number; // Timestamp
}

const otpStorage: Map<string, OTPRecord> = new Map();
```

#### **C. Updated Functions**

**1. `login()` - Với bcrypt compare**
```typescript
login: async (userName: string, password: string): Promise<IAccount | null> => {
  const accounts = await authApi.getAccounts();
  const account = accounts.find(acc => acc.userName === userName);
  
  if (!account) return null;
  
  // Compare password with hashed password
  const isPasswordValid = await bcrypt.compare(password, account.password);
  
  return isPasswordValid ? account : null;
}
```

**2. `signUp()` - Hash password trước khi lưu**
```typescript
signUp: async (userName, password, fullName, email): Promise<IAccount> => {
  // Check existing user...
  
  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  
  const newAccount = {
    userName,
    password: hashedPassword, // Store hashed password
    fullName,
    email,
    avatar: '',
  };
  
  const res = await request.post(URL_CREATE_ACCOUNT, newAccount);
  return res.data;
}
```

**3. `updatePassword()` - Hash password mới**
```typescript
updatePassword: async (accountId: number, newPassword: string): Promise<void> => {
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  await request.patch(URL_UPDATE_ACCOUNT, [
    {
      Id: accountId,
      password: hashedPassword,
    },
  ]);
}
```

**4. `checkOTPRateLimit()` - Kiểm tra rate limiting**
```typescript
checkOTPRateLimit: (email: string): boolean => {
  const record = otpStorage.get(email);
  if (!record) return false;
  
  const now = Date.now();
  const windowStart = now - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
  
  if (record.lastAttemptAt > windowStart) {
    if (record.attempts >= OTP_RATE_LIMIT_COUNT) {
      return true; // Rate limit exceeded
    }
  } else {
    record.attempts = 0; // Reset attempts
  }
  
  return false;
}
```

**5. `sendOTPEmail()` - Gửi email thật qua SendGrid**
```typescript
sendOTPEmail: async (email: string): Promise<{
  success: boolean;
  otp?: string;
  error?: string;
}> => {
  // Check rate limiting
  if (authApi.checkOTPRateLimit(email)) {
    return {
      success: false,
      error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau X phút.',
    };
  }
  
  // Generate OTP
  const otp = authApi.generateOTP();
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;
  
  // Store OTP record
  const existingRecord = otpStorage.get(email);
  otpStorage.set(email, {
    email,
    otp,
    expiresAt,
    attempts: existingRecord ? existingRecord.attempts + 1 : 1,
    lastAttemptAt: now,
  });
  
  // Send email via SendGrid
  const msg = {
    to: email,
    from: 'noreply@travelapp.com',
    subject: 'Mã xác thực đặt lại mật khẩu - Travel App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Travel App.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 36px; margin: 0;">${otp}</h1>
        </div>
        <p>Mã xác thực này có hiệu lực trong <strong>${OTP_EXPIRY_MINUTES} phút</strong>.</p>
        <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };
  
  await sgMail.send(msg);
  
  return {success: true, otp};
}
```

**6. `verifyOTP()` - Xác thực OTP với expiry check**
```typescript
verifyOTP: (email: string, otp: string): {valid: boolean; error?: string} => {
  const record = otpStorage.get(email);
  
  if (!record) {
    return {valid: false, error: 'Mã xác thực không tồn tại'};
  }
  
  const now = Date.now();
  
  // Check if OTP expired
  if (now > record.expiresAt) {
    otpStorage.delete(email); // Clean up expired OTP
    return {valid: false, error: 'Mã xác thực đã hết hạn'};
  }
  
  // Check if OTP matches
  if (record.otp !== otp) {
    return {valid: false, error: 'Mã xác thực không chính xác'};
  }
  
  otpStorage.delete(email); // Clean up used OTP
  return {valid: true};
}
```

---

### **3. Cập nhật `ForgotPasswordScreen.tsx`** ✅

**Thay đổi state:**
```typescript
type ForgotPasswordState = {
  email: string;
  otp: string;
  // Removed: generatedOtp (now handled by authApi)
  newPassword: string;
  confirmPassword: string;
  step: 1 | 2 | 3;
  loading: boolean;
  accountId: number | null;
  isSecureTextEntry: boolean;
  isSecureTextEntryConfirm: boolean;
};
```

**Updated `handleSendOTP()`:**
```typescript
handleSendOTP = async () => {
  // ... validation ...
  
  const account = await authApi.checkEmailExists(email);
  if (!account) { /* error */ }
  
  // Send OTP via SendGrid (with rate limiting)
  const result = await authApi.sendOTPEmail(email);
  
  if (!result.success) {
    Toast.show({
      type: 'error',
      text1: 'Không thể gửi mã xác thực',
      text2: result.error,
    });
    return;
  }
  
  // Move to step 2
  this.setState({
    accountId: account.Id ?? null,
    step: 2,
    loading: false,
  });
}
```

**Updated `handleVerifyOTP()`:**
```typescript
handleVerifyOTP = () => {
  const {otp, email} = this.state;
  
  // Verify OTP with authApi (checks expiry and validity)
  const result = authApi.verifyOTP(email, otp);
  
  if (!result.valid) {
    Toast.show({
      type: 'error',
      text1: result.error || 'Mã xác thực không hợp lệ',
    });
    return;
  }
  
  Toast.show({type: 'success', text1: 'Xác thực thành công'});
  this.setState({step: 3});
}
```

---

### **4. Cập nhật Profile Screens** ✅

**ProfileScreen.tsx và Personal.tsx:**

```typescript
{/* Avatar - Show ProfileSvg if no avatar */}
{account?.avatar ? (
  <Image
    source={{uri: account.avatar}}
    style={{
      borderRadius: 100,
      width: sizes._60sdp,
      height: sizes._60sdp,
    }}
  />
) : (
  <View>
    <ProfileSvg
      width={sizes._60sdp}
      height={sizes._60sdp}
      color={colors.primary}
    />
  </View>
)}

{/* Display fullName instead of userName */}
<TextBase style={AppStyle.txt_18_bold_review}>
  {account?.fullName || account?.userName}
</TextBase>
```

**Personal.tsx - Hiển thị thông tin đầy đủ:**
```typescript
{/* Họ và tên */}
<View style={{marginBottom: sizes._16sdp}}>
  <TextBase style={[AppStyle.txt_16_bold, {color: colors.primary_400}]}>
    Họ và tên
  </TextBase>
  <TextBase style={[AppStyle.txt_18_bold, {color: colors.primary_950}]}>
    {account?.fullName || 'Chưa cập nhật'}
  </TextBase>
</View>

{/* Tên đăng nhập */}
<View style={{marginBottom: sizes._16sdp}}>
  <TextBase style={[AppStyle.txt_16_bold, {color: colors.primary_400}]}>
    Tên đăng nhập
  </TextBase>
  <TextBase style={[AppStyle.txt_18_bold, {color: colors.primary_950}]}>
    {account?.userName || 'Chưa cập nhật'}
  </TextBase>
</View>

{/* Email */}
<View style={{marginBottom: sizes._16sdp}}>
  <TextBase style={[AppStyle.txt_16_bold, {color: colors.primary_400}]}>
    Email
  </TextBase>
  <TextBase style={[AppStyle.txt_18_bold, {color: colors.primary_950}]}>
    {account?.email || 'Chưa cập nhật'}
  </TextBase>
</View>
```

---

## 🎯 NHỮNG GÌ ĐÃ CẢI THIỆN

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| **Password Storage** | Plain text ❌ | Bcrypt hashed ✅ |
| **OTP Delivery** | Console log ❌ | SendGrid email ✅ |
| **OTP Expiry** | Không có ❌ | 5 phút ✅ |
| **Rate Limiting** | Không có ❌ | 3 lần/10 phút ✅ |
| **Avatar Display** | Broken image ❌ | ProfileSvg fallback ✅ |
| **Name Display** | userName ❌ | fullName ✅ |

---

## 📋 HƯỚNG DẪN TEST

### **Test 1: Đăng ký với password hashing**
1. Đăng ký tài khoản mới
2. Kiểm tra NocoDB → Password field sẽ là hash (ví dụ: `$2a$10$...`)
3. Đăng nhập với password gốc → Thành công ✅

### **Test 2: Quên mật khẩu với SendGrid**
1. Click "Quên mật khẩu"
2. Nhập email đã đăng ký
3. **Kiểm tra email** → Nhận được email với mã OTP
4. Nhập OTP từ email → Xác thực thành công
5. Đặt mật khẩu mới → Thành công
6. Đăng nhập với mật khẩu mới → Thành công ✅

### **Test 3: OTP Expiry**
1. Gửi OTP
2. **Đợi 6 phút** (sau khi OTP hết hạn)
3. Nhập OTP → Toast "Mã xác thực đã hết hạn" ✅

### **Test 4: Rate Limiting**
1. Gửi OTP lần 1 → Thành công
2. Gửi OTP lần 2 → Thành công
3. Gửi OTP lần 3 → Thành công
4. Gửi OTP lần 4 → Toast "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau X phút" ✅

### **Test 5: Profile Screen**
1. Vào trang Cá nhân
2. **Kiểm tra avatar:** Nếu chưa có → Hiển thị ProfileSvg màu primary ✅
3. **Kiểm tra tên:** Hiển thị fullName thay vì userName ✅
4. **Kiểm tra thông tin:** Họ tên, Username, Email đều hiển thị đầy đủ ✅

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **SendGrid Configuration**
- **Sender Email:** Hiện tại dùng `noreply@travelapp.com`
- **Cần verify sender:** Vào SendGrid Dashboard → Settings → Sender Authentication
- **Nếu chưa verify:** Email sẽ không gửi được, cần verify domain hoặc single sender

### **OTP Storage**
- Hiện tại lưu trong memory (Map)
- **Production:** Nên dùng Redis hoặc database để lưu OTP
- **Lý do:** Nếu server restart, OTP sẽ mất

### **Password Migration**
- **Tài khoản cũ:** Nếu có tài khoản với plain text password, cần migrate
- **Cách migrate:** Chạy script để hash tất cả password cũ

---

## 🎉 KẾT QUẢ

Bây giờ hệ thống authentication của bạn đã:
- ✅ **An toàn hơn** với bcrypt password hashing
- ✅ **Chuyên nghiệp hơn** với SendGrid email service
- ✅ **Bảo mật hơn** với OTP expiry và rate limiting
- ✅ **UX tốt hơn** với ProfileSvg fallback và fullName display

**Chúc mừng! 🚀**

