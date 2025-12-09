import {request} from './axios';
import {IAccount} from '../common/types';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import {env} from '../utils/env';

// ========================================
// CONFIGURATION
// ========================================

// Table ID của bảng Accounts trên NocoDB
const ACCOUNTS_TABLE_ID = 'mad8fvjhd0ba1bk';

const URL_GET_ACCOUNTS = `/api/v2/tables/${ACCOUNTS_TABLE_ID}/records`;
const URL_CREATE_ACCOUNT = `/api/v2/tables/${ACCOUNTS_TABLE_ID}/records`;
const URL_UPDATE_ACCOUNT = `/api/v2/tables/${ACCOUNTS_TABLE_ID}/records`;

// SendGrid API Key
const SENDGRID_API_KEY = '';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

// OTP Configuration
const OTP_EXPIRY_MINUTES = 5; // OTP hết hạn sau 5 phút
const OTP_RATE_LIMIT_COUNT = 3; // Giới hạn 3 lần gửi
const OTP_RATE_LIMIT_WINDOW_MINUTES = 10; // Trong 10 phút

// Password hashing configuration
const PASSWORD_SALT = env.PASSWORD_SALT || 'TravelApp_Secret_Salt_2025'; // Secret salt (nên lưu trong env)

// Helper function to hash password using SHA256
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + PASSWORD_SALT).toString();
};

// Helper function to compare password
const comparePassword = (password: string, hashedPassword: string): boolean => {
  const hash = hashPassword(password);
  return hash === hashedPassword;
};

// ========================================
// INTERFACES
// ========================================

interface GetAccountsResponse {
  list: IAccount[];
  pageInfo: {
    totalRows?: number;
    page?: number;
    pageSize?: number;
    isFirstPage?: boolean;
    isLastPage?: boolean;
  };
}

interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: number; // Timestamp
  attempts: number;
  lastAttemptAt: number; // Timestamp
}

// ========================================
// IN-MEMORY OTP STORAGE
// ========================================

// Store OTP records in memory (in production, use Redis or database)
const otpStorage: Map<string, OTPRecord> = new Map();

