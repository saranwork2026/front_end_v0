import type { AxiosInstance } from 'axios';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/chat.types';
import type { PaginatedResponse } from '../types/common.types';

export interface MessageListParams {
  page?: number;
  size?: number;
}

export function createChatApi(client: AxiosInstance) {
  return {
    getConversations() {
      return client.get<Conversation[]>('/user/chat/conversations');
    },

    getMessages(otherProfileId: string, params: MessageListParams = {}) {
      const { page = 0, size = 20 } = params;
      return client.get<PaginatedResponse<Message>>(
        `/user/chat/messages/${otherProfileId}?page=${page}&size=${size}`
      );
    },

    sendMessage(data: SendMessageRequest) {
      return client.post<SendMessageResponse>('/user/chat/send', data);
    },

    /** Flag a received message for admin review. */
    flagMessage(messageId: number, reason: string) {
      return client.post<{ message: string }>(`/user/chat/messages/${messageId}/flag`, { reason });
    },
  };
}
