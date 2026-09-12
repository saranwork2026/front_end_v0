// API Client
export { createApiClient } from './api/client';
export type { ApiClientConfig } from './api/client';

// Domain API modules
export { createAuthApi } from './api/auth.api';
export { createProfileApi } from './api/profile.api';
export type { PartnerPreference } from './api/profile.api';
export { createSearchApi } from './api/search.api';
export type { SearchParams } from './api/search.api';
export { createInterestsApi } from './api/interests.api';
export type { InterestListParams } from './api/interests.api';
export { createAccessApi } from './api/access.api';
export type { AccessRequestListParams } from './api/access.api';
export { createContactsApi } from './api/contacts.api';
export { createChatApi } from './api/chat.api';
export type { MessageListParams } from './api/chat.api';
export { createPaymentsApi } from './api/payments.api';
export { createWalletApi } from './api/wallet.api';
export { createReferralApi } from './api/referral.api';
export { createPublicProfileApi } from './api/publicProfile.api';
export { createNotificationsApi } from './api/notifications.api';
export type { NotificationListParams } from './api/notifications.api';
export { createAdminApi } from './api/admin.api';
export type { AdminUserListParams, AdminReportListParams, AdminFlaggedUserParams } from './api/admin.api';
export { createPlansApi } from './api/plans.api';
export { createShortlistApi } from './api/shortlist.api';
export type { ShortlistListParams } from './api/shortlist.api';
export { createBlockApi } from './api/block.api';
export { createProfileViewsApi } from './api/profileViews.api';
export type { ProfileViewListParams } from './api/profileViews.api';
export { createActivityApi } from './api/activity.api';
export { createReportApi } from './api/report.api';
export { createAccountApi } from './api/account.api';
export { createPhotoApi } from './api/photo.api';
export { createSuccessStoryApi } from './api/successStory.api';
export type { SuccessStorySubmitData } from './api/successStory.api';
export { createVerificationApi } from './api/verification.api';

// Common types
export type { ApiError, PaginatedResponse, UserRole } from './types/common.types';

// Auth types
export type {
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
} from './types/auth.types';

// Profile types
export type {
  Gender,
  MaritalStatus,
  Manglik,
  EmploymentType,
  ResidencyStatus,
  BloodGroup,
  Complexion,
  BodyType,
  PhysicalStatus,
  FamilyType,
  FamilyStatus,
  Dhosam,
  ProfileStatus,
  VisibilityLevel,
  ProfileSection,
  ProfileStrength,
  UserProfile,
  BasicSectionRequest,
  ReligiousSectionRequest,
  ProfessionalSectionRequest,
  LocationSectionRequest,
  PhysicalSectionRequest,
  FamilySectionRequest,
  HoroscopeSectionRequest,
} from './types/profile.types';

// Search types
export type { SearchFilters, SearchResult, ActivityStatus } from './types/search.types';

// Interest types
export type { InterestStatus, Interest, SendInterestResponse } from './types/interests.types';

// Access types
export type { AccessRequestType, AccessRequestStatus, AccessRequest } from './types/access.types';

// Contact types
export type { UnlockContactResponse, UnlockedContact } from './types/contacts.types';

// Chat types
export type { Conversation, Message, SendMessageRequest, SendMessageResponse } from './types/chat.types';

// Payment types
export type {
  PaymentStatus,
  PaymentType,
  Payment,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentSuccessRequest,
  PaymentFailedRequest,
  PaymentMethod,
  ManualPaymentRequest,
  ManualPaymentResponse,
  ContactUnlockManualPaymentRequest,
} from './types/payments.types';

export type { ManualPaymentFormData, ContactUnlockManualPaymentFormData } from './api/payments.api';

// Wallet types
export type { Wallet, WalletTransaction, WalletTopupRequest, WalletTopupResponse } from './types/wallet.types';

// Referral types
export type { ReferralSummary } from './types/referral.types';

// Public profile preview types
export type { PublicProfilePreview } from './types/publicProfile.types';

// Notification types
export type { NotificationType, Notification, UnreadCountResponse } from './types/notifications.types';

