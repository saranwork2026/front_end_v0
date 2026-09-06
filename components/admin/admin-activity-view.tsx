'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminActivity } from '@matrimony/shared-core'

import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/src/lib/api'

const WINDOW_OPTIONS: { value: string; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

function eventLabel(eventType: string): string {
  return eventType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function AdminActivityView(_props: { initialState?: string }) {
  const [days, setDays] = useState('30')
  const [data, setData] = useState<AdminActivity | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.getAdminActivity(Number(days))
      setData(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    void load()
  }, [load])

  const admins = data?.admins ?? []
  const maxTotal = admins.reduce((m, r) => Math.max(m, r.totalActions), 0) || 1

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Admin activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Action counts per administrator. Tap a row to see the breakdown.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 sm:w-48">
          <span className="text-xs font-medium text-muted-foreground">Window</span>
          <Select value={days} onChange={(e) => setDays(e.target.value)}>
            {WINDOW_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </Select>
        </label>
      </header>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-6 text-center" role="alert">
          <Icon name="alert-circle" className="mx-auto mb-2 text-destructive" size={24} />
          <p className="text-sm font-medium text-foreground">Could not load activity</p>
          <Button variant="secondary" className="mt-4" onClick={() => void load()}>
            Retry
          </Button>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <EmptyState
          icon="user"
          title="No activity recorded"
          description="No administrator actions were logged in this window."
        />
      ) : (
        <div className="space-y-3">
          {admins.map((r, idx) => {
            const open = expanded === r.adminId
            return (
              <Card key={r.adminId} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : r.adminId)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                  aria-expanded={open}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium text-foreground">
                      {r.adminName ?? r.adminId}
                    </span>
                    {/* Total bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(r.totalActions / maxTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-right">
                      <span className="block text-lg font-semibold text-foreground tabular-nums">
                        {r.totalActions}
                      </span>
                      <span className="block text-xs text-muted-foreground">actions</span>
                    </span>
                    <Icon
                      name="chevron-down"
                      size={18}
                      className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border bg-muted/20 px-4 py-4">
                    {r.byEvent.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No event breakdown available.</p>
                    ) : (
                      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {r.byEvent.map((b) => (
                          <div
                            key={b.eventType}
                            className="flex items-center gap-3 rounded-lg bg-background px-3 py-2"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon name="layers" size={16} />
                            </span>
                            <div className="flex-1">
                              <dt className="text-xs text-muted-foreground">{eventLabel(b.eventType)}</dt>
                              <dd className="text-sm font-semibold text-foreground tabular-nums">{b.count}</dd>
                            </div>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
