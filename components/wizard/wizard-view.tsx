'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { PhotosStep } from '@/components/wizard/photos-step'
import { ReviewStep } from '@/components/wizard/review-step'
import { StepFields } from '@/components/wizard/step-fields'
import { WizardProgress } from '@/components/wizard/wizard-progress'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import {
  emptyForm,
  isSubmittable,
  lastStepIndex,
  saveStep,
  seedFromProfile,
  steps,
  stepOrder,
  submitProfile,
  validateStep,
  type FieldErrors,
  type StepKey,
  type WizardForm,
} from '@/lib/wizard-data'
import { profileApi } from '@/src/lib/api'
import { authStore } from '@/src/lib/api'

type WizardState = 'ready' | 'loading'

interface WizardViewProps {
  /** Preview hook for the initial load state (?state=loading). */
  initialState?: WizardState
  /** Start empty instead of seeded (?state=empty). */
  empty?: boolean
}

export function WizardView({
  initialState = 'ready',
  empty = false,
}: WizardViewProps) {
  const router = useRouter()
  const [pageState, setPageState] = useState<WizardState>(initialState === 'loading' ? 'loading' : empty ? 'ready' : 'loading')
  const [form, setForm] = useState<WizardForm>(emptyForm)
  const [current, setCurrent] = useState(0)

  // Seed the wizard from the user's existing profile (completion mode).
  useEffect(() => {
    if (empty || initialState === 'loading') {
      setPageState(initialState === 'loading' ? 'loading' : 'ready')
      return
    }
    let cancelled = false
    profileApi
      .getProfile()
      .then((res) => {
        if (!cancelled) setForm(seedFromProfile(res.data))
      })
      .catch(() => {
        /* Start blank if no profile yet. */
      })
      .finally(() => {
        if (!cancelled) setPageState('ready')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [maxVisited, setMaxVisited] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const step = steps[current]
  const isReview = step.key === 'review'

  const pushToast = useCallback(
    (message: string, variant: ToastItem['variant']) => {
      setToasts((t) => [...t, { id: Date.now() + Math.random(), message, variant }])
    },
    [],
  )
  const dismissToast = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  )

  function patchForm(patch: Partial<WizardForm>) {
    setForm((f) => ({ ...f, ...patch }))
    // Clear inline errors for any field being edited.
    setErrors((e) => {
      const next = { ...e }
      for (const key of Object.keys(patch)) delete next[key as keyof WizardForm]
      return next
    })
  }

  function scrollStepTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function goNext() {
    const stepErrors = validateStep(step.key, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      pushToast('Please fix the highlighted fields before continuing.', 'error')
      return
    }
    setSaving(true)
    try {
      await saveStep(step.key, form)
      const next = Math.min(current + 1, lastStepIndex)
      setCurrent(next)
      setMaxVisited((m) => Math.max(m, next))
      scrollStepTop()
    } catch {
      pushToast('Could not save this step. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function goPrev() {
    if (current === 0) return
    setCurrent((c) => c - 1)
    scrollStepTop()
  }

  function jumpTo(index: number) {
    // Pills jump back only (index < current guaranteed by the pill component).
    setCurrent(index)
    setErrors({})
    scrollStepTop()
  }

  function changeStep(key: StepKey) {
    const index = stepOrder.indexOf(key)
    if (index >= 0) {
      setCurrent(index)
      scrollStepTop()
    }
  }

  async function handleSubmit() {
    if (!isSubmittable(form)) {
      pushToast(
        'Some required details are missing. Please complete the basic and location steps.',
        'error',
      )
      return
    }
    setSubmitting(true)
    try {
      await submitProfile(form)
      // Reflect the submission in the in-memory session so ProfileStatusGuard
      // lets the user proceed to partner preferences instead of bouncing back.
      authStore.getState().updateProfileProgress({ profileStatus: 'COMPLETED' })
      pushToast('Profile submitted for review.', 'success')
      setTimeout(() => router.push('/partner-preferences'), 600)
    } catch {
      pushToast('Could not submit your profile. Please try again.', 'error')
      setSubmitting(false)
    }
  }

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <span
          className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    )
  }

  return (
    <>
      {/*
        Mobile: fixed-height column (header + scrolling middle + sticky footer).
        Desktop (md+): reverts to normal document flow, max-w-4xl centered.
      */}
      <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-4xl flex-col md:h-auto md:min-h-0 md:py-8">
        {/* Header: title + progress pills */}
        <header className="shrink-0 border-b border-border bg-background px-4 pt-4 pb-3 md:border-0 md:px-0 md:pt-0">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Step {current + 1} of {steps.length}
              </p>
              <h1 className="font-serif text-xl font-semibold text-foreground text-balance md:text-2xl">
                {step.title}
              </h1>
            </div>
          </div>
          <WizardProgress
            current={current}
            maxVisited={maxVisited}
            onJump={jumpTo}
          />
        </header>

        {/* Scrolling step content */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:overflow-visible md:px-0"
        >
          <p className="mb-5 max-w-prose text-sm text-muted-foreground text-pretty">
            {step.description}
          </p>

          {step.key === 'photos' ? (
            <PhotosStep />
          ) : isReview ? (
            <ReviewStep form={form} onChangeStep={changeStep} />
          ) : (
            <StepFields
              step={step.key}
              form={form}
              errors={errors}
              onChange={patchForm}
            />
          )}

          {isReview && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href="/"
                className={cn(buttonVariants({ variant: 'ghost' }), 'sm:w-auto')}
              >
                Save & exit
              </Link>
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                onClick={handleSubmit}
                className="sm:w-auto"
              >
                <Icon name="circle-check" size={18} />
                Submit for review
              </Button>
            </div>
          )}
        </div>

        {/* Sticky Prev/Next footer — hidden on the review step */}
        {!isReview && (
          <footer className="shrink-0 border-t border-border bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:border-0 md:px-0 md:pb-0 md:pt-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={goPrev}
                disabled={current === 0 || saving}
              >
                <Icon name="chevron-left" size={18} />
                Previous
              </Button>
              <Button variant="primary" loading={saving} onClick={goNext}>
                Save & continue
                <Icon name="chevron-right" size={18} />
              </Button>
            </div>
          </footer>
        )}
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
