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
  /** True when the viewer doesn't meet this photo's visibility requirement
   * — photoUrl is null in that case; render a blurred/lock placeholder. */
  isBlurred?: boolean;
}
