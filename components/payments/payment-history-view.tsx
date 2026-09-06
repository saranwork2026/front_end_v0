'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { Payment } from '@matrimony/shared-core'

import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import { paymentsApi } from '@/src/lib/api'

const PAGE_SIZE = 10

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const paymentDate = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const referenceTypeLabel: Record<Payment['paymentReferenceType'], string> = {
  SUBSCRIPTION: 'Subscription',
  WALLET_RECHARGE: 'Wallet recharge',
  CONTACT_UNLOCK: 'Contact unlock',
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

interface PaymentHistoryViewProps {
  /** Kept for the page wrapper; data is always fetched from the real API. */
  initialState?: 'loading' | 'ready' | 'empty'
}

export function PaymentHistoryView(_props: PaymentHistoryViewProps) {
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [all, setAll] = useState<Payment[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await paymentsApi.getPaymentHistory()
      const sorted = [...(res.data ?? [])].sort(
        (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
      )
      setAll(sorted)
      setPage(0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const items = all.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Billing</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground text-balance">Payment history</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          A record of every subscription and contact-unlock payment on your account.
        </p>
      </header>

      {loading ? (
        <HistorySkeleton />
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center"
        >
          <p className="text-sm text-destructive">We could not load your payments. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="No payments yet"
          description="When you subscribe to a plan or unlock a contact, your receipts will appear here."
          action={
            <Link href="/plans" className={cn(buttonVariants({ variant: 'primary' }))}>
              View plans
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Receipt</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Gateway</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((txn) => (
                  <tr key={txn.paymentId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {shortId(txn.paymentId)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {paymentDate.format(new Date(txn.paymentDate))}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {referenceTypeLabel[txn.paymentReferenceType]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{txn.paymentGateway}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                      {INR.format(txn.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <ul className="flex flex-col gap-3 md:hidden">
            {items.map((txn) => (
              <li key={txn.paymentId}>
                <PaymentCard txn={txn} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}
    </main>
  )
}

function PaymentCard({ txn }: { txn: Payment }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {referenceTypeLabel[txn.paymentReferenceType]}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{shortId(txn.paymentId)}</p>
        </div>
        <StatusBadge status={txn.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Amount</dt>
          <dd className="mt-0.5 font-medium text-foreground">{INR.format(txn.amount)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Gateway</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-foreground">
            <Icon name="wallet" size={15} className="text-muted-foreground" />
            {txn.paymentGateway}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Transaction</dt>
          <dd className="mt-0.5 truncate font-mono text-xs text-foreground">
            {txn.transactionId ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Date</dt>
          <dd className="mt-0.5 text-foreground">{paymentDate.format(new Date(txn.paymentDate))}</dd>
        </div>
      </dl>
    </article>
  )
}

function HistorySkeleton() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <div className="border-b border-border bg-secondary/50 px-4 py-3">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
