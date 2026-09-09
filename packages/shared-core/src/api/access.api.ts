import type { AxiosInstance } from 'axios';
import type { AccessRequest, AccessRequestStatus, AccessRequestType } from '../types/access.types';
import type { PaginatedResponse } from '../types/common.types';

export interface AccessRequestListParams {
  page?: number;
  size?: number;
  status?: AccessRequestStatus;
}

export function createAccessApi(client: AxiosInstance) {
  return {
    sendAccessRequest(ownerProfileId: string, type: AccessRequestType) {
      return client.post<AccessRequest>(
        `/user/access-requests/${ownerProfileId}?type=${type}`
      );
    },

    getReceivedAccessRequests(params: AccessRequestListParams = {}) {
      const { page = 0, size = 10, status } = params;
      let url = `/user/access-requests/received?page=${page}&size=${size}`;
      if (status) url += `&status=${status}`;

      return client.get<PaginatedResponse<AccessRequest>>(url);
    },

    getSentAccessRequests(params: AccessRequestListParams = {}) {
      const { page = 0, size = 10, status } = params;
      let url = `/user/access-requests/sent?page=${page}&size=${size}`;
      if (status) url += `&status=${status}`;

      return client.get<PaginatedResponse<AccessRequest>>(url);
    },

    updateAccessRequestStatus(requestId: number, status: 'APPROVED' | 'REJECTED') {
      return client.put<AccessRequest>(
        `/user/access-requests/${requestId}?status=${status}`
      );
    },
  };
}
