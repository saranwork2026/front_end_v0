import type {
  ProfileStatus,
  BasicSectionRequest,
  ReligiousSectionRequest,
  ProfessionalSectionRequest,
  LocationSectionRequest,
  PhysicalSectionRequest,
  FamilySectionRequest,
  HoroscopeSectionRequest,
} from './profile.types';

export type ModerationAction = 'APPROVE' | 'REJECT';

export interface ModerationRequest {
  action: ModerationAction;
  reason?: string;
}

// --- Two-step moderation workflow ---
// Step 1 (ADMIN_REQUESTER): review pending profiles/photos, submit a request.
// Step 2 (ADMIN_APPROVER): review pending ModerationRequestRecords, approve/reject.

export type ModerationRequestAction =
  | 'APPROVE_PROFILE'
  | 'REJECT_PROFILE'
  | 'BLOCK_USER'
  | 'APPROVE_PHOTO'
  | 'REJECT_PHOTO'
  | 'VERIFY_PAYMENT'
  | 'REJECT_PAYMENT'
  | 'ASSIGN_SUBSCRIPTION'
  | 'APPLY_PROFILE_EDIT'
  | 'APPLY_ASSISTED_PROFILE'
  | 'APPROVE_AD_BANNER'
  | 'REJECT_AD_BANNER';

