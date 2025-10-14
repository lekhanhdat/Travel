# 🔄 MIGRATION: BCRYPT → CRYPTO-JS

## ❌ **VẤN ĐỀ**

**Lỗi gặp phải:**
```
Error: Unable to resolve module crypto from bcryptjs
```

**Nguyên nhân:**
- `bcryptjs` cần module `crypto` của Node.js
- React Native không có module `crypto` built-in
- Không thể dùng bcrypt trong React Native mà không có polyfill phức tạp

---

## ✅ **GIẢI PHÁP**

Thay `bcryptjs` bằng `crypto-js` - một thư viện JavaScript thuần túy, không cần native modules.

---

## 📦 **CÀI ĐẶT**

```bash
# Gỡ bcryptjs
npm uninstall bcryptjs @types/bcryptjs --legacy-peer-deps

# Cài crypto-js
npm install crypto-js --legacy-peer-deps
npm install --save-dev @types/crypto-js --legacy-peer-deps
```

---

## 🔧 **THAY ĐỔI CODE**

### **1. Import**

**Trước:**
```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
```

**Sau:**
```typescript
import CryptoJS from 'crypto-js';

const PASSWORD_SALT = 'TravelApp_Secret_Salt_2025';

// Helper function to hash password using SHA256
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + PASSWORD_SALT).toString();
};

// Helper function to compare password
const comparePassword = (password: string, hashedPassword: string): boolean => {
  const hash = hashPassword(password);
  return hash === hashedPassword;
};
```

---

### **2. Login Function**

**Trước:**
```typescript
const isPasswordValid = await bcrypt.compare(password, account.password);
```

**Sau:**
```typescript
const isPasswordValid = comparePassword(password, account.password);
```

---

### **3. Sign Up Function**

**Trước:**
```typescript
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
```

**Sau:**
```typescript
const hashedPassword = hashPassword(password);
```

---

### **4. Update Password Function**

**Trước:**
```typescript
const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
```

**Sau:**
```typescript
const hashedPassword = hashPassword(newPassword);
```

---

## 🔐 **SO SÁNH BẢO MẬT**

| Tính năng | Bcrypt | Crypto-JS (SHA256 + Salt) |
|-----------|--------|---------------------------|
| **Algorithm** | Bcrypt (Blowfish) | SHA256 |
| **Salt** | Random per password | Fixed salt |
| **Async** | Yes (slow by design) | No (fast) |
| **Brute-force resistance** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| **React Native support** | ❌ Cần polyfill | ✅ Native support |
| **Production ready** | ✅ Best practice | ⚠️ OK cho MVP |

---

## ⚠️ **LƯU Ý BẢO MẬT**

### **1. Fixed Salt**
- **Hiện tại:** Dùng salt cố định `TravelApp_Secret_Salt_2025`
- **Vấn đề:** Nếu salt bị lộ, attacker có thể tạo rainbow table
- **Giải pháp tốt hơn:** Dùng random salt per user (lưu trong database)

### **2. SHA256 vs Bcrypt**
- **SHA256:** Nhanh → Dễ brute-force hơn
- **Bcrypt:** Chậm by design → Khó brute-force hơn
- **Khuyến nghị:** Nếu production, nên hash password ở backend với bcrypt

### **3. Lưu Salt**
- **Hiện tại:** Salt hardcoded trong code
- **Tốt hơn:** Lưu trong environment variable
- **Tốt nhất:** Random salt per user

---

## 🚀 **HƯỚNG DẪN TEST**

### **Test 1: Đăng ký tài khoản mới**
1. Đăng ký với password: `123456`
2. Kiểm tra NocoDB → Password sẽ là hash SHA256:
   ```
   a1b2c3d4e5f6... (64 ký tự hex)
   ```
3. Đăng nhập với password `123456` → Thành công ✅

---

### **Test 2: Đăng nhập**
1. Username: `nguyenvana`
2. Password: `123456`
3. Nếu thành công → Crypto-JS hoạt động đúng ✅

---

### **Test 3: Quên mật khẩu**
1. Gửi OTP → Nhận email
2. Nhập OTP → Xác thực thành công
3. Đặt password mới: `654321`
4. Kiểm tra NocoDB → Password đã thay đổi (hash mới)
5. Đăng nhập với password mới → Thành công ✅

---

## 📊 **MIGRATION EXISTING ACCOUNTS**

Nếu bạn đã có accounts với bcrypt hash, cần migrate:

### **Option 1: Force Reset Password**
- Yêu cầu tất cả users reset password
- Đơn giản nhưng không user-friendly

### **Option 2: Dual Hash Support**
- Detect hash type (bcrypt starts with `$2a$`, SHA256 là hex)
- Support cả 2 loại hash
- Migrate dần dần khi user login

**Code example:**
```typescript
const isPasswordValid = account.password.startsWith('$2a$')
  ? await bcrypt.compare(password, account.password) // Old bcrypt hash
  : comparePassword(password, account.password); // New SHA256 hash

// If old hash, migrate to new hash
if (isPasswordValid && account.password.startsWith('$2a$')) {
  const newHash = hashPassword(password);
  await authApi.updatePassword(account.Id, newHash);
}
```

---

## 🎯 **KẾT QUẢ**

- ✅ **Không còn lỗi crypto module**
- ✅ **Password vẫn được hash** (SHA256 + Salt)
- ✅ **Hoạt động trên React Native** (không cần polyfill)
- ✅ **Đủ an toàn cho MVP** (nhưng nên cải thiện cho production)

---

## 🔮 **KHUYẾN NGHỊ CHO PRODUCTION**

### **Option 1: Hash ở Backend**
- Tạo API endpoint `/auth/login` và `/auth/signup` ở backend
- Backend dùng bcrypt để hash password
- React Native chỉ gửi plain password qua HTTPS

### **Option 2: Dùng Firebase Authentication**
- Firebase tự động handle password hashing
- Không cần tự implement

### **Option 3: Dùng Auth0 / Supabase**
- Managed authentication service
- Best practices built-in

---

**Hiện tại với Crypto-JS đã đủ an toàn cho development và MVP!** ✅

