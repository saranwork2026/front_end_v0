'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiError, type SubscriptionPlan } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { apiClient, plansApi } from '@/src/lib/api'
import { setSubscriptionRemindLater } from '@/src/stores/landing'

/** Minimal shape from GET /user/subscriptions/active (see SubscriptionsView). */
interface ActiveSubscriptionInfo {
  planName: string
  expiryDate: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Tier ordering for the plan grid. Unknown tiers sort last. */
const TIER_ORDER = ['BASE', 'SILVER', 'GOLD', 'PLATINUM']

function tierIndex(name: string): number {
  const i = TIER_ORDER.indexOf(name.toUpperCase())
  return i === -1 ? TIER_ORDER.length : i
}

interface PlanFeature {
  icon: IconName
  label: string
  /** false renders the row muted with a line-through + x-mark. */
  included: boolean
}

type TFunc = ReturnType<typeof useTranslation>['t']

/** Derives the feature bullet list for a plan from its real quota/flag fields. */
function planFeatures(plan: SubscriptionPlan, t: TFunc): PlanFeature[] {
  return [
    { icon: 'eye', label: t('page.plans.featContactViews', { count: plan.contactViewLimit }), included: plan.contactViewLimit > 0 },
    { icon: 'mail', label: t('page.plans.featMessages', { count: plan.messageLimit }), included: plan.messageLimit > 0 },
    { icon: 'heart', label: t('page.plans.featInterests', { count: plan.interestLimit }), included: plan.interestLimit > 0 },
    {
      icon: plan.chatEnabled ? 'chat' : 'x',
      label: plan.chatEnabled ? t('page.plans.featChatOn') : t('page.plans.featChatOff'),
      included: plan.chatEnabled,
    },
    {
      icon: plan.profileBoostEnabled ? 'star' : 'x',
      label: plan.profileBoostEnabled ? t('page.plans.featBoostOn') : t('page.plans.featBoostOff'),
      included: plan.profileBoostEnabled,
    },
  ]
}

function validityLabel(days: number, t: TFunc): string {
  if (days <= 0) return t('page.plans.forever')
  if (days % 365 === 0) return t('page.plans.year', { count: days / 365 })
  if (days % 30 === 0) return t('page.plans.month', { count: days / 30 })
  return t('page.plans.days', { count: days })
}

interface PlansViewProps {
  /** Kept for the page wrapper; data is always fetched from the real API. */
  initialState?: 'loading' | 'error' | 'ready'
}

export function PlansView(_props: PlansViewProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  // Reached as the final step of the post-submission onboarding flow
  // (partner preferences → packages → status). Packages are optional here —
  // the free BASE plan is already active — so we surface a clear skip path.
  const onboarding = searchParams.get('onboarding') === '1'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  // A non-BASE active subscription means buying again STACKS (extends validity
  // + adds quota) rather than replacing — we surface that so the user knows a
  // second purchase is an intentional top-up, not an accidental double-charge.
  const [activeSub, setActiveSub] = useState<ActiveSubscriptionInfo | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await plansApi.getActivePlans()
      const sorted = [...(res.data ?? [])].sort(
        (a, b) => tierIndex(a.name) - tierIndex(b.name),
      )
      setPlans(sorted)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Fetch the current active subscription (best-effort — no active paid plan
  // just means no banner). SUBSCRIPTION_NOT_FOUND / the free BASE plan are
  // both treated as "nothing to warn about".
  useEffect(() => {
    let cancelled = false
    apiClient
      .get<ActiveSubscriptionInfo>('/user/subscriptions/active')
      .then((res) => {
        if (cancelled) return
        const sub = res.data
        if (sub && sub.planName && sub.planName.toUpperCase() !== 'BASE') {
          setActiveSub({ planName: sub.planName, expiryDate: sub.expiryDate })
        }
      })
      .catch((err) => {
        // SUBSCRIPTION_NOT_FOUND (no paid plan) is expected — ignore silently.
        const code = getApiError(err)?.errorCode
        if (code !== 'SUBSCRIPTION_NOT_FOUND') {
          // Non-fatal: the plans grid still works without the banner.
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-gold-foreground">
          {onboarding ? t('page.plans.eyebrowOnboarding') : t('page.plans.eyebrowDefault')}
        </p>
        <h1 className="mt-2 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          {onboarding ? t('page.plans.titleOnboarding') : t('page.plans.titleDefault')}
        </h1>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
          {onboarding ? t('page.plans.subtitleOnboarding') : t('page.plans.subtitleDefault')}
        </p>
      </header>

      {onboarding && (
        <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => {
              // "Remind me later": persist per-device so the onboarding funnel
              // stops sending the user here, then take them straight to matches.
              setSubscriptionRemindLater()
              navigate('/', { replace: true })
            }}
          >
            {t('page.plans.remindLater')}
          </Button>
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            {t('page.plans.upgradeAnytimePre')}
            <span className="font-medium text-foreground">{t('page.plans.upgradeAnytimePlans')}</span>
            {t('page.plans.upgradeAnytimePost')}
          </p>
        </div>
      )}

      {activeSub && (
        <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Icon name="star" className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {t('page.plans.activeBanner', { plan: activeSub.planName, date: formatDate(activeSub.expiryDate) })}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {t('page.plans.stackNotePre')}
              <Link href="/subscriptions" className="text-primary underline-offset-2 hover:underline">
                {t('page.plans.stackNoteLink')}
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 sm:mt-10">
        {loading ? (
          <PlansSkeleton />
        ) : error ? (
          <ErrorBox onRetry={() => void load()} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard key={plan.planId} plan={plan} onboarding={onboarding} />
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {t('page.plans.footerPre')}
        <Link href="/subscriptions" className="text-primary underline-offset-2 hover:underline">
          {t('page.plans.footerLink')}
        </Link>
        .
      </p>
    </div>
  )
}

function PlanCard({ plan, onboarding }: { plan: SubscriptionPlan; onboarding: boolean }) {
  const { t } = useTranslation()
  const tier = plan.name.toUpperCase()
  const isBase = tier === 'BASE'
  const isTopTier = tier === 'GOLD' || tier === 'PLATINUM'
  const premium = isTopTier
  const features = planFeatures(plan, t)

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-shadow sm:p-6',
        premium ? 'border-gold ring-1 ring-gold shadow-md lg:-translate-y-1' : 'border-border',
      )}
    >
      {premium && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="gold" className="shadow-sm">
            <Icon name="star-filled" className="size-3" />
            {t('page.plans.premium')}
          </Badge>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          {plan.name}
        </h2>
        {isBase && <Badge variant="neutral">{t('page.plans.free')}</Badge>}
      </div>

      <p className="mt-1 min-h-10 text-sm leading-relaxed text-muted-foreground">
        {plan.description}
      </p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-serif text-3xl font-semibold text-foreground">
          {plan.price === 0 ? t('page.plans.free') : INR.format(plan.price)}
        </span>
        {plan.price > 0 && (
          <span className="text-sm text-muted-foreground">
            / {validityLabel(plan.validityDays, t)}
          </span>
        )}
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-3">
        {features.map((f, i) => (
          <li
            key={i}
            className={cn(
              'flex items-start gap-2.5 text-sm',
              f.included ? 'text-foreground' : 'text-muted-foreground/70',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                f.included ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground/60',
              )}
              aria-hidden="true"
            >
              <Icon name={f.included ? 'check' : 'x'} className="size-3" />
            </span>
            <span className={cn(!f.included && 'line-through')}>{f.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isBase ? (
          <span
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'w-full cursor-default text-muted-foreground hover:bg-transparent',
            )}
            aria-disabled="true"
          >
            {t('page.plans.currentPlan')}
          </span>
        ) : (
          <Link
            href={onboarding ? `/payment?planId=${plan.planId}&onboarding=1` : `/payment?planId=${plan.planId}`}
            className={cn(
              buttonVariants({
                variant: isTopTier ? 'primary' : 'secondary',
                size: 'lg',
              }),
              'w-full',
            )}
          >
            {t('page.plans.subscribe')}
            <Icon name="arrow-right" className="size-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

function PlansSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-2/3" />
          <Skeleton className="mt-4 h-9 w-32" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2.5">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-11 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon name="alert-circle" className="size-6" />
      </span>
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          {t('page.plans.errorTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('page.plans.errorDesc')}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={cn(buttonVariants({ variant: 'secondary' }))}
      >
        <Icon name="refresh" className="size-4" />
        {t('page.plans.retry')}
      </button>
    </div>
  )
}
