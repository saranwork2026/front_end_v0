'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { UnlockedContact } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { contactsApi } from '@/src/lib/api'

type ViewState = 'ready' | 'loading' | 'empty' | 'error'

const PAGE_SIZE = 6

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const sourceVariant: Record<UnlockedContact['paymentSource'], 'success' | 'gold'> = {
  PAYMENT: 'success',
  SUBSCRIPTION: 'gold',
}
const sourceLabel: Record<UnlockedContact['paymentSource'], string> = {
  PAYMENT: 'Paid',
  SUBSCRIPTION: 'Plan',
}

function fullName(c: UnlockedContact) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.profileId
}

function formatUnlockedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ContactsView({ state }: { state?: ViewState }) {
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [all, setAll] = useState<UnlockedContact[]>([])

  const load = useCallback(async () => {
    if (state === 'loading') return
    setLoading(true)
    setError(false)
    try {
      const res = await contactsApi.getUnlockedContacts()
      setAll(res.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [state])

  useEffect(() => {
    if (state === 'empty') {
      setAll([])
      setLoading(false)
      return
    }
    void load()
  }, [load, state])

  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const items = all.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const isLoading = state === 'loading' || loading

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Unlocked contacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phone numbers and emails you have unlocked. Reach out directly.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">We could not load your contacts. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon="phone"
          title="No unlocked contacts yet"
          description="When you unlock a member's phone or email, their contact details will be saved here for easy access."
          action={
            <Link href="/matches" className={cn(buttonVariants({ variant: 'primary' }))}>
              Browse matches
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Profile</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Unlocked</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.profileId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/profile/${c.profileId}`} className="flex items-center gap-3 hover:underline">
                        <Avatar contact={c} />
                        <span className="font-medium text-foreground">{fullName(c)}</span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <a href={`tel:${c.mobileNo.replace(/\s/g, '')}`} className="font-mono text-foreground hover:underline">
                        {c.mobileNo}
                      </a>
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="block truncate text-foreground hover:underline">
                          {c.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-foreground">
                      {c.amountCharged > 0 ? INR.format(c.amountCharged) : 'Free'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sourceVariant[c.paymentSource]}>{sourceLabel[c.paymentSource]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatUnlockedDate(c.unlockedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <ul className="space-y-3 md:hidden">
            {items.map((c) => (
              <li key={c.profileId} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/profile/${c.profileId}`} className="flex min-w-0 items-center gap-3">
                    <Avatar contact={c} />
                    <span className="truncate font-medium text-foreground">{fullName(c)}</span>
                  </Link>
                  <Badge variant={sourceVariant[c.paymentSource]}>{sourceLabel[c.paymentSource]}</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="phone" className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a href={`tel:${c.mobileNo.replace(/\s/g, '')}`} className="font-mono text-foreground">
                      {c.mobileNo}
                    </a>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Icon name="mail" className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <a href={`mailto:${c.email}`} className="truncate text-foreground">
                        {c.email}
                      </a>
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                    <span>{c.amountCharged > 0 ? INR.format(c.amountCharged) : 'Free'}</span>
                    <span>Unlocked {formatUnlockedDate(c.unlockedAt)}</span>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={page} totalPages={pageCount} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </main>
  )
}

function Avatar({ contact }: { contact: UnlockedContact }) {
  return (
    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
      <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
        {fullName(contact).charAt(0).toUpperCase()}
      </span>
    </span>
  )
}
