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
      return <Navigate to="/access-denied" replace />
    }
  }

  return <Outlet />
}
