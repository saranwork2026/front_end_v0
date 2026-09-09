import type { AxiosInstance } from 'axios';
import type { SuccessStory } from '../types/admin.types';
import type { PaginatedResponse } from '../types/common.types';

export interface SuccessStorySubmitData {
  brideName: string;
  groomName: string;
  story: string;
  marriageDate?: string;
  partnerProfileId?: string;
  photo?: File;
}

/**
 * Public + member success-story endpoints.
 * (Admin moderation lives in admin.api.ts.)
 */
export function createSuccessStoryApi(client: AxiosInstance) {
  return {
    /** Published stories for the public marketing page. */
    getPublished(page = 0, size = 12) {
      return client.get<PaginatedResponse<SuccessStory>>(
        `/pub/success-stories?page=${page}&size=${size}`
      );
    },

    /** Member submits a success story (with optional couple photo). */
    submit(data: SuccessStorySubmitData) {
      const formData = new FormData();
      formData.append('brideName', data.brideName);
      formData.append('groomName', data.groomName);
      formData.append('story', data.story);
      if (data.marriageDate) formData.append('marriageDate', data.marriageDate);
      if (data.partnerProfileId) formData.append('partnerProfileId', data.partnerProfileId);
      if (data.photo) formData.append('photo', data.photo);
      return client.post<SuccessStory>('/user/success-stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  };
}
