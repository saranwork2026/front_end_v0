'use client'

import { useEffect, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { StatusView } from '@/components/status/status-view'
import { statusConfig, type ProfileStatus } from '@/lib/status-data'
import { authStore, profileApi } from '@/src/lib/api'

interface ProfileStatusPageViewProps {
  /**
   * Design-preview override: when set (via ?preview=1&state=), render that
   * exact state and show the state switcher, skipping the real profile fetch.
   */
  previewStatus?: ProfileStatus
}

/**
 * Real profile-status landing page. The authoritative status comes from the
 * user's profile (GET /user/profile) — the in-memory authStore value is only a
 * seed that can go stale as the user progresses. We fetch on mount, refresh the
 * store so ProfileStatusGuard stays in sync, and fall back to the stored value
 * (or COMPLETED) while loading / on error. A design preview can still be forced
 * with ?preview=1&state=<STATUS>.
 */
export function ProfileStatusView({ previewStatus }: ProfileStatusPageViewProps) {
  const seeded = authStore.getState().profileStatus
  const [status, setStatus] = useState<ProfileStatus | null>(
    seeded && seeded in statusConfig ? (seeded as ProfileStatus) : null,
  )
  const [loading, setLoading] = useState(!previewStatus)

  useEffect(() => {
    if (previewStatus) return
    let cancelled = false
    profileApi
      .getProfile()
      .then((res) => {
        if (cancelled) return
        const real = res.data.status as ProfileStatus
        setStatus(real)
        // Keep the guard's in-memory copy fresh (it can otherwise go stale).
        authStore.getState().updateProfileProgress({
          profileStatus: real,
          profileCompletionPct: res.data.profileCompletionPct,
        })
      })
      .catch(() => {
        // Fall back to the seeded store value (already in `status`).
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [previewStatus])

  if (previewStatus) {
    return <StatusView status={previewStatus} preview />
  }

  if (loading && !status) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col justify-center px-4 py-10">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </main>
    )
  }

  // Default to COMPLETED (the neutral "submitted, awaiting review" state) if we
  // still have nothing — this page is only reached for non-APPROVED profiles.
  return <StatusView status={status ?? 'COMPLETED'} />
}
