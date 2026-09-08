'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SearchResult, PaginatedResponse } from '@matrimony/shared-core'

import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { ProfileCardSkeleton } from '@/components/ui/skeleton'
import { ProfileCard } from '@/components/shared/profile-card'
import { searchApi } from '@/src/lib/api'
import { toProfileCard } from '@/src/lib/adapters'
import { useShortlist } from '@/src/hooks/useShortlist'

type MatchErrorCode = 'PREFERENCE_NOT_FOUND' | 'PROFILE_NOT_FOUND' | 'GENERIC'
export type MatchesPreview = 'loading' | 'empty' | MatchErrorCode

interface MatchesViewProps {
  preview?: MatchesPreview
}

export function MatchesView({ preview }: MatchesViewProps) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<PaginatedResponse<SearchResult> | null>(null)
  const [errorCode, setErrorCode] = useState<MatchErrorCode | null>(null)
  const [page, setPage] = useState(0)
  const { isShortlisted, toggle } = useShortlist()

  useEffect(() => {
    if (preview) {
      setLoading(preview === 'loading')
      if (preview === 'empty') setResults({ content: [], totalElements: 0, totalPages: 0, size: 9, number: 0 })
      if (preview === 'PREFERENCE_NOT_FOUND' || preview === 'PROFILE_NOT_FOUND' || preview === 'GENERIC')
        setErrorCode(preview)
      return
    }
    let cancelled = false
    setLoading(true)
    setErrorCode(null)
    searchApi
      .getMatches({ page, size: 9 })
      .then((res) => {
        if (!cancelled) setResults(res.data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const code = (err as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode
        if (code === 'PREFERENCE_NOT_FOUND') setErrorCode('PREFERENCE_NOT_FOUND')
        else if (code === 'PROFILE_NOT_FOUND') setErrorCode('PROFILE_NOT_FOUND')
        else setErrorCode('GENERIC')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [preview, page])

  const isLoading = preview === 'loading' || loading
  const content = results?.content ?? []

  const countLine = isLoading
    ? 'Finding your matches…'
    : errorCode
      ? 'Matches paused'
      : content.length === 0
        ? 'No matches yet'
        : `${results?.totalElements ?? content.length} ${(results?.totalElements ?? content.length) === 1 ? 'match' : 'matches'} for you`

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-primary">
          <Icon name="heart" size={18} />
          <span className="text-xs font-semibold uppercase tracking-wide">Preference matches</span>
        </div>
        <h1 className="mt-1.5 text-balance font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Your matches
        </h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Profiles curated from your partner preferences, ranked by how closely they match.
        </p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <p aria-live="polite" className="text-sm font-medium text-muted-foreground">
          {countLine}
        </p>
        {!isLoading && !errorCode && content.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <Icon name="star-filled" size={13} className="text-gold" />
            Sorted by best match
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
        ) : content.length === 0 ? (
          <EmptyState
            icon="heart"
            title="No matches yet"
            description="We couldn't find profiles that fit your current preferences. Widening them — like age, community, or location — usually surfaces more matches."
            action={
              <Link href="/partner-preferences" className={buttonVariants()}>
                <Icon name="settings" size={18} />
                Update preferences
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.map((result) => (
                <ProfileCard
                  key={result.profileId}
                  profile={toProfileCard(result)}
                  href={`/profile/${result.profileId}`}
                  showShortlistButton
                  isShortlisted={isShortlisted(result.profileId)}
                  onShortlistToggle={(id) => void toggle(id)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={results?.totalPages ?? 0}
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
        <p className="font-semibold">We couldn&apos;t load your matches</p>
        <p className="mt-0.5 text-sm text-destructive/90">
          Something went wrong on our end. Please refresh the page to try again.
        </p>
      </div>
    </div>
  )
}
