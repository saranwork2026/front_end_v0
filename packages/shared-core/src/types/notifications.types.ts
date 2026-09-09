// Mirrors the backend com.matrimony.notification.dto.NotificationType enum exactly.
// Keep this union in sync with that enum — these are the only `type` values the
// notifications API can return.
export type NotificationType =
  | 'NEW_INTEREST'
  | 'INTEREST_ACCEPTED'
  | 'INTEREST_REJECTED'
  | 'ACCESS_REQUEST_RECEIVED'
  | 'ACCESS_REQUEST_RESPONDED'
  | 'NEW_MESSAGE'
  | 'CONTACT_UNLOCKED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'PROFILE_VIEWED'
  | 'OTP_VERIFIED'
  | 'PROFILE_SUBMITTED'
  | 'PROFILE_INCOMPLETE_REMINDER'
  | 'PROFILE_APPROVED'
  | 'PROFILE_REJECTED'
  | 'PHOTO_APPROVED'
  | 'PHOTO_REJECTED'
  | 'PAYMENT_APPROVED'
  | 'PLAN_ACTIVATED';

export interface Notification {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
