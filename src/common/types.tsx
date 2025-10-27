export interface IAccount {
  Id?: number; // NocoDB primary key
  userName: string;
  password: string;
  fullName?: string; // Họ và tên đầy đủ
  email?: string; // Email for password recovery
  avatar?: string; // Avatar URL (optional, default to ProfileSvg)
  balance?: number; // Số dư ví
  CreatedAt?: string; // Timestamp
}

export interface ILocation {
  Id?: number; // Optional vì data có cả 'id' và 'Id'
  id?: number; // Optional vì data có cả 'id' và 'Id'
  name: string;
  avatar: string;
  address: string;
  description: string;
  lat: number;
  long: number;
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
  location?: Pick<ILocation, 'Id' | 'name'>;
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

