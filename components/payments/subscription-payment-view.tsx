'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useNavigate } from 'react-router-dom'
import type { PaymentMethod, SubscriptionPlan } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ManualPaymentForm } from '@/components/payments/manual-payment-form'
import { paymentsApi, plansApi } from '@/src/lib/api'

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

type Phase = 'form' | 'success' | 'claim-submitted'

interface SubscriptionPaymentViewProps {
  planId?: string
}

interface PlanFeature {
  icon: IconName
  label: string
}

function validityLabel(days: number): string {
  if (days <= 0) return 'Forever'
  if (days % 365 === 0) {
    const y = days / 365
    return `${y} ${y === 1 ? 'year' : 'years'}`
  }
  if (days % 30 === 0) {
    const m = days / 30
    return `${m} ${m === 1 ? 'month' : 'months'}`
  }
  return `${days} days`
}

/** Included features only, derived from the real plan fields. */
function includedFeatures(plan: SubscriptionPlan): PlanFeature[] {
  const features: PlanFeature[] = []
  if (plan.contactViewLimit > 0) {
    features.push({ icon: 'eye', label: `${plan.contactViewLimit} contact views` })
  }
  if (plan.messageLimit > 0) {
    features.push({ icon: 'mail', label: `${plan.messageLimit} messages` })
  }
  if (plan.interestLimit > 0) {
    features.push({ icon: 'heart', label: `${plan.interestLimit} interests` })
  }
  if (plan.chatEnabled) {
    features.push({ icon: 'chat', label: 'Chat enabled' })
  }
  if (plan.profileBoostEnabled) {
    features.push({ icon: 'star', label: 'Profile boost' })
  }
  return features
}

/**
 * Subscription payment (`/payment`): a plan summary card plus the shared
 * ManualPaymentForm, with a "Pay now" instant-gateway path that initialises a
 * subscription payment and navigates to the payment-processing route.
 */
