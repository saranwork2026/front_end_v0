import type { AxiosInstance } from 'axios';
import type { AdBanner, AdBannerStatus } from '../types/adBanner.types';
import type { PaginatedResponse } from '../types/common.types';

export function createAdBannerApi(client: AxiosInstance) {
  return {
    /** Public: approved banners for the dashboard carousel. */
    getApprovedBanners() {
      return client.get<AdBanner[]>('/pub/ad-banners');
    },

    // --- Admin (reviewer) management ---

    /** Reviewer upload (multipart). Banner starts PENDING until approved. */
    uploadBanner(data: {
      image: File;
      title?: string;
      linkUrl?: string;
      displayOrder?: number;
    }) {
      const form = new FormData();
      form.append('image', data.image);
      if (data.title) form.append('title', data.title);
      if (data.linkUrl) form.append('linkUrl', data.linkUrl);
      if (data.displayOrder != null) form.append('displayOrder', String(data.displayOrder));
      return client.post<AdBanner>('/admin/ad-banners', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    listBanners(params: { status?: AdBannerStatus; page?: number; size?: number } = {}) {
      const { status, page = 0, size = 20 } = params;
      let url = `/admin/ad-banners?page=${page}&size=${size}`;
      if (status) url += `&status=${status}`;
      return client.get<PaginatedResponse<AdBanner>>(url);
    },

    deleteBanner(id: number) {
      return client.delete<{ message: string }>(`/admin/ad-banners/${id}`);
    },

    // --- Reviewer -> approver moderation (two-step) ---

    /** Reviewer raises an approval request for a PENDING banner. */
    requestApproval(id: number, remarks?: string) {
      const q = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(`/admin/moderation/request/ad-banner/${id}/approve${q}`);
    },

    /** Reviewer raises a rejection request for a PENDING banner. */
    requestRejection(id: number, remarks?: string) {
      const q = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(`/admin/moderation/request/ad-banner/${id}/reject${q}`);
    },
  };
}
