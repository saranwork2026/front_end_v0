import type { AxiosInstance } from 'axios';
import type { ProfileView, ProfileViewCountResponse } from '../types/profileViews.types';
import type { PaginatedResponse } from '../types/common.types';

export interface ProfileViewListParams {
  page?: number;
  size?: number;
}

export function createProfileViewsApi(client: AxiosInstance) {
  return {
    getProfileViews(params: ProfileViewListParams = {}) {
      const { page = 0, size = 10 } = params;
      return client.get<PaginatedResponse<ProfileView>>(
        `/user/profile-views?page=${page}&size=${size}`
      );
    },

    getViewCount() {
      return client.get<ProfileViewCountResponse>('/user/profile-views/count');
    },

    /** Profiles the current user has viewed (outgoing; each profile once). */
    getProfilesIViewed(params: ProfileViewListParams = {}) {
      const { page = 0, size = 10 } = params;
      return client.get<PaginatedResponse<ProfileView>>(
        `/user/profile-views/made?page=${page}&size=${size}`
      );
    },
  };
}
