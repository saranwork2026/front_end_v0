'use client'

import { useEffect, useState } from 'react'
import type { BroadcastSegment, SubscriptionPlan } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { adminApi, plansApi } from '@/src/lib/api'

/** Demo role. In the real app this is `useAuthStore(s => s.role)`. */
type AdminRole = 'ADMIN' | 'ADMIN_APPROVER'

const MESSAGE_MAX = 2000
const TITLE_MAX = 120

const SEGMENT_OPTIONS: { value: BroadcastSegment; label: string; description: string }[] = [
  { value: 'ALL', label: 'All members', description: 'Everyone with an active account.' },
  { value: 'PLAN', label: 'Specific plan', description: 'Members on a chosen plan.' },
  { value: 'USER_STATUS', label: 'By account status', description: 'Members with a chosen account status.' },
]

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OTP_PENDING', label: 'OTP pending' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DEACTIVATED', label: 'Deactivated' },
]

interface FieldErrors {
  title?: string
  message?: string
  segmentValue?: string
}

interface AdminBroadcastViewProps {
  initialRole?: AdminRole
  initialState?: 'ready' | 'loading'
}

export function AdminBroadcastView({ initialRole = 'ADMIN_APPROVER' }: AdminBroadcastViewProps) {
  const [role, setRole] = useState<AdminRole>(initialRole)
  const isApprover = role === 'ADMIN_APPROVER'

  const [segment, setSegment] = useState<BroadcastSegment>('ALL')
  const [segmentValue, setSegmentValue] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [sendSms, setSendSms] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [result, setResult] = useState<{ scheduled: boolean; recipients: number; emailsSent: number; message: string } | null>(
    null,
  )
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function pushToast(msg: string, variant: ToastItem['variant']) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message: msg, variant }])
  }

  useEffect(() => {
    plansApi
      .getActivePlans()
      .then((res) => setPlans(res.data ?? []))
      .catch(() => {
        /* non-fatal */
      })
  }, [])

  // Keep segmentValue sensible when the segment type changes.
  useEffect(() => {
    if (segment === 'PLAN') setSegmentValue(plans[0]?.name ?? '')
    else if (segment === 'USER_STATUS') setSegmentValue('ACTIVE')
    else setSegmentValue('')
    setErrors((e) => ({ ...e, segmentValue: undefined }))
  }, [segment, plans])

  function validate(): boolean {
    const next: FieldErrors = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!message.trim()) next.message = 'Message is required.'
    else if (message.length > MESSAGE_MAX) next.message = `Message must be ${MESSAGE_MAX} characters or fewer.`
    if (segment !== 'ALL' && !segmentValue.trim()) next.segmentValue = 'Please choose a value for this segment.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSend() {
    setResult(null)
    if (!validate()) return
    setBusy(true)
    try {
      // datetime-local is local time; convert to an ISO instant for the backend.
      const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : undefined
      const res = await adminApi.sendBroadcast({
        segment,
        segmentValue: segment === 'ALL' ? undefined : segmentValue,
        title: title.trim(),
        message: message.trim(),
        sendEmail,
        sendSms,
        scheduledAt: scheduledIso,
      })
      setResult({
        scheduled: Boolean(scheduledIso),
        recipients: res.data.recipients,
        emailsSent: res.data.emailsSent,
        message: res.data.message,
      })
      pushToast(scheduledIso ? 'Broadcast scheduled.' : 'Broadcast sent.', 'success')
      // Reset the message body; keep segment for repeat sends.
      setTitle('')
      setMessage('')
      setScheduledAt('')
    } catch {
      pushToast('Could not send the broadcast. Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const activeSegment = SEGMENT_OPTIONS.find((s) => s.value === segment)!

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Broadcast</h1>
          <p className="mt-1 text-sm text-muted-foreground">Send or schedule a notification to a member segment.</p>
        </div>
        {/* Demo-only role toggle (real app derives this from the session). */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {(['ADMIN', 'ADMIN_APPROVER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                role === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r === 'ADMIN' ? 'Admin' : 'Approver'}
            </button>
          ))}
        </div>
      </div>

      {!isApprover ? (
        <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-5">
          <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-foreground">Approver access required</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Broadcasts can only be composed and sent by an admin approver. Switch to an approver account to use this
              tool.
            </p>
          </div>
        </div>
      ) : (
        <form
          className="mt-6 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          {result && (
            <div role="status" className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success-soft p-4">
              <Icon name="circle-check" className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <p className="font-semibold text-foreground">
                  {result.scheduled ? 'Broadcast scheduled' : 'Broadcast sent'}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {result.message}{' '}
                  <span className="font-medium text-foreground">
                    {result.recipients} recipient{result.recipients === 1 ? '' : 's'}
                  </span>
                  {result.emailsSent > 0 && (
                    <>
                      {' · '}
                      <span className="font-medium text-foreground">{result.emailsSent} email{result.emailsSent === 1 ? '' : 's'} sent</span>
                    </>
                  )}
                  .
                </p>
              </div>
            </div>
          )}

          {/* Audience */}
          <fieldset className="rounded-2xl border border-border bg-card p-5">
            <legend className="px-1 text-sm font-semibold text-foreground">Audience</legend>
            <div className="mt-3 flex flex-col gap-4">
              <div>
                <Select
                  label="Segment"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as BroadcastSegment)}
                >
                  {SEGMENT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">{activeSegment.description}</p>
              </div>

              {segment === 'PLAN' && (
                <Select
                  label="Plan"
                  value={segmentValue}
                  error={errors.segmentValue}
                  onChange={(e) => {
                    setSegmentValue(e.target.value)
                    setErrors((x) => ({ ...x, segmentValue: undefined }))
                  }}
                >
                  <option value="">Select a plan</option>
                  {plans.map((p) => (
                    <option key={p.planId} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}

              {segment === 'USER_STATUS' && (
                <Select
                  label="Account status"
                  value={segmentValue}
                  error={errors.segmentValue}
                  onChange={(e) => {
                    setSegmentValue(e.target.value)
                    setErrors((x) => ({ ...x, segmentValue: undefined }))
                  }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </fieldset>

          {/* Content */}
          <fieldset className="rounded-2xl border border-border bg-card p-5">
            <legend className="px-1 text-sm font-semibold text-foreground">Content</legend>
            <div className="mt-3 flex flex-col gap-4">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="bc-title" className="block text-sm font-medium text-foreground">
                    Title
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {title.length}/{TITLE_MAX}
                  </span>
                </div>
                <Input
                  id="bc-title"
                  value={title}
                  maxLength={TITLE_MAX}
                  placeholder="e.g. New Platinum plan is here"
                  error={errors.title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setErrors((x) => ({ ...x, title: undefined }))
                  }}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="bc-message" className="block text-sm font-medium text-foreground">
                    Message
                  </label>
                  <span
                    className={cn(
                      'text-xs',
                      message.length > MESSAGE_MAX ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {message.length}/{MESSAGE_MAX}
                  </span>
                </div>
                <textarea
                  id="bc-message"
                  value={message}
                  rows={5}
                  maxLength={MESSAGE_MAX}
                  placeholder="Write the announcement members will receive…"
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setErrors((x) => ({ ...x, message: undefined }))
                  }}
                  className={cn(
                    'w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30',
                    errors.message || message.length > MESSAGE_MAX ? 'border-destructive' : 'border-border',
                  )}
                />
                {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* Delivery */}
          <fieldset className="rounded-2xl border border-border bg-card p-5">
            <legend className="px-1 text-sm font-semibold text-foreground">Delivery</legend>
            <div className="mt-3 flex flex-col gap-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Channels</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <input type="checkbox" checked disabled className="size-4 accent-primary" />
                    <Icon name="bell" className="size-4" />
                    In-app (always sent)
                  </label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                      sendEmail ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    <Icon name="mail" className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Email</span>
                  </label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                      sendSms ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    <Icon name="phone" className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">SMS</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="bc-schedule" className="mb-1.5 block text-sm font-medium text-foreground">
                  Schedule <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="bc-schedule"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">Leave empty to send immediately.</p>
              </div>
            </div>
          </fieldset>

          {/* Preview */}
          <div className="rounded-2xl border border-dashed border-border bg-background p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon name="eye" className="size-3.5" />
              Preview
            </p>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon name="bell" className="size-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{title.trim() || 'Notification title'}</p>
                  <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {message.trim() || 'Your message body will appear here.'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="neutral">In-app</Badge>
                    {sendEmail && <Badge variant="neutral">Email</Badge>}
                    {sendSms && <Badge variant="neutral">SMS</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
              {scheduledAt ? 'Schedule broadcast' : 'Send broadcast'}
            </Button>
          </div>
        </form>
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
