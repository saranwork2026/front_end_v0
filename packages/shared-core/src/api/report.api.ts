import type { AxiosInstance } from 'axios';
import type { ReportUserRequest } from '../types/report.types';

export function createReportApi(client: AxiosInstance) {
  return {
    reportUser(profileId: string, data: ReportUserRequest) {
      return client.post<{ message: string }>(`/user/report/${profileId}`, data);
    },
  };
}
