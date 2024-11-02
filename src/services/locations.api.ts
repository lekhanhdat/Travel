import {ILocation} from '../common/types';
import {request} from './axios';

export type GetLocationsResponse = {
  records: ILocation[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
  };
};

export const URL_GET_LOCATIONS = '/api/v2/tables/mabae56b5ekx00z/records';

const locationApi = {
  getLocations: async () => {
    const res = await request.get<GetLocationsResponse>(URL_GET_LOCATIONS, {
      params: {
        offset: '0',
        limit: '100',
      },
    });
    const data = res.data?.records ?? [];
    return data;
  },
};
export default locationApi;
