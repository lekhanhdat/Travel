import moment from 'moment';
import {apiCall} from './api.client';
import catalogRepository from './catalogRepository';
import {IReview} from '../common/types';

// P7: reviews live in the BE table `reviews` (D9); locations.api / festivals.api keep their old
// function names and delegate here. Reading is public, writing needs the signed-in account.
export const REVIEWS_PAGE_SIZE = 100;

export interface ReviewDTO {
  id: number;
  location_id: number | null;
  festival_id: number | null;
  rating: number;
  content: string;
  images: string[];
  created_at: string;
  author: {id: number; user_name: string; full_name: string | null; avatar: string | null};
}

interface ReviewPageDTO {
  items: ReviewDTO[];
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface NewReview {
  location_id?: number;
  festival_id?: number;
  rating: number;
  content: string;
  images: string[];
}

/** Same shape the screens already use (ReviewItem, NewFeed, Detail*). */
export function toReview(dto: ReviewDTO): IReview {
  return {
    id: dto.id,
    accountId: dto.author.id,
    content: dto.content,
    name_user_review: dto.author.user_name,
    fullName: dto.author.full_name ?? undefined,
    time_review: moment(dto.created_at).format('HH:mm DD/MM/YYYY'),
    start: dto.rating,
    avatar: dto.author.avatar ?? '',
    images: dto.images,
  };
}

/** Attaches the catalog location / festival (for "Địa điểm: …" and the Feed filter). */
async function withTargets(dtos: ReviewDTO[]): Promise<IReview[]> {
  const catalog = await catalogRepository.get().catch(() => null);
  return dtos.map(dto => {
    const review = toReview(dto);
    if (dto.location_id !== null) {
      review.location = catalog?.locationById.get(dto.location_id) ?? undefined;
    }
    if (dto.festival_id !== null) {
      const festival = catalog?.festivalById.get(dto.festival_id);
      review.festival = festival ? {id: festival.id, name: festival.name} : undefined;
    }
    return review;
  });
}

const reviewsApi = {
  list: async (filter: {location_id?: number; festival_id?: number} = {}): Promise<IReview[]> => {
    const page = await apiCall<ReviewPageDTO>({
      method: 'get', url: '/reviews', params: {...filter, limit: REVIEWS_PAGE_SIZE}, signedIn: false,
    });
    return withTargets(page.items);
  },

  create: async (review: NewReview): Promise<IReview> => {
    const dto = await apiCall<ReviewDTO>({method: 'post', url: '/reviews', data: review});
    // rating/review_count of the catalog changed.
    catalogRepository.clear();
    return (await withTargets([dto]))[0];
  },

  remove: async (reviewId: number): Promise<void> => {
    await apiCall({method: 'delete', url: `/reviews/${reviewId}`});
    catalogRepository.clear();
  },

  report: async (reviewId: number, reason?: string): Promise<string> =>
    (await apiCall<{detail: string}>({method: 'post', url: `/reviews/${reviewId}/report`, data: {reason}})).detail,
};

export default reviewsApi;
