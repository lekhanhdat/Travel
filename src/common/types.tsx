export interface IAccount {
  userName: string;
  password: string;
  avatar: string;
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
  time_review: string;
  start: number;
  avatar: string;
  location?: ILocation;
}

export interface IItem {
  Id: number;
  name: string;
  description: string;
  video?: string;
  images?: any[];
  location?: Pick<ILocation, 'Id' | 'name'>;
}
