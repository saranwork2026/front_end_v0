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

    /** Privacy toggle — hide/show the member's activity indicator to others. */
    setAppearOffline(appearOffline: boolean) {
      return client.put<{ message: string; appearOffline: boolean }>(
        '/user/account/appear-offline',
        { appearOffline },
      );
    },
  };
}
