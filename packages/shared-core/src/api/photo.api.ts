import type { AxiosInstance, AxiosProgressEvent } from 'axios';
import type { PhotoResponse, PhotoVisibility } from '../types/photo.types';

/**
 * Photo API — profile photos and horoscope chart photos.
 *
 * Backend contract (com.matrimony.photo.controller.UserPhotoController):
 *   POST   /user/photos                         — upload profile photo (multipart: file, visibility)
 *   POST   /user/photos/horoscope               — upload horoscope photo (multipart: file)
 *   GET    /user/photos                          — own profile photos (all statuses)
 *   GET    /user/photos/horoscope                — own horoscope photos (all statuses)
 *   GET    /user/photos/profile/{profileId}      — another user's visible profile photos
 *   GET    /user/photos/horoscope/{profileId}    — another user's visible horoscope photos
 *   PUT    /user/photos/{photoId}/primary        — set primary
 *   DELETE /user/photos/{photoId}                — soft delete
 */
export function createPhotoApi(client: AxiosInstance) {
  return {
    /** Own profile photos (all statuses). */
    listPhotos() {
      return client.get<PhotoResponse[]>('/user/photos');
    },

    /** Own horoscope photos (all statuses). */
    listHoroscopePhotos() {
      return client.get<PhotoResponse[]>('/user/photos/horoscope');
    },

    /**
     * Another user's APPROVED profile photos, filtered by their
     * photoVisibility setting (see backend VisibilityService). Returns
     * placeholder entries with isBlurred:true (no photoUrl) for photos the
     * viewer isn't allowed to see, rather than omitting them.
     */
    getPhotosForProfile(profileId: string) {
      return client.get<PhotoResponse[]>(`/user/photos/profile/${profileId}`);
    },

    /**
     * Another user's APPROVED horoscope photos, filtered by their
     * photoVisibility setting (same rules as profile photos).
     */
    getHoroscopePhotosForProfile(profileId: string) {
      return client.get<PhotoResponse[]>(`/user/photos/horoscope/${profileId}`);
    },

    uploadPhoto(
      file: File,
      visibility: PhotoVisibility,
      onUploadProgress?: (event: AxiosProgressEvent) => void
    ) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('visibility', visibility);
      return client.post<PhotoResponse>('/user/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });
    },

    /**
     * Upload a horoscope chart photo. The backend forces visibility to
     * REQUEST_REQUIRED and these don't count against the 3-photo profile limit.
     */
    uploadHoroscopePhoto(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      return client.post<PhotoResponse>('/user/photos/horoscope', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    setPrimary(photoId: number) {
      return client.put<PhotoResponse>(`/user/photos/${photoId}/primary`);
    },

    deletePhoto(photoId: number) {
      return client.delete<PhotoResponse>(`/user/photos/${photoId}`);
    },
  };
}
