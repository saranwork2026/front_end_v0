'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { PaginatedResponse } from '@matrimony/shared-core'

import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { ProfileCardSkeleton } from '@/components/ui/skeleton'
import { ProfileCard, type ProfileCardProfile } from '@/components/shared/profile-card'
import { cn } from '@/lib/utils'
import {
  searchApi,
  shortlistApi,
  profileViewsApi,
  interestsApi,
} from '@/src/lib/api'
import { toProfileCard, toCardFromView, toCardFromInterest } from '@/src/lib/adapters'
import { useShortlist } from '@/src/hooks/useShortlist'

/** The eight Matches filters. `newest` is the default. */
type MatchFilter =
  | 'newest'
  | 'all'
  | 'shortlistedYou'
  | 'youShortlisted'
  | 'viewedYou'
  | 'youViewed'
  | 'youSentInterest'
  | 'otherSentInterest'

interface FilterDef {
  key: MatchFilter
  label: string
  /** Fetches a page and maps each row to the shared ProfileCard shape. */
  fetchPage: (page: number, size: number) => Promise<{ cards: ProfileCardProfile[]; totalPages: number; totalElements: number }>
  emptyTitle: string
  emptyDesc: string
}

const PAGE_SIZE = 12

// Small helper to normalise any paginated response into the card list shape.
function mapPage<T>(
  res: { data: PaginatedResponse<T> },
  toCard: (row: T) => ProfileCardProfile,
) {
  const data = res.data
  return {
    cards: (data.content ?? []).map(toCard),
    totalPages: data.totalPages ?? 0,
    totalElements: data.totalElements ?? data.content?.length ?? 0,
  }
}

const FILTERS: FilterDef[] = [
  {
    key: 'newest',
    label: 'Newly joined',
    fetchPage: (page, size) =>
      searchApi.getMatches({ page, size, sort: 'newest' }).then((r) => mapPage(r, toProfileCard)),
    emptyTitle: 'No new matches yet',
    emptyDesc: 'Newly joined profiles that fit your preferences will show up here first.',
  },
  {
    key: 'all',
    label: 'All matches',
    fetchPage: (page, size) =>
      searchApi.getMatches({ page, size }).then((r) => mapPage(r, toProfileCard)),
    emptyTitle: 'No matches yet',
    emptyDesc: "We couldn't find profiles that fit your current preferences. Widening them usually surfaces more matches.",
  },
  {
    key: 'shortlistedYou',
    label: 'Shortlisted you',
    fetchPage: (page, size) =>
      shortlistApi.getWhoShortlistedMe({ page, size }).then((r) => mapPage(r, toProfileCard)),
    emptyTitle: 'No one has shortlisted you yet',
    emptyDesc: 'When a member shortlists your profile, they will appear here.',
  },
  {
    key: 'youShortlisted',
    label: 'You shortlisted',
    fetchPage: (page, size) =>
      shortlistApi.getShortlist({ page, size }).then((r) => mapPage(r, toProfileCard)),
    emptyTitle: "You haven't shortlisted anyone",
    emptyDesc: 'Shortlist profiles you like and they will collect here for easy review.',
  },
  {
    key: 'viewedYou',
    label: 'Viewed you',
    fetchPage: (page, size) =>
      profileViewsApi.getProfileViews({ page, size }).then((r) => mapPage(r, toCardFromView)),
    emptyTitle: 'No profile views yet',
    emptyDesc: 'Members who view your profile will appear here.',
  },
  {
    key: 'youViewed',
    label: 'You viewed',
    fetchPage: (page, size) =>
      profileViewsApi.getProfilesIViewed({ page, size }).then((r) => mapPage(r, toCardFromView)),
    emptyTitle: "You haven't viewed anyone yet",
    emptyDesc: 'Profiles you open will be listed here so you can revisit them.',
  },
  {
    key: 'youSentInterest',
    label: 'You sent interest',
    fetchPage: (page, size) =>
      interestsApi.getSentInterests({ page, size }).then((r) => mapPage(r, toCardFromInterest)),
    emptyTitle: "You haven't sent any interests",
    emptyDesc: 'Interests you send will be listed here with their status.',
  },
  {
    key: 'otherSentInterest',
    label: 'Received interest',
    fetchPage: (page, size) =>
      interestsApi.getReceivedInterests({ page, size }).then((r) => mapPage(r, toCardFromInterest)),
    emptyTitle: 'No interests received yet',
    emptyDesc: 'When someone expresses interest in your profile, they will appear here.',
  },
]

type MatchErrorCode = 'PREFERENCE_NOT_FOUND' | 'PROFILE_NOT_FOUND' | 'GENERIC'
export type MatchesPreview = 'loading' | 'empty' | MatchErrorCode

interface MatchesViewProps {
  preview?: MatchesPreview
}

