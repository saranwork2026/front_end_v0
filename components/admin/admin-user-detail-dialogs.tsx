import { useEffect, useState } from 'react'
import type {
  AdminEditableField,
  AdminPayment,
  AdminProfileEditRequestView,
  SubscriptionPlan,
  UserProfile,
} from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { type ToastItem } from '@/components/ui/toast'
import { ProfileDetailSections } from '@/components/shared/profile-detail-sections'
import { buildProfileSections } from '@/components/admin/profile-review-sections'
import { flattenProfileResponse } from '@/src/lib/adapters'
import { adminApi, plansApi } from '@/src/lib/api'
import { INR, fullName } from '@/components/admin/admin-user-detail-utils'

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

/* --------------------------- Subscription assign/change dialog --------------------------- */

export function SubscriptionDialog({
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

/* --------------------------- Cancel subscription dialog --------------------------- */

export function CancelSubscriptionDialog({
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

/* --------------------------- Refund dialog --------------------------- */

export function RefundDialog({
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

export function FlagDialog({
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

export function DurationDialog({
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

export function EditDetailsDialog({
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

export function ViewAsMemberDialog({
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
