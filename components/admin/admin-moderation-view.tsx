'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type {
  ModerationRequestRecord,
  PendingPaymentSummary,
  PendingPhotoSummary,
  PendingProfileSummary,
  UserProfile,
} from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ImageLightbox } from '@/components/profile/image-lightbox'
import { ProfileDetailSections } from '@/components/shared/profile-detail-sections'
import { cn } from '@/lib/utils'
import { adminApi } from '@/src/lib/api'
import { flattenProfileResponse } from '@/src/lib/adapters'
import { useAuthStore } from '@/src/stores/auth'
import { buildProfileSections } from '@/components/admin/profile-review-sections'

/** Reviewer ('ADMIN' = ADMIN_REQUESTER) raises requests; Approver signs off. */
type AdminRole = 'ADMIN' | 'ADMIN_APPROVER'

/** Reviewer tabs — order matches the reference: Photos, Profiles, Payments. */
type ReviewerTab = 'PHOTOS' | 'PROFILES' | 'PAYMENTS'

const REVIEWER_TABS: { id: ReviewerTab; label: string }[] = [
  { id: 'PHOTOS', label: 'Photos' },
  { id: 'PROFILES', label: 'Profiles' },
  { id: 'PAYMENTS', label: 'Payments' },
]

const PROFILE_PAGE_SIZE = 10
const PHOTO_PAGE_SIZE = 12
const REQUEST_PAGE_SIZE = 10

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function methodLabel(method: PendingPaymentSummary['paymentMethod']): string {
  if (method === 'CASH') return 'Cash'
  if (method === 'UPI') return 'UPI'
  return 'Online'
}

const ACTION_LABELS: Record<ModerationRequestRecord['action'], string> = {
  APPROVE_PROFILE: 'Approve profile',
  REJECT_PROFILE: 'Reject profile',
  BLOCK_USER: 'Block member',
  APPROVE_PHOTO: 'Approve photo',
  REJECT_PHOTO: 'Reject photo',
  VERIFY_PAYMENT: 'Verify payment',
  REJECT_PAYMENT: 'Reject payment',
  ASSIGN_SUBSCRIPTION: 'Assign subscription',
  APPLY_PROFILE_EDIT: 'Apply profile edit',
  APPLY_ASSISTED_PROFILE: 'Apply assisted profile',
  APPROVE_AD_BANNER: 'Approve vendor ad',
  REJECT_AD_BANNER: 'Reject vendor ad',
}

/** What kind of detail a request's action needs shown in the approver modal. */
function detailKind(
  action: ModerationRequestRecord['action'],
): 'photo' | 'profile' | 'payment' | null {
  switch (action) {
    case 'APPROVE_PHOTO':
    case 'REJECT_PHOTO':
      return 'photo'
    case 'APPROVE_PROFILE':
    case 'REJECT_PROFILE':
    case 'APPLY_PROFILE_EDIT':
    case 'APPLY_ASSISTED_PROFILE':
      return 'profile'
    case 'VERIFY_PAYMENT':
    case 'REJECT_PAYMENT':
      return 'payment'
    default:
      return null
  }
}

function targetLabel(item: ModerationRequestRecord): string {
  const name = [item.targetFirstName, item.targetLastName].filter(Boolean).join(' ').trim()
  if (name && item.targetProfileId) return `${name} (${item.targetProfileId})`
  if (item.targetProfileId) return item.targetProfileId
  if (name) return name
  return item.targetUserId
}

function requesterLabel(item: ModerationRequestRecord): string {
  if (item.requestedByName && item.requestedByProfileId) {
    return `${item.requestedByName} (${item.requestedByProfileId})`
  }
  return item.requestedByName || item.requestedByProfileId || item.requestedBy
}

interface AdminModerationViewProps {
  initialRole?: AdminRole
  initialState?: 'ready' | 'loading' | 'empty'
}

