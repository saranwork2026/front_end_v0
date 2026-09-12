export interface ProfileView {
  viewerProfileId: string;
  viewerFirstName: string;
  viewerAge: string | null;
  viewerCity: string | null;
  viewerPrimaryPhotoUrl: string | null;
  /** DP crop focal point (object-position %, 0–100); null → center. */
  viewerPhotoFocalX?: number | null;
  viewerPhotoFocalY?: number | null;
  viewedAt: string;
}

export interface ProfileViewCountResponse {
  totalViews: number;
}
