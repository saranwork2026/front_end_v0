'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useNavigate } from 'react-router-dom'
import type {
  UserProfile,
  SearchResult,
  SearchFilters,
  PaginatedResponse,
} from '@matrimony/shared-core'

import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { ProfileCardSkeleton } from '@/components/ui/skeleton'
import { ProfileCard } from '@/components/shared/profile-card'
import { ProfileStrengthWidget } from '@/components/shared/profile-strength-widget'
import { cn } from '@/lib/utils'
import { profileApi, searchApi, profileViewsApi } from '@/src/lib/api'
import { toProfileCard, missingSectionLabels, flattenProfileResponse } from '@/src/lib/adapters'
import type { ProfileView } from '@matrimony/shared-core'

/** Preview states retained so the loading/empty views can be forced via ?preview=. */
export type DashboardPreview = 'loading' | 'empty'

interface DashboardViewProps {
  preview?: DashboardPreview
}

export function DashboardView({ preview }: DashboardViewProps) {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [daily, setDaily] = useState<SearchResult[]>([])
  const [results, setResults] = useState<PaginatedResponse<SearchResult> | null>(null)
  const [loadingResults, setLoadingResults] = useState(false)
  const [page, setPage] = useState(0)

  // #3 profiles who viewed me, #4 profiles I viewed, and the set of profileIds
  // I've already viewed (used to hide already-seen profiles from #2).
  const [viewedMe, setViewedMe] = useState<ProfileView[]>([])
  const [iViewed, setIViewed] = useState<ProfileView[]>([])
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())

  // Load the profile (welcome header + strength). Reaching this page means
  // ProfileStatusGuard already confirmed APPROVED.
  useEffect(() => {
    if (preview) {
      setLoading(preview === 'loading')
      return
    }
    let cancelled = false
    profileApi
      .getProfile()
      .then((res) => {
        if (!cancelled) setProfile(flattenProfileResponse(res.data as unknown as Record<string, unknown>))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [preview])

  // Curated "Today's matches" (best-effort — a failure just hides the section).
  useEffect(() => {
    if (preview) return
    let cancelled = false
    searchApi
      .getDailyRecommendations(6)
      .then((res) => {
        if (!cancelled) setDaily(res.data)
      })
      .catch(() => {
        if (!cancelled) setDaily([])
      })
    return () => {
      cancelled = true
    }
  }, [preview])

  // #3/#4 + the "already viewed" set (best-effort — failures just hide sections).
  useEffect(() => {
    if (preview) return
    let cancelled = false
    Promise.allSettled([
      profileViewsApi.getProfileViews({ page: 0, size: 8 }),
      profileViewsApi.getProfilesIViewed({ page: 0, size: 8 }),
    ]).then(([me, mine]) => {
      if (cancelled) return
      if (me.status === 'fulfilled') setViewedMe(me.value.data.content ?? [])
      if (mine.status === 'fulfilled') {
        const list = mine.value.data.content ?? []
        setIViewed(list)
        setViewedIds(new Set(list.map((v) => v.viewerProfileId).filter(Boolean) as string[]))
      }
    })
    return () => {
      cancelled = true
    }
  }, [preview])

  // Recommended matches with the existing app's PREFERENCE_NOT_FOUND fallback.
  useEffect(() => {
    if (preview) return
    let cancelled = false

    async function loadDefault() {
      const filters: SearchFilters = {}
      if (profile?.gender === 'MALE') {
        filters.gender = 'FEMALE'
        filters.minAge = 18
        filters.maxAge = profile.age ? profile.age - 1 : 35
      } else if (profile?.gender === 'FEMALE') {
        filters.gender = 'MALE'
        filters.minAge = profile.age ? profile.age + 1 : 25
        filters.maxAge = 70
      }
      try {
        const res = await searchApi.searchProfiles(filters, { page, size: 10 })
        if (!cancelled) setResults(res.data)
      } catch {
        if (!cancelled)
          setResults({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 })
      }
    }

    async function load() {
      setLoadingResults(true)
      try {
        const res = await searchApi.getMatches({ page, size: 10 })
        if (!cancelled) setResults(res.data)
      } catch {
        // Any error (incl. PREFERENCE_NOT_FOUND) → default gender/age search.
        if (!cancelled) await loadDefault()
      } finally {
        if (!cancelled) setLoadingResults(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // profile read via closure; only page re-triggers (matches existing app).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, page])

  const isLoading = preview === 'loading' || loading
  const firstName = profile?.firstName ?? 'there'
  const strengthPct = profile?.profileStrength?.completionPct ?? profile?.profileCompletionPct ?? 0
  const missing = missingSectionLabels(profile?.profileStrength?.missingSections)

  // #2: only surface profiles the customer hasn't already viewed. If every
  // curated/recommended profile has been viewed, the section simply hides.
  const notViewed = (list: SearchResult[]) => list.filter((p) => !viewedIds.has(p.profileId))
  const dailyCards = preview === 'empty' ? [] : notViewed(daily)
  const matchContent = preview === 'empty' ? [] : notViewed(results?.content ?? [])
  const hasAnything = dailyCards.length > 0 || matchContent.length > 0

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{greeting()}</p>
        <h1 className="mt-1 text-balance font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Here are today&apos;s curated matches and fresh recommendations based on your preferences.
        </p>
      </header>

      {profile && (strengthPct < 100 || missing.length > 0) && (
        <ProfileStrengthWidget strength={strengthPct} missing={missing} className="mb-8" />
      )}

      {isLoading ? (
        <DashboardSkeleton />
      ) : !hasAnything ? (
        <EmptyState
          icon="heart"
          title="No recommendations yet"
          description="Set your partner preferences so we can start curating matches for you. It only takes a minute and makes your matches far more relevant."
          action={
            <Link href="/partner-preferences" className={buttonVariants()}>
              <Icon name="settings" size={18} />
              Set preferences
            </Link>
          }
        />
      ) : (
        <>
          {dailyCards.length > 0 && (
            <section aria-labelledby="todays-matches" className="mb-10">
              <SectionHeading id="todays-matches" eyebrow="Today's matches" title="Handpicked for you today" icon="sparkles" />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dailyCards.map((profileItem) => (
                  <ProfileCard
                    key={`daily-${profileItem.profileId}`}
                    profile={toProfileCard(profileItem)}
                    href={`/profile/${profileItem.profileId}`}
                  />
                ))}
              </div>
            </section>
          )}

          {matchContent.length > 0 && (
            <section aria-labelledby="recommended">
              <SectionHeading id="recommended" eyebrow="Recommended matches" title="More profiles you may like" icon="heart" />
              {loadingResults ? (
                <DashboardSkeleton />
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matchContent.map((profileItem) => (
                    <ProfileCard
                      key={profileItem.profileId}
                      profile={toProfileCard(profileItem)}
                      href={`/profile/${profileItem.profileId}`}
                    />
                  ))}
                </div>
              )}
              <Pagination
                page={page}
                totalPages={results?.totalPages ?? 0}
                onPageChange={(p) => {
                  setPage(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="mt-8"
              />
            </section>
          )}
        </>
      )}

      {/* #3 Profiles who viewed me + #4 Profiles I viewed — shown independently
          of match availability (best-effort; each hides when empty). */}
      {!isLoading && viewedMe.length > 0 && (
        <section aria-labelledby="viewed-me" className="mt-10">
          <SectionHeading id="viewed-me" eyebrow="Profile views" title="Who viewed your profile" icon="eye" />
          <ViewedGrid views={viewedMe} />
          <div className="mt-4">
            <Link
              href="/profile-views"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
        </section>
      )}

      {!isLoading && iViewed.length > 0 && (
        <section aria-labelledby="i-viewed" className="mt-10">
          <SectionHeading id="i-viewed" eyebrow="Recently viewed" title="Profiles you viewed" icon="eye" />
          <ViewedGrid views={iViewed} />
        </section>
      )}
    </main>
  )
}

/** Compact grid of profile-view entries (reused for "who viewed me" + "I viewed"). */
function ViewedGrid({ views }: { views: ProfileView[] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {views.map((v) => (
        <Link
          key={`${v.viewerProfileId}-${v.viewedAt ?? ''}`}
          href={`/profile/${v.viewerProfileId}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
        >
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
            {v.viewerPrimaryPhotoUrl ? (
              <img src={v.viewerPrimaryPhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (v.viewerFirstName?.charAt(0) ?? '?').toUpperCase()
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">
              {v.viewerFirstName ?? v.viewerProfileId}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {[v.viewerAge, v.viewerCity].filter(Boolean).join(' · ') || v.viewerProfileId}
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function SectionHeading({
  id,
  eyebrow,
  title,
  icon,
}: {
  id: string
  eyebrow: string
  title: string
  icon: 'sparkles' | 'heart' | 'eye'
}) {
  return (
    <div>
      <div className={cn('flex items-center gap-2', icon === 'sparkles' ? 'text-gold' : 'text-primary')}>
        <Icon name={icon} size={16} />
        <span className="text-xs font-semibold uppercase tracking-wide">{eyebrow}</span>
      </div>
      <h2 id={id} className="mt-1 text-balance font-serif text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h2>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProfileCardSkeleton key={i} />
      ))}
    </div>
  )
}
