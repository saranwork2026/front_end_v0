'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { PaginatedResponse, ProfileView } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { apiClient, profileViewsApi } from '@/src/lib/api'

type ViewState = 'ready' | 'loading' | 'empty' | 'error'

const PAGE_SIZE = 10

interface ActiveSubscriptionResponse {
  planName: string
}

function formatViewedTime(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ProfileViewsView({ state }: { state?: ViewState }) {
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [results, setResults] = useState<PaginatedResponse<ProfileView> | null>(null)
  const [totalViews, setTotalViews] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  const fetchViews = useCallback(
    async (targetPage: number) => {
      if (state === 'loading') return
      setLoading(true)
      setError(false)
      try {
        const [viewsRes, countRes] = await Promise.all([
          profileViewsApi.getProfileViews({ page: targetPage, size: PAGE_SIZE }),
          profileViewsApi.getViewCount(),
        ])
        setResults(viewsRes.data)
        setTotalViews(countRes.data.totalViews)
        setPage(targetPage)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [state],
  )

  useEffect(() => {
    if (state === 'empty') {
      setResults({ content: [], totalElements: 0, totalPages: 0, size: PAGE_SIZE, number: 0 })
      setTotalViews(0)
      setLoading(false)
      return
    }
    void fetchViews(0)
    // Premium status is resolved the same way the rest of the app does — via
    // the active subscription endpoint. BASE (free tier) is not premium.
    apiClient
      .get<ActiveSubscriptionResponse>('/user/subscriptions/active')
      .then((res) => setIsPremium(res.data.planName !== 'BASE'))
      .catch(() => setIsPremium(false))
  }, [fetchViews, state])

  const items = results?.content ?? []
  const isLoading = state === 'loading' || loading
  const count = totalViews

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Profile views</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count && count > 0
            ? `${count} members have viewed your profile.`
            : 'Members who recently viewed your profile.'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">We could not load your profile views. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void fetchViews(page)}>
              Retry
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="eye"
          title="No profile views yet"
          description="When members view your profile, they will show up here. Keep your profile complete to attract more visits."
          action={
            <Link href="/profile/wizard" className={cn(buttonVariants({ variant: 'primary' }))}>
              Improve my profile
            </Link>
          }
        />
      ) : (
        <>
          {!isPremium && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold-soft/50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                  <Icon name="lock" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Upgrade to see who viewed you</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {count ?? items.length} members viewed your profile. Unlock their details with a premium plan.
                  </p>
                </div>
              </div>
              <Link href="/plans" className={cn(buttonVariants({ variant: 'gold' }), 'shrink-0')}>
                Upgrade
              </Link>
            </div>
          )}

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((v) => (
              <li key={`${v.viewerProfileId}-${v.viewedAt}`}>
                <ViewerCard viewer={v} premium={isPremium} />
              </li>
            ))}
          </ul>

          {(results?.totalPages ?? 0) > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={page} totalPages={results?.totalPages ?? 0} onPageChange={(p) => void fetchViews(p)} />
            </div>
          )}
        </>
      )}
    </main>
  )
}

function ViewerCard({ viewer, premium }: { viewer: ProfileView; premium: boolean }) {
  const initial = viewer.viewerFirstName.charAt(0).toUpperCase()
  const meta = premium
    ? [viewer.viewerAge ? `${viewer.viewerAge} yrs` : null, viewer.viewerCity].filter(Boolean).join(' · ') ||
      'Details on profile'
    : '28 yrs · Chennai'

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
        {premium && viewer.viewerPrimaryPhotoUrl ? (
          <img src={viewer.viewerPrimaryPhotoUrl} alt={viewer.viewerFirstName} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
            {premium ? initial : <Icon name="user" className="h-6 w-6" />}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold text-foreground', !premium && 'select-none blur-[5px]')}>
          {premium ? viewer.viewerFirstName : 'Premium member'}
        </p>
        <p className={cn('mt-0.5 truncate text-sm text-muted-foreground', !premium && 'select-none blur-[5px]')}>
          {meta}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">{formatViewedTime(viewer.viewedAt)}</p>
      </div>

      {premium ? (
        <Link
          href={`/profile/${viewer.viewerProfileId}`}
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'shrink-0')}
        >
          View
        </Link>
      ) : (
        <Link
          href="/plans"
          aria-label="Upgrade to view this member"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0 text-muted-foreground')}
        >
          <Icon name="lock" className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