const authApi = {
  /**
   * Get all accounts from NocoDB
   */
  getAccounts: async (): Promise<IAccount[]> => {
    try {
      const res = await request.get<GetAccountsResponse>(URL_GET_ACCOUNTS, {
        params: {
          offset: '0',
          limit: '1000', // Get all accounts
        },
      });

      const accounts = res.data.list ?? [];
      console.log('✅ Accounts fetched from NocoDB:', accounts.length);
      return accounts;
    } catch (error) {
      console.error('❌ Error fetching accounts from NocoDB:', error);
      throw error;
    }
  },

  /**
   * Login - Verify username and password (with bcrypt)
   */
  login: async (
    userName: string,
    password: string,
  ): Promise<IAccount | null> => {
    try {
      console.log('🔐 Attempting login:', {userName});

      const accounts = await authApi.getAccounts();

      // Find account with matching username
      const account = accounts.find(acc => acc.userName === userName);

      if (!account) {
        console.log('❌ Login failed: User not found');
        return null;
      }

      // Compare password with hashed password
      const isPasswordValid = comparePassword(password, account.password);

      if (isPasswordValid) {
        console.log('✅ Login successful:', account.userName);
        return account;
      } else {
        console.log('❌ Login failed: Invalid password');
        return null;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  /**
   * Sign up - Create new account (with password hashing)
   */
  signUp: async (
    userName: string,
    password: string,
    fullName: string,
    email: string,
    phone?: string,
    gender?: 'Male' | 'Female' | 'Other',
    birthday?: string,
    address?: string,
  ): Promise<IAccount> => {
    try {
      console.log('📝 Creating new account:', {userName, email});

      // Check if username or email already exists
      const accounts = await authApi.getAccounts();
      const existingUser = accounts.find(
        acc => acc.userName === userName || acc.email === email,
      );

      if (existingUser) {
        if (existingUser.userName === userName) {
          throw new Error('Tên đăng nhập đã tồn tại');
        }
        if (existingUser.email === email) {
          throw new Error('Email đã được sử dụng');
        }
      }

      // Hash password before saving
      console.log('🔒 Hashing password...');
      const hashedPassword = hashPassword(password);

      // Create new account
      const newAccount: any = {
        userName,
        password: hashedPassword, // Store hashed password
        fullName,
        email,
        avatar: '', // Default empty, will use ProfileSvg in UI
      };

      // Add optional fields if provided
      if (phone) newAccount.phone = phone;
      if (gender) newAccount.gender = gender;
      if (birthday) newAccount.birthday = birthday;
      if (address) newAccount.address = address;

      const res = await request.post(URL_CREATE_ACCOUNT, newAccount);

      console.log('✅ Account created successfully:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  },

  /**
   * Check if email exists (for forgot password)
   */
  checkEmailExists: async (email: string): Promise<IAccount | null> => {
    try {
      console.log('📧 Checking email:', email);

      const accounts = await authApi.getAccounts();
      const account = accounts.find(acc => acc.email === email);

      if (account) {
        console.log('✅ Email found:', email);
        return account;
      } else {
        console.log('❌ Email not found:', email);
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking email:', error);
      throw error;
    }
  },

  /**
   * Update password (for forgot password flow) - with hashing
   */
  updatePassword: async (
    accountId: number,
    newPassword: string,
  ): Promise<void> => {
    try {
      console.log('🔑 Updating password for account ID:', accountId);

      // Hash new password
      console.log('🔒 Hashing new password...');
      const hashedPassword = hashPassword(newPassword);

      // NocoDB PATCH format: array of objects with Id
      await request.patch(URL_UPDATE_ACCOUNT, [
        {
          Id: accountId,
          password: hashedPassword, // Store hashed password
        },
      ]);

      console.log('✅ Password updated successfully');
    } catch (error) {
      console.error('❌ Error updating password:', error);
      throw error;
    }
  },

  /**
   * Update user profile (fullName, email, avatar, phone, gender, birthday, address)
   */
  updateProfile: async (
    accountId: number,
    updates: {
      fullName?: string;
      email?: string;
      avatar?: string;
      phone?: string;
      gender?: 'Male' | 'Female' | 'Other';
      birthday?: string;
      address?: string;
    },
  ): Promise<IAccount> => {
    try {
      console.log('📝 Updating profile for account ID:', accountId);

      // Check if email is being updated and if it's already in use
      if (updates.email) {
        const accounts = await authApi.getAccounts();
        const existingUser = accounts.find(
          acc => acc.email === updates.email && acc.Id !== accountId,
        );

        if (existingUser) {
          throw new Error('Email đã được sử dụng bởi tài khoản khác');
        }
      }

      // NocoDB PATCH format: array of objects with Id
      const res = await request.patch(URL_UPDATE_ACCOUNT, [
        {
          Id: accountId,
          ...updates,
        },
      ]);

      console.log('✅ Profile updated successfully:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Change password (requires current password verification)
   */
  changePassword: async (
    accountId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    try {
      console.log('🔑 Changing password for account ID:', accountId);

      // Get account to verify current password
      const accounts = await authApi.getAccounts();
      const account = accounts.find(acc => acc.Id === accountId);

      if (!account) {
        throw new Error('Tài khoản không tồn tại');
      }

      // Verify current password
      if (!comparePassword(currentPassword, account.password)) {
        throw new Error('Mật khẩu hiện tại không đúng');
      }

      // Hash new password
      console.log('🔒 Hashing new password...');
      const hashedPassword = hashPassword(newPassword);

      // Update password
      await request.patch(URL_UPDATE_ACCOUNT, [
        {
          Id: accountId,
          password: hashedPassword,
        },
      ]);

      console.log('✅ Password changed successfully');
    } catch (error: any) {
      console.error('❌ Error changing password:', error);
      throw error;
    }
  },

  /**
   * Generate random 6-digit OTP code
   */
  generateOTP: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Check rate limiting for OTP requests
   * Returns true if rate limit exceeded
   */
  checkOTPRateLimit: (email: string): boolean => {
    const record = otpStorage.get(email);
    if (!record) {
      return false; // No previous attempts
    }

    const now = Date.now();
    const windowStart = now - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

    // Check if last attempt was within the rate limit window
    if (record.lastAttemptAt > windowStart) {
      // Within window, check attempt count
      if (record.attempts >= OTP_RATE_LIMIT_COUNT) {
        console.log(
          `⚠️ Rate limit exceeded for ${email}: ${record.attempts} attempts`,
        );
        return true; // Rate limit exceeded
      }
    } else {
      // Outside window, reset attempts
      record.attempts = 0;
    }

    return false; // Rate limit not exceeded
  },

  /**
   * Send OTP to email via SendGrid
   * With rate limiting (3 attempts per 10 minutes)
   */
  sendOTPEmail: async (email: string): Promise<{
    success: boolean;
    otp?: string;
    error?: string;
  }> => {
    try {
      console.log('📧 Sending OTP to email:', email);

      // Check rate limiting
      if (authApi.checkOTPRateLimit(email)) {
        const record = otpStorage.get(email);
        const waitMinutes = Math.ceil(
          (record!.lastAttemptAt +
            OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 -
            Date.now()) /
            60000,
        );
        return {
          success: false,
          error: `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${waitMinutes} phút.`,
        };
      }

      // Generate OTP
      const otp = authApi.generateOTP();
      const now = Date.now();
      const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000; // 5 minutes from now

      // Update or create OTP record
      const existingRecord = otpStorage.get(email);
      otpStorage.set(email, {
        email,
        otp,
        expiresAt,
        attempts: existingRecord ? existingRecord.attempts + 1 : 1,
        lastAttemptAt: now,
      });

      console.log('🔢 OTP Code:', otp);
      console.log('⏰ Expires at:', new Date(expiresAt).toLocaleString());

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
  },

  /**
   * Get user by ID from NocoDB
   */
  getUserById: async (userId: number): Promise<IAccount | null> => {
    try {
      console.log('🔍 Fetching user by ID:', userId);

      const url = `${URL_GET_ACCOUNTS}/${userId}`;
      const res = await request.get<IAccount>(url);

      console.log('✅ User fetched:', res.data);
      return res.data;
    } catch (error) {
      console.error('❌ Error fetching user by ID:', error);
      return null;
    }
  },

  /**
   * Verify OTP code
   * Returns true if OTP is valid and not expired
   */
  verifyOTP: (email: string, otp: string): {valid: boolean; error?: string} => {
    const record = otpStorage.get(email);

    if (!record) {
      console.log('❌ No OTP record found for:', email);
      return {valid: false, error: 'Mã xác thực không tồn tại'};
    }

    const now = Date.now();

    // Check if OTP expired
    if (now > record.expiresAt) {
      console.log('❌ OTP expired for:', email);
      otpStorage.delete(email); // Clean up expired OTP
      return {valid: false, error: 'Mã xác thực đã hết hạn'};
    }

    // Check if OTP matches
    if (record.otp !== otp) {
      console.log('❌ Invalid OTP for:', email);
      return {valid: false, error: 'Mã xác thực không chính xác'};
    }

    console.log('✅ OTP verified successfully for:', email);
    otpStorage.delete(email); // Clean up used OTP
    return {valid: true};
  },
};

export default authApi;

