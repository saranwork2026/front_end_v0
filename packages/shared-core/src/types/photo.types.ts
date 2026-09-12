export type PhotoStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type PhotoVisibility = 'PUBLIC' | 'PREMIUM_ONLY' | 'REQUEST_REQUIRED';

export interface PhotoResponse {
  photoId: number;
  photoUrl: string | null;
  /** Resized variant for grids/thumbnails; falls back to photoUrl when null. */
  thumbnailUrl?: string | null;
  visibility: PhotoVisibility;
  status: PhotoStatus;
  isPrimary: boolean;
  isDeleted: boolean;
  /** DP crop focal point as CSS object-position percentages (0–100). Used to
   * render the same face-centered crop everywhere the avatar/DP appears.
   * Defaults to 50/50 (center) when unset. */
  focalX?: number | null;
  focalY?: number | null;
  /** True when the viewer doesn't meet this photo's visibility requirement
   * — photoUrl is null in that case; render a blurred/lock placeholder. */
  isBlurred?: boolean;
}
