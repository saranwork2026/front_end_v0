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
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ProfileDetailSections } from '@/components/shared/profile-detail-sections'
import { buildProfileSections } from '@/components/admin/profile-review-sections'
import { ImageLightbox } from '@/components/profile/image-lightbox'
import { cn } from '@/lib/utils'
import { flattenProfileResponse } from '@/src/lib/adapters'
import { adminApi } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/auth'
import { INR, shortDate, dateTime, fullName, limit } from '@/components/admin/admin-user-detail-utils'
import {
  SubscriptionDialog,
  CancelSubscriptionDialog,
  RefundDialog,
  FlagDialog,
  DurationDialog,
  EditDetailsDialog,
  ViewAsMemberDialog,
} from '@/components/admin/admin-user-detail-dialogs'

interface AdminUserDetailViewProps {
  profileId: string
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
      const res = await adminApi.exportUserBiodataPdf(profile.profileId)
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `biodata-${profile.profileId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      pushToast('Biodata PDF exported.', 'success')
    } catch {
      pushToast('Could not export biodata PDF.', 'error')
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
              { label: 'Export biodata (PDF)', icon: 'download', onSelect: handleExport },
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
