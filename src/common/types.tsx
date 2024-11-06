export interface IAccount {
  userName: string;
  password: string;
  avatar: string;
}

export interface ILocation {
  id: number;
  name: string;
  avatar: string;
  address: string;
  description: string;
  lat: number;
  long: number;
  haveVoice?: boolean;
  reviews: IReview[];
  icon?: any;
  voiceName?: string;
  advise?: string[];
  images?: string[];
  videos?: string[];
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