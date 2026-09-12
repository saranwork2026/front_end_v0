export type AccessRequestType = 'PHOTO' | 'CONTACT';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AccessRequest {
  requestId: number;
  requesterProfileId: string;
  requesterFirstName: string;
  requesterLastName: string | null;
  requesterPrimaryPhotoUrl: string | null;
  requesterPhotoFocalX?: number | null;
  requesterPhotoFocalY?: number | null;
  ownerProfileId: string;
  ownerFirstName: string;
  ownerLastName: string | null;
  ownerPrimaryPhotoUrl: string | null;
  ownerPhotoFocalX?: number | null;
  ownerPhotoFocalY?: number | null;
  type: AccessRequestType;
  status: AccessRequestStatus;
  createdAt: string;
}
