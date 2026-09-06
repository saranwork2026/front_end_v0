'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WalletTransaction } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { walletApi } from '@/src/lib/api'

const PAGE_SIZE = 10
const MIN_TOPUP = 1
const MAX_TOPUP = 999999

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const walletDate = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const WALLET_PRESETS = [199, 499, 999, 2499]

type LoadState = 'loading' | 'ready' | 'empty'

interface WalletViewProps {
  /** Kept for the page wrapper; data is always fetched from the real API. */
  initialState?: LoadState
}

/** Client-side range check (1–999999). Returns error message or null. */
function validateTopupAmount(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Enter an amount to top up.'
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return 'Enter a valid amount.'
  if (value < MIN_TOPUP) return `Minimum top-up is ${INR.format(MIN_TOPUP)}.`
  if (value > MAX_TOPUP) return `Maximum top-up is ${INR.format(MAX_TOPUP)}.`
  return null
}

export function WalletView(_props: WalletViewProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])

  const [amount, setAmount] = useState('')
  const [gateway, setGateway] = useState('MOCK')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  function pushToast(message: string, variant: ToastItem['variant']) {
    setToasts((t) => [...t, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }])
  }
  function dismissToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id))
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [walletRes, txnsRes] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactions(),
      ])
      setBalance(walletRes.data?.balance ?? 0)
      setTransactions(txnsRes.data ?? [])
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

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    const err = validateTopupAmount(amount)
    setAmountError(err)
    if (err) {
      pushToast('Please fix the amount before continuing.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await walletApi.topup({ amount: Number(amount), paymentGateway: gateway })
      pushToast('Redirecting to payment…', 'success')
      navigate(`/payments/${res.data.paymentId}`, {
        state: { amount: res.data.amount, paymentType: 'WALLET_RECHARGE' as const },
      })
    } catch (topupErr) {
      const message =
        (topupErr as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'We could not start your top-up. Please try again.'
      pushToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))
  const items = transactions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Billing</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground text-balance">Wallet</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Top up your wallet to unlock contacts and pay for add-ons instantly.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center"
        >
          <p className="text-sm text-destructive">We could not load your wallet. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Balance + top-up: stacked on mobile, side-by-side from lg */}
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <BalanceCard balance={balance} loading={loading} />

            <form
              onSubmit={handleTopup}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6"
              noValidate
            >
              <h2 className="font-serif text-xl text-foreground">Add money</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter an amount between {INR.format(MIN_TOPUP)} and {INR.format(MAX_TOPUP)}.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {WALLET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(String(preset))
                      setAmountError(null)
                    }}
                    className="rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {INR.format(preset)}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Amount (₹)"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    if (amountError) setAmountError(null)
                  }}
                  error={amountError ?? undefined}
                />
                <Select
                  label="Payment gateway"
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                >
                  <option value="MOCK">Test gateway (Mock)</option>
                </Select>
              </div>

              <Button type="submit" size="lg" loading={submitting} className="mt-5 w-full">
                {submitting ? 'Starting top-up…' : 'Top up wallet'}
              </Button>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="shield" size={13} />
                You&apos;ll confirm the payment on the next screen before any money moves.
              </p>
            </form>
          </div>

          {/* Ledger */}
          <section className="mt-10">
            <h2 className="mb-4 font-serif text-xl text-foreground">Transaction history</h2>

            {loading ? (
              <LedgerSkeleton />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon="wallet"
                title="No wallet activity yet"
                description="Once you top up or spend from your wallet, every entry will appear here."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                        <th scope="col" className="px-4 py-3 font-medium">Date</th>
                        <th scope="col" className="px-4 py-3 font-medium">Description</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((txn) => (
                        <tr key={txn.transactionId} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {txn.transactionId}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-foreground">
                            {walletDate.format(new Date(txn.createdAt))}
                          </td>
                          <td className="px-4 py-3 text-foreground">{txn.referenceType}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                            <AmountText txn={txn} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {INR.format(txn.balanceAfterTransaction)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <ul className="flex flex-col gap-3 md:hidden">
                  {items.map((txn) => (
                    <li key={txn.transactionId}>
                      <LedgerCard txn={txn} />
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
          </section>
        </>
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}

function BalanceCard({ balance, loading }: { balance: number; loading: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary p-6 text-primary-foreground">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary-foreground/70">
        <Icon name="wallet" size={15} />
        Available balance
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-10 w-40 bg-primary-foreground/20" />
      ) : (
        <p className="mt-3 font-serif text-4xl tracking-tight">{INR.format(balance)}</p>
      )}
      <p className="mt-2 text-sm text-primary-foreground/70">
        Spend on contact unlocks and premium add-ons.
      </p>
    </div>
  )
}

function AmountText({ txn }: { txn: WalletTransaction }) {
  const credit = txn.type === 'CREDIT'
  return (
    <span className={credit ? 'text-success' : 'text-foreground'}>
      {credit ? '+' : '−'}
      {INR.format(txn.amount)}
    </span>
  )
}

function LedgerCard({ txn }: { txn: WalletTransaction }) {
  const credit = txn.type === 'CREDIT'
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{txn.referenceType}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{txn.transactionId}</p>
        </div>
        <p className={`text-lg font-semibold ${credit ? 'text-success' : 'text-foreground'}`}>
          {credit ? '+' : '−'}
          {INR.format(txn.amount)}
        </p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
          <p className="mt-0.5 text-foreground">{walletDate.format(new Date(txn.createdAt))}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
          <p className="mt-0.5 tabular-nums text-foreground">
            {INR.format(txn.balanceAfterTransaction)}
          </p>
        </div>
      </div>
    </article>
  )
}

function LedgerSkeleton() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <div className="border-b border-border bg-secondary/50 px-4 py-3">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
