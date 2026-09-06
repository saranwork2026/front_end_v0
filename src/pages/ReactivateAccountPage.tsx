import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { ApiError } from '@matrimony/shared-core'

import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useDocumentTitle } from '@/src/hooks/use-document-title'
import { accountApi } from '@/src/lib/api'
import { authStore } from '@/src/lib/api'

/**
 * Minimal reactivation screen for DEACTIVATED accounts. Calls the real
 * accountApi.activateAccount(), updates the in-memory session, and returns the
 * user to where they were headed. Mirrors the existing app's reactivate flow.
 */
export function ReactivateAccountPage() {
  useDocumentTitle('Reactivate account | Matrimony')
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReactivate() {
    setLoading(true)
    setError(null)
    try {
      await accountApi.activateAccount()
      // Reflect the reactivation in the in-memory session so guards let the
      // user through. Profile returns to COMPLETED (needs re-approval).
      authStore.getState().setSession({
        profileId: authStore.getState().profileId ?? '',
        userId: authStore.getState().userId ?? '',
        role: authStore.getState().role ?? 'USER',
        userStatus: 'ACTIVE',
        profileStatus: authStore.getState().profileStatus,
        profileCompletionPct: authStore.getState().profileCompletionPct ?? undefined,
      })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      setError(apiError?.message ?? 'Could not reactivate your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Your account is deactivated. Reactivate it to continue where you left off."
    >
      <div className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive"
          >
            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Reactivating restores your profile. It will return to a completed state and may need admin
          re-approval before it appears in search again.
        </p>
        <Button size="lg" loading={loading} onClick={() => void handleReactivate()} className="w-full">
          {loading ? 'Reactivating…' : 'Reactivate my account'}
        </Button>
      </div>
    </AuthShell>
  )
}
