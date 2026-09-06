'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FlaggedUser, PaginatedResponse } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { adminApi } from '@/src/lib/api'

const PAGE_SIZE = 8

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OTP_PENDING', label: 'OTP pending' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DEACTIVATED', label: 'Deactivated' },
]

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All roles' },
  { value: 'USER', label: 'Customer' },
  { value: 'ADMIN_REQUESTER', label: 'Reviewer' },
  { value: 'ADMIN_APPROVER', label: 'Approver' },
]

const ROLE_LABEL: Record<string, string> = {
  USER: 'Customer',
  ADMIN_REQUESTER: 'Reviewer',
  ADMIN_APPROVER: 'Approver',
}

function fullName(u: FlaggedUser): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.profileId
}

interface AdminUsersViewProps {
  state?: 'ready' | 'loading' | 'empty'
}

export function AdminUsersView(_props: AdminUsersViewProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [role, setRole] = useState('ALL')
  const [page, setPage] = useState(0)

  const [users, setUsers] = useState<FlaggedUser[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [blockTarget, setBlockTarget] = useState<FlaggedUser | null>(null)
  const [blockBusy, setBlockBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.listUsers({
        page,
        size: PAGE_SIZE,
        status: status === 'ALL' ? undefined : status,
        role: role === 'ALL' ? undefined : role,
        search: search || undefined,
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
  }, [page, status, role, search])

  useEffect(() => {
    void load()
  }, [load])

  // Debounce the search box: apply 400ms after the user stops typing.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(0)
    }, 400)
    return () => clearTimeout(id)
  }, [searchInput])

  async function confirmBlock() {
    if (!blockTarget) return
    const isBlocked = blockTarget.userStatus === 'BLOCKED'
    setBlockBusy(true)
    try {
      if (isBlocked) {
        await adminApi.unblockUser(blockTarget.profileId)
        pushToast(`${fullName(blockTarget)} unblocked.`, 'success')
      } else {
        await adminApi.requestUserBlock(blockTarget.profileId)
        pushToast(`Block request raised for ${fullName(blockTarget)}.`, 'info')
      }
      setBlockTarget(null)
      void load()
    } catch {
      pushToast('Could not update member status. Try again.', 'error')
    } finally {
      setBlockBusy(false)
    }
  }

  if (loading && users.length === 0 && !error) {
    return (
      <div className="space-y-6">
        <HeaderRow onCreate={() => {}} disabled />
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <HeaderRow onCreate={() => setCreateOpen(true)} />

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
        <Input
          type="search"
          placeholder="Search name, ID, mobile, email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search members"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(0)
          }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(0)
          }}
          aria-label="Filter by role"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center"
        >
          <p className="text-sm text-destructive">We could not load members. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="users"
          title="No members match"
          description="Try clearing the search or changing the status and role filters."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {totalElements} member{totalElements === 1 ? '' : 's'} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-[28%] px-4 py-3 font-semibold">Member</th>
                    <th className="w-[24%] px-4 py-3 font-semibold">Contact</th>
                    <th className="w-[13%] px-4 py-3 font-semibold">Role</th>
                    <th className="w-[11%] px-4 py-3 font-semibold">Status</th>
                    <th className="w-[10%] px-4 py-3 font-semibold">Flag</th>
                    <th className="w-[14%] px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.profileId} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName(u)} flagged={Boolean(u.flag)} />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/users/${u.profileId}`}
                              className="truncate font-medium text-foreground hover:text-primary"
                            >
                              {fullName(u)}
                            </Link>
                            <div className="font-mono text-xs text-muted-foreground">{u.profileId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        <div>{u.mobileNo || '—'}</div>
                        <div className="max-w-[180px] truncate text-xs">{u.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {u.role ? ROLE_LABEL[u.role] ?? u.role : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.userStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {u.flag ? <StatusBadge status={u.flag} /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/users/${u.profileId}`}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label={`View ${fullName(u)}`}
                          >
                            <Icon name="eye" size={18} />
                          </Link>
                          <Button
                            variant={u.userStatus === 'BLOCKED' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setBlockTarget(u)}
                          >
                            {u.userStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <ul className="space-y-3 md:hidden">
            {users.map((u) => (
              <li key={u.profileId} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={fullName(u)} flagged={Boolean(u.flag)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/admin/users/${u.profileId}`}
                        className="min-w-0 truncate font-medium text-foreground"
                      >
                        {fullName(u)}
                      </Link>
                      <StatusBadge status={u.userStatus} />
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{u.profileId}</div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <Meta label="Mobile" value={u.mobileNo || '—'} />
                      <Meta label="Email" value={u.email || '—'} />
                      <Meta label="Role" value={u.role ? ROLE_LABEL[u.role] ?? u.role : '—'} />
                      <Meta label="Flag" value={u.flag ?? '—'} />
                    </dl>
                    <div className="mt-3 flex gap-2">
                      <Link
                        to={`/admin/users/${u.profileId}`}
                        className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        View
                      </Link>
                      <Button
                        variant={u.userStatus === 'BLOCKED' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setBlockTarget(u)}
                      >
                        {u.userStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Block / Unblock confirm */}
      <Dialog
        open={blockTarget !== null}
        onClose={() => (blockBusy ? null : setBlockTarget(null))}
        title={blockTarget && blockTarget.userStatus === 'BLOCKED' ? 'Unblock member' : 'Block member'}
        description={
          blockTarget
            ? `${fullName(blockTarget)} (${blockTarget.profileId}). ${
                blockTarget.userStatus === 'BLOCKED'
                  ? 'They will regain access to their account.'
                  : 'This raises a block request for approver sign-off.'
              }`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlockTarget(null)} disabled={blockBusy}>
              Cancel
            </Button>
            <Button
              variant={blockTarget?.userStatus === 'BLOCKED' ? 'primary' : 'danger'}
              onClick={confirmBlock}
              loading={blockBusy}
            >
              Confirm
            </Button>
          </>
        }
      />

      {/* Create assisted member */}
      <CreateMemberDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          pushToast(msg, 'success')
          void load()
        }}
      />

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}

