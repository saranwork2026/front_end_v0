import type { ProfileStatus, UserRole, UserStatus } from './common.types';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  mobileNo: string;
  email?: string;
  password: string;
  captchaToken: string;
  /** Optional referral code (an inviter's profileId) captured from ?ref= on the register URL. */
  referralCode?: string;
}

export interface RegisterResponse {
  userId: string;
  profileId: string;
  message: string;
  otpChannels: string[];
  /**
   * Whether the user must complete OTP verification. True in the normal
   * flow. False only in backend TEST mock mode (otp.mock-enabled) — when
   * false the frontend skips the OTP screen and sends the user to login.
   * Optional for backwards compatibility with older backends that don't
   * send it (treated as "OTP required" when absent).
   */
  otpRequired?: boolean;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  captchaToken: string;
}

export interface LoginResponse {
  profileId: string;
  userId: string;
  role: UserRole;
  userStatus: UserStatus;
  profileStatus: ProfileStatus | null;
  profileCompletionPct: number;
  /** True for admin-created members who must set their own password before using the app. */
  mustChangePassword?: boolean;
  message: string;
}

export interface OTPVerifyRequest {
  profileId: string;
  smsOtp: string;
  emailOtp?: string;
}

export interface OTPVerifyResponse {
  smsVerified: boolean;
  emailVerified: boolean;
  userActivated: boolean;
  message: string;
  emailError: string | null;
}

export interface OTPResendRequest {
  profileId: string;
  channel: 'SMS' | 'EMAIL';
}

export interface RefreshTokenResponse {
  profileId: string;
  userId: string;
  role: UserRole;
  userStatus: UserStatus;
  profileStatus: ProfileStatus | null;
  profileCompletionPct: number;
  message: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface PendingVerificationRequest {
  identifier: string;
}

export interface PendingVerificationResponse {
  profileId: string;
  otpChannels: string[];
}

export interface ResetPasswordRequest {
  profileId: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
