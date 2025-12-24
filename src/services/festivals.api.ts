import {request} from './axios';

// ========================================
// CONFIGURATION
// ========================================

// Table ID của bảng Festivals trên NocoDB
const FESTIVALS_TABLE_ID = 'mktzgff8mpu2c32'; // Table ID bạn đã tạo

export const URL_GET_FESTIVALS = `/api/v2/tables/${FESTIVALS_TABLE_ID}/records`;
export const URL_CREATE_FESTIVAL = `/api/v2/tables/${FESTIVALS_TABLE_ID}/records`;
export const URL_UPDATE_FESTIVAL = `/api/v2/tables/${FESTIVALS_TABLE_ID}/records`;

// ========================================
// TYPES
// ========================================

export interface IFestivalReview {
  id: number;
  content: string;
  name_user_review: string;
  fullName?: string; // Full name of user (preferred over name_user_review)
  time_review: string;
  start: number; // rating 1-5
  avatar: string;
  images?: string[]; // Array of image URLs uploaded by user
}

export interface IFestival {
  Id?: number;
  name: string;
  types: string[]; // ['festival', 'sport', 'cultural', etc.]
  description: string;
  event_time: string; // Thời gian diễn ra
  location: string; // Tên địa điểm
  location_id?: number; // ID liên kết với bảng Locations (sẽ dùng sau)
  price_level: number; // 0: Free, 1: Affordable, 2: Expensive
  ticket_info: string;
  rating: number;
  reviews: IFestivalReview[];
  images: string[]; // Array of image URLs
  videos: string[]; // Array of YouTube video IDs
  advise: string[]; // Array of advice strings
  CreatedAt?: string;
  UpdatedAt?: string;
}

