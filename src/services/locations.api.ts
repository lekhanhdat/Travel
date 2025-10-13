import {IItem, ILocation} from '../common/types';
import {request} from './axios';

export type GetLocationsResponse = {
  list: ILocation[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
  };
};

export type GetItemsResponse = {
  list: IItem[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
  };
};

export const URL_GET_LOCATIONS = '/api/v2/tables/m9x4suuh5ufxi1n/records'; // NocoDB Locations Table
export const URL_GET_ITEMS = '/api/v2/tables/m0s4uwjesun4rl9/records'; // Items - chưa setup

const locationApi = {
  getLocations: async () => {
    const res = await request.get<GetLocationsResponse>(URL_GET_LOCATIONS, {
      params: {
        offset: '0',
        limit: '100',
      },
    });
    let data = res.data.list ?? [];

    // Parse JSON fields từ NocoDB
    data = data.map(location => {
      const parsed: any = {
        ...location,
      };

      // Parse reviews (luôn là JSON string từ NocoDB)
      if (typeof location.reviews === 'string') {
        try {
          parsed.reviews = JSON.parse(location.reviews);
        } catch (e) {
          console.error('Error parsing reviews:', e);
          parsed.reviews = [];
        }
      }

      // Parse images (có thể là JSON string từ NocoDB)
      if (typeof location.images === 'string') {
        try {
          parsed.images = JSON.parse(location.images);
        } catch (e) {
          console.error('Error parsing images:', e);
          parsed.images = [];
        }
      }

      // Parse videos (có thể là JSON string từ NocoDB)
      if (typeof location.videos === 'string') {
        try {
          parsed.videos = JSON.parse(location.videos);
        } catch (e) {
          console.error('Error parsing videos:', e);
          parsed.videos = [];
        }
      }

      // Parse advise (có thể là JSON string từ NocoDB)
      if (typeof location.advise === 'string') {
        try {
          // Thử parse JSON trước
          parsed.advise = JSON.parse(location.advise);
        } catch (e) {
          // Nếu không phải JSON, giữ nguyên string
          parsed.advise = location.advise;
        }
      }

      return parsed;
    });

    return data;
  },

  getItems: async () => {
    const res = await request.get<GetItemsResponse>(URL_GET_ITEMS, {
      params: {
        offset: '0',
        limit: '100',
      },
    });
    const data = res.data.list ?? [];
    return data;
  },

  getItemsWithLocationId: async (locationId: number) => {
    const res = await request.get<GetItemsResponse>(URL_GET_ITEMS, {
      params: {
        offset: '0',
        limit: '100',
        // filterByFormula: `FIND('${locationId}', {location})`,
      },
    });
    let data = res.data.list ?? [];

    data = data.filter(
      item => item.location && item.location?.Id === locationId,
    );

    // return data.filter(item => item.location?.Id === locationId);
    return data;
  },
};
export default locationApi;
