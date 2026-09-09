import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { useLandingStore, isSubscriptionRemindLater } from '../stores/landing'

/**
 * Enforces the business rule: only APPROVED profiles get full app access.
 * DRAFT/COMPLETED/UNDER_REVIEW/REJECTED profiles are confined to a small set
 * of "fix your profile / manage account" routes until admin approval clears
 * them. Mirrors the existing app's ProfileStatusGuard, adapted to New-FE's
 * route paths.
 *
 * Sits inside AuthGuard (role already checked) and wraps the USER route tree.
 */
const ALLOWED_PATHS = [
  '/profile',
  '/profile/edit',
  '/profile/wizard',
  '/profile/status',
  '/partner-preferences',
  '/photos',
  '/account',
  '/change-password',
  '/notifications',
  '/subscriptions',
  '/payment',
  '/plans',
  '/support',
]

function isAllowedPath(pathname: string): boolean {
  if (ALLOWED_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/notifications/')) return true
  // Payment gateway/processing + history are reachable pre-approval (e.g. a
  // not-yet-approved member upgrading from the status page).
  if (pathname.startsWith('/payments/')) return true
  return false
}

export default function ProfileStatusGuard() {
  const location = useLocation()
  const userStatus = useAuthStore((s) => s.userStatus)
  const profileStatus = useAuthStore((s) => s.profileStatus)
  const profileCompletionPct = useAuthStore((s) => s.profileCompletionPct)
  const hasPartnerPreferences = useLandingStore((s) => s.hasPartnerPreferences)
  const hasActiveSubscription = useLandingStore((s) => s.hasActiveSubscription)

  if (userStatus === 'DEACTIVATED') {
    return <Navigate to="/account/reactivate" state={{ from: location.pathname }} replace />
  }

  // APPROVED → run the post-approval onboarding funnel (items 5, 6):
  //   1. no partner preferences yet        → /partner-preferences
  //   2. prefs set, no subscription, and
  //      "remind me later" not chosen       → /plans
  //   3. otherwise                          → full app (matches/dashboard)
  // Preferences/plans/onboarding + the account-management allow-list stay
  // reachable so the user can complete each step (and revisit later).
  if (profileStatus === 'APPROVED') {
    const path = location.pathname

    // Step 1 — must set partner preferences first. null = unknown (signals not
    // loaded yet, e.g. a hard nav before bootstrap) → don't redirect.
    if (hasPartnerPreferences === false && path !== '/partner-preferences' && !isAllowedPath(path)) {
      return <Navigate to="/partner-preferences" replace />
    }

    // Step 2 — prefs set but no paid plan and the user hasn't deferred it.
    // Send to plans, but only from the app entry (dashboard/root) so we don't
    // trap them on every navigation; once they can browse, Plans stays in nav.
    if (
      hasPartnerPreferences === true &&
      hasActiveSubscription === false &&
      !isSubscriptionRemindLater() &&
      path === '/' 
    ) {
      return <Navigate to="/plans?onboarding=1" replace />
    }

    return <Outlet />
  }

  // Still being built (never submitted) → wizard.
  const isIncomplete =
    !profileStatus || profileStatus === 'DRAFT' || (profileCompletionPct ?? 0) < 70

  if (isIncomplete) {
    if (location.pathname !== '/profile/wizard' && !isAllowedPath(location.pathname)) {
      return <Navigate to="/profile/wizard" replace />
    }
    return <Outlet />
  }

  // Submitted but not approved (or rejected) → confine to allow-list.
  const isPendingOrRejected =
    profileStatus === 'COMPLETED' ||
    profileStatus === 'UNDER_REVIEW' ||
    profileStatus === 'REJECTED'

  if (isPendingOrRejected && !isAllowedPath(location.pathname)) {
    return <Navigate to="/profile/status" replace />
  }

  return <Outlet />
}
