import type { AxiosInstance } from 'axios';
import type { SearchFilters, SearchResult } from '../types/search.types';
import type { PaginatedResponse } from '../types/common.types';

export interface SearchParams {
  page?: number;
  size?: number;
  sort?: string;
}

export function createSearchApi(client: AxiosInstance) {
  return {
    searchProfiles(filters: SearchFilters, params: SearchParams = {}) {
      const { page = 0, size = 10, sort } = params;
      let url = `/user/search?page=${page}&size=${size}`;
      if (sort) url += `&sort=${sort}`;

      return client.post<PaginatedResponse<SearchResult>>(url, filters);
    },

    getMatches(params: SearchParams = {}) {
      const { page = 0, size = 10 } = params;
      return client.get<PaginatedResponse<SearchResult>>(
        `/user/matches?page=${page}&size=${size}`
      );
    },

    /** A small, curated "Today's matches" set (deterministic per day). */
    getDailyRecommendations(limit = 6) {
      return client.get<SearchResult[]>(`/user/matches/daily?limit=${limit}`);
    },

    /** Admin-curated featured/spotlight profiles (public endpoint). */
    getFeaturedProfiles(limit = 12) {
      return client.get<SearchResult[]>(`/pub/featured-profiles?limit=${limit}`);
    },
  };
}
