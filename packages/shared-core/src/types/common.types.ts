export interface ApiError {
  timestamp?: string;
  status?: number;
  errorCode?: string;
  message?: string;
  path?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export type UserRole = 'USER' | 'ADMIN_REQUESTER' | 'ADMIN_APPROVER';

export type UserStatus = 'ACTIVE' | 'OTP_PENDING' | 'BLOCKED' | 'DEACTIVATED';

export type ProfileStatus = 'DRAFT' | 'COMPLETED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
