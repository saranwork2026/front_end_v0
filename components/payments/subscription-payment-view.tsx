'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

type TFunc = ReturnType<typeof useTranslation>['t']

function validityLabel(days: number, t: TFunc): string {
  if (days <= 0) return t('page.payments.forever')
  if (days % 365 === 0) return t('page.payments.year', { count: days / 365 })
  if (days % 30 === 0) return t('page.payments.month', { count: days / 30 })
  return t('page.payments.days', { count: days })
}

/** Included features only, derived from the real plan fields. */
function includedFeatures(plan: SubscriptionPlan, t: TFunc): PlanFeature[] {
  const features: PlanFeature[] = []
  if (plan.contactViewLimit > 0) {
    features.push({ icon: 'eye', label: t('page.payments.featContactViews', { count: plan.contactViewLimit }) })
  }
  if (plan.messageLimit > 0) {
    features.push({ icon: 'mail', label: t('page.payments.featMessages', { count: plan.messageLimit }) })
  }
  if (plan.interestLimit > 0) {
    features.push({ icon: 'heart', label: t('page.payments.featInterests', { count: plan.interestLimit }) })
  }
  if (plan.chatEnabled) {
    features.push({ icon: 'chat', label: t('page.payments.featChat') })
  }
  if (plan.profileBoostEnabled) {
    features.push({ icon: 'star', label: t('page.payments.featBoost') })
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
  const { t } = useTranslation()
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
        t('page.payments.payStartError')
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
        t('page.payments.manualClaimError')
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
        <h1 className="font-serif text-2xl text-foreground">{t('page.payments.loadPlanErrorTitle')}</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          {t('page.payments.loadPlanErrorDesc')}
        </p>
        <Button variant="secondary" onClick={() => void load()}>
          <Icon name="refresh" size={16} />
          {t('page.payments.retry')}
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
        <h1 className="font-serif text-2xl text-foreground">{t('page.payments.planNotFoundTitle')}</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          {t('page.payments.planNotFoundDesc')}
        </p>
        <Link href="/plans" className={buttonVariants()}>
          {t('page.payments.viewPlans')}
        </Link>
      </div>
    )
  }

  const total = plan.price
  const features = includedFeatures(plan, t)

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
              {submitted ? t('page.payments.claimReceived') : t('page.payments.paymentSuccessful')}
            </h1>
            <p className="text-pretty text-sm text-muted-foreground">
              {submitted
                ? t('page.payments.claimReceivedDesc')
                : t('page.payments.successDesc', { plan: plan.name })}
            </p>
          </div>

          <div className="w-full rounded-xl border border-border bg-muted/40 p-4 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('page.payments.plan')}</span>
              <span className="font-medium text-foreground">{plan.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('page.payments.amount')}</span>
              <span className="font-medium text-foreground">{INR.format(total)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('page.payments.validity')}</span>
              <span className="font-medium text-foreground">{validityLabel(plan.validityDays, t)}</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {onboarding ? (
              <>
                <Link href="/profile/status" className={buttonVariants({ className: 'flex-1' })}>
                  {t('page.payments.continue')}
                </Link>
                <Link
                  href="/subscriptions"
                  className={buttonVariants({ variant: 'secondary', className: 'flex-1' })}
                >
                  {t('page.payments.viewSubscription')}
                </Link>
              </>
            ) : (
              <>
                <Link href="/subscriptions" className={buttonVariants({ className: 'flex-1' })}>
                  {t('page.payments.viewSubscription')}
                </Link>
                <Link
                  href="/"
                  className={buttonVariants({ variant: 'secondary', className: 'flex-1' })}
                >
                  {t('page.payments.goToDashboard')}
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
            {t('page.payments.backToPlans')}
          </Link>
          <h1 className="text-balance font-serif text-3xl text-foreground">{t('page.payments.completeTitle')}</h1>
          <p className="text-pretty text-sm text-muted-foreground">
            {t('page.payments.completeSubtitle')}
          </p>
        </div>

        {/* Plan summary */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('page.payments.selectedPlan')}
              </span>
              <span className="font-serif text-xl text-foreground">{plan.name}</span>
              <span className="text-sm text-muted-foreground">
                {t('page.payments.membership', { validity: validityLabel(plan.validityDays, t) })}
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
            <span>{t('page.payments.totalPayable')}</span>
            <span>{INR.format(total)}</span>
          </div>
        </section>

        {/* Instant pay (mock gateway) */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-lg text-foreground">{t('page.payments.payInstantly')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('page.payments.payInstantlyDesc')}
            </p>
          </div>
          <Button onClick={handlePayNow} loading={paying} size="lg">
            <Icon name="lock" size={16} />
            {t('page.payments.payNowAmount', { amount: INR.format(total) })}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="shield" size={13} />
            {t('page.payments.demoGateway')}
          </p>
        </section>

        {/* Manual payment */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-serif text-lg text-foreground">{t('page.payments.orPayManually')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('page.payments.orPayManuallyDesc')}
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
