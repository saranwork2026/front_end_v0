import type { AxiosInstance } from 'axios';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
  OTPResendRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  PendingVerificationRequest,
  PendingVerificationResponse,
} from '../types/auth.types';

export function createAuthApi(client: AxiosInstance) {
  return {
    register(data: RegisterRequest) {
      return client.post<RegisterResponse>('/auth/register', data);
    },

    verifyOtp(data: OTPVerifyRequest) {
      return client.post<OTPVerifyResponse>('/auth/verify-otp', data);
    },

    resendOtp(data: OTPResendRequest) {
      return client.post<{ message: string }>('/auth/resend-otp', data);
    },

    login(data: LoginRequest) {
      return client.post<LoginResponse>('/auth/login', data);
    },

    /**
     * Cookie-only refresh — no body needed, refresh_token cookie is sent
     * automatically. Used both for the interceptor's silent refresh and for
     * explicit session-restore on app load.
     */
    refreshToken() {
      return client.post<RefreshTokenResponse>('/auth/refresh-token');
    },

    logout() {
      return client.post<{ message: string }>('/auth/logout');
    },

    forgotPassword(data: ForgotPasswordRequest) {
      return client.post<{ message: string }>('/auth/forgot-password', data);
    },

    resetPassword(data: ResetPasswordRequest) {
      return client.post<{ message: string }>('/auth/reset-password', data);
    },

    changePassword(data: ChangePasswordRequest) {
      return client.post<{ message: string }>('/auth/change-password', data);
    },

    /**
     * Looks up a not-yet-activated account by profileId, email, or mobile —
     * used by VerifyOtpPage to reconstruct profileId + otpChannels when the
     * user lands there without register-flow router state (e.g. via the
     * "Verify your account" link shown after a USER_OTP_PENDING login error).
     */
    getPendingVerification(data: PendingVerificationRequest) {
      return client.post<PendingVerificationResponse>('/auth/pending-verification', data);
    },
  };
}
