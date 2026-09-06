'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FlaggedUser, FlagReason, PaginatedResponse } from '@matrimony/shared-core'

import { Icon } from '@/components/ui/icon'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { adminApi } from '@/src/lib/api'

const PAGE_SIZE = 10

const REASON_OPTIONS: { value: FlagReason | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All reasons' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'SUSPICIOUS', label: 'Suspicious' },
]

function fullName(u: FlaggedUser): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.profileId
}

function flaggedDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function AdminFlaggedUsersView(_props: { state?: 'ready' | 'loading' | 'empty' }) {
  const [reason, setReason] = useState<FlagReason | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const [users, setUsers] = useState<FlaggedUser[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.listFlaggedUsers({
        page,
        size: PAGE_SIZE,
        reason: reason === 'ALL' ? undefined : reason,
      })
      const data = res.data as PaginatedResponse<FlaggedUser>
      setUsers(data.content ?? [])
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, reason])

  useEffect(() => {
    void load()
  }, [load])

  async function handleUnflag(u: FlaggedUser) {
    setBusyId(u.profileId)
    try {
      await adminApi.unflagUser(u.profileId)
      pushToast(`Flag cleared for ${fullName(u)}.`, 'success')
      setUsers((prev) => prev.filter((x) => x.profileId !== u.profileId))
    } catch {
      pushToast('Could not clear the flag. Try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleUnblock(u: FlaggedUser) {
    setBusyId(u.profileId)
    try {
      await adminApi.unblockUser(u.profileId)
      pushToast(`${fullName(u)} unblocked.`, 'success')
      void load()
    } catch {
      pushToast('Could not unblock the member. Try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-foreground">Flagged users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profiles flagged by members or automated checks. Clear a flag or unblock a member, or open
          the profile for the full member 360.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Select
            label="Filter by reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value as FlagReason | 'ALL')
              setPage(0)
            }}
          >
            {REASON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        {!loading && !error && (
          <p className="pb-2 text-sm text-muted-foreground" aria-live="polite">
            {totalElements} flagged {totalElements === 1 ? 'profile' : 'profiles'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">We could not load flagged users. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="flag"
          title="No flagged users"
          description="Nothing needs review under this filter right now."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-[24%] px-4 py-3 font-medium">Profile</th>
                  <th className="w-[13%] px-4 py-3 font-medium">Reason</th>
                  <th className="w-[24%] px-4 py-3 font-medium">Note</th>
                  <th className="w-[14%] px-4 py-3 font-medium">Flagged by</th>
                  <th className="w-[11%] px-4 py-3 font-medium">Flagged</th>
                  <th className="w-[14%] px-4 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.profileId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName(u)} />
                        <div className="min-w-0">
                          <Link
                            to={`/admin/users/${u.profileId}`}
                            className="truncate font-medium text-foreground hover:text-primary"
                          >
                            {fullName(u)}
                          </Link>
                          <p className="font-mono text-xs text-muted-foreground">{u.profileId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.flag ? <StatusBadge status={u.flag} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate text-muted-foreground" title={u.flagReason ?? ''}>
                        {u.flagReason || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {u.flaggedBy ? u.flaggedBy.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {flaggedDate(u.flaggedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={busyId === u.profileId}
                          onClick={() => handleUnflag(u)}
                        >
                          Clear flag
                        </Button>
                        {u.userStatus === 'BLOCKED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === u.profileId}
                            onClick={() => handleUnblock(u)}
                          >
                            Unblock
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <ul className="space-y-3 md:hidden">
            {users.map((u) => (
              <li key={u.profileId} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar name={fullName(u)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/admin/users/${u.profileId}`}
                        className="truncate font-medium text-foreground"
                      >
                        {fullName(u)}
                      </Link>
                      {u.flag && <StatusBadge status={u.flag} />}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{u.profileId}</p>
                  </div>
                </div>
                {u.flagReason && <p className="mt-3 text-sm text-muted-foreground">{u.flagReason}</p>}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{flaggedDate(u.flaggedAt)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busyId === u.profileId}
                      onClick={() => handleUnflag(u)}
                    >
                      Clear flag
                    </Button>
                    {u.userStatus === 'BLOCKED' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === u.profileId}
                        onClick={() => handleUnblock(u)}
                      >
                        Unblock
                      </Button>
                    ) : (
                      <Link
                        to={`/admin/users/${u.profileId}`}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
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

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
