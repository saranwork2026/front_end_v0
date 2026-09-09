export interface ProfileView {
  viewerProfileId: string;
  viewerFirstName: string;
  viewerAge: string | null;
  viewerCity: string | null;
  viewerPrimaryPhotoUrl: string | null;
  viewedAt: string;
}

export interface ProfileViewCountResponse {
  totalViews: number;
}
