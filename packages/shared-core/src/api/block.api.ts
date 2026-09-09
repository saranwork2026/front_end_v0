import type { AxiosInstance } from 'axios';
import type { BlockedUser } from '../types/block.types';

export function createBlockApi(client: AxiosInstance) {
  return {
    blockUser(profileId: string) {
      return client.post<{ message: string }>(`/user/block/${profileId}`);
    },

    unblockUser(profileId: string) {
      return client.delete<{ message: string }>(`/user/block/${profileId}`);
    },

    getBlockedUsers() {
      return client.get<BlockedUser[]>('/user/block');
    },
  };
}
