import type { AxiosInstance } from 'axios';
import type { UnlockContactResponse, UnlockedContact } from '../types/contacts.types';

export function createContactsApi(client: AxiosInstance) {
  return {
    unlockContact(targetProfileId: string) {
      return client.post<UnlockContactResponse>(
        `/user/contacts/unlock/${targetProfileId}`
      );
    },

    getUnlockedContacts() {
      return client.get<UnlockedContact[]>('/user/contacts/unlocked');
    },
  };
}
