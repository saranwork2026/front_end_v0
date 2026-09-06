'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminSession } from '@matrimony/shared-core'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { adminApi } from '@/src/lib/api'

type AdminRole = 'ADMIN' | 'ADMIN_APPROVER'

function displayName(s: AdminSession): string {
  return s.adminName ?? s.profileId
}

function roleLabel(role: string): string {
  if (role === 'ADMIN_APPROVER') return 'Approver'
  if (role === 'ADMIN_REQUESTER') return 'Reviewer'
  return role.replace('ADMIN_', '')
}

function lastLogin(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AdminSessionsView(_props: { initialState?: string; role?: AdminRole }) {
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [target, setTarget] = useState<AdminSession | null>(null)
  const [busy, setBusy] = useState(false)

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.getAdminSessions()
      setSessions(res.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function confirmForceLogout() {
    if (!target) return
    setBusy(true)
    try {
      await adminApi.forceLogout(target.profileId)
      pushToast(`Ended ${displayName(target)}'s session.`, 'success')
      setTarget(null)
      void load()
    } catch {
      pushToast('Could not end the session. Try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const liveCount = sessions.filter((s) => s.hasActiveSession).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Admin sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrator accounts, their last login, and whether they hold a live session. Ending a
          session revokes the refresh token.
        </p>
      </header>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-6 text-center" role="alert">
          <Icon name="alert-circle" className="mx-auto mb-2 text-destructive" size={24} />
          <p className="text-sm font-medium text-foreground">Could not load sessions</p>
          <Button variant="secondary" className="mt-4" onClick={() => void load()}>
            Retry
          </Button>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState icon="shield" title="No admins" description="No admin accounts found." />
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Administrator accounts · {liveCount} live
          </h2>

          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-[34%] px-4 py-3 font-medium">Administrator</th>
                  <th className="w-[16%] px-4 py-3 font-medium">Role</th>
                  <th className="w-[22%] px-4 py-3 font-medium">Last login</th>
                  <th className="w-[12%] px-4 py-3 font-medium">Session</th>
                  <th className="w-[16%] px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.profileId} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(displayName(s))}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{displayName(s)}</div>
                          <div className="font-mono text-xs text-muted-foreground">{s.profileId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.role === 'ADMIN_APPROVER' ? 'success' : 'neutral'}>
                        {roleLabel(s.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lastLogin(s.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      {s.hasActiveSession ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                          <span className="h-2 w-2 rounded-full bg-success" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setTarget(s)}
                        disabled={!s.hasActiveSession}
                        title={!s.hasActiveSession ? 'No active session' : undefined}
                      >
                        End session
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {sessions.map((s) => (
              <Card key={s.profileId} className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(displayName(s))}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{displayName(s)}</div>
                      <div className="font-mono text-xs text-muted-foreground">{s.profileId}</div>
                    </div>
                  </div>
                  <Badge variant={s.role === 'ADMIN_APPROVER' ? 'success' : 'neutral'}>
                    {roleLabel(s.role)}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Last login</dt>
                    <dd className="text-foreground">{lastLogin(s.lastLoginAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Session</dt>
                    <dd className="text-foreground">{s.hasActiveSession ? 'Active' : '—'}</dd>
                  </div>
                </dl>
                <Button
                  size="sm"
                  variant="danger"
                  className="mt-3 w-full"
                  onClick={() => setTarget(s)}
                  disabled={!s.hasActiveSession}
                >
                  End session
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Dialog
        open={Boolean(target)}
        onClose={() => (busy ? null : setTarget(null))}
        title="End this session?"
        description={
          target
            ? `${displayName(target)} will be signed out immediately and their refresh token revoked.`
            : undefined
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmForceLogout} loading={busy}>
            End session
          </Button>
        </div>
      </Dialog>

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
