import catalogRepository from './catalogRepository';
import {IReview} from '../common/types';
import {apiCall, ApiError} from './api.client';
import reviewsApi from './reviews.api';

// Same limit as the BE (core_api/uploads.py); uploads get more time than the 12 s default.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60000;

// Catalog reads go through catalogRepository (one shared load for locations + festivals).
const clearCache = () => {
  catalogRepository.clear();
};

const clearLocationsCache = () => {
  catalogRepository.clear();
};

const locationApi = {
  clearCache,
  clearLocationsCache,

  getLocations: async (forceRefresh = false) => (await catalogRepository.get(forceRefresh)).locations,

  getLocationById: async (id: number, forceRefresh = false) =>
    (await catalogRepository.get(forceRefresh)).locationById.get(id) ?? null,

  // P7: reviews + uploads go through the Cloud Run API (reviews.api, POST /uploads); same names/signatures.
  /** Every visible review (newest first), or one location's when `locationId` is given. */
  getReviews: async (_forceRefresh: boolean = false, locationId?: number): Promise<IReview[]> =>
    reviewsApi.list(locationId ? {location_id: locationId} : {}),

  /** Creates a review for `review.location`; returns it as stored by the BE (id, author, time). */
  createReview: async (review: Partial<IReview>): Promise<IReview> => {
    const locationId = review.location?.id;
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return reviewsApi.create({
      location_id: locationId,
      rating: review.start ?? 0,
      content: review.content ?? '',
      images: review.images ?? [],
    });
  },

  /**
   * Upload one picked image (react-native-image-picker asset) for a review or the avatar.
   * The BE checks type (JPEG/PNG/WebP), size and the daily quota; returns its public URL.
   */
  uploadImage: async (file: any): Promise<{url: string}> => {
    if (file.fileSize && file.fileSize > MAX_UPLOAD_BYTES) {
      throw new ApiError('http', 413, 'Ảnh vượt quá 2 MB');
    }
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `photo_${Date.now()}.jpg`,
    } as any);
    return apiCall<{url: string}>({
      method: 'post',
      url: '/uploads',
      data: formData,
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: UPLOAD_TIMEOUT_MS,
    });
  },

  /**
   * Calculate average rating for a location
   */
  calculateAverageRating: (reviews: IReview[]): number => {
    if (!reviews || reviews.length === 0) {
      return 0;
    }
    const total = reviews.reduce((sum, review) => sum + (review.start || 0), 0);
    return Number((total / reviews.length).toFixed(1));
  },
};
export default locationApi;
