// Profile as returned by the backend (services/auth.api.ts toAccount); never holds a password.
export interface IAccount {
  id: number;
  userName: string;
  fullName?: string; // Họ và tên đầy đủ
  email?: string; // Email for password recovery
  avatar?: string; // Avatar URL (optional, default to ProfileSvg)
  balance?: number; // Số dư ví
  phone?: string; // Số điện thoại
  gender?: 'Male' | 'Female' | 'Other'; // Giới tính
  birthday?: string; // Ngày sinh (DD/MM/YYYY)
  address?: string; // Địa chỉ
  CreatedAt?: string; // Timestamp
}

export interface ILocation {
  id: number; // API primary key (single key; legacy NocoDB 'Id' removed)
  name: string;
  avatar: string;
  address: string;
  description: string;
  long_description?: string; // Detailed description for DetailLocation screen (falls back to description if empty)
  record_id?: string;
  rating?: number | null;
  lat: number | null;
  long: number | null;
  types?: string[]; // Array of location types (e.g., ["museum", "attraction", "historical"])
  haveVoice?: boolean; // DƯ THỪA - chỉ cần check voiceName
  reviews: IReview[];
  // item?: IItem[];
  recommendation?: string; // KHÔNG ĐƯỢC SỬ DỤNG - nên là optional
  icon?: any;
  voiceName?: string;
  advise?: string | string[]; // Có thể là string hoặc array of strings
  images?: any[];
  videos?: string[]; // Array of video IDs (YouTube video IDs)
  relatedKeyWord?: string;
  phone?: string; // Phone number
  website?: string; // Website URL
  opening_hours?: string; // Opening hours
  publishable?: boolean; // Only explicitly published records may appear on the map.
}

export interface IReview {
  id: number;
  content: string;
  name_user_review: string;
  fullName?: string; // Full name of user (preferred over name_user_review)
  time_review: string;
  start: number;
  avatar: string;
  location?: ILocation;
  images?: string[]; // Array of image URLs uploaded by user
}

export interface IItem {
  Id: number;
  name: string;
  description: string;
  video?: string;
  images?: any[];
  location?: Pick<ILocation, 'id' | 'name'>;
}

export interface ITransaction {
  Id?: number;
  accountId?: number;
  amount: number;
  description?: string;
  paymentLinkId?: string;
  orderCode?: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  createdAt?: string;
}

