import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '@matrimony/shared-core'
import { useAuthStore } from '../stores/auth'

interface AuthGuardProps {
  allowedRoles?: UserRole | UserRole[]
}

/**
 * Redirects unauthenticated users to /login (preserving the attempted path in
 * location state), and enforces role access. Mirrors the existing app's guard.
 */
export default function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.role)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    if (!role || !roles.includes(role)) {
      // Role-aware fallback. An authenticated admin who lands on a USER-only
      // route (most notably `/` after a silent refresh-token bootstrap) belongs
      // in the admin area, not on /access-denied — mirrors the login-time
      // redirect in components/auth/login-view.tsx (admin home = /admin).
      // A non-admin (USER) hitting an admin route still gets /access-denied.
      const isAdmin = role === 'ADMIN_REQUESTER' || role === 'ADMIN_APPROVER'
      const fallback = isAdmin ? '/admin' : '/access-denied'
      return <Navigate to={fallback} replace />
    }
  }

  return <Outlet />
}
