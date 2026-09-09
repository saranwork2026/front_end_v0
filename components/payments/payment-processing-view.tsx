'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getApiError, type PaymentMethod, type PaymentType } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ManualPaymentForm } from '@/components/payments/manual-payment-form'
import { paymentsApi } from '@/src/lib/api'
import { landingStore, clearSubscriptionRemindLater } from '@/src/stores/landing'

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  SUBSCRIPTION: 'Subscription',
  WALLET_RECHARGE: 'Wallet recharge',
  CONTACT_UNLOCK: 'Contact unlock',
}

type Phase = 'payment' | 'success' | 'claim-submitted'

interface PaymentProcessingViewProps {
  paymentId: string
}

/** Location.state passed by the callers (subscription-payment / wallet / unlock). */
interface PaymentLocationState {
  amount?: number
  paymentType?: PaymentType
  /** True when this payment is part of the post-submission onboarding flow. */
  onboarding?: boolean
}

/**
 * Payment gateway processing screen (`/payments/:paymentId`). Confirms or
 * cancels an INITIATED payment via the mock gateway, and — for a CONTACT_UNLOCK
 * payment — offers a manual (cash/UPI) claim for admin verification. Mirrors
 * the existing app's PaymentPage.
 */
export function PaymentProcessingView({ paymentId }: PaymentProcessingViewProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state as PaymentLocationState | null) ?? {}
  const amount = state.amount
  const paymentType = state.paymentType
  const onboarding = state.onboarding === true

  const [phase, setPhase] = useState<Phase>('payment')
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // True when this payment is already terminal-failed and cannot be retried.
  const [terminated, setTerminated] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = (message: string, variant: ToastItem['variant']) =>
    setToasts((t) => [...t, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }])

  function messageOf(err: unknown, fallback: string): string {
    return (
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
    )
  }

  async function handlePay() {
    setPaying(true)
    setError(null)
    try {
      await paymentsApi.paymentSuccess({ paymentId, transactionId: `txn_mock_${Date.now()}` })
      markSubscriptionActiveIfApplicable()
      setPhase('success')
    } catch (err) {
      const code = getApiError(err)?.errorCode
      // Idempotency: this payment was already completed (e.g. the user came
      // back to this screen, refreshed, or double-submitted). Treat it as a
      // success rather than a scary error — the plan is already active.
      if (code === 'PAYMENT_ALREADY_SUCCESS') {
        markSubscriptionActiveIfApplicable()
        setPhase('success')
        return
      }
      // This payment attempt is terminal (already cancelled/failed). The user
      // must start a NEW payment — retrying this paymentId will never work.
      if (code === 'PAYMENT_ALREADY_FAILED') {
        setTerminated(true)
        return
      }
      setError(messageOf(err, 'The payment could not be processed. Please try again.'))
    } finally {
      setPaying(false)
    }
  }

  // On a successful SUBSCRIPTION payment, reflect it in the landing signals so
  // the onboarding funnel treats the user as subscribed (stops routing to
  // plans) and clear any "remind me later" flag.
  function markSubscriptionActiveIfApplicable() {
    if (paymentType === 'SUBSCRIPTION') {
      landingStore.getState().setLandingSignals({ hasActiveSubscription: true })
      clearSubscriptionRemindLater()
    }
  }

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    try {
      await paymentsApi.paymentFailed({ paymentId, transactionId: `txn_mock_${Date.now()}` })
      pushToast('Payment cancelled.', 'info')
      if (paymentType === 'WALLET_RECHARGE') navigate('/wallet')
      else if (paymentType === 'CONTACT_UNLOCK') navigate('/')
      // Onboarding subscription: back to packages (still skippable) rather than
      // the generic plans page, so the user keeps the onboarding skip path.
      else navigate(onboarding ? '/plans?onboarding=1' : '/plans')
    } catch (err) {
      const code = getApiError(err)?.errorCode
      // Can't cancel a payment that already went through — show it as done.
      if (code === 'PAYMENT_ALREADY_SUCCESS') {
        setPhase('success')
        return
      }
      // Already failed/cancelled — this attempt is closed.
      if (code === 'PAYMENT_ALREADY_FAILED') {
        setTerminated(true)
        return
      }
      setError(messageOf(err, 'The payment could not be cancelled. Please try again.'))
    } finally {
      setCancelling(false)
    }
  }

  async function handleManualSubmit(data: {
    paymentMethod: PaymentMethod
    referenceNote: string
    screenshot?: File
  }) {
    setClaiming(true)
    try {
      await paymentsApi.submitContactUnlockManualPayment({
        paymentId: Number(paymentId),
        paymentMethod: data.paymentMethod,
        referenceNote: data.referenceNote,
        screenshot: data.screenshot,
      })
      setPhase('claim-submitted')
    } catch (err) {
      pushToast(messageOf(err, 'We could not record your payment claim. Please try again.'), 'error')
    } finally {
      setClaiming(false)
    }
  }

  // Terminal: this payment attempt already failed/cancelled and can't be
  // retried. Point the user at starting a fresh payment from plans.
  if (terminated) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon name="alert-circle" size={34} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-balance font-serif text-2xl text-foreground">
            This payment is closed
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            This payment attempt was already cancelled or did not go through, so
            it can&apos;t be completed. Please start a new payment to continue.
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Payment ID: {paymentId}</p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row">
          <Link
            href={onboarding ? '/plans?onboarding=1' : '/plans'}
            className={buttonVariants({ className: 'flex-1' })}
          >
            Back to plans
          </Link>
          <Link
            href={onboarding ? '/profile/status' : '/'}
            className={buttonVariants({ variant: 'secondary', className: 'flex-1' })}
          >
            {onboarding ? 'Continue' : 'Go to dashboard'}
          </Link>
        </div>
        <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </div>
    )
  }

  if (phase === 'success' || phase === 'claim-submitted') {
    const submitted = phase === 'claim-submitted'
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-12 text-center">
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
              ? 'Our team will verify your payment shortly. You will be notified once it is confirmed.'
              : 'Your payment was processed successfully.'}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Payment ID: {paymentId}</p>
          {amount != null && (
            <p className="text-sm text-muted-foreground">Amount: {INR.format(amount)}</p>
          )}
        </div>
        {onboarding ? (
          <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row">
            <Link href="/profile/status" className={buttonVariants({ className: 'flex-1' })}>
              Continue
            </Link>
            <Link
              href="/subscriptions"
              className={buttonVariants({ variant: 'secondary', className: 'flex-1' })}
            >
              View subscription
            </Link>
          </div>
        ) : (
          <Link href="/" className={buttonVariants()}>
            Go to dashboard
          </Link>
        )}
        <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-center font-serif text-2xl text-foreground">Complete your payment</h1>

        <dl className="mb-6 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Payment ID</dt>
            <dd className="font-mono text-xs text-foreground">{paymentId}</dd>
          </div>
          {amount != null && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-serif text-lg font-semibold text-foreground">{INR.format(amount)}</dd>
            </div>
          )}
          {paymentType && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium text-foreground">{PAYMENT_TYPE_LABELS[paymentType]}</dd>
            </div>
          )}
          {amount == null && !paymentType && (
            <p className="text-center text-muted-foreground">
              Confirm below to complete your payment.
            </p>
          )}
        </dl>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Link href="/" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
              Go to dashboard
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" loading={paying} disabled={cancelling} onClick={() => void handlePay()}>
            <Icon name="lock" size={16} />
            Pay now
          </Button>
          <Button variant="secondary" size="lg" loading={cancelling} disabled={paying} onClick={() => void handleCancel()}>
            Cancel payment
          </Button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="shield" size={13} />
          This is a demo gateway — no real charge is made.
        </p>
      </section>

      {/* Manual (cash/UPI) claim — only for a single contact unlock. */}
      {paymentType === 'CONTACT_UNLOCK' && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-lg text-foreground">Or pay by cash / UPI</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prefer UPI or cash? Submit your payment details and we&apos;ll verify and unlock the contact.
          </p>
          <div className="mt-4">
            <ManualPaymentForm onSubmit={handleManualSubmit} submitting={claiming} />
          </div>
        </section>
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
