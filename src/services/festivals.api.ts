import {FestivalDTO} from './catalog.adapter';
import catalogRepository from './catalogRepository';
import reviewsApi from './reviews.api';
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
  accountId?: number; // P7: author's account (BE reviews)
  content: string;
  name_user_review: string;
  fullName?: string; // Full name of user (preferred over name_user_review)
  time_review: string;
  start: number; // rating 1-5
  avatar: string;
  images?: string[]; // Array of image URLs uploaded by user
}

export interface IFestival extends FestivalDTO {
  CreatedAt?: string;
  UpdatedAt?: string;
  /** Venue name resolved from location_id; empty when the festival has no linked location. */
  location: string;
}
// P2: Legacy festival type retained below.
// export interface IFestival {
//   Id?: number;
//   name: string;
//   types: string[]; // ['festival', 'sport', 'cultural', etc.]
//   description: string;
//   event_time: string; // Thời gian diễn ra
//   location: string; // Tên địa điểm
//   location_id?: number; // ID liên kết với bảng Locations (sẽ dùng sau)
//   ticket_info: string;
//   rating: number;
//   reviews: IFestivalReview[];
//   images: string[]; // Array of image URLs
//   videos: string[]; // Array of YouTube video IDs
//   advise: string[]; // Array of advice strings
//   CreatedAt?: string;
//   UpdatedAt?: string;
// }

// interface GetFestivalsResponse {
//   list: IFestival[];
//   pageInfo: {
//     totalRows: number;
//     page: number;
//     pageSize: number;
//     isFirstPage: boolean;
//     isLastPage: boolean;
//   };
// }
//
// ========================================
// API FUNCTIONS
// ========================================

const festivalsApi = {
  /**
   * Lấy danh sách tất cả festivals
   */
  getFestivals: async (forceRefresh = false): Promise<IFestival[]> =>
    (await catalogRepository.get(forceRefresh)).festivals,
  clearCache: catalogRepository.clear,

  // P2: Original NocoDB catalog read retained for recovery history.
  //   getFestivals: async (): Promise<IFestival[]> => {
  //     if (!FEATURE_FLAGS.ENABLE_NOCODB) {
  //       throw new Error('Catalog is not connected in Phase 1.');
  //     }
  //     try {
  //       const res = await request.get<GetFestivalsResponse>(URL_GET_FESTIVALS, {
  //         params: {
  //           offset: '0',
  //           limit: '100', // Lấy tối đa 100 festivals
  //         },
  //       });
  //
  //       let data = res.data.list ?? [];
  //
  //       // Parse JSON fields
  //       data = data.map(festival => ({
  //         ...festival,
  //         types: typeof festival.types === 'string' ? JSON.parse(festival.types) : festival.types,
  //         reviews: typeof festival.reviews === 'string' ? JSON.parse(festival.reviews) : festival.reviews,
  //         images: typeof festival.images === 'string' ? JSON.parse(festival.images) : festival.images,
  //         videos: typeof festival.videos === 'string' ? JSON.parse(festival.videos) : festival.videos,
  //         advise: typeof festival.advise === 'string' ? JSON.parse(festival.advise) : festival.advise,
  //       }));
  //
  //       console.log('✅ Fetched festivals:', data.length);
  //       return data;
  //     } catch (error) {
  //       console.error('❌ Error fetching festivals:', error);
  //       throw error;
  //     }
  //   },

  /**
   * Lấy festival theo ID
   */
  getFestivalById: async (id: number, forceRefresh = false): Promise<IFestival | null> => {
    try {
      return (await catalogRepository.get(forceRefresh)).festivalById.get(id) ?? null;
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
  createFestival: async (festival: Omit<IFestival, 'id' | 'CreatedAt' | 'UpdatedAt'>): Promise<IFestival> => {
    try {
      const payload = {
        name: festival.name,
        types: JSON.stringify(festival.types),
        description: festival.description,
        event_time: festival.event_time,
        location: festival.location,
        location_id: festival.location_id,
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
          payload[key] = updates[key as keyof IFestival];
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
   * Thêm review vào festival (P7: POST /reviews; rating tính ở BE từ bảng reviews)
   */
  addReview: async (festivalId: number, review: IFestivalReview): Promise<void> => {
    await reviewsApi.create({
      festival_id: festivalId,
      rating: review.start,
      content: review.content,
      images: review.images ?? [],
    });
  },

  /**
   * Review của một festival (mới nhất trước) từ GET /reviews.
   */
  getReviews: async (festivalId: number): Promise<IFestivalReview[]> =>
    reviewsApi.list({festival_id: festivalId}),

  // P7: NocoDB version retained for recovery history (removed at P12).
  // /**
  //  * Thêm review vào festival
  //  */
  // addReview: async (festivalId: number, review: IFestivalReview): Promise<void> => {
  //   try {
  //     const festival = await festivalsApi.getFestivalById(festivalId);
  //     if (!festival) {
  //       throw new Error('Festival not found');
  //     }
  //
  //     const currentReviews = festival.reviews || [];
  //     currentReviews.push(review);
  //
  //     await festivalsApi.updateFestival(festivalId, {
  //       reviews: currentReviews,
  //       rating: currentReviews.reduce((sum, r) => sum + r.start, 0) / currentReviews.length,
  //     });
  //
  //     console.log('✅ Review added to festival:', festivalId);
  //   } catch (error) {
  //     console.error('❌ Error adding review:', error);
  //     throw error;
  //   }
  // },

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
   * Lấy festivals theo location ID
   */
  getFestivalsByLocationId: async (locationId: number): Promise<IFestival[]> => {
    if (!Number.isSafeInteger(locationId)) {return [];}
    try {
      return [...(await catalogRepository.get()).festivalsByLocationId.get(locationId) ?? []];
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

