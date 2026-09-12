export type AdBannerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';

/** A vendor/promo banner shown on the customer dashboard. */
export interface AdBanner {
  id: number;
  imageUrl: string;
  title?: string | null;
  linkUrl?: string | null;
  displayOrder: number;
  status: AdBannerStatus;
  createdAt?: string;
}
