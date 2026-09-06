'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PaginatedResponse, Report, ReportContext, ReportStatus } from '@matrimony/shared-core'

import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ImageLightbox } from '@/components/profile/image-lightbox'
import { cn } from '@/lib/utils'
import { adminApi } from '@/src/lib/api'

const PAGE_SIZE = 10

const STATUS_FILTERS: { value: ReportStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
]

const RESOLUTION_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'REVIEWED', label: 'Mark as reviewed' },
  { value: 'RESOLVED', label: 'Resolve report' },
  { value: 'DISMISSED', label: 'Dismiss report' },
]

function relativeTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function chatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function AdminReportsView(_props: { initialState?: 'ready' | 'loading' | 'empty' }) {
  const [status, setStatus] = useState<ReportStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)
  const [reports, setReports] = useState<Report[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [active, setActive] = useState<Report | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.getReports({
        page,
        size: PAGE_SIZE,
        status: status === 'ALL' ? undefined : status,
      })
      const data = res.data as PaginatedResponse<Report>
      setReports(data.content ?? [])
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-2xl text-foreground">User reports</h1>
        <p className="text-sm text-muted-foreground">
          Review member-submitted reports with profile and chat context, then record a resolution.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ReportStatus | 'ALL')
              setPage(0)
            }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${totalElements} report${totalElements === 1 ? '' : 's'}`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">We could not load reports. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon="flag"
          title="No reports here"
          description="There are no reports matching this filter right now."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-[10%] px-4 py-3 font-medium">ID</th>
                  <th className="w-[20%] px-4 py-3 font-medium">Reported</th>
                  <th className="w-[20%] px-4 py-3 font-medium">Reason</th>
                  <th className="w-[18%] px-4 py-3 font-medium">Reporter</th>
                  <th className="w-[13%] px-4 py-3 font-medium">Filed</th>
                  <th className="w-[10%] px-4 py-3 font-medium">Status</th>
                  <th className="w-[9%] px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.reportId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{r.reportId}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/users/${r.reportedProfileId}`}
                        className="truncate font-medium text-foreground hover:text-primary"
                      >
                        {r.reportedProfileId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{r.reason}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.reporterProfileId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{relativeTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setActive(r)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {reports.map((r) => (
              <li key={r.reportId} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.reportedProfileId}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.reason} · {relativeTime(r.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reported by {r.reporterProfileId}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => setActive(r)}>
                  Review report
                </Button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {active && (
        <ReportReviewDialog
          report={active}
          onClose={() => setActive(null)}
          onResolved={(msg, variant) => {
            pushToast(msg, variant)
            if (variant === 'success') {
              setActive(null)
              void load()
            }
          }}
        />
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}

function ReportReviewDialog({
  report,
  onClose,
  onResolved,
}: {
  report: Report
  onClose: () => void
  onResolved: (message: string, variant: ToastItem['variant']) => void
}) {
  const [resolution, setResolution] = useState<ReportStatus>('REVIEWED')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [context, setContext] = useState<ReportContext | null>(null)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

  const requiresNotes = resolution === 'RESOLVED' || resolution === 'DISMISSED'

  useEffect(() => {
    let active = true
    // Offending content inline (photos + recent chat) — non-fatal.
    adminApi
      .getReportContext(report.reportId)
      .then((res) => {
        if (active) setContext(res.data)
      })
      .catch(() => {
        /* non-fatal: review still works without inline content */
      })
    return () => {
      active = false
    }
  }, [report.reportId])

  async function submit() {
    if (requiresNotes && notes.trim().length === 0) {
      setError('Please add a note explaining this resolution.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await adminApi.reviewReport(report.reportId, resolution, notes.trim() || undefined)
      onResolved('Report updated.', 'success')
    } catch {
      onResolved('Could not update the report.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const reportedName = context
    ? [context.reportedFirstName, context.reportedLastName].filter(Boolean).join(' ').trim()
    : ''
  const photos = (context?.reportedPhotos ?? []).filter((p) => p.photoUrl)

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title={`Review report · #${report.reportId}`}
        className="h-full max-h-none w-full max-w-none rounded-none sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl"
      >
        <div className="space-y-6">
          {/* Report summary */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Icon name="flag" className="h-4 w-4 text-destructive" />
              {report.reason}
            </div>
            {report.description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{report.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Filed by{' '}
              <Link
                to={`/admin/users/${report.reporterProfileId}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {context?.reporterFirstName ?? report.reporterProfileId}
              </Link>{' '}
              · {relativeTime(report.createdAt)}
            </p>
          </div>

          {/* Reported member */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg text-foreground">Reported member</h3>
              <Link
                to={`/admin/users/${report.reportedProfileId}`}
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                Open profile
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-foreground">
                {reportedName || report.reportedProfileId}{' '}
                <span className="font-normal text-muted-foreground">({report.reportedProfileId})</span>
              </p>
              {(context?.reportedMobileNo || context?.reportedEmail) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {context?.reportedMobileNo}
                  {context?.reportedEmail ? ` · ${context.reportedEmail}` : ''}
                </p>
              )}
            </div>

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((photo, i) => (
                  <button
                    key={photo.photoId}
                    type="button"
                    onClick={() =>
                      setLightbox({ images: photos.map((p) => p.photoUrl), index: i })
                    }
                    className="block aspect-square overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    aria-label={`View reported photo ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.photoUrl}
                      alt={`Reported photo ${i + 1}`}
                      className="h-full w-full object-cover transition-opacity hover:opacity-90"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Chat context */}
          {context && context.recentChat.length > 0 && (
            <section>
              <h3 className="mb-3 font-serif text-lg text-foreground">Recent chat context</h3>
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                {context.recentChat.map((line, i) => (
                  <div key={i} className={cn('flex', line.fromReportedUser ? 'justify-start' : 'justify-end')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                        line.fromReportedUser
                          ? 'rounded-tl-sm bg-card text-foreground'
                          : 'rounded-tr-sm bg-primary text-primary-foreground',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{line.content}</p>
                      <p
                        className={cn(
                          'mt-1 text-[10px]',
                          line.fromReportedUser ? 'text-muted-foreground' : 'text-primary-foreground/70',
                        )}
                      >
                        {line.fromReportedUser ? 'Reported' : 'Reporter'} · {chatTime(line.sentAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resolution */}
          <section className="space-y-3">
            <h3 className="font-serif text-lg text-foreground">Resolution</h3>
            <Select
              aria-label="Resolution status"
              value={resolution}
              onChange={(e) => setResolution(e.target.value as ReportStatus)}
            >
              {RESOLUTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <div>
              <label htmlFor="report-notes" className="mb-1 block text-sm font-medium text-foreground">
                Notes {requiresNotes && <span className="text-destructive">*</span>}
              </label>
              <textarea
                id="report-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Record what you found and the action taken…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{notes.length}/500</p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </section>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Save resolution
          </Button>
        </div>
      </Dialog>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          open
          alt="Reported photo"
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((v) => (v ? { ...v, index } : v))}
        />
      )}
    </>
  )
}