export function SubscriptionPaymentView({ planId }: SubscriptionPaymentViewProps) {
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  // Carried through the post-submission onboarding flow so the success screens
  // send the user back to their profile status instead of the dashboard.
  const onboarding = searchParams.get('onboarding') === '1'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [phase, setPhase] = useState<Phase>('form')
  const [paying, setPaying] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function pushToast(message: string, variant: ToastItem['variant']) {
    setToasts((t) => [...t, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await plansApi.getActivePlans()
      const found = (res.data ?? []).find((p) => String(p.planId) === planId) ?? null
      setPlan(found)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => {
    void load()
  }, [load])

  async function handlePayNow() {
    if (!plan) return
    setPaying(true)
    try {
      const res = await paymentsApi.initSubscription({ planId: plan.planId, paymentGateway: 'MOCK' })
      navigate(`/payments/${res.data.paymentId}`, {
        state: { amount: res.data.amount, paymentType: res.data.paymentType, onboarding },
      })
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'The payment could not be started. Please try again.'
      pushToast(message, 'error')
    } finally {
      setPaying(false)
    }
  }

  async function handleManualSubmit(data: {
    paymentMethod: PaymentMethod
    referenceNote: string
    screenshot?: File
  }) {
    if (!plan) return
    setClaiming(true)
    try {
      await paymentsApi.submitManualPayment({
        planId: plan.planId,
        paymentMethod: data.paymentMethod,
        referenceNote: data.referenceNote,
        screenshot: data.screenshot,
      })
      setPhase('claim-submitted')
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'We could not record your payment claim. Please try again.'
      pushToast(message, 'error')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-lg px-4 flex-col gap-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-lg px-4 flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Icon name="alert-circle" size={26} />
        </span>
        <h1 className="font-serif text-2xl text-foreground">Could not load plan</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Something went wrong while loading this plan. Please try again.
        </p>
        <Button variant="secondary" onClick={() => void load()}>
          <Icon name="refresh" size={16} />
          Retry
        </Button>
      </div>
    )
  }

  // Guard: unknown / missing plan.
  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-lg px-4 flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon name="alert-circle" size={26} />
        </span>
        <h1 className="font-serif text-2xl text-foreground">Plan not found</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          We couldn&apos;t find the plan you were trying to pay for. Choose a plan to continue.
        </p>
        <Link href="/plans" className={buttonVariants()}>
          View plans
        </Link>
      </div>
    )
  }

  const total = plan.price
  const features = includedFeatures(plan)

  if (phase === 'success' || phase === 'claim-submitted') {
    const submitted = phase === 'claim-submitted'
    return (
      <>
        <div className="mx-auto flex w-full max-w-lg px-4 flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-center">
          <span
            className={
              submitted
                ? 'flex size-16 items-center justify-center rounded-full bg-warning/15 text-warning'
                : 'flex size-16 items-center justify-center rounded-full bg-success/15 text-success'
            }
          >
            <Icon name={submitted ? 'clock' : 'circle-check'} size={34} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-balance font-serif text-2xl text-foreground">
              {submitted ? 'Payment claim received' : 'Payment successful'}
            </h1>
            <p className="text-pretty text-sm text-muted-foreground">
              {submitted
                ? 'Our team will verify your payment and activate your plan shortly. You will be notified once it is confirmed.'
                : `Your ${plan.name} plan is now active. Welcome to a richer matchmaking experience.`}
            </p>
          </div>

          <div className="w-full rounded-xl border border-border bg-muted/40 p-4 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground">{plan.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium text-foreground">{INR.format(total)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Validity</span>
              <span className="font-medium text-foreground">{validityLabel(plan.validityDays)}</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {onboarding ? (
              <>
                <Link href="/profile/status" className={buttonVariants({ className: 'flex-1' })}>
                  Continue
                </Link>
                <Link
                  href="/subscriptions"
                  className={buttonVariants({ variant: 'secondary', className: 'flex-1' })}
                >
                  View subscription
                </Link>
              </>
            ) : (
              <>
                <Link href="/subscriptions" className={buttonVariants({ className: 'flex-1' })}>
                  View subscription
                </Link>
                <Link
                  href="/"
                  className={buttonVariants({ variant: 'secondary', className: 'flex-1' })}
                >
                  Go to dashboard
                </Link>
              </>
            )}
          </div>
        </div>
        <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </>
    )
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-lg px-4 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Link
            href="/plans"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="arrow-left" size={15} />
            Back to plans
          </Link>
          <h1 className="text-balance font-serif text-3xl text-foreground">Complete your payment</h1>
          <p className="text-pretty text-sm text-muted-foreground">
            Review your plan, then pay instantly or submit a manual payment for our team to verify.
          </p>
        </div>

        {/* Plan summary */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Selected plan
              </span>
              <span className="font-serif text-xl text-foreground">{plan.name}</span>
              <span className="text-sm text-muted-foreground">
                {validityLabel(plan.validityDays)} membership
              </span>
            </div>
            <span className="text-right">
              <span className="block font-serif text-2xl text-foreground">{INR.format(total)}</span>
            </span>
          </div>

          {features.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {features.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm text-foreground">
                  <Icon name={f.icon} size={16} className="shrink-0 text-primary" />
                  {f.label}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-medium text-foreground">
            <span>Total payable</span>
            <span>{INR.format(total)}</span>
          </div>
        </section>

        {/* Instant pay (mock gateway) */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-lg text-foreground">Pay instantly</h2>
            <p className="text-sm text-muted-foreground">
              Use our secure payment gateway to activate your plan right away.
            </p>
          </div>
          <Button onClick={handlePayNow} loading={paying} size="lg">
            <Icon name="lock" size={16} />
            Pay {INR.format(total)} now
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="shield" size={13} />
            This is a demo gateway — no real charge is made.
          </p>
        </section>

        {/* Manual payment */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-lg text-foreground">Or pay manually</h2>
            <p className="text-sm text-muted-foreground">
              Prefer UPI or cash? Submit your payment details and we&apos;ll verify and activate your plan.
            </p>
          </div>
          <ManualPaymentForm
            onSubmit={handleManualSubmit}
            submitting={claiming}
            onCancel={() => navigate('/plans')}
          />
        </section>
      </div>
      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </>
  )
}
