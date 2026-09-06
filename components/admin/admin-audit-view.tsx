'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AuditLogEntry, PaginatedResponse } from '@matrimony/shared-core'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { adminApi } from '@/src/lib/api'

const PAGE_SIZE = 20

interface Filters {
  entityType: string
  eventType: string
  performedBy: string
  entityId: string
  from: string // yyyy-MM-dd
  to: string
}

const EMPTY_FILTERS: Filters = {
  entityType: '',
  eventType: '',
  performedBy: '',
  entityId: '',
  from: '',
  to: '',
}

const ENTITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All entities' },
  { value: 'USER', label: 'User' },
  { value: 'PROFILE', label: 'Profile' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'MODERATION_REQUEST', label: 'Moderation request' },
  { value: 'BROADCAST', label: 'Broadcast' },
  { value: 'SUCCESS_STORY', label: 'Success story' },
  { value: 'VERIFICATION', label: 'Verification' },
]

/** Convert a yyyy-MM-dd date to an ISO instant at day start/end. */
function toInstant(date: string, endOfDay = false): string | undefined {
  if (!date) return undefined
  return endOfDay ? `${date}T23:59:59Z` : `${date}T00:00:00Z`
}

function formatAuditTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusVariant(status: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!status) return 'neutral'
  const s = status.toUpperCase()
  if (['SUCCESS', 'APPROVED', 'APPLIED', 'COMPLETED'].includes(s)) return 'success'
  if (['PENDING', 'PENDING_APPROVAL', 'PENDING_OTP'].includes(s)) return 'warning'
  if (['FAILED', 'REJECTED', 'ERROR', 'CANCELLED'].includes(s)) return 'danger'
  return 'neutral'
}

export function AdminAuditView(_props: { initialState?: string }) {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.searchAuditLogs({
        page,
        size: PAGE_SIZE,
        entityType: applied.entityType || undefined,
        eventType: applied.eventType || undefined,
        performedBy: applied.performedBy || undefined,
        entityId: applied.entityId || undefined,
        from: toInstant(applied.from),
        to: toInstant(applied.to, true),
      })
      const data = res.data as PaginatedResponse<AuditLogEntry>
      setEntries(data.content ?? [])
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  useEffect(() => {
    void load()
  }, [load])

  function apply() {
    setPage(0)
    setApplied(draft)
  }

  function reset() {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(0)
  }

  const hasFilters =
    applied.entityType !== '' ||
    applied.eventType !== '' ||
    applied.performedBy !== '' ||
    applied.entityId !== '' ||
    applied.from !== '' ||
    applied.to !== ''

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every administrative action, searchable by entity, actor, event, and date.
        </p>
      </header>

      <Card className="mb-6 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Entity</span>
            <Select
              value={draft.entityType}
              onChange={(e) => setDraft((d) => ({ ...d, entityType: e.target.value }))}
            >
              {ENTITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </label>
          <Input
            label="Event type"
            placeholder="e.g. USER_BLOCKED"
            value={draft.eventType}
            onChange={(e) => setDraft((d) => ({ ...d, eventType: e.target.value }))}
          />
          <Input
            label="Performed by"
            placeholder="Admin ULID"
            value={draft.performedBy}
            onChange={(e) => setDraft((d) => ({ ...d, performedBy: e.target.value }))}
          />
          <Input
            label="Entity ID"
            placeholder="e.g. SM12"
            value={draft.entityId}
            onChange={(e) => setDraft((d) => ({ ...d, entityId: e.target.value }))}
          />
          <Input
            label="From date"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
          />
          <Input
            label="To date"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
          />
          <div className="flex items-end gap-2">
            <Button onClick={apply} className="flex-1">
              Apply filters
            </Button>
            <Button variant="ghost" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-6 text-center" role="alert">
          <Icon name="alert-circle" className="mx-auto mb-2 text-destructive" size={24} />
          <p className="text-sm font-medium text-foreground">Could not load the audit log</p>
          <p className="mt-1 text-sm text-muted-foreground">Please retry in a moment.</p>
          <Button variant="secondary" className="mt-4" onClick={() => void load()}>
            Retry
          </Button>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matching entries"
          description={
            hasFilters
              ? 'No audit entries match these filters. Try widening your search.'
              : 'There is no audit activity to show yet.'
          }
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {totalElements} {totalElements === 1 ? 'entry' : 'entries'}
          </p>

          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-[16%] px-4 py-3 font-medium">When</th>
                    <th className="w-[20%] px-4 py-3 font-medium">Entity</th>
                    <th className="w-[18%] px-4 py-3 font-medium">Event</th>
                    <th className="w-[10%] px-4 py-3 font-medium">Status</th>
                    <th className="w-[16%] px-4 py-3 font-medium">Performed by</th>
                    <th className="w-[20%] px-4 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-border align-top last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatAuditTime(e.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">
                        {e.entityType}{' '}
                        <span className="font-mono text-muted-foreground">#{e.entityId}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{e.eventType}</td>
                      <td className="px-4 py-3">
                        {e.status ? (
                          <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {e.performedBy ? e.performedBy.slice(0, 10) + '…' : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className="line-clamp-2" title={e.details ?? undefined}>
                          {e.details || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {entries.map((e) => (
              <Card key={e.id} className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-foreground">{e.eventType}</span>
                  {e.status ? (
                    <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{formatAuditTime(e.createdAt)}</p>
                {e.details && <p className="mt-2 text-sm text-foreground">{e.details}</p>}
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Entity</dt>
                    <dd className="text-foreground">{e.entityType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Entity ID</dt>
                    <dd className="font-mono text-foreground">{e.entityId}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Performed by</dt>
                    <dd className="font-mono text-foreground">{e.performedBy ?? '—'}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
