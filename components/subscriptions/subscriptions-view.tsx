'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useNavigate } from 'react-router-dom'
import type { PaymentMethod, SubscriptionPlan } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { apiClient, paymentsApi, plansApi } from '@/src/lib/api'

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Shape returned by GET /user/subscriptions/active. */
interface ActiveSubscription {
  id: number
  planName: string
  price: number
  startDate: string
  expiryDate: string
  status: string
  totalContactLimit: number
  remainingContactViews: number
  totalMessageLimit: number
  remainingMessages: number
  totalInterestLimit: number
  remainingInterests: number
  totalPhotoLimit: number
  remainingPhotoViews: number
}

interface SubscriptionsViewProps {
  /** Kept for the page wrapper; UI is driven by the real fetch state. */
  state?: string
  /** When present, the page was reached with {planId} → show purchase CTA. */
  planId?: string
}

/** "14 Jun 2026" */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Whole days between now and the expiry date (clamped at 0). */
function daysRemaining(endIso: string): number {
  const end = new Date(endIso).getTime()
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000))
}

/** Elapsed fraction (0–1) of the subscription window, for the term bar. */
function termProgress(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  const now = Date.now()
  if (now <= start) return 0
  if (now >= end) return 1
  return (now - start) / (end - start)
}

type TFunc = ReturnType<typeof useTranslation>['t']

function validityLabel(days: number, t: TFunc): string {
  if (days <= 0) return t('page.subscriptions.forever')
  if (days % 365 === 0) return t('page.subscriptions.year', { count: days / 365 })
  if (days % 30 === 0) return t('page.subscriptions.month', { count: days / 30 })
  return t('page.subscriptions.days', { count: days })
}

export function SubscriptionsView({ planId }: SubscriptionsViewProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [sub, setSub] = React.useState<ActiveSubscription | null>(null)
  const [purchasePlan, setPurchasePlan] = React.useState<SubscriptionPlan | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(false)
    setSub(null)
    try {
      const res = await apiClient.get<ActiveSubscription>('/user/subscriptions/active')
      setSub(res.data)
    } catch (err) {
      const errorCode = (err as { response?: { data?: { errorCode?: string } } })?.response?.data
        ?.errorCode
      if (errorCode === 'SUBSCRIPTION_NOT_FOUND') {
        setSub(null)
      } else {
        setError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  React.useEffect(() => {
    if (!planId) {
      setPurchasePlan(null)
      return
    }
    let active = true
    plansApi
      .getActivePlans()
      .then((res) => {
        if (!active) return
        const found = (res.data ?? []).find((p) => String(p.planId) === planId) ?? null
        setPurchasePlan(found)
      })
      .catch(() => active && setPurchasePlan(null))
    return () => {
      active = false
    }
  }, [planId])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t('page.subscriptions.eyebrow')}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-foreground text-balance sm:text-3xl">
          {t('page.subscriptions.title')}
        </h1>
      </header>

      {/* Optional purchase section when reached with {planId}: confirm & pay
          (instant gateway) plus a manual (cash/online) payment claim. */}
      {purchasePlan && <SubscriptionPurchaseSection plan={purchasePlan} />}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !sub ? (
        <EmptySubscription />
      ) : (
        <ActiveSubscriptionCard sub={sub} />
      )}
    </div>
  )
}

/* ------------------------------ Purchase ------------------------------ */

/**
 * Inline purchase block shown when the page is reached with a `{planId}`.
 * Mirrors the existing app's SubscriptionPurchaseSection: a "Confirm & pay"
 * instant-gateway path (initSubscription → /payments/:id) plus a manual
 * (cash/online) payment claim that an admin verifies before the plan
 * activates. On a successful manual claim it swaps to a confirmation state.
 */
