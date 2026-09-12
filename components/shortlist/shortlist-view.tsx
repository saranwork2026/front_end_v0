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
import { scrollMainToTop } from '@/lib/utils'
import { shortlistApi } from '@/src/lib/api'
import { toProfileCard } from '@/src/lib/adapters'

const PAGE_SIZE = 9
export type ShortlistPreview = 'loading' | 'empty' | 'error'

interface ShortlistViewProps {
  preview?: ShortlistPreview
}

export function ShortlistView({ preview }: ShortlistViewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [results, setResults] = useState<PaginatedResponse<SearchResult> | null>(null)
  // Local copy so un-shortlist removes a card immediately (optimistic).
  const [items, setItems] = useState<SearchResult[]>([])
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (preview) {
      setLoading(preview === 'loading')
      setError(preview === 'error')
      if (preview === 'empty') setItems([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(false)
    shortlistApi
      .getShortlist({ page, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return
        setResults(res.data)
        setItems(res.data.content)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [preview, page])

  const isLoading = preview === 'loading' || loading

  async function removeFromShortlist(id: string) {
    setItems((prev) => prev.filter((p) => p.profileId !== id)) // optimistic
    try {
      await shortlistApi.removeFromShortlist(id)
    } catch {
      // Re-fetch to restore accurate state on failure.
      try {
        const res = await shortlistApi.getShortlist({ page, size: PAGE_SIZE })
        setResults(res.data)
        setItems(res.data.content)
      } catch {
        /* leave optimistic state */
      }
    }
  }

  const countLine = isLoading
    ? 'Loading your shortlist…'
    : error
      ? 'Shortlist unavailable'
      : items.length === 0
        ? 'No saved profiles'
        : `${results?.totalElements ?? items.length} saved ${(results?.totalElements ?? items.length) === 1 ? 'profile' : 'profiles'}`

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-gold">
          <Icon name="star-filled" size={18} />
          <span className="text-xs font-semibold uppercase tracking-wide">Saved for later</span>
        </div>
        <h1 className="mt-1.5 text-balance font-serif text-2xl font-bold text-foreground sm:text-3xl">
          My shortlist
        </h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Profiles you&apos;ve bookmarked. Remove one anytime by tapping its star.
        </p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <p aria-live="polite" className="text-sm font-medium text-muted-foreground">
          {countLine}
        </p>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <Icon name="alert-circle" size={20} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">We couldn&apos;t load your shortlist</p>
              <p className="mt-0.5 text-sm text-destructive/90">
                Something went wrong on our end. Please refresh the page to try again.
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="star"
            title="Your shortlist is empty"
            description="Tap the star on any profile to save it here for later. Your bookmarked profiles will stay in one place."
            action={
              <Link href="/search" className={buttonVariants()}>
                <Icon name="search" size={18} />
                Browse profiles
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((result) => (
                <ProfileCard
                  key={result.profileId}
                  profile={toProfileCard(result)}
                  href={`/profile/${result.profileId}`}
                  showShortlistButton
                  isShortlisted
                  onShortlistToggle={(id) => void removeFromShortlist(id)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={results?.totalPages ?? 0}
              onPageChange={(p) => {
                setPage(p)
                scrollMainToTop()
              }}
              className="mt-8"
            />
          </>
        )}
      </div>
    </main>
  )
}