export type ModerationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Matches backend PendingModerationRequestSummary (GET /admin/moderation/pending). */
export interface ModerationRequestRecord {
  id: number;
  action: ModerationRequestAction;
  status: ModerationRequestStatus;
  targetUserId: string;
  /** Public-facing id of the target user (e.g. SM12), resolved from the ULID. */
  targetProfileId: string | null;
  targetFirstName: string | null;
  targetLastName: string | null;
  targetPhotoId: number | null;
  targetPaymentId: number | null;
  targetPlanId: number | null;
  planAssignMode: string | null;
  requestedBy: string;
  /** Public-facing id of the requesting admin, resolved from the ULID. */
  requestedByProfileId: string | null;
  /** Display name of the requesting admin, resolved from the ULID. */
  requestedByName: string | null;
  approvedBy: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** Matches backend PendingProfileSummary (GET /admin/moderation/profiles/pending). */
export interface PendingProfileSummary {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  age: number | null;
  currentCity: string | null;
  religion: string | null;
  profileCompletionPct: number | null;
  status: ProfileStatus;
  submittedAt: string;
}

/** Matches backend PendingPhotoSummary (GET /admin/photos/pending). */
export interface PendingPhotoSummary {
  photoId: number;
  profileId: string;
  photoUrl: string;
  uploadedAt: string;
}

/** Matches backend PendingPaymentSummary (GET /admin/moderation/payments/pending). */
export interface PendingPaymentSummary {
  paymentId: number;
  profileId: string | null;
  firstName: string | null;
  lastName: string | null;
  amount: number;
  planName: string | null;
  paymentMethod: 'CASH' | 'UPI' | 'ONLINE';
  referenceNote: string | null;
  screenshotUrl: string | null;
  submittedAt: string;
}

/** Matches backend com.matrimony.admin.dto.FlagReason. */
export type FlagReason =
  | 'SPAM'
  | 'FRAUD'
  | 'INAPPROPRIATE'
  | 'DUPLICATE'
  | 'SUSPICIOUS';

export type UserAccountStatus = 'ACTIVE' | 'OTP_PENDING' | 'BLOCKED' | 'DEACTIVATED';

/** Matches backend com.matrimony.admin.dto.Role. USER = customer, ADMIN_REQUESTER = reviewer, ADMIN_APPROVER = approver. */
export type Role = 'USER' | 'ADMIN_REQUESTER' | 'ADMIN_APPROVER';

/** Matches backend FlaggedUserResponse (GET /admin/users, GET /admin/users/flagged). */
export interface FlaggedUser {
  profileId: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string | null;
  userStatus: UserAccountStatus;
  role: Role | null;
  flag: FlagReason | null;
  flagReason: string | null;
  flaggedBy: string | null;
  flaggedAt: string | null;
}

/**
 * Matches backend FlaggedUserResponse — the actual DTO returned by both
 * GET /admin/users (list) and GET /admin/users/flagged. Kept as an alias
 * of FlaggedUser since they're the same wire shape.
 */
export type AdminUserDetail = FlaggedUser;

/** Matches backend AuditLog entity (GET /admin/audit-logs). */
export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: string;
  eventType: string;
  status: string | null;
  performedBy: string | null;
  details: string | null;
  createdAt: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED';

/** Matches backend AdminSubscriptionResponse (GET /admin/moderation/subscriptions/{identifier}). */
export interface AdminSubscriptionView {
  hasActiveSubscription: boolean;
  subscriptionId: number | null;
  planId: number | null;
  planName: string | null;
  price: number | null;
  startDate: string | null;
  expiryDate: string | null;
  totalContactLimit: number | null;
  remainingContactViews: number | null;
  totalMessageLimit: number | null;
  remainingMessages: number | null;
  totalInterestLimit: number | null;
  remainingInterests: number | null;
  totalPhotoLimit: number | null;
  remainingPhotoViews: number | null;
  status: SubscriptionStatus | null;
}

/** Matches backend com.matrimony.admin.dto.AdminEditableField. */
export type AdminEditableField = 'FIRST_NAME' | 'LAST_NAME' | 'MOBILE_NO' | 'EMAIL';

/** Matches backend com.matrimony.admin.dto.AdminEditRequestStatus. */
export type AdminEditRequestStatus = 'PENDING_OTP' | 'PENDING_APPROVAL' | 'APPLIED' | 'REJECTED' | 'CANCELLED';

/** Matches backend AdminProfileEditRequestResponse. */
export interface AdminProfileEditRequestView {
  id: number;
  targetUserId: string;
  targetProfileId: string | null;
  fieldName: AdminEditableField;
  oldValue: string | null;
  newValue: string;
  otpDestination: string;
  status: AdminEditRequestStatus;
  requestedBy: string;
  otpConfirmedAt: string | null;
  createdAt: string;
}

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  reportId: number;
  reporterProfileId: string;
  reportedProfileId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

// --- Admin analytics dashboard (GET /admin/analytics) ---

export interface AnalyticsCountByLabel {
  label: string;
  count: number;
}

export interface AnalyticsDailyCount {
  /** ISO date (yyyy-MM-dd). */
  date: string;
  count: number;
}

/** Matches backend AdminAnalyticsResponse. */
export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  deactivatedUsers: number;
  otpPendingUsers: number;
  newUsersToday: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalRevenue: number;
  revenueLast30Days: number;
  paidPaymentsCount: number;
  pendingVerificationPaymentsCount: number;
  activeSubscriptions: number;
  usersByStatus: AnalyticsCountByLabel[];
  profilesByStatus: AnalyticsCountByLabel[];
  profilesByGender: AnalyticsCountByLabel[];
  activeSubscriptionsByPlan: AnalyticsCountByLabel[];
  registrationsTrend: AnalyticsDailyCount[];
}

// --- Success stories ---

export type SuccessStoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Matches backend SuccessStoryResponse. */
export interface SuccessStory {
  id: number;
  brideName: string;
  groomName: string;
  marriageDate: string | null;
  story: string;
  photoUrl: string | null;
  partnerProfileId: string | null;
  status: SuccessStoryStatus;
  submittedAt: string;
}

// --- Admin broadcast ---

export type BroadcastSegment = 'ALL' | 'PLAN' | 'USER_STATUS';

export interface BroadcastRequestPayload {
  segment: BroadcastSegment;
  segmentValue?: string;
  title: string;
  message: string;
  sendEmail: boolean;
  sendSms?: boolean;
  /** Optional ISO-8601 instant for send-later; omit/past = send now. */
  scheduledAt?: string;
}

export interface BroadcastResult {
  recipients: number;
  emailsSent: number;
  message: string;
}

// --- Admin member notes (CRM) ---

/** Matches backend MemberNoteResponse. */
export interface MemberNote {
  id: number;
  note: string;
  authorAdminId: string;
  authorName: string | null;
  createdAt: string;
}

