import type { AxiosInstance } from 'axios';
import type { PublicProfilePreview } from '../types/publicProfile.types';

export function createPublicProfileApi(client: AxiosInstance) {
  return {
    /** Public, unauthenticated profile preview for a shareable link. */
    getPreview(profileId: string) {
      return client.get<PublicProfilePreview>(`/pub/profile/${profileId}`);
    },
  };
}
