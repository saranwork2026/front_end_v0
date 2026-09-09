import type { AxiosInstance } from 'axios';

export function createAccountApi(client: AxiosInstance) {
  return {
    deactivateAccount() {
      return client.put<{ message: string }>('/user/account/deactivate');
    },

    activateAccount() {
      return client.put<{ message: string }>('/user/account/activate');
    },

    deleteAccount() {
      return client.delete<{ message: string }>('/user/account');
    },
  };
}
