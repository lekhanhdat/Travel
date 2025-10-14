# 🔄 MIGRATION: SENDGRID SDK → SENDGRID REST API

## ❌ **VẤN ĐỀ**

**Lỗi gặp phải:**
```
Error: Unable to resolve module fs from @sendgrid/mail
```

**Nguyên nhân:**
- `@sendgrid/mail` SDK cần module `fs` và `path` của Node.js
- React Native không có các module này
- SendGrid SDK không thể chạy trên React Native

---

## ✅ **GIẢI PHÁP**

Thay SendGrid SDK bằng **SendGrid REST API** - gọi trực tiếp qua HTTP.

---

## 📦 **CÀI ĐẶT**

```bash
# Gỡ SendGrid SDK
npm uninstall @sendgrid/mail --legacy-peer-deps

# Không cần cài thêm gì (dùng axios có sẵn)
```

---

## 🔧 **THAY ĐỔI CODE**

### **1. Import**

**Trước:**
```typescript
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = 'SG.xxx...';
sgMail.setApiKey(SENDGRID_API_KEY);
```

**Sau:**
```typescript
import axios from 'axios';

const SENDGRID_API_KEY = 'SG.xxx...';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
```

---

### **2. Send Email Function**

**Trước (SDK):**
```typescript
const msg = {
  to: email,
  from: 'sender@example.com',
  subject: 'Subject',
  text: 'Plain text',
  html: '<h1>HTML content</h1>',
};

await sgMail.send(msg);
```

**Sau (REST API):**
```typescript
const emailData = {
  personalizations: [
    {
      to: [{email: email}],
      subject: 'Subject',
    },
  ],
  from: {
    email: 'sender@example.com',
    name: 'Sender Name',
  },
  content: [
    {
      type: 'text/plain',
      value: 'Plain text',
    },
    {
      type: 'text/html',
      value: '<h1>HTML content</h1>',
    },
  ],
};

await axios.post(SENDGRID_API_URL, emailData, {
  headers: {
    Authorization: `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
```

---

## 📧 **SENDGRID REST API FORMAT**

### **Cấu trúc cơ bản:**

```json
{
  "personalizations": [
    {
      "to": [{"email": "recipient@example.com"}],
      "subject": "Email Subject"
    }
  ],
  "from": {
    "email": "sender@example.com",
    "name": "Sender Name"
  },
  "content": [
    {
      "type": "text/plain",
      "value": "Plain text content"
    },
    {
      "type": "text/html",
      "value": "<h1>HTML content</h1>"
    }
  ]
}
```

### **Headers:**
```javascript
{
  "Authorization": "Bearer SG.your_api_key_here",
  "Content-Type": "application/json"
}
```

---

## 🎯 **CODE HOÀN CHỈNH**

**File: `Travel/src/services/auth.api.ts`**

```typescript
import axios from 'axios';

const SENDGRID_API_KEY = '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';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

sendOTPEmail: async (email: string): Promise<{
  success: boolean;
  otp?: string;
  error?: string;
}> => {
  try {
    // ... rate limiting check ...
    
    // Generate OTP
    const otp = authApi.generateOTP();
    const now = Date.now();
    const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;
    
    // Store OTP
    otpStorage.set(email, {
      email,
      otp,
      expiresAt,
      attempts: existingRecord ? existingRecord.attempts + 1 : 1,
      lastAttemptAt: now,
    });
    
    // Send email via SendGrid REST API
    const emailData = {
      personalizations: [
        {
          to: [{email: email}],
          subject: 'Mã xác thực đặt lại mật khẩu - Travel App',
        },
      ],
      from: {
        email: 'datlk.21it@vku.udn.vn',
        name: 'Travel App',
      },
      content: [
        {
          type: 'text/plain',
          value: `Mã xác thực của bạn là: ${otp}\n\nMã này có hiệu lực trong ${OTP_EXPIRY_MINUTES} phút.`,
        },
        {
          type: 'text/html',
          value: `
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
        },
      ],
    };
    
    // Send via SendGrid REST API
    await axios.post(SENDGRID_API_URL, emailData, {
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ OTP email sent successfully via SendGrid');
    return {success: true, otp};
  } catch (error: any) {
    console.error('❌ Error sending OTP email:', error);
    return {
      success: false,
      error: 'Không thể gửi email. Vui lòng thử lại sau.',
    };
  }
}
```

---

## 🚀 **HƯỚNG DẪN TEST**

### **Test 1: Gửi OTP**
1. Vào app → Click "Quên mật khẩu"
2. Nhập email: `datlk.21it@vku.udn.vn`
3. Click "Gửi mã"
4. **Kiểm tra email** → Nhận được email với OTP ✅

### **Test 2: Kiểm tra Console**
```
🔢 OTP Code: 123456
⏰ Expires at: 14/10/2025, 16:15:30
✅ OTP email sent successfully via SendGrid
```

### **Test 3: Nếu lỗi**
```
❌ Error sending OTP email: {
  response: {
    status: 403,
    data: {
      errors: [{
        message: "The from address does not match a verified Sender Identity"
      }]
    }
  }
}
```
→ Cần verify sender email trong SendGrid!

---

## ⚠️ **LƯU Ý QUAN TRỌNG**

### **1. Verify Sender Email**
- **Bắt buộc:** Phải verify email `datlk.21it@vku.udn.vn` trong SendGrid
- **Cách verify:**
  1. Vào https://app.sendgrid.com
  2. Settings → Sender Authentication
  3. Verify a Single Sender
  4. Nhập `datlk.21it@vku.udn.vn`
  5. Check email và click link verify

**Nếu không verify:** SendGrid sẽ trả về lỗi 403!

---

### **2. API Key Security**
- **Hiện tại:** API key hardcoded trong code
- **Tốt hơn:** Lưu trong environment variable
- **Production:** Nên gọi API từ backend, không expose API key ở client

---

### **3. Error Handling**
```typescript
catch (error: any) {
  console.error('❌ Error:', error.response?.data || error.message);
  
  if (error.response?.status === 403) {
    return {
      success: false,
      error: 'Email chưa được xác thực. Vui lòng liên hệ admin.',
    };
  }
  
  return {
    success: false,
    error: 'Không thể gửi email. Vui lòng thử lại sau.',
  };
}
```

---

## 📊 **SO SÁNH**

| Tính năng | SendGrid SDK | SendGrid REST API |
|-----------|--------------|-------------------|
| **React Native** | ❌ Cần fs, path | ✅ Hoạt động |
| **Cài đặt** | npm install @sendgrid/mail | Dùng axios có sẵn |
| **Code** | Đơn giản hơn | Dài hơn một chút |
| **Tính năng** | Đầy đủ | Đầy đủ (qua API) |
| **Performance** | Tương đương | Tương đương |

---

## 🎉 **KẾT QUẢ**

- ✅ **Không còn lỗi fs module**
- ✅ **Gửi email thật qua SendGrid**
- ✅ **Hoạt động trên React Native**
- ✅ **HTML email đẹp với OTP**

---

**Bây giờ có thể gửi email thật trên React Native!** 🚀

