import { useEffect, useState } from 'react'
import { authApi, authStore } from '../lib/api'

interface AppBootstrapProps {
  children: React.ReactNode
}

/**
 * Restores the auth session on app load. Auth state lives only in memory
 * (Zustand); a reload resets it even though the HttpOnly cookies are still
 * valid server-side. This calls /auth/refresh-token once on mount (cookie-only)
 * and repopulates the store on success. Mirrors the existing app's AppBootstrap.
 */
export function AppBootstrap({ children }: AppBootstrapProps) {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    authApi
      .refreshToken()
      .then((response) => {
        if (cancelled) return
        const { profileId, userId, role, userStatus, profileStatus, profileCompletionPct } =
          response.data
        authStore.getState().setSession({
          profileId,
          userId,
          role,
          userStatus,
          profileStatus,
          profileCompletionPct,
        })
      })
      .catch(() => {
        // No valid session — proceed unauthenticated; guards redirect as needed.
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-background"
        role="status"
        aria-label="Loading"
      >
        <div className="size-9 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      </div>
    )
  }

  return <>{children}</>
}
