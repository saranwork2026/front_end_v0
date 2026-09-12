'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AccessRequest, AccessRequestStatus, PaginatedResponse } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { accessApi } from '@/src/lib/api'

const PAGE_SIZE = 10
type Direction = 'received' | 'sent'

const statusFilterOptions: { value: 'ALL' | AccessRequestStatus; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const accessTypeLabel = (t: string) => (t === 'PHOTO' ? 'Photo access' : 'Contact access')

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
interface AccessRequestsViewProps {
  state?: ViewState
}

export function AccessRequestsView({ state }: AccessRequestsViewProps) {
  const [tab, setTab] = useState<Direction>('received')
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccessRequestStatus>('ALL')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<PaginatedResponse<AccessRequest> | null>(null)
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
          ? await accessApi.getReceivedAccessRequests({ page, size: PAGE_SIZE, status })
          : await accessApi.getSentAccessRequests({ page, size: PAGE_SIZE, status })
      setResults(res.data)
    } catch {
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
  const changeStatus = (next: 'ALL' | AccessRequestStatus) => {
    setStatusFilter(next)
    setPage(0)
  }

  const runAction = async (request: AccessRequest, action: 'APPROVED' | 'REJECTED') => {
    const key = `${request.requestId}:${action}`
    setPending(key)
    setResults((prev) =>
      prev ? { ...prev, content: prev.content.map((r) => (r.requestId === request.requestId ? { ...r, status: action } : r)) } : prev,
    )
    try {
      await accessApi.updateAccessRequestStatus(request.requestId, action)
      pushToast(action === 'APPROVED' ? 'Access request approved.' : 'Access request declined.', 'success')
    } catch {
      setResults((prev) =>
        prev ? { ...prev, content: prev.content.map((r) => (r.requestId === request.requestId ? { ...r, status: request.status } : r)) } : prev,
      )
      pushToast('Could not update the request. Please try again.', 'error')
    } finally {
      setPending((k) => (k === key ? null : k))
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/80">Privacy</p>
        <h1 className="mt-1 font-serif text-2xl text-foreground sm:text-3xl">Access requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or decline members asking to see your photos and contact details, and track the requests you have sent.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Request direction" className="inline-flex w-full rounded-xl border border-border bg-card p-1 sm:w-auto">
          <TabButton active={tab === 'received'} onClick={() => changeTab('received')} icon="lock" label="Received" />
          <TabButton active={tab === 'sent'} onClick={() => changeTab('sent')} icon="share" label="Sent" />
        </div>
        <div className="w-full sm:w-52">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => changeStatus(e.target.value as 'ALL' | AccessRequestStatus)}
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
            ? 'No requests'
            : `${results?.totalElements ?? items.length} ${(results?.totalElements ?? items.length) === 1 ? 'request' : 'requests'}`}
        </p>
      )}

      {isLoading ? (
        <AccessListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="lock"
          title={tab === 'received' ? 'No access requests received' : 'No access requests sent'}
          description={
            tab === 'received'
              ? 'When someone requests access to your photos or contact details, it will appear here.'
              : 'Request photo or contact access from a profile to start building trust.'
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
          {items.map((request) => (
            <AccessRow key={request.requestId} request={request} direction={tab} pending={pending} onAction={runAction} />
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
  icon: 'lock' | 'share'
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none',
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  )
}

function AccessRow({
  request,
  direction,
  pending,
  onAction,
}: {
  request: AccessRequest
  direction: Direction
  pending: string | null
  onAction: (r: AccessRequest, a: 'APPROVED' | 'REJECTED') => void
}) {
  // The "other party" is the requester when viewing received, owner when sent.
  const party =
    direction === 'received'
      ? { profileId: request.requesterProfileId, firstName: request.requesterFirstName, lastName: request.requesterLastName, photo: request.requesterPrimaryPhotoUrl, focalX: request.requesterPhotoFocalX, focalY: request.requesterPhotoFocalY }
      : { profileId: request.ownerProfileId, firstName: request.ownerFirstName, lastName: request.ownerLastName, photo: request.ownerPrimaryPhotoUrl, focalX: request.ownerPhotoFocalX, focalY: request.ownerPhotoFocalY }

  const fullName = [party.firstName, party.lastName].filter(Boolean).join(' ')
  const initials = `${party.firstName?.[0] ?? ''}${party.lastName?.[0] ?? ''}`

  const canRespond = direction === 'received' && request.status === 'PENDING'
  const busyApprove = pending === `${request.requestId}:APPROVED`
  const busyReject = pending === `${request.requestId}:REJECTED`
  const anyBusy = busyApprove || busyReject

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
      <div className="flex flex-wrap items-start gap-4">
        <Link
          href={`/profile/${party.profileId}`}
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`View ${fullName}'s profile`}
        >
          {party.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={party.photo}
              alt=""
              className="size-14 rounded-full object-cover"
              style={{
                objectPosition:
                  party.focalX != null && party.focalY != null ? `${party.focalX}% ${party.focalY}%` : 'top',
              }}
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary font-serif text-lg text-primary">
              {initials}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${party.profileId}`}
            className="truncate font-medium text-foreground outline-none hover:text-primary focus-visible:text-primary"
          >
            {fullName}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5 font-medium text-foreground/80">
              <Icon name={request.type === 'PHOTO' ? 'eye' : 'phone'} size={12} />
              {accessTypeLabel(request.type)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={12} />
              {timeAgo(request.createdAt)}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={request.status} />
        </div>
      </div>

      {canRespond && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => onAction(request, 'REJECTED')}
            loading={busyReject}
            disabled={anyBusy && !busyReject}
            className="min-h-11 w-full sm:w-auto"
          >
            <Icon name="x" size={16} />
            Decline
          </Button>
          <Button
            onClick={() => onAction(request, 'APPROVED')}
            loading={busyApprove}
            disabled={anyBusy && !busyApprove}
            className="min-h-11 w-full sm:w-auto"
          >
            <Icon name="check" size={16} />
            Approve
          </Button>
        </div>
      )}
    </li>
  )
}

function AccessListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="size-14 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  )
}
