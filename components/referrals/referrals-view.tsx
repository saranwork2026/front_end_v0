'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReferralSummary } from '@matrimony/shared-core'

import { Icon, type IconName } from '@/components/ui/icon'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { referralApi } from '@/src/lib/api'

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function StatCard({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-center sm:p-5">
      <span className="mx-auto flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon name={icon} className="size-4" />
      </span>
      <span className="font-serif text-2xl leading-none text-foreground sm:text-3xl">{value}</span>
      <span className="text-xs text-muted-foreground text-pretty">{label}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  )
}

export function ReferralsView(_props: { state?: string }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [summary, setSummary] = useState<ReferralSummary | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    setToasts((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), message, variant },
    ])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await referralApi.getSummary()
      setSummary(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const absoluteLink = summary
    ? summary.shareLink.startsWith('http')
      ? summary.shareLink
      : window.location.origin + summary.shareLink
    : ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteLink)
      pushToast(t('page.referrals.linkCopied'))
    } catch {
      pushToast(t('page.referrals.linkCopyError'), 'error')
    }
  }

  async function copyCode() {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary.referralCode)
      pushToast(t('page.referrals.codeCopied'))
    } catch {
      pushToast(t('page.referrals.codeCopyError'), 'error')
    }
  }

  function shareWhatsApp() {
    window.open(
      'https://wa.me/?text=' +
        encodeURIComponent(t('page.referrals.whatsappMessage') + absoluteLink),
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{t('page.referrals.eyebrow')}</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground text-balance">{t('page.referrals.title')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          {t('page.referrals.subtitle')}
        </p>
      </header>

      {loading ? (
        <LoadingState />
      ) : error || !summary ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
        >
          <Icon name="alert-circle" size={28} className="text-destructive" />
          <div>
            <p className="font-medium text-foreground">{t('page.referrals.errorTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('page.referrals.errorDesc')}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            {t('page.referrals.retry')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary to-[#5c0f26] p-5 text-primary-foreground sm:p-6">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
              <Icon name="gift" className="size-4" />
              {t('page.referrals.yourCode')}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl font-semibold tracking-[0.15em] sm:text-3xl">
                {summary.referralCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary-foreground/30 px-2.5 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
              >
                <Icon name="copy" className="size-3.5" />
                {t('page.referrals.copyCode')}
              </button>
            </div>

            <label htmlFor="share-link" className="mt-5 block text-xs font-medium text-primary-foreground/80">
              {t('page.referrals.shareLink')}
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                id="share-link"
                type="text"
                readOnly
                value={absoluteLink}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 truncate rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-2 font-mono text-xs text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary-foreground px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary-foreground/90 sm:flex-none"
                >
                  <Icon name="copy" className="size-4" />
                  {t('page.referrals.copy')}
                </button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-primary-foreground/40 px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10 sm:flex-none"
                >
                  <Icon name="chat" className="size-4" />
                  {t('page.referrals.whatsapp')}
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3">
            <StatCard label={t('page.referrals.statReferred')} value={String(summary.totalReferred)} icon="users" />
            <StatCard label={t('page.referrals.statQualified')} value={String(summary.totalQualified)} icon="circle-check" />
            <StatCard label={t('page.referrals.statRewards')} value={INR.format(summary.totalRewardEarned)} icon="gift" />
          </section>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground text-pretty">
              {t('page.referrals.walletNote')}
            </p>
            <a href="/wallet" className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'shrink-0' })}>
              {t('page.referrals.viewWallet')}
              <Icon name="arrow-right" className="size-4" />
            </a>
          </div>
        </div>
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  )
}
