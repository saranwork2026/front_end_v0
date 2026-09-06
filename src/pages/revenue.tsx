import { useParams, useSearchParams } from 'react-router-dom'

import { useDocumentTitle } from '@/src/hooks/use-document-title'
import { PlansView } from '@/components/plans/plans-view'
import { SubscriptionPaymentView } from '@/components/payments/subscription-payment-view'
import { SubscriptionsView } from '@/components/subscriptions/subscriptions-view'
import { PaymentHistoryView } from '@/components/payments/payment-history-view'
import { PaymentProcessingView } from '@/components/payments/payment-processing-view'
import { WalletView } from '@/components/wallet/wallet-view'
import { ReferralsView } from '@/components/referrals/referrals-view'

type PlansState = 'loading' | 'error' | 'ready'

const PLAN_STATES: PlansState[] = ['loading', 'error', 'ready']

export function PlansPage() {
  useDocumentTitle('Membership plans | Matrimony')
  const [params] = useSearchParams()
  const raw = params.get('state')
  const initialState = PLAN_STATES.includes(raw as PlansState) ? (raw as PlansState) : 'loading'
  return <PlansView initialState={initialState} />
}

export function PaymentPage() {
  useDocumentTitle('Payment | Matrimony')
  const [params] = useSearchParams()
  const planId = params.get('planId') ?? params.get('plan') ?? ''
  return <SubscriptionPaymentView planId={planId} />
}

export function SubscriptionsPage() {
  useDocumentTitle('Subscriptions | Matrimony')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  const planId = params.get('planId') ?? undefined
  return <SubscriptionsView state={state} planId={planId} />
}

export function PaymentHistoryPage() {
  useDocumentTitle('Payment history | Matrimony')
  const [params] = useSearchParams()
  const raw = params.get('state')
  const initialState = raw === 'loading' || raw === 'empty' ? raw : 'ready'
  return <PaymentHistoryView initialState={initialState} />
}

export function WalletPage() {
  useDocumentTitle('Wallet | Matrimony')
  const [params] = useSearchParams()
  const raw = params.get('state')
  const initialState = raw === 'loading' || raw === 'empty' ? raw : 'ready'
  return <WalletView initialState={initialState} />
}

export function ReferralsPage() {
  useDocumentTitle('Referrals | Matrimony')
  const [params] = useSearchParams()
  const state = (params.get('state') as never) ?? undefined
  return <ReferralsView state={state} />
}

export function PaymentProcessingPage() {
  useDocumentTitle('Payment | Matrimony')
  const { paymentId = '' } = useParams()
  return <PaymentProcessingView paymentId={paymentId} />
}
