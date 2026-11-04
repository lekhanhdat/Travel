import {FestivalDTO} from './catalog.adapter';
import catalogRepository from './catalogRepository';
import reviewsApi from './reviews.api';

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

