import type { AxiosInstance } from 'axios';
import type { Notification, UnreadCountResponse } from '../types/notifications.types';
import type { PaginatedResponse } from '../types/common.types';

export interface NotificationListParams {
  page?: number;
  size?: number;
}

export function createNotificationsApi(client: AxiosInstance) {
  return {
    getNotifications(params: NotificationListParams = {}) {
      const { page = 0, size = 10 } = params;
      return client.get<PaginatedResponse<Notification>>(
        `/user/notifications?page=${page}&size=${size}`
      );
    },

    getUnreadCount() {
      return client.get<UnreadCountResponse>('/user/notifications/unread-count');
    },

    markRead(notificationId: number) {
      return client.put<{ message: string }>(
        `/user/notifications/${notificationId}/read`
      );
    },

    markAllRead() {
      return client.put<{ message: string }>('/user/notifications/read-all');
    },
  };
}
