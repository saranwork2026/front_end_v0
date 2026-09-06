'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SuccessStory, SuccessStoryStatus } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { adminApi } from '@/src/lib/api'

const PAGE_SIZE = 50

interface AdminSuccessStoriesViewProps {
  initialState?: 'ready' | 'loading' | 'error'
  /** Approver role unlocks the delete action (spec: delete approver-only). */
  isApprover?: boolean
}

const TABS: { status: SuccessStoryStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
]

const statusBadge: Record<SuccessStoryStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Pending review', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
}

function formatStoryDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AdminSuccessStoriesView({ isApprover = false }: AdminSuccessStoriesViewProps) {
  const [tab, setTab] = useState<SuccessStoryStatus>('PENDING')
  const [stories, setStories] = useState<SuccessStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const [rejecting, setRejecting] = useState<SuccessStory | null>(null)
  const [deleting, setDeleting] = useState<SuccessStory | null>(null)

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.getSuccessStories(tab, 0, PAGE_SIZE)
      setStories(res.data.content ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    void load()
  }, [load])

  async function approve(story: SuccessStory) {
    setBusyId(story.id)
    try {
      await adminApi.approveSuccessStory(story.id)
      pushToast(`Approved ${story.brideName} & ${story.groomName}'s story.`, 'success')
      setStories((prev) => prev.filter((s) => s.id !== story.id))
    } catch {
      pushToast('Action failed. Please try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function reject(story: SuccessStory) {
    setBusyId(story.id)
    try {
      await adminApi.rejectSuccessStory(story.id)
      pushToast('Story rejected and the member notified.', 'success')
      setStories((prev) => prev.filter((s) => s.id !== story.id))
      setRejecting(null)
    } catch {
      pushToast('Action failed. Please try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(story: SuccessStory) {
    setBusyId(story.id)
    try {
      await adminApi.deleteSuccessStory(story.id)
      pushToast('Story permanently removed.', 'success')
      setStories((prev) => prev.filter((s) => s.id !== story.id))
      setDeleting(null)
    } catch {
      pushToast('Action failed. Please try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground text-balance">Success stories</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Review member-submitted wedding stories before they appear on the public success-stories page.
        </p>
      </header>

      {/* Tabs */}
      <div role="tablist" aria-label="Story status" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tItem) => {
          const active = tab === tItem.status
          return (
            <button
              key={tItem.status}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tItem.status)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {tItem.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-6"
        >
          <div className="flex items-center gap-2 text-destructive">
            <Icon name="alert-circle" size={20} />
            <p className="font-medium">Couldn&apos;t load success stories</p>
          </div>
          <Button variant="secondary" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Retry
          </Button>
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon="heart"
          title={`No ${statusBadge[tab].label.toLowerCase()} stories`}
          description={
            tab === 'PENDING'
              ? 'New submissions from members will appear here for review.'
              : 'Stories you act on will move into this tab.'
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => {
            const badge = statusBadge[story.status]
            const busy = busyId === story.id
            return (
              <article
                key={story.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="relative aspect-[4/3] w-full bg-muted">
                  {story.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.photoUrl}
                      alt={`${story.brideName} and ${story.groomName} wedding photo`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Icon name="heart" size={28} />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-serif text-lg font-semibold text-foreground text-balance">
                    {story.brideName} &amp; {story.groomName}
                  </h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="heart" size={13} />
                      Married {formatStoryDate(story.marriageDate)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Filed {formatStoryDate(story.submittedAt)}</span>
                  </p>

                  {story.partnerProfileId && (
                    <Link
                      to={`/admin/users/${story.partnerProfileId}`}
                      className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Icon name="user" size={13} />
                      {story.partnerProfileId}
                    </Link>
                  )}

                  <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90 text-pretty">
                    {story.story}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {story.status !== 'APPROVED' && (
                      <Button size="sm" variant="primary" loading={busy} onClick={() => approve(story)}>
                        <Icon name="check" size={15} />
                        Approve
                      </Button>
                    )}
                    {story.status === 'PENDING' && (
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => setRejecting(story)}>
                        <Icon name="x" size={15} />
                        Reject
                      </Button>
                    )}
                    {isApprover && (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() => setDeleting(story)}
                        className="ml-auto"
                      >
                        <Icon name="trash" size={15} />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Reject confirm */}
      <Dialog
        open={rejecting !== null}
        onClose={() => (busyId ? null : setRejecting(null))}
        title="Reject this story"
        description={
          rejecting
            ? `${rejecting.brideName} & ${rejecting.groomName}'s story will be rejected and the member notified.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejecting(null)} disabled={busyId === rejecting?.id}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busyId === rejecting?.id}
            onClick={() => rejecting && reject(rejecting)}
          >
            Reject story
          </Button>
        </div>
      </Dialog>

      {/* Delete confirm — approver only */}
      <Dialog
        open={deleting !== null}
        onClose={() => (busyId ? null : setDeleting(null))}
        title="Delete this story?"
        description={
          deleting
            ? `${deleting.brideName} & ${deleting.groomName}'s story will be permanently removed. This cannot be undone.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)} disabled={busyId === deleting?.id}>
            Cancel
          </Button>
          <Button variant="danger" loading={busyId === deleting?.id} onClick={() => deleting && remove(deleting)}>
            <Icon name="trash" size={16} />
            Delete permanently
          </Button>
        </div>
      </Dialog>

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
