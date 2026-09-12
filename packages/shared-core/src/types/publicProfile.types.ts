/**
 * Public, unauthenticated profile preview for a shareable link
 * (matches backend PublicProfilePreviewResponse). When {@code available} is
 * false, the other fields are absent — render a "not available" state.
 */
export interface PublicProfilePreview {
  available: boolean;
  profileId?: string;
  firstName?: string;
  age?: number | null;
  currentCity?: string | null;
  religion?: string | null;
  primaryPhotoUrl?: string | null;
  /** DP crop focal point (object-position %, 0–100); null → center. */
  photoFocalX?: number | null;
  photoFocalY?: number | null;
}
