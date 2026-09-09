export type ReportReasonType =
  | 'FAKE_PROFILE'
  | 'INAPPROPRIATE_PHOTO'
  | 'HARASSMENT'
  | 'SPAM'
  | 'WRONG_INFORMATION'
  | 'ALREADY_MARRIED'
  | 'OTHER';

export interface ReportUserRequest {
  reason: ReportReasonType;
  description?: string;
}