function SubscriptionPurchaseSection({ plan }: { plan: SubscriptionPlan }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [initiating, setInitiating] = React.useState(false)
  const [manualMethod, setManualMethod] = React.useState<PaymentMethod>('CASH')
  const [referenceNote, setReferenceNote] = React.useState('')
  const [manualSubmitting, setManualSubmitting] = React.useState(false)
  const [manualSubmitted, setManualSubmitted] = React.useState(false)
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  function pushToast(message: string, variant: ToastItem['variant']) {
    setToasts((t) => [
      ...t,
      { id: Date.now() + Math.floor(Math.random() * 1000), message, variant },
    ])
  }

  async function handleConfirm() {
    setInitiating(true)
    try {
      const res = await paymentsApi.initSubscription({ planId: plan.planId, paymentGateway: 'MOCK' })
      navigate(`/payments/${res.data.paymentId}`, {
        state: { amount: res.data.amount, paymentType: res.data.paymentType },
      })
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('page.subscriptions.planUnavailable')
      pushToast(message, 'error')
    } finally {
      setInitiating(false)
    }
  }

  async function handleManualSubmit() {
    if (!referenceNote.trim()) return
    setManualSubmitting(true)
    try {
      await paymentsApi.submitManualPayment({
        planId: plan.planId,
        paymentMethod: manualMethod,
        referenceNote: referenceNote.trim(),
      })
      setManualSubmitted(true)
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('page.subscriptions.manualClaimError')
      pushToast(message, 'error')
    } finally {
      setManualSubmitting(false)
    }
  }

  if (manualSubmitted) {
    return (
      <>
        <section className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-success/30 bg-success/10 p-6 text-center sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon name="circle-check" size={26} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-xl text-foreground">{t('page.subscriptions.claimReceivedTitle')}</h2>
            <p className="text-pretty text-sm text-muted-foreground">
              {t('page.subscriptions.claimReceivedDesc', {
                method:
                  manualMethod === 'CASH'
                    ? t('page.subscriptions.claimReceivedCash')
                    : t('page.subscriptions.claimReceivedOnline'),
                plan: plan.name,
              })}
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants())}>
            {t('page.subscriptions.goToDashboard')}
          </Link>
        </section>
        <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        {/* Confirm & pay (instant gateway) */}
        <section className="rounded-2xl border border-primary/30 bg-secondary/40 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {t('page.subscriptions.selectedPlan')}
              </p>
              <h2 className="mt-0.5 font-serif text-xl text-foreground">{plan.name}</h2>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl text-foreground">{INR.format(plan.price)}</p>
              <p className="text-xs text-muted-foreground">{validityLabel(plan.validityDays, t)}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={handleConfirm} loading={initiating}>
              <Icon name="lock" size={16} />
              {t('page.subscriptions.confirmPay')}
            </Button>
            <Link
              href="/plans"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('page.subscriptions.cancel')}
            </Link>
          </div>
        </section>

        {/* Manual (cash/online) payment claim */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-serif text-lg text-foreground">{t('page.subscriptions.manualTitle')}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('page.subscriptions.manualDesc')}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <Select
              label={t('page.subscriptions.paymentMethod')}
              name="manual-payment-method"
              value={manualMethod}
              onChange={(e) => setManualMethod(e.target.value as PaymentMethod)}
            >
              <option value="CASH">{t('page.subscriptions.methodCash')}</option>
              <option value="ONLINE">{t('page.subscriptions.methodOnline')}</option>
            </Select>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reference-note" className="text-sm font-medium text-foreground">
                {t('page.subscriptions.referenceNote')}
              </label>
              <textarea
                id="reference-note"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  manualMethod === 'CASH'
                    ? t('page.subscriptions.referencePlaceholderCash')
                    : t('page.subscriptions.referencePlaceholderOnline')
                }
                className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <p className="text-right text-xs text-muted-foreground tabular-nums">
                {referenceNote.length}/500
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleManualSubmit}
              loading={manualSubmitting}
              disabled={manualSubmitting || !referenceNote.trim()}
              className="w-full sm:w-auto"
            >
              {t('page.subscriptions.submitClaim')}
            </Button>
          </div>
        </section>
      </div>
      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </>
  )
}

/* ------------------------------- Active ------------------------------- */

function ActiveSubscriptionCard({ sub }: { sub: ActiveSubscription }) {
  const { t } = useTranslation()
  const remaining = daysRemaining(sub.expiryDate)
  const progress = Math.round(termProgress(sub.startDate, sub.expiryDate) * 100)

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Plan header band */}
      <div className="border-b border-border bg-gradient-to-br from-secondary/60 to-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl text-foreground">
                {sub.planName}
              </h2>
              <StatusBadge status={sub.status} />
            </div>
          </div>
          <Link
            href="/plans"
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
          >
            {t('page.subscriptions.upgradePlan')}
          </Link>
        </div>

        {/* Term dates + remaining */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <p className="text-xs text-muted-foreground">{t('page.subscriptions.started')}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {formatDate(sub.startDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('page.subscriptions.renewsEnds')}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {formatDate(sub.expiryDate)}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 sm:text-right">
            <p className="text-xs text-muted-foreground">{t('page.subscriptions.daysLeft')}</p>
            <p className="mt-0.5 font-serif text-lg text-primary">{remaining}</p>
          </div>
        </div>

        {/* Term progress bar */}
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-foreground">
          {t('page.subscriptions.usageThisCycle')}
        </h3>
        <ul className="mt-4 flex flex-col gap-4">
          <UsageRow
            label={t('page.subscriptions.contactViews')}
            remaining={sub.remainingContactViews}
            total={sub.totalContactLimit}
          />
          <UsageRow
            label={t('page.subscriptions.photoViews')}
            remaining={sub.remainingPhotoViews}
            total={sub.totalPhotoLimit}
          />
          <UsageRow
            label={t('page.subscriptions.messages')}
            remaining={sub.remainingMessages}
            total={sub.totalMessageLimit}
          />
          <UsageRow
            label={t('page.subscriptions.interests')}
            remaining={sub.remainingInterests}
            total={sub.totalInterestLimit}
          />
        </ul>
      </div>
    </section>
  )
}

/**
 * A single quota usage row: label, remaining/total figure, and a progress bar
 * whose width and colour reflect how much of the quota is left.
 */
function UsageRow({
  label,
  remaining,
  total,
}: {
  label: string
  remaining: number
  total: number
}) {
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((remaining / total) * 100))) : 0
  const barColor = pct > 50 ? 'bg-success' : pct > 20 ? 'bg-warning' : 'bg-destructive'

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          <span className="text-foreground">{remaining}</span>
          {' / '}
          {total}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={remaining}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  )
}

/* ------------------------------- States ------------------------------- */

function EmptySubscription() {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="star"
      title={t('page.subscriptions.emptyTitle')}
      description={t('page.subscriptions.emptyDesc')}
      action={
        <Link href="/plans" className={cn(buttonVariants())}>
          {t('page.subscriptions.viewPlans')}
        </Link>
      }
    />
  )
}

function LoadingState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-3 w-24" />
        <div className="mt-5 flex gap-6">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
      </div>
      <div className="space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
    >
      <Icon name="alert-circle" size={28} className="text-destructive" />
      <div>
        <p className="font-medium text-foreground">
          {t('page.subscriptions.errorTitle')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('page.subscriptions.errorDesc')}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {t('page.subscriptions.retry')}
      </Button>
    </div>
  )
}
