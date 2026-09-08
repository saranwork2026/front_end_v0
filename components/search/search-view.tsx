'use client'

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SearchFilters, SearchResult, PaginatedResponse } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { ProfileCardSkeleton } from '@/components/ui/skeleton'
import { ProfileCard } from '@/components/shared/profile-card'
import { FilterChip } from '@/components/shared/filter-bar'
import { FilterFields } from '@/components/search/filter-fields'
import { searchApi } from '@/src/lib/api'
import { toProfileCard } from '@/src/lib/adapters'
import {
  buildActiveChips,
  countActiveFilters,
  removeFilter,
  validateFilters,
  type ChipKey,
} from '@/src/lib/search-filters'
import { useShortlist } from '@/src/hooks/useShortlist'

const PAGE_SIZE = 10

export function SearchView() {
  const navigate = useNavigate()

  // `draft` is what the filter inputs edit; `applied` is what the results use.
  const [draft, setDraft] = useState<SearchFilters>({})
  const [applied, setApplied] = useState<SearchFilters>({})
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<PaginatedResponse<SearchResult> | null>(null)
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { isShortlisted, toggle } = useShortlist()

  const chips = buildActiveChips(applied)
  const activeCount = countActiveFilters(applied)

  const runSearch = useCallback(async (next: SearchFilters, searchPage: number) => {
    const validationError = validateFilters(next)
    setApplied(next)
    setSearched(true)
    setPage(searchPage)
    if (validationError) {
      setError(validationError)
      setResults(null)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await searchApi.searchProfiles(next, { page: searchPage, size: PAGE_SIZE })
      setResults(res.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const patchDraft = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }))

  function handleReset() {
    setDraft({})
    setApplied({})
    setSearched(false)
    setError(null)
    setResults(null)
    setPage(0)
  }

  function handleRemoveChip(key: ChipKey) {
    const next = removeFilter(applied, key)
    setDraft(next)
    void runSearch(next, 0)
  }

  function handleApplyFromSheet() {
    setSheetOpen(false)
    void runSearch(draft, 0)
  }

  function openSheet() {
    setDraft(applied)
    setSheetOpen(true)
  }

  const content = results?.content ?? []
  const countLine = !searched
    ? 'Set your filters to begin'
    : loading
      ? 'Searching profiles…'
      : error
        ? 'Search paused'
        : content.length === 0
          ? 'No profiles found'
          : `${results?.totalElements ?? content.length} ${(results?.totalElements ?? content.length) === 1 ? 'profile' : 'profiles'} found`

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-5">
        <h1 className="text-balance font-serif text-2xl font-bold text-foreground sm:text-3xl">
          Find your match
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search verified profiles by the details that matter to your family.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-foreground">Filters</h2>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-md px-1.5 py-0.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto pr-1">
              <FilterFields value={draft} onChange={patchDraft} />
            </div>
            <div className="mt-5 border-t border-border/70 pt-4">
              <Button className="w-full" loading={loading} onClick={() => void runSearch(draft, 0)}>
                <Icon name="search" size={18} />
                Search
              </Button>
            </div>
          </div>
        </aside>

        {/* Results column */}
        <section className="min-w-0">
          <div className="sticky top-14 z-30 -mx-4 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={openSheet}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 lg:hidden"
              >
                <Icon name="filter" size={16} />
                Filters
                {activeCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </button>
              <p aria-live="polite" className="ml-auto text-sm font-medium text-muted-foreground">
                {countLine}
              </p>
            </div>

            {chips.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 lg:flex-wrap lg:overflow-visible">
                {chips.map((chip) => (
                  <span key={chip.key} className="shrink-0">
                    <FilterChip label={chip.label} onRemove={() => handleRemoveChip(chip.key)} />
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"
              >
                <Icon name="alert-circle" size={20} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">We couldn&apos;t run that search</p>
                  <p className="mt-0.5 text-sm text-destructive/90">{error}</p>
                  <div className="mt-3">
                    <Button variant="secondary" size="sm" onClick={openSheet} className="lg:hidden">
                      Adjust filters
                    </Button>
                  </div>
                </div>
              </div>
            ) : !searched ? (
              <EmptyState
                icon="search"
                title="Start your search"
                description="Choose the criteria that matter — age, community, location, education, horoscope — and we'll find matching profiles."
                action={
                  <Button onClick={openSheet} className="lg:hidden">
                    <Icon name="filter" size={18} />
                    Open filters
                  </Button>
                }
              />
            ) : loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProfileCardSkeleton key={i} />
                ))}
              </div>
            ) : content.length === 0 ? (
              <EmptyState
                icon="search"
                title="No profiles match your filters"
                description="Try widening your age or height range, or removing a filter or two to see more matches."
                action={
                  <Button variant="secondary" onClick={handleReset}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
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
                    void runSearch(applied, p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="mt-8"
                />
              </>
            )}
          </div>
        </section>
      </div>

      {/* Mobile / tablet filter sheet (single FilterFields, kept in sync) */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDraft({})}>
              Reset
            </Button>
            <Button className="flex-1" onClick={handleApplyFromSheet}>
              Apply filters
            </Button>
          </>
        }
      >
        <FilterFields value={draft} onChange={patchDraft} />
      </BottomSheet>
    </main>
  )
}
