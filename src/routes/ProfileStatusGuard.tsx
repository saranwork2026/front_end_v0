import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

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

  if (userStatus === 'DEACTIVATED') {
    return <Navigate to="/account/reactivate" state={{ from: location.pathname }} replace />
  }

  // APPROVED → full app regardless of completion %.
  if (profileStatus === 'APPROVED') {
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
