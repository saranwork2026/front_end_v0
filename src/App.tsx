import { Routes, Route, Navigate } from 'react-router-dom'

import {
  DashboardPage,
  SearchPage,
  MatchesPage,
  InterestsPage,
  ShortlistPage,
  AccessRequestsPage,
  ProfileDetailPage,
  ProfileStatusPage,
  WizardPage,
  PartnerPreferencesPage,
  ChatListPage,
  ChatConversationPage,
  NotificationsPage,
  NotificationDetailPage,
  ProfileViewsPage,
  ContactsPage,
  SupportPage,
  MyProfilePage,
  ProfileEditPage,
  PhotosPage,
  AccountPage,
  SuccessStoriesPage,
  SubmitSuccessStoryPage,
} from './pages/customer'
import {
  LoginPage,
  RegisterPage,
  VerifyOtpPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ChangePasswordPage,
  TermsPage,
  PrivacyPolicyPage,
  PublicProfilePage,
} from './pages/auth'
import {
  PlansPage,
  PaymentPage,
  SubscriptionsPage,
  PaymentHistoryPage,
  PaymentProcessingPage,
  WalletPage,
  ReferralsPage,
} from './pages/revenue'
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminUserDetailPage,
  AdminAssistedProfilePage,
  AdminModerationPage,
  AdminReportsPage,
  AdminFlaggedUsersPage,
  AdminFlaggedMessagesPage,
  AdminPlansPage,
  AdminVerificationsPage,
  AdminBroadcastPage,
  AdminAuditPage,
  AdminActivityPage,
  AdminSessionsPage,
  AdminSuccessStoriesPage,
  AdminAdBannersPage,
} from './pages/admin'
import { AccessDeniedPage, NotFoundPage } from './pages/errors'
import { ReactivateAccountPage } from './pages/ReactivateAccountPage'
import AuthGuard from './routes/AuthGuard'
import ProfileStatusGuard from './routes/ProfileStatusGuard'
import { UserLayout } from './components/layout/UserLayout'

export function App() {
  return (
    <Routes>
      {/* Public auth + legal/support (no app chrome — pages own their shell) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {/* Support is reachable logged-out (auth error links point here). */}
      <Route path="/support" element={<SupportPage />} />
      {/* Legal pages (public — register + auth footer link here). */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/legal/terms" element={<TermsPage />} />
      <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
      {/* Public success-stories gallery (logged-out friendly marketing surface). */}
      <Route path="/success-stories" element={<SuccessStoriesPage />} />
      {/* Public shareable profile preview (logged-out friendly). */}
      <Route path="/p/:profileId" element={<PublicProfilePage />} />

      {/* Authenticated USER area */}
      <Route element={<AuthGuard allowedRoles="USER" />}>
        {/* Reachable regardless of profile status (before ProfileStatusGuard). */}
        <Route path="/account/reactivate" element={<ReactivateAccountPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/success-stories/submit" element={<SubmitSuccessStoryPage />} />

        {/* Profile-status gated app shell */}
        <Route element={<ProfileStatusGuard />}>
          <Route element={<UserLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/interests" element={<InterestsPage />} />
            <Route path="/shortlist" element={<ShortlistPage />} />
            <Route path="/access-requests" element={<AccessRequestsPage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/profile/wizard" element={<WizardPage />} />
            <Route path="/profile/status" element={<ProfileStatusPage />} />
            <Route path="/profile/:profileId" element={<ProfileDetailPage />} />
            <Route path="/photos" element={<PhotosPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/partner-preferences" element={<PartnerPreferencesPage />} />
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/:profileId" element={<ChatConversationPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notifications/:id" element={<NotificationDetailPage />} />
            <Route path="/profile-views" element={<ProfileViewsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />

            {/* Revenue */}
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/payments/history" element={<PaymentHistoryPage />} />
            <Route path="/payments/:paymentId" element={<PaymentProcessingPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Admin area (self-contained AdminShell chrome) */}
      <Route element={<AuthGuard allowedRoles={['ADMIN_REQUESTER', 'ADMIN_APPROVER']} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/:profileId" element={<AdminUserDetailPage />} />
        <Route path="/admin/users/:profileId/assisted-profile" element={<AdminAssistedProfilePage />} />
        <Route path="/admin/moderation" element={<AdminModerationPage />} />
        {/* Photo moderation folded into the moderation queue — redirect legacy links. */}
        <Route path="/admin/photos" element={<Navigate to="/admin/moderation" replace />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/flagged" element={<AdminFlaggedUsersPage />} />
        <Route path="/admin/flagged-messages" element={<AdminFlaggedMessagesPage />} />
        <Route path="/admin/plans" element={<AdminPlansPage />} />
        <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
        <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/activity" element={<AdminActivityPage />} />
        <Route path="/admin/sessions" element={<AdminSessionsPage />} />
        <Route path="/admin/success-stories" element={<AdminSuccessStoriesPage />} />
        <Route path="/admin/ad-banners" element={<AdminAdBannersPage />} />
      </Route>

      {/* Errors */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