interface GetFestivalsResponse {
  list: IFestival[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}

// ========================================
// API FUNCTIONS
// ========================================

const festivalsApi = {
  /**
   * Lấy danh sách tất cả festivals
   */
  getFestivals: async (): Promise<IFestival[]> => {
    try {
      const res = await request.get<GetFestivalsResponse>(URL_GET_FESTIVALS, {
        params: {
          offset: '0',
          limit: '100', // Lấy tối đa 100 festivals
        },
      });

      let data = res.data.list ?? [];

      // Parse JSON fields
      data = data.map(festival => ({
        ...festival,
        types: typeof festival.types === 'string' ? JSON.parse(festival.types) : festival.types,
        reviews: typeof festival.reviews === 'string' ? JSON.parse(festival.reviews) : festival.reviews,
        images: typeof festival.images === 'string' ? JSON.parse(festival.images) : festival.images,
        videos: typeof festival.videos === 'string' ? JSON.parse(festival.videos) : festival.videos,
        advise: typeof festival.advise === 'string' ? JSON.parse(festival.advise) : festival.advise,
      }));

      console.log('✅ Fetched festivals:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error fetching festivals:', error);
      throw error;
    }
  },

  /**
   * Lấy festival theo ID
   */
  getFestivalById: async (id: number): Promise<IFestival | null> => {
    try {
      const festivals = await festivalsApi.getFestivals();
      const festival = festivals.find(f => f.Id === id);
      return festival || null;
    } catch (error) {
      console.error('❌ Error fetching festival by ID:', error);
      throw error;
    }
  },

  /**
   * Lấy festivals theo loại (type)
   */
  getFestivalsByType: async (type: string): Promise<IFestival[]> => {
    try {
      const festivals = await festivalsApi.getFestivals();
      return festivals.filter(f => f.types.includes(type));
    } catch (error) {
      console.error('❌ Error fetching festivals by type:', error);
      throw error;
    }
  },

  /**
   * Tìm kiếm festivals theo tên
   */
  searchFestivals: async (keyword: string): Promise<IFestival[]> => {
    try {
      const festivals = await festivalsApi.getFestivals();
      const lowerKeyword = keyword.toLowerCase();
      return festivals.filter(f =>
        f.name.toLowerCase().includes(lowerKeyword) ||
        f.description.toLowerCase().includes(lowerKeyword)
      );
    } catch (error) {
      console.error('❌ Error searching festivals:', error);
      throw error;
    }
  },

  /**
   * Tạo festival mới
   */
  createFestival: async (festival: Omit<IFestival, 'Id' | 'CreatedAt' | 'UpdatedAt'>): Promise<IFestival> => {
    try {
      const payload = {
        name: festival.name,
        types: JSON.stringify(festival.types),
        description: festival.description,
        event_time: festival.event_time,
        location: festival.location,
        location_id: festival.location_id,
        price_level: festival.price_level,
        ticket_info: festival.ticket_info,
        rating: festival.rating,
        reviews: JSON.stringify(festival.reviews),
        images: JSON.stringify(festival.images),
        videos: JSON.stringify(festival.videos),
        advise: JSON.stringify(festival.advise),
      };

      const res = await request.post(URL_CREATE_FESTIVAL, payload);
      console.log('✅ Festival created:', res.data);
      return res.data;
    } catch (error) {
      console.error('❌ Error creating festival:', error);
      throw error;
    }
  },

  /**
   * Cập nhật festival
   */
  updateFestival: async (id: number, updates: Partial<IFestival>): Promise<void> => {
    try {
      const payload: any = {
        Id: id,
      };

      // Chỉ stringify các field là array/object
      if (updates.types) {payload.types = JSON.stringify(updates.types);}
      if (updates.reviews) {payload.reviews = JSON.stringify(updates.reviews);}
      if (updates.images) {payload.images = JSON.stringify(updates.images);}
      if (updates.videos) {payload.videos = JSON.stringify(updates.videos);}
      if (updates.advise) {payload.advise = JSON.stringify(updates.advise);}

      // Các field khác giữ nguyên
      Object.keys(updates).forEach(key => {
        if (!['types', 'reviews', 'images', 'videos', 'advise', 'Id'].includes(key)) {
          payload[key] = updates[key];
        }
      });

      await request.patch(URL_UPDATE_FESTIVAL, [payload]);
      console.log('✅ Festival updated:', id);
    } catch (error) {
      console.error('❌ Error updating festival:', error);
      throw error;
    }
  },

  /**
   * Thêm review vào festival
   */
  addReview: async (festivalId: number, review: IFestivalReview): Promise<void> => {
    try {
      const festival = await festivalsApi.getFestivalById(festivalId);
      if (!festival) {
        throw new Error('Festival not found');
      }

      const currentReviews = festival.reviews || [];
      currentReviews.push(review);

      await festivalsApi.updateFestival(festivalId, {
        reviews: currentReviews,
        rating: currentReviews.reduce((sum, r) => sum + r.start, 0) / currentReviews.length,
      });

      console.log('✅ Review added to festival:', festivalId);
    } catch (error) {
      console.error('❌ Error adding review:', error);
      throw error;
    }
  },

  /**
   * Lấy festivals theo tháng (dựa vào event_time)
   */
  getFestivalsByMonth: async (month: number): Promise<IFestival[]> => {
    try {
      const festivals = await festivalsApi.getFestivals();
      return festivals.filter(f => {
        // Parse event_time để lấy tháng
        // Format: "Tháng 3 hàng năm" hoặc "Từ ngày 31/5 đến 12/7 hàng năm"
        const eventTime = f.event_time.toLowerCase();
        return eventTime.includes(`tháng ${month}`) ||
               eventTime.includes(`/${month}/`) ||
               eventTime.includes(`-${month}/`);
      });
    } catch (error) {
      console.error('❌ Error fetching festivals by month:', error);
      throw error;
    }
  },

  /**
   * Lấy festivals miễn phí
   */
  getFreeFestivals: async (): Promise<IFestival[]> => {
    try {
      const festivals = await festivalsApi.getFestivals();
      return festivals.filter(f => f.price_level === 0);
    } catch (error) {
      console.error('❌ Error fetching free festivals:', error);
      throw error;
    }
  },

  /**
   * Lấy festivals theo location ID
   */
  getFestivalsByLocationId: async (locationId: number): Promise<IFestival[]> => {
    try {
      const festivals = await festivalsApi.getFestivals();
      return festivals.filter(f => f.location_id === locationId);
    } catch (error) {
      console.error('❌ Error fetching festivals by location ID:', error);
      throw error;
    }
  },

  /**
   * Lấy festivals theo location name (tìm kiếm gần đúng)
   */
  getFestivalsByLocationName: async (locationName: string): Promise<IFestival[]> => {
    try {
      const festivals = await festivalsApi.getFestivals();
      const normalizedSearch = locationName.toLowerCase();
      return festivals.filter(f =>
        f.location.toLowerCase().includes(normalizedSearch)
      );
    } catch (error) {
      console.error('❌ Error fetching festivals by location name:', error);
      throw error;
    }
  },

  /**
   * Calculate average rating from festival reviews
   */
  calculateAverageRating: (reviews: IFestivalReview[]): number => {
    if (!reviews || reviews.length === 0) {
      return 0;
    }
    const total = reviews.reduce((sum, review) => sum + (review.start || 0), 0);
    return Number((total / reviews.length).toFixed(1));
  },
};

export default festivalsApi;