export function AdminModerationView({
  initialRole,
  initialState = 'ready',
}: AdminModerationViewProps) {
  const sessionRole = useAuthStore((s) => s.role)
  // Default to the tab that matches the signed-in admin's role: approvers
  // land on the approval queue, reviewers on the review tabs.
  const defaultRole: AdminRole =
    initialRole ?? (sessionRole === 'ADMIN_APPROVER' ? 'ADMIN_APPROVER' : 'ADMIN')
  const [role, setRole] = useState<AdminRole>(defaultRole)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const isApprover = role === 'ADMIN_APPROVER'

  const pushToast = useCallback(
    (message: string, variant: ToastItem['variant'] = 'success') => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setToasts((t) => [...t, { id, message, variant }])
    },
    [],
  )

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Moderation</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {isApprover
              ? 'Execute the approve/reject requests raised by reviewers.'
              : 'Review submissions and raise approve/reject requests for an approver to sign off.'}
          </p>
        </div>

        {/* Demo-only role toggle (real app derives this from the session). */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
          {(['ADMIN', 'ADMIN_APPROVER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                role === r
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r === 'ADMIN' ? 'Reviewer' : 'Approver'}
            </button>
          ))}
        </div>
      </header>

      {isApprover ? (
        <ApproverQueue initialState={initialState} pushToast={pushToast} />
      ) : (
        <ReviewerPanel initialState={initialState} pushToast={pushToast} />
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Reviewer (ADMIN_REQUESTER) — raise approve/reject requests                 */
/* -------------------------------------------------------------------------- */

type ReviewTarget =
  | { kind: 'profile'; item: PendingProfileSummary }
  | { kind: 'photo'; item: PendingPhotoSummary }
  | { kind: 'payment'; item: PendingPaymentSummary }

function ReviewerPanel({
  initialState,
  pushToast,
}: {
  initialState: 'ready' | 'loading' | 'empty'
  pushToast: (message: string, variant?: ToastItem['variant']) => void
}) {
  const [tab, setTab] = useState<ReviewerTab>('PHOTOS')
  const [page, setPage] = useState(0)

  const [profiles, setProfiles] = useState<PendingProfileSummary[]>([])
  const [photos, setPhotos] = useState<PendingPhotoSummary[]>([])
  const [payments, setPayments] = useState<PendingPaymentSummary[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [target, setTarget] = useState<ReviewTarget | null>(null)

  const load = useCallback(async () => {
    if (initialState === 'empty') {
      setProfiles([])
      setPhotos([])
      setPayments([])
      setTotalPages(0)
      setLoading(false)
      setError(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      if (tab === 'PROFILES') {
        const res = await adminApi.getPendingProfiles({ page, size: PROFILE_PAGE_SIZE })
        setProfiles(res.data.content ?? [])
        setTotalPages(res.data.totalPages ?? 0)
      } else if (tab === 'PHOTOS') {
        const res = await adminApi.getPendingPhotos({ page, size: PHOTO_PAGE_SIZE })
        setPhotos(res.data.content ?? [])
        setTotalPages(res.data.totalPages ?? 0)
      } else {
        const res = await adminApi.getPendingPayments()
        setPayments(res.data ?? [])
        setTotalPages(0) // not paginated on the backend
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tab, page, initialState])

  useEffect(() => {
    void load()
  }, [load])

  function switchTab(next: ReviewerTab) {
    setTab(next)
    setPage(0)
  }

  function onRaised(t: ReviewTarget) {
    // Optimistically drop the item from its list; the toast/refetch confirm.
    if (t.kind === 'profile') {
      setProfiles((prev) => prev.filter((p) => p.profileId !== t.item.profileId))
    } else if (t.kind === 'photo') {
      setPhotos((prev) => prev.filter((p) => p.photoId !== t.item.photoId))
    } else {
      setPayments((prev) => prev.filter((p) => p.paymentId !== t.item.paymentId))
    }
    setTarget(null)
  }

  const isEmpty =
    tab === 'PROFILES'
      ? profiles.length === 0
      : tab === 'PHOTOS'
        ? photos.length === 0
        : payments.length === 0

  return (
    <>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Moderation type"
        className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
      >
        {REVIEWER_TABS.map((t) => {
          const selected = t.id === tab
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => switchTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                selected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        {loading ? (
          <QueueSkeleton grid={tab === 'PHOTOS'} />
        ) : error ? (
          <QueueError onRetry={() => void load()} />
        ) : isEmpty ? (
          <EmptyState
            icon={tab === 'PHOTOS' ? 'photo' : tab === 'PAYMENTS' ? 'wallet' : 'check'}
            title="Nothing to review"
            description={`No pending ${REVIEWER_TABS.find((t) => t.id === tab)!.label.toLowerCase()} are waiting for moderation right now.`}
          />
        ) : tab === 'PHOTOS' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo) => (
                <article
                  key={photo.photoId}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="relative aspect-square w-full bg-secondary">
                    {photo.photoUrl ? (
                      <img
                        src={photo.photoUrl || '/placeholder.svg'}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Icon name="photo" size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-foreground">{photo.profileId}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Uploaded {shortDate(photo.uploadedAt)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-auto w-full"
                      onClick={() => setTarget({ kind: 'photo', item: photo })}
                    >
                      <Icon name="eye" size={16} />
                      Review
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        ) : tab === 'PROFILES' ? (
          <>
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div
                  key={profile.profileId}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {profile.firstName} {profile.lastName}{' '}
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        ({profile.profileId})
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {profile.gender ?? '—'} · {profile.age ?? '—'} yrs · {profile.currentCity ?? '—'}
                      {profile.religion ? ` · ${profile.religion}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {profile.profileCompletionPct ?? 0}% complete · submitted {shortDate(profile.submittedAt)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setTarget({ kind: 'profile', item: profile })}
                  >
                    <Icon name="eye" size={16} />
                    Review
                  </Button>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.paymentId}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {[payment.firstName, payment.lastName].filter(Boolean).join(' ') || 'Member'}{' '}
                    <span className="font-mono text-xs font-normal text-muted-foreground">
                      ({payment.profileId ?? '—'})
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">
                    <span className="font-semibold">{INR.format(payment.amount)}</span>{' '}
                    <span className="text-muted-foreground">
                      · {payment.planName ?? 'Contact unlock'} · {methodLabel(payment.paymentMethod)}
                    </span>
                  </p>
                  {payment.referenceNote && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Note: {payment.referenceNote}</p>
                  )}
                  {payment.screenshotUrl && (
                    <p className="mt-0.5 text-xs text-primary">Screenshot attached</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Submitted {shortDate(payment.submittedAt)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setTarget({ kind: 'payment', item: payment })}
                >
                  <Icon name="eye" size={16} />
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {target && (
        <ReviewDialog
          target={target}
          onClose={() => setTarget(null)}
          onDone={(msg, variant, raised) => {
            pushToast(msg, variant)
            if (raised) onRaised(target)
          }}
        />
      )}
    </>
  )
}

function ReviewDialog({
  target,
  onClose,
  onDone,
}: {
  target: ReviewTarget
  onClose: () => void
  onDone: (message: string, variant: ToastItem['variant'], raised: boolean) => void
}) {
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profilePhotos, setProfilePhotos] = useState<PendingPhotoSummary[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

  useEffect(() => {
    if (target.kind !== 'profile') return
    let active = true
    setProfileLoading(true)
    adminApi
      .getProfileForReview(target.item.profileId)
      .then((res) => {
        // The backend returns a nested/sectioned profile; flatten it so all
        // detail sections render (not just age). Same pattern as
        // admin-user-detail-view.tsx.
        if (active) setProfile(flattenProfileResponse(res.data as unknown as Record<string, unknown>))
      })
      .catch(() => {
        /* surfaced below via the empty profile state */
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })
    adminApi
      .getProfilePhotosForReview(target.item.profileId)
      .then((res) => {
        if (active) setProfilePhotos(res.data ?? [])
      })
      .catch(() => {
        /* non-fatal: profile review still works without photos */
      })
    return () => {
      active = false
    }
  }, [target])

  async function submit(decision: 'approve' | 'reject') {
    setBusy(decision)
    try {
      const remark = remarks.trim() || undefined
      if (target.kind === 'profile') {
        if (decision === 'approve') await adminApi.requestProfileApproval(target.item.profileId, remark)
        else await adminApi.requestProfileRejection(target.item.profileId, remark)
      } else if (target.kind === 'photo') {
        if (decision === 'approve') await adminApi.requestPhotoApproval(target.item.photoId, remark)
        else await adminApi.requestPhotoRejection(target.item.photoId, remark)
      } else {
        if (decision === 'approve') await adminApi.requestPaymentVerification(target.item.paymentId, remark)
        else await adminApi.requestPaymentRejection(target.item.paymentId, remark)
      }
      onDone(
        decision === 'approve'
          ? 'Approval request raised for approver sign-off.'
          : 'Rejection request raised for approver sign-off.',
        'success',
        true,
      )
    } catch {
      onDone('Could not raise the request. Please try again.', 'error', false)
    } finally {
      setBusy(null)
    }
  }

  const title =
    target.kind === 'profile'
      ? 'Review profile'
      : target.kind === 'photo'
        ? 'Review photo'
        : 'Review payment'

  const description =
    target.kind === 'profile'
      ? `${target.item.firstName} ${target.item.lastName} · ${target.item.profileId}`
      : target.kind === 'payment'
        ? `${target.item.profileId ?? 'Member'} · submitted ${shortDate(target.item.submittedAt)}`
        : `${target.item.profileId} · uploaded ${shortDate(target.item.uploadedAt)}`

  const photoUrls = profilePhotos.map((p) => p.photoUrl).filter(Boolean)

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title={title}
        description={description}
        className="max-w-3xl"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={busy !== null}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => submit('reject')}
              loading={busy === 'reject'}
              disabled={busy !== null}
              className="w-full sm:w-auto sm:min-w-32"
            >
              <Icon name="x" size={16} />
              Raise reject
            </Button>
            <Button
              variant="success"
              onClick={() => submit('approve')}
              loading={busy === 'approve'}
              disabled={busy !== null}
              className="w-full sm:w-auto sm:min-w-32"
            >
              <Icon name="check" size={16} />
              Raise approve
            </Button>
          </div>
        }
      >
        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {target.kind === 'profile' &&
            (profileLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : profile ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    {photoUrls.length > 0 ? `Photos (${photoUrls.length})` : 'Photos'}
                  </p>
                  {photoUrls.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {photoUrls.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          onClick={() => setLightbox({ images: photoUrls, index: i })}
                          className="relative size-24 overflow-hidden rounded-lg border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                          aria-label={`View photo ${i + 1}`}
                        >
                          <img src={src} alt="" className="h-full w-full object-cover object-top" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No photos uploaded.</p>
                  )}
                </div>
                <ProfileDetailSections columns={3} sections={buildProfileSections(profile)} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load this profile.</p>
            ))}

          {target.kind === 'photo' && (
            <button
              type="button"
              onClick={() => setLightbox({ images: [target.item.photoUrl], index: 0 })}
              className="block w-full overflow-hidden rounded-xl border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label="View photo full screen"
            >
              <img
                src={target.item.photoUrl || '/placeholder.svg'}
                alt="Photo under review"
                className="max-h-80 w-full object-contain bg-secondary"
              />
            </button>
          )}

          {target.kind === 'payment' && (
            <div className="space-y-4">
              <ProfileDetailSections
                columns={2}
                sections={[
                  {
                    title: 'Payment details',
                    icon: 'wallet',
                    fields: [
                      { label: 'Amount', value: INR.format(target.item.amount) },
                      { label: 'Plan', value: target.item.planName ?? 'Contact unlock' },
                      { label: 'Method', value: methodLabel(target.item.paymentMethod) },
                      { label: 'Reference', value: target.item.referenceNote ?? '—', mono: true },
                    ],
                  },
                ]}
              />
              {target.item.screenshotUrl && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">Payment screenshot</p>
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({ images: [target.item.screenshotUrl as string], index: 0 })
                    }
                    className="block w-full overflow-hidden rounded-xl border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    aria-label="View payment screenshot full screen"
                  >
                    <img
                      src={target.item.screenshotUrl}
                      alt="Payment proof"
                      className="max-h-80 w-full object-contain bg-secondary"
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label htmlFor="mod-remark" className="mb-1.5 block text-sm font-medium text-foreground">
              Remarks (optional, shared with the approver)
            </label>
            <textarea
              id="mod-remark"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Add context for this decision…"
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{remarks.length}/500</p>
          </div>
        </div>
      </Dialog>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          open
          alt="Content under review"
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((v) => (v ? { ...v, index } : v))}
        />
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Approver (ADMIN_APPROVER) — execute the raised requests                    */
/* -------------------------------------------------------------------------- */

function ApproverQueue({
  initialState,
  pushToast,
}: {
  initialState: 'ready' | 'loading' | 'empty'
  pushToast: (message: string, variant?: ToastItem['variant']) => void
}) {
  const [items, setItems] = useState<ModerationRequestRecord[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [detail, setDetail] = useState<ModerationRequestRecord | null>(null)

  const load = useCallback(async () => {
    if (initialState === 'empty') {
      setItems([])
      setTotalPages(0)
      setLoading(false)
      setError(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.getPendingModerationRequests({
        page,
        size: REQUEST_PAGE_SIZE,
        search: search || undefined,
      })
      setItems(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, search, initialState])

  useEffect(() => {
    void load()
  }, [load])

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(0)
    }, 400)
    return () => clearTimeout(id)
  }, [searchInput])

  async function decide(requestId: number, decision: 'approve' | 'reject') {
    setActionId(requestId)
    try {
      if (decision === 'approve') await adminApi.approveModerationRequest(requestId)
      else await adminApi.rejectModerationRequest(requestId)
      setItems((prev) => prev.filter((i) => i.id !== requestId))
      setDetail(null)
      pushToast(
        decision === 'approve'
          ? 'Request approved — the member has been notified.'
          : 'Request rejected.',
        'success',
      )
    } catch {
      pushToast('Could not record the decision. Please retry.', 'error')
    } finally {
      setActionId(null)
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${items.length} request${items.length === 1 ? '' : 's'} on this page`}
        </p>
        <div className="w-full sm:w-72">
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by member"
            aria-label="Search requests by member"
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <QueueSkeleton grid={false} />
        ) : error ? (
          <QueueError onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="check"
            title={search ? 'No matching requests' : 'Nothing to approve'}
            description={
              search
                ? 'No pending requests match this member.'
                : 'There are no pending moderation requests right now.'
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => {
                const kind = detailKind(item.action)
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{ACTION_LABELS[item.action]}</p>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Target: {targetLabel(item)}
                        {item.targetPhotoId != null && ` · Photo #${item.targetPhotoId}`}
                        {item.targetPaymentId != null && ` · Payment #${item.targetPaymentId}`}
                        {item.targetPlanId != null &&
                          ` · Plan #${item.targetPlanId} (${item.planAssignMode ?? 'EXTEND'})`}
                        {' · '}Requested by {requesterLabel(item)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{shortDate(item.createdAt)}</p>
                      {item.remarks && (
                        <p className="mt-1 text-xs text-muted-foreground">Remarks: {item.remarks}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {kind && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDetail(item)}
                          disabled={actionId !== null}
                        >
                          <Icon name="eye" size={16} />
                          Details
                        </Button>
                      )}
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => decide(item.id, 'approve')}
                        loading={actionId === item.id}
                        disabled={actionId !== null}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => decide(item.id, 'reject')}
                        loading={actionId === item.id}
                        disabled={actionId !== null}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {detail && (
        <ApproverDetailDialog
          item={detail}
          busy={actionId !== null}
          onClose={() => setDetail(null)}
          onApprove={() => decide(detail.id, 'approve')}
          onReject={() => decide(detail.id, 'reject')}
        />
      )}
    </>
  )
}

function ApproverDetailDialog({
  item,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  item: ModerationRequestRecord
  busy: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const kind = detailKind(item.action)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [photos, setPhotos] = useState<PendingPhotoSummary[]>([])
  const [payment, setPayment] = useState<PendingPaymentSummary | null>(null)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

  useEffect(() => {
    if (!kind) return
    let active = true
    setLoading(true)
    if (kind === 'profile' && item.targetProfileId) {
      adminApi
        .getProfileForReview(item.targetProfileId)
        .then(
          (res) =>
            active &&
            setProfile(flattenProfileResponse(res.data as unknown as Record<string, unknown>)),
        )
        .catch(() => {})
        .finally(() => active && setLoading(false))
    } else if (kind === 'photo' && item.targetProfileId) {
      adminApi
        .getProfilePhotosForReview(item.targetProfileId)
        .then((res) => active && setPhotos(res.data ?? []))
        .catch(() => {})
        .finally(() => active && setLoading(false))
    } else if (kind === 'payment') {
      adminApi
        .getPendingPayments()
        .then((res) => {
          if (active) setPayment(res.data.find((p) => p.paymentId === item.targetPaymentId) ?? null)
        })
        .catch(() => {})
        .finally(() => active && setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      active = false
    }
  }, [item, kind])

  const photoUrls = photos.map((p) => p.photoUrl).filter(Boolean)

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title={ACTION_LABELS[item.action]}
        description={`Target: ${targetLabel(item)}`}
        className="max-w-3xl"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              variant="danger"
              onClick={onReject}
              disabled={busy}
              className="w-full sm:w-auto sm:min-w-28"
            >
              Reject
            </Button>
            <Button variant="success" onClick={onApprove} disabled={busy} className="w-full sm:w-auto sm:min-w-28">
              Approve
            </Button>
          </div>
        }
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : kind === 'profile' ? (
            profile ? (
              <ProfileDetailSections columns={3} sections={buildProfileSections(profile)} />
            ) : (
              <p className="text-sm text-muted-foreground">Could not load the profile.</p>
            )
          ) : kind === 'photo' ? (
            photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((photo, i) => {
                  const isTarget = item.targetPhotoId != null && photo.photoId === item.targetPhotoId
                  return (
                    <button
                      key={photo.photoId}
                      type="button"
                      onClick={() =>
                        photo.photoUrl && setLightbox({ images: photoUrls, index: photoUrls.indexOf(photo.photoUrl) })
                      }
                      disabled={!photo.photoUrl}
                      className={cn(
                        'block aspect-square overflow-hidden rounded-md border bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                        isTarget ? 'border-primary ring-2 ring-primary' : 'border-border',
                      )}
                      aria-label={`Photo ${photo.photoId}${isTarget ? ' (under review)' : ''}`}
                    >
                      <img
                        src={photo.photoUrl ?? undefined}
                        alt=""
                        className="h-full w-full object-cover object-top"
                      />
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No photos to show.</p>
            )
          ) : kind === 'payment' ? (
            payment ? (
              <div className="space-y-4">
                <ProfileDetailSections
                  columns={2}
                  sections={[
                    {
                      title: 'Payment details',
                      icon: 'wallet',
                      fields: [
                        { label: 'Amount', value: INR.format(payment.amount) },
                        { label: 'Plan', value: payment.planName ?? 'Contact unlock' },
                        { label: 'Method', value: methodLabel(payment.paymentMethod) },
                        { label: 'Reference', value: payment.referenceNote ?? '—', mono: true },
                      ],
                    },
                  ]}
                />
                {payment.screenshotUrl && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-foreground">Payment screenshot</p>
                    <img
                      src={payment.screenshotUrl}
                      alt="Payment proof"
                      className="max-h-80 w-full rounded-xl border border-border bg-secondary object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Payment details are no longer available.</p>
            )
          ) : null}

          {item.remarks && (
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reviewer remark
              </p>
              <p className="mt-1 text-sm text-foreground text-pretty">{item.remarks}</p>
            </div>
          )}
        </div>
      </Dialog>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          open
          alt="Photo under review"
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((v) => (v ? { ...v, index } : v))}
        />
      )}
    </>
  )
}

/* --------------------------------- shared --------------------------------- */

function QueueSkeleton({ grid }: { grid: boolean }) {
  if (grid) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  )
}

function QueueError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
      <p className="text-sm text-destructive">We could not load the moderation queue. Please try again.</p>
      <div className="mt-4 flex justify-center">
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  )
}