// --- Admin activity dashboard (GET /admin/activity) ---

export interface AdminActivityEventCount {
  eventType: string;
  count: number;
}

export interface AdminActivityRow {
  adminId: string;
  adminName: string | null;
  totalActions: number;
  byEvent: AdminActivityEventCount[];
}

export interface AdminActivity {
  window: string;
  admins: AdminActivityRow[];
}

// --- ID / document verification ---

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'VOTER_ID'
  | 'OTHER';

/** Matches backend VerificationResponse. */
export interface IdVerification {
  id: number;
  profileId: string | null;
  firstName: string | null;
  documentType: DocumentType;
  documentUrl: string | null;
  status: VerificationStatus;
  reviewNote: string | null;
  submittedAt: string;
}

// --- Report context (offending content inline) ---

export interface ReportChatMessage {
  senderProfileId: string | null;
  fromReportedUser: boolean;
  content: string;
  sentAt: string;
}

/** Matches backend ReportContextResponse. */
export interface ReportContext {
  reportId: number;
  reason: string;
  description: string | null;
  status: string;
  reportedProfileId: string | null;
  reportedFirstName: string | null;
  reportedLastName: string | null;
  reportedMobileNo: string | null;
  reportedEmail: string | null;
  reporterProfileId: string | null;
  reporterFirstName: string | null;
  reportedPhotos: PendingPhotoSummary[];
  recentChat: ReportChatMessage[];
}

// --- Admin-assisted member creation ---

export interface AdminCreateUserPayload {
  firstName: string;
  lastName: string;
  mobileNo: string;
  email?: string;
}

/** Matches backend AdminCreateUserResponse. */
export interface AdminCreateUserResult {
  profileId: string;
  firstName: string;
  mobileNo: string;
  temporaryPassword: string;
  message: string;
}

// --- Admin-assisted registration (fill full profile on a member's behalf) ---

/**
 * Full 7-section profile payload for assisted registration. Mirrors the
 * backend FullProfileRequest. Per business rules, Basic is mandatory and
 * Location (currentCity) is required; the other five sections are optional.
 */
export interface FullProfileRequest {
  basic: BasicSectionRequest;
  religious?: ReligiousSectionRequest;
  professional?: ProfessionalSectionRequest;
  location: LocationSectionRequest;
  physical?: PhysicalSectionRequest;
  family?: FamilySectionRequest;
  horoscope?: HoroscopeSectionRequest;
}

/**
 * Matches backend AssistedRegistrationRequestResponse — the status view of a
 * pending assisted-registration request (payload and OTP are never returned;
 * the destination mobile is masked).
 */
export interface AssistedRegistrationRequestView {
  id: number;
  targetUserId: string;
  targetProfileId: string | null;
  otpDestination: string;
  status: AdminEditRequestStatus;
  requestedBy: string;
  otpConfirmedAt: string | null;
  createdAt: string;
}

// --- Admin payments / refunds ---

export type PaymentReferenceType = 'SUBSCRIPTION' | 'WALLET_RECHARGE' | 'CONTACT_UNLOCK';

/** Matches backend AdminPaymentSummary. */
export interface AdminPayment {
  paymentId: number;
  amount: number;
  status: string;
  referenceType: PaymentReferenceType | null;
  paymentMethod: string | null;
  planName: string | null;
  referenceNote: string | null;
  createdAt: string;
  refundReason: string | null;
  refundedAt: string | null;
  refundable: boolean;
}

// --- Flagged chat-message moderation ---

/** Matches backend FlaggedMessageResponse. */
export interface FlaggedMessage {
  messageId: number;
  conversationId: number;
  content: string;
  senderProfileId: string | null;
  senderName: string | null;
  flaggedByProfileId: string | null;
  flagReason: string | null;
  sentAt: string;
}

// --- Admin session / activity controls ---

/** Matches backend AdminSessionResponse. */
export interface AdminSession {
  profileId: string;
  adminName: string | null;
  role: string;
  lastLoginAt: string | null;
  hasActiveSession: boolean;
}