export function MatchesView({ preview }: MatchesViewProps) {
  // Default filter: Newly joined (per product spec).
  const [filter, setFilter] = useState<MatchFilter>('newest')
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<ProfileCardProfile[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [errorCode, setErrorCode] = useState<MatchErrorCode | null>(null)
  const [page, setPage] = useState(0)
  const { isShortlisted, toggle } = useShortlist()

  const activeDef = FILTERS.find((f) => f.key === filter)!

  const runFetch = useCallback(
    async (f: MatchFilter, p: number) => {
      const def = FILTERS.find((x) => x.key === f)!
      setLoading(true)
      setErrorCode(null)
      try {
        const { cards: next, totalPages: tp, totalElements: te } = await def.fetchPage(p, PAGE_SIZE)
        setCards(next)
        setTotalPages(tp)
        setTotalElements(te)
      } catch (err: unknown) {
        const code = (err as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode
        if (code === 'PREFERENCE_NOT_FOUND') setErrorCode('PREFERENCE_NOT_FOUND')
        else if (code === 'PROFILE_NOT_FOUND') setErrorCode('PROFILE_NOT_FOUND')
        else setErrorCode('GENERIC')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (preview) {
      setLoading(preview === 'loading')
      if (preview === 'empty') {
        setCards([])
        setTotalElements(0)
        setTotalPages(0)
      }
      if (preview === 'PREFERENCE_NOT_FOUND' || preview === 'PROFILE_NOT_FOUND' || preview === 'GENERIC')
        setErrorCode(preview)
      return
    }
    void runFetch(filter, page)
  }, [preview, filter, page, runFetch])

  function changeFilter(next: MatchFilter) {
    if (next === filter) return
    setFilter(next)
    setPage(0)
  }

  const isLoading = preview === 'loading' || loading

  const countLine = isLoading
    ? 'Loading…'
    : errorCode
      ? 'Matches paused'
      : cards.length === 0
        ? activeDef.emptyTitle
        : `${totalElements} ${totalElements === 1 ? 'profile' : 'profiles'}`

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-primary">
          <Icon name="heart" size={18} />
          <span className="text-xs font-semibold uppercase tracking-wide">Matches</span>
        </div>
        <h1 className="mt-1.5 text-balance font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Your matches
        </h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Newly joined profiles first. Use the filters to switch between shortlists, profile views and interests.
        </p>
      </header>

      {/* Filter selector — scrollable chip row (mirrors the Search filter styling). */}
      <div
        role="tablist"
        aria-label="Match filter"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {FILTERS.map((f) => {
          const active = f.key === filter
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => changeFilter(f.key)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="sticky top-14 z-30 -mx-4 mt-3 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <p aria-live="polite" className="text-sm font-medium text-muted-foreground">
          {countLine}
        </p>
        {filter === 'newest' && !isLoading && !errorCode && cards.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <Icon name="sparkles" size={13} className="text-gold" />
            Newest first
          </span>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : errorCode ? (
          <MatchesError code={errorCode} />
        ) : cards.length === 0 ? (
          <EmptyState
            icon="heart"
            title={activeDef.emptyTitle}
            description={activeDef.emptyDesc}
            action={
              filter === 'all' || filter === 'newest' ? (
                <Link href="/partner-preferences" className={buttonVariants()}>
                  <Icon name="settings" size={18} />
                  Update preferences
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <ProfileCard
                  key={card.profileId}
                  profile={card}
                  href={`/profile/${card.profileId}`}
                  showShortlistButton
                  isShortlisted={isShortlisted(card.profileId)}
                  onShortlistToggle={(id) => void toggle(id)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="mt-8"
            />
          </>
        )}
      </div>
    </main>
  )
}

function MatchesError({ code }: { code: MatchErrorCode }) {
  if (code === 'PREFERENCE_NOT_FOUND') {
    return (
      <EmptyState
        icon="settings"
        title="Set your partner preferences"
        description="Tell us what you're looking for — age, community, location and more — and we'll build your personalized matches."
        action={
          <Link href="/partner-preferences" className={buttonVariants()}>
            <Icon name="settings" size={18} />
            Set preferences
          </Link>
        }
      />
    )
  }
  if (code === 'PROFILE_NOT_FOUND') {
    return (
      <EmptyState
        icon="user"
        title="Complete your profile first"
        description="We need a few more details about you before we can find compatible matches. It only takes a couple of minutes."
        action={
          <Link href="/profile/wizard" className={buttonVariants()}>
            <Icon name="arrow-right" size={18} />
            Complete profile
          </Link>
        }
      />
    )
  }
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
      <Icon name="alert-circle" size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">We couldn&apos;t load these profiles</p>
        <p className="mt-0.5 text-sm text-destructive/90">
          Something went wrong on our end. Please refresh the page to try again.
        </p>
      </div>
    </div>
  )
}
