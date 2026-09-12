export type InterestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface Interest {
  interestId: number;
  status: InterestStatus;
  createdAt: string;
  updatedAt: string | null;
  // The "other" party in the interest — sender when viewing /received, receiver when viewing /sent
  otherProfileId: string;
  otherFirstName: string;
  otherLastName: string | null;
  otherAge: number | null;
  otherCity: string | null;
  otherPrimaryPhotoUrl: string | null;
  /** DP crop focal point (object-position %, 0–100); null → center. */
  otherPhotoFocalX?: number | null;
  otherPhotoFocalY?: number | null;
}

export interface SendInterestResponse {
  interestId: number;
  status: InterestStatus;
  message: string;
}
