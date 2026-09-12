'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Interest, InterestStatus, PaginatedResponse } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { interestsApi } from '@/src/lib/api'

const PAGE_SIZE = 10
type Direction = 'received' | 'sent'

const statusFilterOptions: { value: 'ALL' | InterestStatus; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return `${Math.round(days / 7)} wk ago`
}

type ViewState = 'ready' | 'loading' | 'empty'
interface InterestsViewProps {
  state?: ViewState
}

export function InterestsView({ state }: InterestsViewProps) {
  const [tab, setTab] = useState<Direction>('received')
  const [statusFilter, setStatusFilter] = useState<'ALL' | InterestStatus>('ALL')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<PaginatedResponse<Interest> | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = useCallback(
    (message: string, variant: ToastItem['variant']) =>
      setToasts((t) => [...t, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }]),
    [],
  )
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const load = useCallback(async () => {
    if (state === 'loading') return
    setLoading(true)
    const status = statusFilter === 'ALL' ? undefined : statusFilter
    try {
      const res =
        tab === 'received'
          ? await interestsApi.getReceivedInterests({ page, size: PAGE_SIZE, status })
          : await interestsApi.getSentInterests({ page, size: PAGE_SIZE, status })
      setResults(res.data)
    } catch {
      // List failures stay silent per spec; show empty.
      setResults({ content: [], totalElements: 0, totalPages: 0, size: PAGE_SIZE, number: 0 })
    } finally {
      setLoading(false)
    }
  }, [tab, statusFilter, page, state])

  useEffect(() => {
    if (state === 'empty') {
      setResults({ content: [], totalElements: 0, totalPages: 0, size: PAGE_SIZE, number: 0 })
      setLoading(false)
      return
    }
    void load()
  }, [load, state])

  const items = results?.content ?? []
  const isLoading = state === 'loading' || loading

  const changeTab = (next: Direction) => {
    setTab(next)
    setPage(0)
  }
  const changeStatus = (next: 'ALL' | InterestStatus) => {
    setStatusFilter(next)
    setPage(0)
  }

  const runAction = async (interest: Interest, action: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => {
    const key = `${interest.interestId}:${action}`
    setPending(key)
    // optimistic
    setResults((prev) =>
      prev ? { ...prev, content: prev.content.map((i) => (i.interestId === interest.interestId ? { ...i, status: action } : i)) } : prev,
    )
    try {
      await interestsApi.updateInterestStatus(interest.interestId, action)
    } catch {
      // revert
      setResults((prev) =>
        prev ? { ...prev, content: prev.content.map((i) => (i.interestId === interest.interestId ? { ...i, status: interest.status } : i)) } : prev,
      )
      pushToast('Could not update the interest. Please try again.', 'error')
    } finally {
      setPending((k) => (k === key ? null : k))
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/80">Connections</p>
        <h1 className="mt-1 font-serif text-2xl text-foreground sm:text-3xl">Interests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Interests you have received and sent. Respond to pending requests to move a conversation forward.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Interest direction" className="inline-flex w-full rounded-xl border border-border bg-card p-1 sm:w-auto">
          <TabButton active={tab === 'received'} onClick={() => changeTab('received')} icon="mail" label="Received" />
          <TabButton active={tab === 'sent'} onClick={() => changeTab('sent')} icon="share" label="Sent" />
        </div>
        <div className="w-full sm:w-52">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => changeStatus(e.target.value as 'ALL' | InterestStatus)}
          >
            {statusFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!isLoading && (
        <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
          {items.length === 0
            ? 'No interests'
            : `${results?.totalElements ?? items.length} ${(results?.totalElements ?? items.length) === 1 ? 'interest' : 'interests'}`}
        </p>
      )}

      {isLoading ? (
        <InterestListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="mail"
          title={tab === 'received' ? 'No interests received yet' : 'No interests sent yet'}
          description={
            tab === 'received'
              ? 'When someone expresses interest in your profile, it will appear here.'
              : 'Browse profiles and send an interest to start a connection.'
          }
          action={
            tab === 'sent' ? (
              <Link href="/search" className={buttonVariants()}>
                Browse profiles
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((interest) => (
            <InterestRow key={interest.interestId} interest={interest} direction={tab} pending={pending} onAction={runAction} />
          ))}
        </ul>
      )}

      {!isLoading && (results?.totalPages ?? 0) > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={results?.totalPages ?? 0} onPageChange={setPage} />
        </div>
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: 'mail' | 'share'
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none',
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  )
}

function InterestRow({
  interest,
  direction,
  pending,
  onAction,
}: {
  interest: Interest
  direction: Direction
  pending: string | null
  onAction: (i: Interest, a: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => void
}) {
  const fullName = [interest.otherFirstName, interest.otherLastName].filter(Boolean).join(' ')
  const initials = `${interest.otherFirstName?.[0] ?? ''}${interest.otherLastName?.[0] ?? ''}`

  const canRespond = direction === 'received' && interest.status === 'PENDING'
  const canCancel = direction === 'sent' && interest.status === 'PENDING'

  const busyAccept = pending === `${interest.interestId}:ACCEPTED`
  const busyReject = pending === `${interest.interestId}:REJECTED`
  const busyCancel = pending === `${interest.interestId}:CANCELLED`
  const anyBusy = busyAccept || busyReject || busyCancel

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
      <div className="flex flex-wrap items-start gap-4">
        <Link
          href={`/profile/${interest.otherProfileId}`}
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`View ${fullName}'s profile`}
        >
          {interest.otherPrimaryPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={interest.otherPrimaryPhotoUrl}
              alt=""
              className="size-14 rounded-full object-cover"
              style={{
                objectPosition:
                  interest.otherPhotoFocalX != null && interest.otherPhotoFocalY != null
                    ? `${interest.otherPhotoFocalX}% ${interest.otherPhotoFocalY}%`
                    : '50% 30%',
              }}
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary font-serif text-lg text-primary">
              {initials}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/profile/${interest.otherProfileId}`}
              className="truncate font-medium text-foreground outline-none hover:text-primary focus-visible:text-primary"
            >
              {fullName}
            </Link>
            {interest.otherAge != null && (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{interest.otherAge}</span>
            )}
          </div>
          {interest.otherCity && <p className="mt-0.5 truncate text-sm text-muted-foreground">{interest.otherCity}</p>}
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Icon name="clock" size={12} />
            {timeAgo(interest.createdAt)}
          </p>
        </div>

        <div className="shrink-0">
          <StatusBadge status={interest.status} />
        </div>
      </div>

      {(canRespond || canCancel) && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:justify-end">
          {canRespond && (
            <>
              <Button
                variant="secondary"
                onClick={() => onAction(interest, 'REJECTED')}
                loading={busyReject}
                disabled={anyBusy && !busyReject}
                className="w-full sm:w-auto"
              >
                <Icon name="x" size={16} />
                Decline
              </Button>
              <Button
                onClick={() => onAction(interest, 'ACCEPTED')}
                loading={busyAccept}
                disabled={anyBusy && !busyAccept}
                className="w-full sm:w-auto"
              >
                <Icon name="check" size={16} />
                Accept
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              variant="secondary"
              onClick={() => onAction(interest, 'CANCELLED')}
              loading={busyCancel}
              disabled={anyBusy && !busyCancel}
              className="w-full sm:w-auto"
            >
              <Icon name="x" size={16} />
              Cancel request
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

function InterestListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="size-14 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  )
}
