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

export const URL_GET_LOCATIONS = '/api/v2/tables/mabae56b5ekx00z/records';
export const URL_GET_ITEMS = '/api/v2/tables/m4r9i7mbcsh1m0e/records';

const locationApi = {
  getLocations: async () => {
    const res = await request.get<GetLocationsResponse>(URL_GET_LOCATIONS, {
      params: {
        offset: '0',
        limit: '100',
      },
    });
    let data = res.data.list ?? [];
    data = data.map(location => ({
      ...location,
      reviews: JSON.parse(location.reviews as unknown as string),
    }));
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
        filterByFormula: `FIND('${locationId}', {location})`,
      },
    });
    const data = res.data.list ?? [];
    // return data.filter(item => item.location?.Id === locationId);
    return data;
  },
};
export default locationApi;
