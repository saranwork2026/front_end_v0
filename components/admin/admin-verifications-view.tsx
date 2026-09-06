'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { DocumentType, IdVerification, VerificationStatus } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ImageLightbox } from '@/components/profile/image-lightbox'
import { cn } from '@/lib/utils'
import { adminApi } from '@/src/lib/api'

const PAGE_SIZE = 50

const TABS: { value: VerificationStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const STATUS_BADGE: Record<VerificationStatus, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  PENDING: { variant: 'warning', label: 'Pending review' },
  APPROVED: { variant: 'success', label: 'Approved' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
}

const DOCUMENT_LABEL: Record<DocumentType, string> = {
  AADHAAR: 'Aadhaar',
  PAN: 'PAN',
  PASSPORT: 'Passport',
  DRIVING_LICENSE: 'Driving license',
  VOTER_ID: 'Voter ID',
  OTHER: 'Other document',
}

function formatSubmitted(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AdminVerificationsView(_props: { initialState?: 'ready' | 'loading' | 'empty' }) {
  const [tab, setTab] = useState<VerificationStatus>('PENDING')
  const [items, setItems] = useState<IdVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null)
  const [rejecting, setRejecting] = useState<IdVerification | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | undefined>()
  const [busyId, setBusyId] = useState<number | null>(null)

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.getVerifications(tab, 0, PAGE_SIZE)
      setItems(res.data.content ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    void load()
  }, [load])

  async function approve(item: IdVerification) {
    setBusyId(item.id)
    try {
      await adminApi.approveVerification(item.id)
      pushToast(`${item.firstName ?? 'Member'}'s ${DOCUMENT_LABEL[item.documentType]} was approved.`, 'success')
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch {
      pushToast('Could not approve verification. Please try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  function openReject(item: IdVerification) {
    setRejecting(item)
    setReason('')
    setReasonError(undefined)
  }

  async function confirmReject() {
    if (!rejecting) return
    if (reason.trim().length < 5) {
      setReasonError('Please give the member a clear reason (min 5 characters).')
      return
    }
    const item = rejecting
    setBusyId(item.id)
    try {
      await adminApi.rejectVerification(item.id, reason.trim())
      pushToast(`${item.firstName ?? 'Member'} was notified with your reason.`, 'success')
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setRejecting(null)
    } catch {
      pushToast('Could not reject verification. Please try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">ID verifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submitted identity documents. Approvals grant the verified badge; rejections notify
          the member with your reason.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Verification status"
        className="mt-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1"
      >
        {TABS.map((tItem) => {
          const selected = tab === tItem.value
          return (
            <button
              key={tItem.value}
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(tItem.value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {tItem.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center"
        >
          <p className="text-sm text-destructive">We could not load verifications. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="shield"
            title={`No ${tab.toLowerCase()} verifications`}
            description={
              tab === 'PENDING'
                ? 'All caught up — there are no documents waiting for review.'
                : `There are no ${tab.toLowerCase()} verification requests.`
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <VerificationCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onView={(images, index) => setViewer({ images, index })}
              onApprove={() => approve(item)}
              onReject={() => openReject(item)}
            />
          ))}
        </div>
      )}

      {viewer && (
        <ImageLightbox
          images={viewer.images}
          index={viewer.index}
          open
          alt="Submitted identity document"
          onClose={() => setViewer(null)}
          onNavigate={(index) => setViewer((v) => (v ? { ...v, index } : v))}
        />
      )}

      <Dialog
        open={rejecting != null}
        onClose={() => setRejecting(null)}
        title="Reject verification"
        description={
          rejecting
            ? `Tell ${rejecting.firstName ?? 'the member'} why their ${DOCUMENT_LABEL[rejecting.documentType]} was rejected. They'll see this reason.`
            : undefined
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="reject-reason" className="mb-1.5 block text-sm font-medium text-foreground">
              Rejection reason
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              maxLength={500}
              onChange={(e) => {
                setReason(e.target.value)
                if (reasonError) setReasonError(undefined)
              }}
              className={cn(
                'w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30',
                reasonError ? 'border-destructive' : 'border-input focus:border-ring',
              )}
              placeholder="e.g. The document photo is blurry — please re-upload a clear image."
            />
            <div className="mt-1 flex items-center justify-between">
              {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : <span />}
              <span className="text-xs text-muted-foreground">{reason.length}/500</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setRejecting(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmReject}
              loading={busyId === rejecting?.id}
              className="flex-1"
            >
              Reject verification
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function VerificationCard({
  item,
  busy,
  onView,
  onApprove,
  onReject,
}: {
  item: IdVerification
  busy: boolean
  onView: (images: string[], index: number) => void
  onApprove: () => void
  onReject: () => void
}) {
  const badge = STATUS_BADGE[item.status]
  const images = item.documentUrl ? [item.documentUrl] : []
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
        >
          {(item.firstName ?? item.profileId ?? '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          {item.profileId ? (
            <Link to={`/admin/users/${item.profileId}`} className="truncate font-medium text-foreground hover:underline">
              {item.firstName ?? item.profileId}
            </Link>
          ) : (
            <p className="truncate font-medium text-foreground">{item.firstName ?? 'Member'}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">
            {DOCUMENT_LABEL[item.documentType]} · {formatSubmitted(item.submittedAt)}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {/* Document thumbnail */}
      {images.length > 0 ? (
        <button
          type="button"
          onClick={() => onView(images, 0)}
          className="group relative mt-3 aspect-[16/10] overflow-hidden rounded-lg border border-border bg-muted"
          aria-label="View document image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={`${item.firstName ?? 'Member'} document`}
            className="size-full object-contain transition-transform group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 text-background opacity-0 transition-opacity group-hover:bg-foreground/40 group-hover:opacity-100">
            <Icon name="eye" size={20} />
          </span>
        </button>
      ) : (
        <div className="mt-3 flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-muted-foreground">
          No document image
        </div>
      )}

      {item.status === 'REJECTED' && item.reviewNote && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span className="font-medium">Reason:</span> {item.reviewNote}
        </p>
      )}

      {item.status === 'PENDING' ? (
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={onReject} disabled={busy} className="flex-1 gap-1.5">
            <Icon name="x" size={16} />
            Reject
          </Button>
          <Button size="sm" onClick={onApprove} loading={busy} className="flex-1 gap-1.5">
            <Icon name="check" size={16} />
            Approve
          </Button>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="clock" size={14} />
          {item.status === 'APPROVED' ? 'Approved' : 'Rejected'} · {formatSubmitted(item.submittedAt)}
        </p>
      )}
    </div>
  )
}
