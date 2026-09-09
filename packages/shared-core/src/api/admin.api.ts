import type { AxiosInstance } from 'axios';
import type {
  ModerationRequest,
  ModerationRequestRecord,
  PendingProfileSummary,
  PendingPhotoSummary,
  PendingPaymentSummary,
  FlaggedUser,
  AdminUserDetail,
  Report,
  ReportStatus,
  AuditLogEntry,
  AdminSubscriptionView,
  AdminEditableField,
  AdminProfileEditRequestView,
  AdminAnalytics,
  SuccessStory,
  SuccessStoryStatus,
  BroadcastRequestPayload,
  BroadcastResult,
  MemberNote,
  AdminActivity,
  VerificationStatus,
  IdVerification,
  ReportContext,
  AdminCreateUserPayload,
  AdminCreateUserResult,
  FullProfileRequest,
  AssistedRegistrationRequestView,
  AdminPayment,
  FlaggedMessage,
  AdminSession,
} from '../types/admin.types';
import type {
  SubscriptionPlan,
  PlanCreateRequest,
  PlanUpdateRequest,
} from '../types/plans.types';
import type { UserProfile } from '../types/profile.types';
import type { PaginatedResponse } from '../types/common.types';

export interface AdminUserListParams {
  page?: number;
  size?: number;
  status?: string;
  /** Filter by role: USER (customer), ADMIN_REQUESTER (reviewer), ADMIN_APPROVER (approver). */
  role?: string;
  /** Free-text search over profileId / name / mobile / email. */
  search?: string;
}

export interface AdminReportListParams {
  page?: number;
  size?: number;
  status?: ReportStatus;
}

export interface AdminFlaggedUserParams {
  page?: number;
  size?: number;
  reason?: string;
}