function HeaderRow({ onCreate, disabled }: { onCreate: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Members</h1>
        <p className="text-sm text-muted-foreground">Search, review, and manage member accounts.</p>
      </div>
      <Button onClick={onCreate} disabled={disabled} className="shrink-0">
        <Icon name="plus" size={18} />
        Create assisted member
      </Button>
    </div>
  )
}

function Avatar({ name, flagged }: { name: string; flagged?: boolean }) {
  return (
    <div className="relative shrink-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
        {name.charAt(0).toUpperCase()}
      </div>
      {flagged && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-card"
          title="Flagged"
        >
          <Icon name="flag" size={9} />
        </span>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{value}</dd>
    </div>
  )
}

function CreateMemberDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (msg: string) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ profileId: string; temporaryPassword: string } | null>(null)

  function reset() {
    setFirstName('')
    setLastName('')
    setMobileNo('')
    setEmail('')
    setErrors({})
    setResult(null)
    setBusy(false)
  }

  function close() {
    reset()
    onClose()
  }

  async function submit() {
    const next: Record<string, string> = {}
    if (!firstName.trim()) next.firstName = 'First name is required.'
    if (!lastName.trim()) next.lastName = 'Last name is required.'
    if (!/^[6-9]\d{9}$/.test(mobileNo)) next.mobileNo = 'Enter a valid 10-digit mobile starting 6-9.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    try {
      const res = await adminApi.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNo: mobileNo.trim(),
        email: email.trim() || undefined,
      })
      setResult({ profileId: res.data.profileId, temporaryPassword: res.data.temporaryPassword })
      onCreated(`Assisted member ${res.data.profileId} created.`)
    } catch {
      setErrors({ form: 'Could not create the member. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (busy ? null : close())}
      title={result ? 'Member created' : 'Create assisted member'}
      description={
        result
          ? 'Share these credentials with the walk-in member. The temporary password is shown only once.'
          : 'Register a walk-in member. They will verify and set a password on first login.'
      }
      footer={
        result ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} loading={busy}>
              Create member
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <CredRow label="Profile ID" value={result.profileId} />
          <CredRow label="Temporary password" value={result.temporaryPassword} />
        </div>
      ) : (
        <div className="space-y-4">
          {errors.form && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors.firstName}
              required
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              required
            />
          </div>
          <Input
            label="Mobile number"
            inputMode="numeric"
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
            error={errors.mobileNo}
            hint="10 digits, starts with 6-9."
            required
          />
          <Input
            label="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}
    </Dialog>
  )
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}