// Admin types
export type {
  ModerationAction,
  ModerationRequest,
  ModerationRequestAction,
  ModerationRequestStatus,
  ModerationRequestRecord,
  PendingProfileSummary,
  PendingPhotoSummary,
  PendingPaymentSummary,
  FlagReason,
  UserAccountStatus,
  Role,
  FlaggedUser,
  AdminUserDetail,
  ReportStatus,
  Report,
  AuditLogEntry,
  SubscriptionStatus,
  AdminSubscriptionView,
  AdminEditableField,
  AdminEditRequestStatus,
  AdminProfileEditRequestView,
  AdminAnalytics,
  AnalyticsCountByLabel,
  AnalyticsDailyCount,
  SuccessStory,
  SuccessStoryStatus,
  BroadcastSegment,
  BroadcastRequestPayload,
  BroadcastResult,
  MemberNote,
  AdminActivity,
  AdminActivityRow,
  AdminActivityEventCount,
  VerificationStatus,
  DocumentType,
  IdVerification,
  ReportContext,
  ReportChatMessage,
  AdminCreateUserPayload,
  AdminCreateUserResult,
  FullProfileRequest,
  AssistedRegistrationRequestView,
  PaymentReferenceType,
  AdminPayment,
  FlaggedMessage,
  AdminSession,
} from './types/admin.types';

// Plan types
export type {
  SubscriptionPlan,
  PlanCreateRequest,
  PlanUpdateRequest,
} from './types/plans.types';

// Block types
export type { BlockedUser } from './types/block.types';

// Profile view types
export type { ProfileView, ProfileViewCountResponse } from './types/profileViews.types';

// Activity summary types
export type { ActivitySummary } from './types/activity.types';

// Report types
export type { ReportReasonType, ReportUserRequest } from './types/report.types';

// Photo types
export type { PhotoStatus, PhotoVisibility, PhotoResponse } from './types/photo.types';

// Utility functions - Token
export { decodeJwtPayload, getTokenExpiry, isTokenExpiringSoon } from './utils/token';

// Utility functions - Formatters
export { formatCurrency, formatDate, formatWalletBalance, truncateText } from './utils/formatters';

// Utility functions - API error handling
export { getApiError, getApiErrorMessage } from './utils/apiError';

// Validation Schemas - Auth
export {
  registerSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  VALIDATION_MESSAGES_EN,
} from './schemas/auth.schema';
export type {
  RegisterFormValues,
  LoginFormValues,
  OtpFormValues,
  ForgotPasswordFormValues,
  ResetPasswordFormValues,
  ChangePasswordFormValues,
} from './schemas/auth.schema';

// Validation Schemas - Profile
export {
  basicSectionSchema,
  religiousSectionSchema,
  professionalSectionSchema,
  locationSectionSchema,
  physicalSectionSchema,
  familySectionSchema,
  horoscopeSectionSchema,
} from './schemas/profile.schema';
export type {
  BasicSectionFormValues,
  ReligiousSectionFormValues,
  ProfessionalSectionFormValues,
  LocationSectionFormValues,
  PhysicalSectionFormValues,
  FamilySectionFormValues,
  HoroscopeSectionFormValues,
} from './schemas/profile.schema';

// Validation Schemas - Partner Preference
export { partnerPreferenceSchema } from './schemas/partner-preference.schema';
export type { PartnerPreferenceFormValues } from './schemas/partner-preference.schema';

// Validation Schemas - Admin
export {
  planFormSchema,
  reportReviewSchema,
  flagSchema,
} from './schemas/admin.schema';
export type {
  PlanFormValues,
  ReportReviewFormValues,
  FlagFormValues,
} from './schemas/admin.schema';

// Stores
export { createAuthStore } from './stores/auth.store';
export type { AuthState, AuthActions, AuthStore } from './stores/auth.store';

export { createNotificationStore } from './stores/notification.store';
export type { NotificationState, NotificationActions, NotificationStore } from './stores/notification.store';

export { createSubscriptionStore } from './stores/subscription.store';
export type { ActivePlan, SubscriptionState, SubscriptionActions, SubscriptionStore } from './stores/subscription.store';
