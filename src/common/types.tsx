export interface IAccount {
  userName: string;
  password: string;
  avatar: string;
}

export interface ILocation {
  Id: number;
  name: string;
  avatar: string;
  address: string;
  description: string;
  lat: number;
  long: number;
  haveVoice?: boolean;
  reviews: IReview[];
  // item?: IItem[];
  recommendation: string;
  icon?: any;
  voiceName?: string;
  advise?: string;
  images?: any[];
  videos?: string;
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
