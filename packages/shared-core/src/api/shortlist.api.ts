import type { AxiosInstance } from 'axios';
import type { SearchResult } from '../types/search.types';
import type { PaginatedResponse } from '../types/common.types';

export interface ShortlistListParams {
  page?: number;
  size?: number;
}

export function createShortlistApi(client: AxiosInstance) {
  return {
    addToShortlist(profileId: string) {
      return client.post<{ message: string }>(`/user/shortlist/${profileId}`);
    },

    removeFromShortlist(profileId: string) {
      return client.delete<{ message: string }>(`/user/shortlist/${profileId}`);
    },

    getShortlist(params: ShortlistListParams = {}) {
      const { page = 0, size = 10 } = params;
      return client.get<PaginatedResponse<SearchResult>>(
        `/user/shortlist?page=${page}&size=${size}`
      );
    },
  };
}
