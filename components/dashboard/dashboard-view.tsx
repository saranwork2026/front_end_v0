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
import { profileApi, searchApi, profileViewsApi, adBannerApi } from '@/src/lib/api'
import { toProfileCard, missingSectionLabels, flattenProfileResponse } from '@/src/lib/adapters'
import type { ProfileView, AdBanner } from '@matrimony/shared-core'

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

  // #6 approved vendor/promo banners (rotating carousel).
  const [banners, setBanners] = useState<AdBanner[]>([])

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

  // #6 approved vendor banners (best-effort; section hides when none).
  useEffect(() => {
    if (preview) return
    let cancelled = false
    adBannerApi
      .getApprovedBanners()
      .then((res) => {
        if (!cancelled) setBanners(res.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setBanners([])
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

      {banners.length > 0 && <AdCarousel banners={banners} />}

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

      {/* #5 Our services (matrimony + event management) + #7 Support/help. */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <ServicesCard />
        <SupportCard />
      </div>
    </main>
  )
}

/** #5 — Magizh does both matrimony registration and event management. */
function ServicesCard() {
  return (
    <section
      aria-labelledby="our-services"
      className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 text-gold">
        <Icon name="sparkles" size={16} />
        <span className="text-xs font-semibold uppercase tracking-wide">Our services</span>
      </div>
      <h2 id="our-services" className="mt-1 font-serif text-xl font-bold text-foreground">
        Matrimony &amp; Event Management
      </h2>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        Wedding registration for all communities, and complete service for all
        auspicious events (நிகழ்ச்சி மேலாண்மை).
      </p>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-start gap-2.5">
          <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <dd className="text-foreground text-pretty">
            1st Floor, Najeem Commercial Complex, Behind Old Bus Stand, Mayiladuthurai&nbsp;&ndash;&nbsp;609&nbsp;001
          </dd>
        </div>
        <div className="flex items-start gap-2.5">
          <Icon name="phone" size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <dd className="text-foreground">
            <a href="tel:+919943099050" className="hover:underline">99430&nbsp;99050</a>,{' '}
            <a href="tel:+919943099060" className="hover:underline">99430&nbsp;99060</a>
          </dd>
        </div>
        <div className="flex items-start gap-2.5">
          <Icon name="mail" size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <dd className="text-foreground">
            <a href="mailto:info@magizhmatrimony.com" className="hover:underline">
              info@magizhmatrimony.com
            </a>
          </dd>
        </div>
      </dl>
    </section>
  )
}

/** #7 — support/help contact for matrimony assistance. */
function SupportCard() {
  return (
    <section
      aria-labelledby="need-help"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center gap-2 text-primary">
        <Icon name="phone" size={16} />
        <span className="text-xs font-semibold uppercase tracking-wide">Need help?</span>
      </div>
      <h2 id="need-help" className="mt-1 font-serif text-xl font-bold text-foreground">
        We&apos;re here to help
      </h2>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        If you need support from Magizh Matrimony, please call us and our team
        will be glad to assist you.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href="tel:+919943099050"
          className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
        >
          <Icon name="phone" size={18} />
          99430 99050
        </a>
        <a
          href="tel:+919943099060"
          className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full sm:w-auto')}
        >
          <Icon name="phone" size={18} />
          99430 99060
        </a>
      </div>
      <div className="mt-3">
        <Link href="/support" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Visit the help centre
        </Link>
      </div>
    </section>
  )
}

/** #6 Rotating vendor/promo banner carousel (auto-advances when >1 banner). */
function AdCarousel({ banners }: { banners: AdBanner[] }) {
  const [index, setIndex] = useState(0)
  const count = banners.length

  useEffect(() => {
    if (count <= 1) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(id)
  }, [count])

  const current = banners[Math.min(index, count - 1)]
  const inner = (
    <img
      src={current.imageUrl}
      alt={current.title ?? 'Advertisement'}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  )

  return (
    <section aria-label="Sponsored" className="mb-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        <div className="aspect-[4/1] w-full">
          {current.linkUrl ? (
            <a href={current.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
              {inner}
            </a>
          ) : (
            inner
          )}
        </div>
        {count > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show banner ${i + 1} of ${count}`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
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
