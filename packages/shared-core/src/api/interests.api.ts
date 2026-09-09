import type { AxiosInstance } from 'axios';
import type { Interest, InterestStatus, SendInterestResponse } from '../types/interests.types';
import type { PaginatedResponse } from '../types/common.types';

export interface InterestListParams {
  page?: number;
  size?: number;
  status?: InterestStatus;
}

export function createInterestsApi(client: AxiosInstance) {
  return {
    sendInterest(receiverProfileId: string) {
      return client.post<SendInterestResponse>(`/user/interests/${receiverProfileId}`);
    },

    getReceivedInterests(params: InterestListParams = {}) {
      const { page = 0, size = 10, status } = params;
      let url = `/user/interests/received?page=${page}&size=${size}`;
      if (status) url += `&status=${status}`;

      return client.get<PaginatedResponse<Interest>>(url);
    },

    getSentInterests(params: InterestListParams = {}) {
      const { page = 0, size = 10, status } = params;
      let url = `/user/interests/sent?page=${page}&size=${size}`;
      if (status) url += `&status=${status}`;

      return client.get<PaginatedResponse<Interest>>(url);
    },

    updateInterestStatus(interestId: number, status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') {
      return client.put<Interest>(`/user/interests/${interestId}?status=${status}`);
    },
  };
}
