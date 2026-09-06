'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AssistedRegistrationRequestView, UserProfile } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { StepFields } from '@/components/wizard/step-fields'
import { cn } from '@/lib/utils'
import { adminApi } from '@/src/lib/api'
import {
  buildFullProfileRequest,
  emptyForm,
  steps,
  validateStep,
  type FieldErrors,
  type StepKey,
  type WizardForm,
} from '@/lib/wizard-data'

interface AdminAssistedProfileViewProps {
  profileId: string
}

/** The assisted flow reuses the 7 data steps — no Photos, no Review step. */
const ASSISTED_STEP_KEYS: Exclude<StepKey, 'photos' | 'review'>[] = [
  'basic',
  'religious',
  'professional',
  'location',
  'physical',
  'family',
  'horoscope',
]

const assistedSteps = ASSISTED_STEP_KEYS.map((key) => steps.find((s) => s.key === key)!)

/** Lifecycle of the assisted draft, mirroring the request status. */
type Stage = 'DRAFT' | 'CONSENT' | 'DONE'

const stageMeta: Record<Stage, { label: string; variant: 'neutral' | 'warning' | 'success' }> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  CONSENT: { label: 'Awaiting consent', variant: 'warning' },
  DONE: { label: 'Sent for approval', variant: 'success' },
}

