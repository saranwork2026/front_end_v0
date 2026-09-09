'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type {
  AdminEditableField,
  AdminPayment,
  AdminProfileEditRequestView,
  AdminSubscriptionView,
  MemberNote,
  PendingPhotoSummary,
  SubscriptionPlan,
  UserProfile,
} from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ProfileDetailSections } from '@/components/shared/profile-detail-sections'
import { buildProfileSections } from '@/components/admin/profile-review-sections'
import { ImageLightbox } from '@/components/profile/image-lightbox'
import { cn } from '@/lib/utils'
import { flattenProfileResponse } from '@/src/lib/adapters'
import { adminApi, plansApi } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/auth'

const FLAG_REASONS = [
  { value: 'SUSPICIOUS', label: 'Suspicious activity' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'DUPLICATE', label: 'Duplicate account' },
]

const DURATION_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '15', label: '15 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '0', label: 'Open-ended' },
]

const EDIT_FIELDS: { value: AdminEditableField; label: string }[] = [
  { value: 'FIRST_NAME', label: 'First name' },
  { value: 'LAST_NAME', label: 'Last name' },
  { value: 'MOBILE_NO', label: 'Mobile number' },
  { value: 'EMAIL', label: 'Email' },
]

interface AdminUserDetailViewProps {
  profileId: string
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Date + time, for the account "last login" line (—/Never when absent). */
function dateTime(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fullName(p: UserProfile): string {
  return [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || p.profileId
}

function limit(total: number | null, remaining: number | null): string {
  if (total == null) return '—'
  if (total === -1) return 'Unlimited'
  return `${remaining ?? 0} / ${total}`
}

export function AdminUserDetailView({ profileId }: AdminUserDetailViewProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<AdminSubscriptionView | null>(null)
  const [notes, setNotes] = useState<MemberNote[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [photos, setPhotos] = useState<PendingPhotoSummary[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Destructive purge is approver-only (backend enforces this too).
  const role = useAuthStore((s) => s.role)
  const canPurge = role === 'ADMIN_APPROVER'

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [modal, setModal] = useState<
    | null
    | { kind: 'block' }
    | { kind: 'flag' }
    | { kind: 'subscription' }
    | { kind: 'cancel-subscription' }
    | { kind: 'refund'; payment: AdminPayment }
    | { kind: 'edit' }
    | { kind: 'view-as' }
    | { kind: 'boost' }
    | { kind: 'feature' }
    | { kind: 'purge' }
  >(null)
  const [busy, setBusy] = useState(false)

  // Local UI mirrors of the toggle-able account states (subscription/notes/
  // payments come from their own fetches; block/flag/feature/boost are raised
  // requests or immediate mutations that we reflect optimistically).
  const [blocked, setBlocked] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [boosted, setBoosted] = useState(false)

  const pushToast = useCallback(
    (message: string, variant: ToastItem['variant'] = 'success') => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setToasts((t) => [...t, { id, message, variant }])
    },
    [],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    const [profileRes, subRes, notesRes, paymentsRes, photosRes] = await Promise.allSettled([
      adminApi.getUserProfile(profileId),
      adminApi.getCustomerSubscription(profileId),
      adminApi.getMemberNotes(profileId),
      adminApi.getMemberPayments(profileId),
      adminApi.getProfilePhotosForReview(profileId),
    ])

    if (profileRes.status === 'fulfilled') {
      // The backend returns a nested/sectioned profile; flatten it so the
      // detail sections (Religious/Career/Location/…) render, not just gender.
      const flat = flattenProfileResponse(profileRes.value.data as unknown as Record<string, unknown>)
      setProfile(flat)
      setBlocked(flat.status === 'REJECTED')
    } else {
      setNotFound(true)
    }
    setSubscription(subRes.status === 'fulfilled' ? subRes.value.data : null)
    setNotes(notesRes.status === 'fulfilled' ? notesRes.value.data ?? [] : [])
    setPayments(paymentsRes.status === 'fulfilled' ? paymentsRes.value.data ?? [] : [])
    setPhotos(photosRes.status === 'fulfilled' ? photosRes.value.data ?? [] : [])
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    void load()
  }, [load])

  async function confirmBlock() {
    if (!profile) return
    setBusy(true)
    try {
      if (blocked) {
        await adminApi.unblockUser(profile.profileId)
        setBlocked(false)
        pushToast(`${fullName(profile)} unblocked.`, 'success')
      } else {
        await adminApi.requestUserBlock(profile.profileId)
        pushToast(`Block request raised for ${fullName(profile)}.`, 'info')
      }
      setModal(null)
    } catch {
      pushToast('Could not update member status. Try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Flag with a reason + optional notes (from the flag dialog).
  async function confirmFlag(reason: string, notes: string) {
    if (!profile) return
    setBusy(true)
    try {
      if (flagged) {
        await adminApi.unflagUser(profile.profileId)
        setFlagged(false)
        pushToast('Flag removed.', 'success')
      } else {
        await adminApi.flagUser(profile.profileId, reason, notes.trim() || undefined)
        setFlagged(true)
        pushToast('Member flagged.', 'success')
      }
      setModal(null)
    } catch {
      pushToast('Could not update the flag. Try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Feature: "off" is an immediate un-feature; "on" opens a duration dialog.
  function onFeatureToggle() {
    if (!profile) return
    if (featured) {
      void adminApi
        .unfeatureProfile(profile.profileId)
        .then(() => {
          setFeatured(false)
          pushToast('Featured flag removed.', 'success')
        })
        .catch(() => pushToast('Could not update featured flag.', 'error'))
    } else {
      setModal({ kind: 'feature' })
    }
  }

  async function confirmFeature(days: number) {
    if (!profile) return
    setBusy(true)
    try {
      await adminApi.featureProfile(profile.profileId, days > 0 ? days : undefined)
      setFeatured(true)
      pushToast(days > 0 ? `Member featured for ${days} days.` : 'Member featured (open-ended).', 'success')
      setModal(null)
    } catch {
      pushToast('Could not feature this member.', 'error')
    } finally {
      setBusy(false)
    }
  }

  function onBoostToggle() {
    if (!profile) return
    if (boosted) {
      void adminApi
        .unboostProfile(profile.profileId)
        .then(() => {
          setBoosted(false)
          pushToast('Boost removed.', 'success')
        })
        .catch(() => pushToast('Could not update boost.', 'error'))
    } else {
      setModal({ kind: 'boost' })
    }
  }

  async function confirmBoost(days: number) {
    if (!profile) return
    setBusy(true)
    try {
      await adminApi.boostProfile(profile.profileId, days > 0 ? days : undefined)
      setBoosted(true)
      pushToast(days > 0 ? `Profile boosted for ${days} days.` : 'Profile boosted (open-ended).', 'success')
      setModal(null)
    } catch {
      pushToast('Could not boost this profile.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleExport() {
    if (!profile) return
    try {
      const res = await adminApi.exportUserData(profile.profileId)
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `member-data-${profile.profileId}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      pushToast('Member data exported.', 'success')
    } catch {
      pushToast('Could not export member data.', 'error')
    }
  }

  async function confirmPurge() {
    if (!profile) return
    setBusy(true)
    try {
      await adminApi.purgeUser(profile.profileId)
      pushToast('Member permanently deleted.', 'success')
      setModal(null)
      // Send the admin back to the list via SPA navigation (no full reload, so
      // the in-memory admin session is preserved). This member no longer exists.
      navigate('/admin/users', { replace: true })
    } catch (err) {
      const code =
        (err as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode
      pushToast(
        code === 'CANNOT_DELETE_SELF'
          ? 'You cannot delete your own admin account.'
          : 'Could not delete this member.',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="space-y-6">
        <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Icon name="arrow-left" size={16} />
          Members
        </Link>
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
          <p className="text-sm text-destructive">We could not load this member.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
            <Link
              to="/admin/users"
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Back to members
            </Link>
          </div>
        </div>
        <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/users" className="flex items-center gap-1 hover:text-foreground">
          <Icon name="arrow-left" size={16} />
          Members
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-mono text-foreground">{profile.profileId}</span>
      </div>

      {/* Identity header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-xl font-semibold text-muted-foreground">
            {profile.firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-foreground">{fullName(profile)}</h1>
              {profile.verified && <Icon name="circle-check" size={18} className="text-primary" />}
            </div>
            <p className="font-mono text-sm text-muted-foreground">{profile.profileId}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={profile.status} />
              <Badge variant="neutral">{profile.profileCompletionPct}% complete</Badge>
              {blocked && <Badge variant="danger">Blocked</Badge>}
              {flagged && <Badge variant="danger">Flagged</Badge>}
              {featured && <Badge variant="gold">Featured</Badge>}
              {boosted && <Badge variant="gold">Boosted</Badge>}
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <Icon name="clock" size={14} className="text-muted-foreground" />
                <dt className="text-muted-foreground">Joined</dt>
                <dd className="font-medium text-foreground">{shortDate(profile.createdAt)}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="bell" size={14} className="text-muted-foreground" />
                <dt className="text-muted-foreground">Last login</dt>
                <dd className="font-medium text-foreground">{dateTime(profile.lastLoginAt, 'Never')}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={blocked ? 'secondary' : 'danger'}
            size="sm"
            onClick={() => setModal({ kind: 'block' })}
          >
            {blocked ? 'Unblock' : 'Block'}
          </Button>
          <Link
            to={`/admin/users/${profile.profileId}/assisted-profile`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
          >
            <Icon name="edit" size={16} />
            Assisted profile
          </Link>
          <OverflowMenu
            items={[
              { label: 'Edit details (OTP)', icon: 'edit', onSelect: () => setModal({ kind: 'edit' }) },
              { label: 'View as member', icon: 'eye', onSelect: () => setModal({ kind: 'view-as' }) },
              { label: flagged ? 'Unflag member' : 'Flag member', icon: 'flag', onSelect: () => setModal({ kind: 'flag' }) },
              { label: featured ? 'Remove featured' : 'Feature member', icon: 'star', onSelect: onFeatureToggle },
              { label: boosted ? 'Remove boost' : 'Boost profile', icon: 'sparkles', onSelect: onBoostToggle },
              { label: 'Export member data', icon: 'download', onSelect: handleExport },
              ...(canPurge
                ? [{ label: 'Delete member', icon: 'trash' as const, onSelect: () => setModal({ kind: 'purge' }), danger: true }]
                : []),
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Profile detail sections */}
          <Section title="Profile">
            <ProfileDetailSections columns={2} sections={buildProfileSections(profile)} />
            {profile.aboutMe && (
              <div className="mt-4">
                <dt className="text-xs text-muted-foreground">About</dt>
                <dd className="mt-1 text-sm leading-relaxed text-foreground text-pretty">{profile.aboutMe}</dd>
              </div>
            )}
          </Section>

          {/* Member photos (all statuses, admin view) */}
          <Section title="Photos">
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">This member has no photos.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {photos.map((photo, i) => (
                  <button
                    key={photo.photoId}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="relative h-28 w-28 overflow-hidden rounded-xl border border-border bg-muted transition-opacity hover:opacity-90"
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img
                      src={photo.photoUrl}
                      alt={`Member photo ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* Notes */}
          <NotesSection
            profileId={profile.profileId}
            notes={notes}
            onChange={setNotes}
            pushToast={pushToast}
          />

          {/* Payments */}
          <PaymentsSection payments={payments} onRefund={(payment) => setModal({ kind: 'refund', payment })} />
        </div>

        {/* Right rail: subscription */}
        <div className="space-y-6">
          <SubscriptionSection
            subscription={subscription}
            onAssign={() => setModal({ kind: 'subscription' })}
            onCancel={() => setModal({ kind: 'cancel-subscription' })}
          />
        </div>
      </div>

      {/* Block / Unblock */}
      <Dialog
        open={modal?.kind === 'block'}
        onClose={() => (busy ? null : setModal(null))}
        title={blocked ? 'Unblock member' : 'Block member'}
        description={
          blocked
            ? `${fullName(profile)} will regain access to their account.`
            : `This raises a block request for approver sign-off.`
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant={blocked ? 'primary' : 'danger'} loading={busy} onClick={confirmBlock}>
              Confirm
            </Button>
          </>
        }
      />

      {/* Flag / Unflag (with reason + notes when flagging) */}
      <FlagDialog
        open={modal?.kind === 'flag'}
        flagged={flagged}
        busy={busy}
        onClose={() => (busy ? undefined : setModal(null))}
        onConfirm={confirmFlag}
      />

      {/* Assign / change subscription */}
      <SubscriptionDialog
        open={modal?.kind === 'subscription'}
        profileId={profile.profileId}
        onClose={() => setModal(null)}
        onDone={(msg, variant) => {
          pushToast(msg, variant)
          if (variant !== 'error') setModal(null)
        }}
      />

      {/* Cancel subscription */}
      <CancelSubscriptionDialog
        open={modal?.kind === 'cancel-subscription'}
        profileId={profile.profileId}
        onClose={() => setModal(null)}
        onDone={(msg, variant) => {
          pushToast(msg, variant)
          if (variant !== 'error') setModal(null)
        }}
      />

      {/* Refund */}
      <RefundDialog
        open={modal?.kind === 'refund'}
        payment={modal?.kind === 'refund' ? modal.payment : null}
        onClose={() => setModal(null)}
        onDone={(msg, variant, paymentId) => {
          pushToast(msg, variant)
          if (variant !== 'error' && paymentId != null) {
            setPayments((prev) =>
              prev.map((p) =>
                p.paymentId === paymentId ? { ...p, refundable: false, status: 'REFUNDED' } : p,
              ),
            )
            setModal(null)
          }
        }}
      />

      {/* OTP-confirmed profile edit (name / mobile / email) */}
      <EditDetailsDialog
        open={modal?.kind === 'edit'}
        profileId={profile.profileId}
        onClose={() => setModal(null)}
        onDone={(msg, variant) => {
          pushToast(msg, variant)
          if (variant === 'success') {
            setModal(null)
            void load()
          }
        }}
      />

      {/* View as member (read-only snapshot) */}
      <ViewAsMemberDialog
        open={modal?.kind === 'view-as'}
        profileId={profile.profileId}
        onClose={() => setModal(null)}
        onError={(msg) => pushToast(msg, 'error')}
      />

      {/* Boost duration */}
      <DurationDialog
        open={modal?.kind === 'boost'}
        title="Boost profile"
        description="Nudge this profile higher in search results for a period."
        actionLabel="Boost"
        busy={busy}
        onClose={() => (busy ? undefined : setModal(null))}
        onConfirm={confirmBoost}
      />

      {/* Feature duration */}
      <DurationDialog
        open={modal?.kind === 'feature'}
        title="Feature member"
        description="Place this profile in the curated spotlight list for a period."
        actionLabel="Feature"
        busy={busy}
        onClose={() => (busy ? undefined : setModal(null))}
        onConfirm={confirmFeature}
      />

      {/* Purge (approver-only, irreversible) */}
      <Dialog
        open={modal?.kind === 'purge'}
        onClose={() => (busy ? undefined : setModal(null))}
        title="Delete member permanently"
        description={`This permanently erases ${fullName(profile)} (${profile.profileId}) and all their data. This cannot be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={confirmPurge}>
              Delete permanently
            </Button>
          </>
        }
      />

      {/* Photo lightbox */}
      <ImageLightbox
        images={photos.map((p) => p.photoUrl)}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        alt={`${fullName(profile)} photo`}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-serif text-lg font-bold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function OverflowMenu({
  items,
}: {
  items: { label: string; icon: Parameters<typeof Icon>[0]['name']; onSelect: () => void; danger?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-label="More actions" aria-expanded={open}>
        <Icon name="more-vertical" size={16} />
        <span className="hidden sm:inline">More</span>
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl animate-in fade-in zoom-in-95"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary',
                item.danger ? 'text-destructive' : 'text-foreground',
              )}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SubscriptionSection({
  subscription,
  onAssign,
  onCancel,
}: {
  subscription: AdminSubscriptionView | null
  onAssign: () => void
  onCancel: () => void
}) {
  const active = subscription?.hasActiveSubscription
  return (
    <Section title="Subscription">
      {active && subscription ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{subscription.planName ?? 'Active plan'}</p>
              {subscription.price != null && (
                <p className="text-sm text-muted-foreground">{INR.format(subscription.price)}</p>
              )}
            </div>
            <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {subscription.status ?? 'ACTIVE'}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
            <Meta label="Started" value={shortDate(subscription.startDate)} />
            <Meta label="Expires" value={shortDate(subscription.expiryDate)} />
            <Meta label="Contact views" value={limit(subscription.totalContactLimit, subscription.remainingContactViews)} />
            <Meta label="Messages" value={limit(subscription.totalMessageLimit, subscription.remainingMessages)} />
            <Meta label="Interests" value={limit(subscription.totalInterestLimit, subscription.remainingInterests)} />
            <Meta label="Photo views" value={limit(subscription.totalPhotoLimit, subscription.remainingPhotoViews)} />
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onAssign}>
              <Icon name="wallet" size={16} />
              Assign / change
            </Button>
            <Button variant="danger" size="sm" onClick={onCancel}>
              Cancel plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">This member has no active subscription.</p>
          <Button variant="secondary" size="sm" onClick={onAssign}>
            <Icon name="wallet" size={16} />
            Assign subscription
          </Button>
        </div>
      )}
    </Section>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}

function NotesSection({
  profileId,
  notes,
  onChange,
  pushToast,
}: {
  profileId: string
  notes: MemberNote[]
  onChange: (next: MemberNote[]) => void
  pushToast: (message: string, variant?: ToastItem['variant']) => void
}) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  async function add() {
    if (draft.trim().length === 0) return
    setBusy(true)
    try {
      const res = await adminApi.addMemberNote(profileId, draft.trim())
      onChange([res.data, ...notes])
      setDraft('')
      pushToast('Note added.', 'success')
    } catch {
      pushToast('Could not save the note.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(noteId: number) {
    try {
      await adminApi.deleteMemberNote(noteId)
      onChange(notes.filter((n) => n.id !== noteId))
      pushToast('Note deleted.', 'success')
    } catch {
      pushToast('Could not delete the note.', 'error')
    }
  }

  return (
    <Section title="Member notes">
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an internal note (visible to staff only)…"
          rows={2}
          className="min-h-11 flex-1 resize-y rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Button size="sm" className="shrink-0" loading={busy} disabled={draft.trim().length === 0} onClick={add}>
          Add note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {n.authorName ?? n.authorAdminId} · {shortDate(n.createdAt)}
                  </div>
                  <p className="mt-1 text-sm text-foreground text-pretty">{n.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  aria-label="Delete note"
                  className="-m-1 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function PaymentsSection({
  payments,
  onRefund,
}: {
  payments: AdminPayment[]
  onRefund: (payment: AdminPayment) => void
}) {
  return (
    <Section title="Payments">
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded.</p>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li
              key={p.paymentId}
              className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {INR.format(p.amount)}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {p.planName ?? p.referenceType ?? 'Payment'}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.paymentMethod ?? '—'} · {shortDate(p.createdAt)}
                  {p.refundedAt ? ` · refunded ${shortDate(p.refundedAt)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={p.status} />
                {p.refundable && (
                  <Button variant="ghost" size="sm" onClick={() => onRefund(p)}>
                    <Icon name="refresh" size={16} />
                    Refund
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function SubscriptionDialog({
  open,
  profileId,
  onClose,
  onDone,
}: {
  open: boolean
  profileId: string
  onClose: () => void
  onDone: (message: string, variant: ToastItem['variant']) => void
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [planId, setPlanId] = useState('')
  const [mode, setMode] = useState<'EXTEND' | 'REPLACE'>('EXTEND')
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setRemarks('')
    plansApi
      .getActivePlans()
      .then((res) => {
        setPlans(res.data ?? [])
        if (res.data?.length) setPlanId(String(res.data[0].planId))
      })
      .catch(() => {
        /* non-fatal — the Select just stays empty */
      })
  }, [open])

  async function submit() {
    if (!planId) {
      onDone('Select a plan first.', 'error')
      return
    }
    setBusy(true)
    try {
      await adminApi.requestSubscriptionAssignment(profileId, Number(planId), mode, remarks.trim() || undefined)
      onDone('Subscription assignment request raised for approver sign-off.', 'success')
    } catch {
      onDone('Could not raise the subscription request.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (busy ? null : onClose())}
      title="Assign / change subscription"
      description="Raise a request for a plan assignment. An approver signs it off."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            Raise request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">Select a plan</option>
          {plans.map((p) => (
            <option key={p.planId} value={p.planId}>
              {p.name} · {INR.format(p.price)}
            </option>
          ))}
        </Select>
        <Select label="Mode" value={mode} onChange={(e) => setMode(e.target.value as 'EXTEND' | 'REPLACE')}>
          <option value="EXTEND">Extend existing</option>
          <option value="REPLACE">Replace existing</option>
        </Select>
        <div>
          <label htmlFor="sub-remarks" className="mb-1.5 block text-sm font-medium text-foreground">
            Remarks (optional)
          </label>
          <textarea
            id="sub-remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
            rows={2}
            className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
      </div>
    </Dialog>
  )
}

function CancelSubscriptionDialog({
  open,
  profileId,
  onClose,
  onDone,
}: {
  open: boolean
  profileId: string
  onClose: () => void
  onDone: (message: string, variant: ToastItem['variant']) => void
}) {
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setRemarks('')
  }, [open])

  async function submit() {
    setBusy(true)
    try {
      await adminApi.requestSubscriptionCancellation(profileId, remarks.trim() || undefined)
      onDone('Subscription cancellation request raised for approver sign-off.', 'success')
    } catch {
      onDone('Could not raise the cancellation request.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (busy ? null : onClose())}
      title="Cancel subscription"
      description="Raise a request to cancel this member's active subscription. An approver signs it off."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={submit}>
            Raise cancellation
          </Button>
        </>
      }
    >
      <div>
        <label htmlFor="cancel-remarks" className="mb-1.5 block text-sm font-medium text-foreground">
          Remarks (optional)
        </label>
        <textarea
          id="cancel-remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
          rows={2}
          className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
    </Dialog>
  )
}

function RefundDialog({
  open,
  payment,
  onClose,
  onDone,
}: {
  open: boolean
  payment: AdminPayment | null
  onClose: () => void
  onDone: (message: string, variant: ToastItem['variant'], paymentId: number | null) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setError('')
    }
  }, [open])

  async function submit() {
    if (reason.trim().length === 0) {
      setError('A refund reason is required.')
      return
    }
    if (!payment) return
    setBusy(true)
    try {
      await adminApi.refundPayment(payment.paymentId, reason.trim())
      onDone(`Refund of ${INR.format(payment.amount)} issued.`, 'success', payment.paymentId)
    } catch {
      onDone('Could not process the refund.', 'error', null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (busy ? null : onClose())}
      title="Issue refund"
      description={payment ? `Refund ${INR.format(payment.amount)} for payment #${payment.paymentId}.` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={submit}>
            Issue refund
          </Button>
        </>
      }
    >
      <div>
        <label htmlFor="refund-reason" className="mb-1.5 block text-sm font-medium text-foreground">
          Refund reason
        </label>
        <textarea
          id="refund-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value.slice(0, 500))
            if (error) setError('')
          }}
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {error && (
          <p role="alert" className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}

/* --------------------------- Flag dialog --------------------------- */

function FlagDialog({
  open,
  flagged,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean
  flagged: boolean
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string, notes: string) => void
}) {
  const [reason, setReason] = useState(FLAG_REASONS[0].value)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setReason(FLAG_REASONS[0].value)
      setNotes('')
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={flagged ? 'Unflag member' : 'Flag member'}
      description={
        flagged
          ? 'Remove the moderation flag from this member.'
          : 'Flag this member for moderator follow-up. They will appear in the flagged queue.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={() => onConfirm(reason, notes)}>
            {flagged ? 'Remove flag' : 'Flag member'}
          </Button>
        </>
      }
    >
      {!flagged && (
        <div className="space-y-4">
          <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {FLAG_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <div>
            <label htmlFor="flag-notes" className="mb-1.5 block text-sm font-medium text-foreground">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="flag-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Context for other moderators…"
              className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>
      )}
    </Dialog>
  )
}

/* --------------------------- Duration dialog (boost / feature) --------------------------- */

function DurationDialog({
  open,
  title,
  description,
  actionLabel,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  actionLabel: string
  busy: boolean
  onClose: () => void
  onConfirm: (days: number) => void
}) {
  const [days, setDays] = useState('7')

  useEffect(() => {
    if (open) setDays('7')
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={() => onConfirm(Number(days))}>
            {actionLabel}
          </Button>
        </>
      }
    >
      <Select label="Duration" value={days} onChange={(e) => setDays(e.target.value)}>
        {DURATION_OPTIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </Select>
    </Dialog>
  )
}

/* --------------------------- OTP-confirmed edit dialog --------------------------- */

function EditDetailsDialog({
  open,
  profileId,
  onClose,
  onDone,
}: {
  open: boolean
  profileId: string
  onClose: () => void
  onDone: (message: string, variant: ToastItem['variant']) => void
}) {
  const [step, setStep] = useState<'propose' | 'confirm'>('propose')
  const [field, setField] = useState<AdminEditableField>('MOBILE_NO')
  const [newValue, setNewValue] = useState('')
  const [request, setRequest] = useState<AdminProfileEditRequestView | null>(null)
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (open) {
      setStep('propose')
      setField('MOBILE_NO')
      setNewValue('')
      setRequest(null)
      setOtp('')
    }
  }, [open])

  async function propose() {
    if (!newValue.trim()) return
    setBusy(true)
    try {
      const res = await adminApi.proposeProfileEdit(profileId, field, newValue.trim())
      setRequest(res.data)
      setStep('confirm')
    } catch {
      onDone('Could not start the edit. Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!request || !otp.trim()) return
    setBusy(true)
    try {
      await adminApi.confirmProfileEdit(request.id, otp.trim())
      onDone('Change confirmed with OTP.', 'success')
    } catch {
      onDone('The OTP could not be confirmed. Please check and retry.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    if (!request) return
    setResending(true)
    try {
      await adminApi.resendProfileEditOtp(request.id)
      onDone('A new OTP has been sent.', 'info')
    } catch {
      onDone('Could not resend the OTP.', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (busy ? undefined : onClose())}
      title="Edit member details"
      description={
        step === 'propose'
          ? 'Changing a name, mobile, or email requires an OTP sent to the member.'
          : `Enter the OTP sent to ${request?.otpDestination ?? 'the member'}.`
      }
      footer={
        step === 'propose' ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button loading={busy} disabled={!newValue.trim()} onClick={propose}>
              Send OTP
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button loading={busy} disabled={otp.trim().length === 0} onClick={confirm}>
              Confirm change
            </Button>
          </>
        )
      }
    >
      {step === 'propose' ? (
        <div className="space-y-4">
          <Select label="Field" value={field} onChange={(e) => setField(e.target.value as AdminEditableField)}>
            {EDIT_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
          <Input
            label="New value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter the new value"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            label="OTP"
            value={otp}
            inputMode="numeric"
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
          />
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
          >
            {resending ? 'Resending…' : 'Resend OTP'}
          </button>
        </div>
      )}
    </Dialog>
  )
}

/* --------------------------- View-as-member dialog --------------------------- */

function ViewAsMemberDialog({
  open,
  profileId,
  onClose,
  onError,
}: {
  open: boolean
  profileId: string
  onClose: () => void
  onError: (message: string) => void
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    setProfile(null)
    setLoading(true)
    adminApi
      .viewAsMember(profileId)
      .then((res) => {
        if (active) setProfile(flattenProfileResponse(res.data as unknown as Record<string, unknown>))
      })
      .catch(() => {
        if (active) {
          onError('Could not load the member view.')
          onClose()
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileId])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="View as member"
      description="An audited, read-only snapshot of how this member sees their own profile."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading || !profile ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="font-serif text-lg font-bold text-foreground">{fullName(profile)}</p>
            <p className="font-mono text-sm text-muted-foreground">{profile.profileId}</p>
          </div>
          <ProfileDetailSections columns={2} sections={buildProfileSections(profile)} />
          {profile.aboutMe && (
            <div>
              <p className="text-xs text-muted-foreground">About</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground text-pretty">{profile.aboutMe}</p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