export interface AdminAuditSearchParams {
  entityType?: string;
  entityId?: string;
  eventType?: string;
  status?: string;
  performedBy?: string;
  /** ISO-8601 instant. */
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface AdminAuditLogParams {
  page?: number;
  size?: number;
  entityType?: string;
}

export function createAdminApi(client: AxiosInstance) {
  return {
    // --- Moderation ---
    // NOTE: the moderation request/approve/reject endpoints return an empty
    // 200 (void) on the backend — do not read `.data` off these responses.
    requestProfileApproval(profileId: string, remarks?: string) {
      const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(
        `/admin/moderation/request/profile/${profileId}/approve${query}`
      );
    },

    requestProfileRejection(profileId: string, remarks?: string) {
      const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(
        `/admin/moderation/request/profile/${profileId}/reject${query}`
      );
    },

    requestPhotoApproval(photoId: number, remarks?: string) {
      const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(
        `/admin/moderation/request/photo/${photoId}/approve${query}`
      );
    },

    requestPhotoRejection(photoId: number, remarks?: string) {
      const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(
        `/admin/moderation/request/photo/${photoId}/reject${query}`
      );
    },

    requestUserBlock(profileId: string, remarks?: string) {
      const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(
        `/admin/moderation/request/user/${profileId}/block${query}`
      );
    },

    getPendingModerationRequests(params: { page?: number; size?: number; search?: string } = {}) {
      const { page = 0, size = 10, search } = params;
      let url = `/admin/moderation/pending?page=${page}&size=${size}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return client.get<PaginatedResponse<ModerationRequestRecord>>(url);
    },

    getPendingProfiles(params: { page?: number; size?: number } = {}) {
      const { page = 0, size = 10 } = params;
      return client.get<PaginatedResponse<PendingProfileSummary>>(
        `/admin/moderation/profiles/pending?page=${page}&size=${size}`
      );
    },

    getProfileForReview(profileId: string) {
      return client.get<UserProfile>(`/admin/moderation/profiles/${profileId}`);
    },

    getPendingPhotos(params: { page?: number; size?: number } = {}) {
      const { page = 0, size = 12 } = params;
      return client.get<PaginatedResponse<PendingPhotoSummary>>(
        `/admin/photos/pending?page=${page}&size=${size}`
      );
    },

    getPendingPayments() {
      return client.get<PendingPaymentSummary[]>('/admin/moderation/payments/pending');
    },

    /** Aggregated business metrics for the analytics dashboard. */
    getAnalytics() {
      return client.get<AdminAnalytics>('/admin/analytics');
    },

    // --- Success stories moderation ---
    getSuccessStories(status: SuccessStoryStatus = 'PENDING', page = 0, size = 12) {
      return client.get<PaginatedResponse<SuccessStory>>(
        `/admin/success-stories?status=${status}&page=${page}&size=${size}`
      );
    },

    approveSuccessStory(id: number) {
      return client.put<SuccessStory>(`/admin/success-stories/${id}/approve`);
    },

    rejectSuccessStory(id: number) {
      return client.put<SuccessStory>(`/admin/success-stories/${id}/reject`);
    },

    deleteSuccessStory(id: number) {
      return client.delete<{ message: string }>(`/admin/success-stories/${id}`);
    },

    // --- Assisted member creation ---
    createUser(payload: AdminCreateUserPayload) {
      return client.post<AdminCreateUserResult>('/admin/users', payload);
    },

    /** "View as member" — audited read-only snapshot of the member's own profile view. */
    viewAsMember(profileId: string) {
      return client.get<UserProfile>(`/admin/users/${profileId}/view-as`);
    },

    /** Per-member data export (DPDP/GDPR) — returns a JSON object of the member's data. */
    exportUserData(profileId: string) {
      return client.get<Record<string, unknown>>(`/admin/users/${profileId}/export`);
    },

    // --- Admin sessions ---
    getAdminSessions() {
      return client.get<AdminSession[]>('/admin/sessions');
    },

    forceLogout(profileId: string) {
      return client.post<{ message: string }>(`/admin/sessions/${profileId}/force-logout`);
    },

    // --- Flagged chat messages ---
    getFlaggedMessages(page = 0, size = 20) {
      return client.get<PaginatedResponse<FlaggedMessage>>(
        `/admin/chat/flagged?page=${page}&size=${size}`
      );
    },

    deleteFlaggedMessage(messageId: number) {
      return client.delete<{ message: string }>(`/admin/chat/messages/${messageId}`);
    },

    dismissMessageFlag(messageId: number) {
      return client.put<{ message: string }>(`/admin/chat/messages/${messageId}/dismiss`);
    },

    // --- Payments / refunds ---
    getMemberPayments(profileId: string) {
      return client.get<AdminPayment[]>(`/admin/moderation/payments/history/${profileId}`);
    },

    refundPayment(paymentId: number, reason: string) {
      return client.post<{ message: string }>(`/admin/moderation/payments/${paymentId}/refund`, { reason });
    },

    // --- Featured / Spotlight ---
    featureProfile(profileId: string, days?: number) {
      const query = days ? `?days=${days}` : '';
      return client.put<{ message: string }>(`/admin/users/${profileId}/feature${query}`);
    },

    unfeatureProfile(profileId: string) {
      return client.put<{ message: string }>(`/admin/users/${profileId}/unfeature`);
    },

    // --- Profile boost ---
    boostProfile(profileId: string, days?: number) {
      const query = days ? `?days=${days}` : '';
      return client.put<{ message: string }>(`/admin/users/${profileId}/boost${query}`);
    },

    unboostProfile(profileId: string) {
      return client.put<{ message: string }>(`/admin/users/${profileId}/unboost`);
    },

    // --- Broadcast ---
    sendBroadcast(payload: BroadcastRequestPayload) {
      return client.post<BroadcastResult>('/admin/broadcast', payload);
    },

    // --- Member notes (CRM) ---
    getMemberNotes(profileId: string) {
      return client.get<MemberNote[]>(`/admin/users/${profileId}/notes`);
    },

    addMemberNote(profileId: string, note: string) {
      return client.post<MemberNote>(`/admin/users/${profileId}/notes`, { note });
    },

    deleteMemberNote(noteId: number) {
      return client.delete<{ message: string }>(`/admin/users/notes/${noteId}`);
    },

    /** All of a profile's photos (any status, unfiltered) for admin review. */
    getProfilePhotosForReview(profileId: string) {
      return client.get<PendingPhotoSummary[]>(
        `/admin/moderation/profiles/${profileId}/photos`
      );
    },

    /**
     * Admin uploads/replaces the payment screenshot for a pending manual
     * payment claim (e.g. proof the customer shared over WhatsApp).
     * Returns the resolved screenshot URL.
     */
    uploadPaymentScreenshot(paymentId: number, screenshot: File) {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      return client.post<{ screenshotUrl: string }>(
        `/admin/moderation/payments/${paymentId}/screenshot`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    },

    requestPaymentVerification(paymentId: number, remarks?: string) {
      const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(
        `/admin/moderation/request/payment/${paymentId}/verify${query}`
      );
    },

    requestPaymentRejection(paymentId: number, remarks?: string) {
      const query = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      return client.post<void>(
        `/admin/moderation/request/payment/${paymentId}/reject${query}`
      );
    },

    approveModerationRequest(requestId: number) {
      return client.put<void>(
        `/admin/moderation/${requestId}/approve`
      );
    },

    rejectModerationRequest(requestId: number) {
      return client.put<void>(
        `/admin/moderation/${requestId}/reject`
      );
    },

    // --- Photo Moderation (Direct) ---
    updatePhotoStatus(photoId: number, status: 'APPROVED' | 'REJECTED' | 'PENDING_APPROVAL') {
      return client.put<{ message: string }>(
        `/admin/photos/${photoId}/status?status=${status}`
      );
    },

    // --- User Management ---
    listUsers(params: AdminUserListParams = {}) {
      const { page = 0, size = 10, status, role, search } = params;
      let url = `/admin/users?page=${page}&size=${size}`;
      if (status) url += `&status=${status}`;
      if (role) url += `&role=${role}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      return client.get<PaginatedResponse<AdminUserDetail>>(url);
    },

    getUserProfile(profileId: string) {
      return client.get<UserProfile>(`/admin/users/${profileId}`);
    },

    flagUser(profileId: string, reason: string, notes?: string) {
      let url = `/admin/users/${profileId}/flag?reason=${encodeURIComponent(reason)}`;
      if (notes) url += `&notes=${encodeURIComponent(notes)}`;

      return client.put<{ message: string }>(url);
    },

    unflagUser(profileId: string) {
      return client.put<{ message: string }>(`/admin/users/${profileId}/unflag`);
    },

    unblockUser(profileId: string) {
      return client.put<{ message: string }>(`/admin/users/${profileId}/unblock`);
    },

    // --- User Purge (TESTING/CLEANUP ONLY, ADMIN_APPROVER) ---
    // Permanently deletes a user and ALL of their data across every table.
    purgeUser(profileId: string) {
      return client.delete<{ message: string; profileId: string; deleted: string }>(
        `/admin/users/${profileId}/purge`
      );
    },

    // Permanently deletes EVERY non-admin user and their data. Admins are
    // preserved (excluded by role on the backend).
    purgeAllUsers() {
      return client.delete<{ message: string; purgedCount: number; purgedProfileIds: string[] }>(
        `/admin/users/purge-all`
      );
    },

    listFlaggedUsers(params: AdminFlaggedUserParams = {}) {
      const { page = 0, size = 10, reason } = params;
      let url = `/admin/users/flagged?page=${page}&size=${size}`;
      if (reason) url += `&reason=${encodeURIComponent(reason)}`;

      return client.get<PaginatedResponse<FlaggedUser>>(url);
    },

    // --- Reports ---
    getReports(params: AdminReportListParams = {}) {
      const { page = 0, size = 10, status } = params;
      let url = `/admin/reports?page=${page}&size=${size}`;
      if (status) url += `&status=${status}`;

      return client.get<PaginatedResponse<Report>>(url);
    },

    reviewReport(reportId: number, status: string, notes?: string) {
      let url = `/admin/reports/${reportId}/review?status=${encodeURIComponent(status)}`;
      if (notes) url += `&notes=${encodeURIComponent(notes)}`;

      return client.put<{ message: string }>(url);
    },

    /** Offending content inline for a report (profile summary, photos, recent chat). */
    getReportContext(reportId: number) {
      return client.get<ReportContext>(`/admin/reports/${reportId}/context`);
    },

    // --- Audit Log ---
    getAuditLogs(params: AdminAuditLogParams = {}) {
      const { page = 0, size = 20, entityType } = params;
      let url = `/admin/audit-logs?page=${page}&size=${size}`;
      if (entityType) url += `&entityType=${encodeURIComponent(entityType)}`;
      return client.get<PaginatedResponse<AuditLogEntry>>(url);
    },

    /** Multi-filter audit search (entity/actor/event/status/date range). */
    searchAuditLogs(params: AdminAuditSearchParams = {}) {
      const { page = 0, size = 20, ...filters } = params;
      const qs = new URLSearchParams({ page: String(page), size: String(size) });
      (Object.keys(filters) as (keyof typeof filters)[]).forEach((k) => {
        const v = filters[k];
        if (v) qs.append(k, String(v));
      });
      return client.get<PaginatedResponse<AuditLogEntry>>(`/admin/audit-logs/search?${qs.toString()}`);
    },

    /** Per-admin action counts for the activity dashboard. */
    getAdminActivity(days = 30) {
      return client.get<AdminActivity>(`/admin/activity?days=${days}`);
    },

    // --- ID verification moderation ---
    getVerifications(status: VerificationStatus = 'PENDING', page = 0, size = 12) {
      return client.get<PaginatedResponse<IdVerification>>(
        `/admin/verifications?status=${status}&page=${page}&size=${size}`
      );
    },

    approveVerification(id: number) {
      return client.put<IdVerification>(`/admin/verifications/${id}/approve`);
    },

    rejectVerification(id: number, note?: string) {
      const qs = note ? `?note=${encodeURIComponent(note)}` : '';
      return client.put<IdVerification>(`/admin/verifications/${id}/reject${qs}`);
    },

    // --- Admin-Assisted Subscription Management ---
    getCustomerSubscription(profileId: string) {
      return client.get<AdminSubscriptionView>(`/admin/moderation/subscriptions/${profileId}`);
    },

    requestSubscriptionAssignment(
      profileId: string,
      planId: number,
      mode: 'EXTEND' | 'REPLACE',
      remarks?: string
    ) {
      let url = `/admin/moderation/request/subscription/${profileId}/assign?planId=${planId}&mode=${mode}`;
      if (remarks) url += `&remarks=${encodeURIComponent(remarks)}`;
      return client.post<void>(url);
    },

    /** Raise a two-step request to cancel/revoke a member's active subscription. */
    requestSubscriptionCancellation(profileId: string, remarks?: string) {
      let url = `/admin/moderation/request/subscription/${profileId}/cancel`;
      if (remarks) url += `?remarks=${encodeURIComponent(remarks)}`;
      return client.post<void>(url);
    },

    // --- Admin-Initiated Customer Detail Edit (OTP-Confirmed) ---
    proposeProfileEdit(profileId: string, field: AdminEditableField, newValue: string) {
      return client.post<AdminProfileEditRequestView>(
        `/admin/users/${profileId}/edit-request`,
        { field, newValue }
      );
    },

    resendProfileEditOtp(requestId: number) {
      return client.post<{ message: string }>(
        `/admin/users/edit-request/${requestId}/resend-otp`
      );
    },

    confirmProfileEdit(requestId: number, otp: string) {
      return client.post<AdminProfileEditRequestView>(
        `/admin/users/edit-request/${requestId}/confirm`,
        { otp }
      );
    },

    // --- Admin-assisted registration (fill full profile on a member's behalf) ---
    // Step 1: draft the full profile for a walk-in member; sends a consent OTP
    // to the member's registered mobile. Returns the pending request (masked mobile).
    proposeAssistedProfile(profileId: string, payload: FullProfileRequest) {
      return client.post<AssistedRegistrationRequestView>(
        `/admin/users/${profileId}/assisted-profile`,
        payload
      );
    },

    // Step 2a: resend the consent OTP.
    resendAssistedProfileOtp(requestId: number) {
      return client.post<{ message: string }>(
        `/admin/users/assisted-profile/${requestId}/resend-otp`
      );
    },

    // Step 2b: confirm the OTP read back from the customer; raises a
    // second-admin moderation request (APPLY_ASSISTED_PROFILE).
    confirmAssistedProfile(requestId: number, otp: string) {
      return client.post<AssistedRegistrationRequestView>(
        `/admin/users/assisted-profile/${requestId}/confirm`,
        { otp }
      );
    },

    // Fetch a single assisted-registration request's status.
    getAssistedProfileRequest(requestId: number) {
      return client.get<AssistedRegistrationRequestView>(
        `/admin/users/assisted-profile/${requestId}`
      );
    },

    // --- Plans ---
    createPlan(data: PlanCreateRequest) {
      return client.post<SubscriptionPlan>('/admin/plans', data);
    },

    updatePlan(planId: number, data: PlanUpdateRequest) {
      return client.put<SubscriptionPlan>(`/admin/plans/${planId}`, data);
    },

    deactivatePlan(planId: number) {
      return client.put<{ message: string }>(`/admin/plans/${planId}/deactivate`);
    },
  };
}