export function AdminAssistedProfileView({ profileId }: AdminAssistedProfileViewProps) {
  const [member, setMember] = useState<UserProfile | null>(null)
  const [memberLoading, setMemberLoading] = useState(true)
  const [memberError, setMemberError] = useState(false)

  const [form, setForm] = useState<WizardForm>({ ...emptyForm })
  const [current, setCurrent] = useState(0)
  const [maxVisited, setMaxVisited] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [stage, setStage] = useState<Stage>('DRAFT')
  const [proposing, setProposing] = useState(false)
  const [request, setRequest] = useState<AssistedRegistrationRequestView | null>(null)

  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [resending, setResending] = useState(false)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const step = assistedSteps[current]
  const isLastDataStep = current === assistedSteps.length - 1

  const pushToast = useCallback((message: string, variant: ToastItem['variant']) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }, [])
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const load = useCallback(async () => {
    setMemberLoading(true)
    setMemberError(false)
    try {
      const res = await adminApi.getUserProfile(profileId)
      setMember(res.data)
      setForm((f) => ({ ...f, firstName: res.data.firstName ?? '', lastName: res.data.lastName ?? '' }))
    } catch {
      setMemberError(true)
    } finally {
      setMemberLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    void load()
  }, [load])

  const memberName = useMemo(
    () => (member ? [member.firstName, member.lastName].filter(Boolean).join(' ').trim() : ''),
    [member],
  )

  function patchForm(patch: Partial<WizardForm>) {
    setForm((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const key of Object.keys(patch)) delete next[key as keyof WizardForm]
      return next
    })
  }

  function scrollTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goPrev() {
    if (current === 0) return
    setCurrent((c) => c - 1)
    scrollTop()
  }

  function jumpTo(index: number) {
    if (index > maxVisited) return
    setCurrent(index)
    setErrors({})
    scrollTop()
  }

  async function goNext() {
    // Validate this step's mandatory fields (Basic DOB/gender/marital, Location city).
    const stepErrors = validateStep(step.key as StepKey, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      pushToast('Please fix the highlighted fields before continuing.', 'error')
      return
    }
    if (!isLastDataStep) {
      const next = current + 1
      setCurrent(next)
      setMaxVisited((m) => Math.max(m, next))
      scrollTop()
      return
    }
    // Last step → propose the assisted profile (sends the consent OTP).
    await propose()
  }

  async function propose() {
    // Re-check the full mandatory gate before submitting.
    const basicErrors = validateStep('basic', form)
    const locationErrors = validateStep('location', form)
    if (Object.keys(basicErrors).length > 0) {
      setErrors(basicErrors)
      setCurrent(assistedSteps.findIndex((s) => s.key === 'basic'))
      pushToast('Basic details are incomplete.', 'error')
      return
    }
    if (Object.keys(locationErrors).length > 0) {
      setErrors(locationErrors)
      setCurrent(assistedSteps.findIndex((s) => s.key === 'location'))
      pushToast('Current city is required.', 'error')
      return
    }
    setProposing(true)
    try {
      const res = await adminApi.proposeAssistedProfile(profileId, buildFullProfileRequest(form))
      setRequest(res.data)
      setOtp('')
      setStage('CONSENT')
      scrollTop()
      pushToast(`Consent code sent to ${res.data.otpDestination}.`, 'success')
    } catch {
      pushToast('Could not submit the profile for consent. Please try again.', 'error')
    } finally {
      setProposing(false)
    }
  }

  async function confirmOtp() {
    if (!request) return
    if (otp.trim().length === 0) {
      setOtpError('Enter the code the member reads back to you.')
      return
    }
    setConfirming(true)
    setOtpError(null)
    try {
      await adminApi.confirmAssistedProfile(request.id, otp.trim())
      setStage('DONE')
      pushToast('Consent confirmed — sent to a second admin for approval.', 'success')
    } catch {
      setOtpError('That code is incorrect or expired. Ask the member to read it again.')
    } finally {
      setConfirming(false)
    }
  }

  async function resendOtp() {
    if (!request) return
    setResending(true)
    try {
      await adminApi.resendAssistedProfileOtp(request.id)
      pushToast('Consent code re-sent.', 'success')
    } catch {
      pushToast('Could not resend the consent code. Try again.', 'error')
    } finally {
      setResending(false)
    }
  }

  if (memberLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  if (memberError || !member) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to={`/admin/users/${profileId}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <Icon name="arrow-left" size={15} />
          Back to member
        </Link>
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
          <p className="text-sm text-destructive">We could not load this member.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
        <Toaster toasts={toasts} onDismiss={dismissToast} />
      </div>
    )
  }

  const editing = stage === 'DRAFT'

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <header className="mb-6">
        <Link
          to={`/admin/users/${profileId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Icon name="arrow-left" size={15} />
          Back to member
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold text-foreground text-balance">Assisted profile</h1>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Completing the profile for{' '}
              <span className="font-medium text-foreground">{memberName || member.profileId}</span>{' '}
              <span className="font-mono text-xs">({member.profileId})</span>.
            </p>
          </div>
          <Badge variant={stageMeta[stage].variant}>{stageMeta[stage].label}</Badge>
        </div>
      </header>

      {/* Data-entry stage: reuse the wizard step fields (no Photos step) */}
      {editing && (
        <>
          {/* Step pills */}
          <nav aria-label="Profile steps" className="mb-5">
            <ol className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
              {assistedSteps.map((s, i) => {
                const visited = i <= maxVisited
                const active = i === current
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      disabled={!visited}
                      onClick={() => jumpTo(i)}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : visited
                            ? 'bg-muted text-foreground hover:bg-accent'
                            : 'bg-muted text-muted-foreground opacity-60',
                      )}
                    >
                      <Icon name={s.icon} size={13} />
                      {s.label}
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>

          <div ref={scrollRef}>
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Step {current + 1} of {assistedSteps.length}
              </p>
              <h2 className="font-serif text-xl font-semibold text-foreground">{step.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">{step.description}</p>
            </div>

            {/* pb-24 keeps fields clear of the sticky footer on mobile */}
            <div className="pb-24 md:pb-0">
              <StepFields step={step.key as StepKey} form={form} errors={errors} onChange={patchForm} />
            </div>
          </div>

          {/* Sticky footer nav */}
          <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:static md:border-0 md:px-0 md:pb-0 md:pt-6">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <Button variant="secondary" onClick={goPrev} disabled={current === 0 || proposing}>
                <Icon name="chevron-left" size={18} />
                Previous
              </Button>
              <Button variant="primary" loading={proposing} onClick={goNext}>
                {isLastDataStep ? 'Save & request consent' : 'Save & continue'}
                <Icon name="chevron-right" size={18} />
              </Button>
            </div>
          </footer>
        </>
      )}

      {/* Consent stage: member OTP */}
      {stage === 'CONSENT' && request && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-foreground">
            <Icon name="shield" size={20} className="text-primary" />
            <h2 className="font-serif text-lg font-semibold">Member consent</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Before this profile goes for approval, {member.firstName} must consent by confirming the one-time code sent
            to their mobile <span className="font-medium text-foreground">{request.otpDestination}</span>.
          </p>

          <div className="mt-5 max-w-xs space-y-3">
            <Input
              label="6-digit consent code"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              error={otpError ?? undefined}
              placeholder="123456"
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ''))
                if (otpError) setOtpError(null)
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" loading={confirming} onClick={confirmOtp}>
                Confirm consent
              </Button>
              <Button variant="ghost" loading={resending} disabled={confirming} onClick={resendOtp}>
                Resend
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStage('DRAFT')}
            disabled={confirming}
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            <Icon name="arrow-left" size={15} />
            Back to editing
          </button>
        </section>
      )}

      {/* Done stage */}
      {stage === 'DONE' && (
        <section className="rounded-xl border border-success/40 bg-success-soft p-6">
          <div className="flex items-center gap-2 text-success">
            <Icon name="circle-check" size={22} />
            <h2 className="font-serif text-lg font-semibold">Sent for approval</h2>
          </div>
          <p className="mt-2 text-sm text-foreground/80 text-pretty">
            The assisted profile for {memberName || member.profileId} is now in the approval queue. A second admin will
            review and publish it.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to={`/admin/users/${profileId}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Icon name="user" size={16} />
              Back to member
            </Link>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              All members
            </Link>
          </div>
        </section>
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
