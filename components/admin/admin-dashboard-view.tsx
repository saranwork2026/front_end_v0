'use client'

import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import type { AdminAnalytics } from '@matrimony/shared-core'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon, type IconName } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BarChart, type BarDatum } from '@/components/admin/bar-chart'
import { adminApi } from '@/src/lib/api'

type State = 'ready' | 'loading' | 'error'

const currencyINR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

interface Kpi {
  key: string
  label: string
  value: number
  icon: IconName
  format?: 'number' | 'currency'
  delta?: string
}

interface Alert {
  key: string
  label: string
  count: number
  href: string
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  icon: IconName
}

const QUICK_LINKS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Manage users', href: '/admin/users', icon: 'users' },
  { label: 'Moderation queue', href: '/admin/moderation', icon: 'shield' },
  { label: 'Send broadcast', href: '/admin/broadcast', icon: 'megaphone' },
  { label: 'Subscription plans', href: '/admin/plans', icon: 'wallet' },
  { label: 'Audit log', href: '/admin/audit', icon: 'layers' },
  { label: 'Admin sessions', href: '/admin/sessions', icon: 'clock' },
]

/** Short weekday/day label for the 30-day registrations trend. */
function trendLabel(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(d)
}

interface AdminDashboardViewProps {
  initialState?: State
}

export function AdminDashboardView({ initialState }: AdminDashboardViewProps) {
  const [state, setState] = useState<State>(initialState === 'loading' ? 'loading' : 'loading')
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [pending, setPending] = useState<{ profiles: number; photos: number; payments: number } | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const [analyticsRes, profilesRes, photosRes, paymentsRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getPendingProfiles({ page: 0, size: 1 }).catch(() => null),
        adminApi.getPendingPhotos({ page: 0, size: 1 }).catch(() => null),
        adminApi.getPendingPayments().catch(() => null),
      ])
      setAnalytics(analyticsRes.data)
      setPending({
        profiles: profilesRes?.data?.totalElements ?? 0,
        photos: photosRes?.data?.totalElements ?? 0,
        payments: paymentsRes?.data?.length ?? 0,
      })
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const kpis: Kpi[] = analytics
    ? [
        {
          key: 'members',
          label: 'Total members',
          value: analytics.totalUsers,
          icon: 'users',
          delta: analytics.newUsersToday > 0 ? `+${analytics.newUsersToday} today` : undefined,
        },
        {
          key: 'active',
          label: 'Active members',
          value: analytics.activeUsers,
          icon: 'sparkles',
          delta: analytics.newUsersLast7Days > 0 ? `+${analytics.newUsersLast7Days} this week` : undefined,
        },
        {
          key: 'subscriptions',
          label: 'Active subscriptions',
          value: analytics.activeSubscriptions,
          icon: 'wallet',
        },
        {
          key: 'revenue',
          label: 'Total revenue',
          value: analytics.totalRevenue,
          icon: 'bar-chart',
          format: 'currency',
          delta:
            analytics.revenueLast30Days > 0
              ? `${currencyINR.format(analytics.revenueLast30Days)} last 30d`
              : undefined,
        },
      ]
    : []

  const alerts: Alert[] = analytics
    ? [
        {
          key: 'profiles',
          label: 'Profiles awaiting approval',
          count: pending?.profiles ?? 0,
          href: '/admin/moderation',
          tone: 'warning',
          icon: 'shield',
        },
        {
          key: 'photos',
          label: 'Photos awaiting review',
          count: pending?.photos ?? 0,
          href: '/admin/moderation',
          tone: 'warning',
          icon: 'photo',
        },
        {
          key: 'payments',
          label: 'Manual payments to verify',
          count: pending?.payments ?? analytics.pendingVerificationPaymentsCount,
          href: '/admin/moderation',
          tone: 'primary',
          icon: 'wallet',
        },
        {
          key: 'otp',
          label: 'Members pending OTP',
          count: analytics.otpPendingUsers,
          href: '/admin/users',
          tone: 'neutral',
          icon: 'clock',
        },
        {
          key: 'blocked',
          label: 'Blocked members',
          count: analytics.blockedUsers,
          href: '/admin/flagged',
          tone: 'danger',
          icon: 'alert-circle',
        },
      ]
    : []

  const registrationsChart: BarDatum[] = (analytics?.registrationsTrend ?? [])
    .slice(-14)
    .map((d) => ({ label: trendLabel(d.date), value: d.count }))
  const plansChart: BarDatum[] = (analytics?.activeSubscriptionsByPlan ?? []).map((p) => ({
    label: p.label,
    value: p.count,
  }))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground text-balance sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance.</p>
        </div>
        <Button variant="secondary" size="icon" aria-label="Refresh analytics" onClick={() => void load()}>
          <Icon name="refresh" size={18} />
        </Button>
      </div>

      {state === 'error' ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-6 text-warning-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <Icon name="alert-circle" size={22} />
            <div>
              <p className="font-semibold">Analytics unavailable</p>
              <p className="text-sm opacity-90">We could not load the latest figures. Please try again.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {state === 'loading'
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
                      <Skeleton className="size-9 rounded-full" />
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </CardContent>
                  </Card>
                ))
              : kpis.map((kpi) => (
                  <Card key={kpi.key}>
                    <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name={kpi.icon} size={18} />
                      </span>
                      <p className="font-serif text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                        {kpi.format === 'currency'
                          ? currencyINR.format(kpi.value)
                          : kpi.value.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                      {kpi.delta && (
                        <span className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-success">
                          {kpi.delta}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))}
          </section>

          {/* Charts */}
          <section aria-label="Trends" className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New registrations</CardTitle>
              </CardHeader>
              <CardContent>
                {state === 'loading' ? (
                  <Skeleton className="h-40 w-full" />
                ) : registrationsChart.some((d) => d.value > 0) ? (
                  <BarChart
                    data={registrationsChart}
                    caption="New member registrations per day (last 14 days)."
                    formatValue={(v) => v.toLocaleString('en-IN')}
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">No registrations in this window.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active subscriptions by plan</CardTitle>
              </CardHeader>
              <CardContent>
                {state === 'loading' ? (
                  <Skeleton className="h-40 w-full" />
                ) : plansChart.length > 0 ? (
                  <BarChart
                    data={plansChart}
                    caption="Active subscriptions grouped by plan tier."
                    formatValue={(v) => v.toLocaleString('en-IN')}
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">No active subscriptions yet.</p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Operational alerts + quick links */}
          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Needs attention</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {state === 'loading'
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
                  : alerts.map((alert) => (
                      <Link
                        key={alert.key}
                        to={alert.href}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3 transition-colors hover:bg-secondary"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                            <Icon name={alert.icon} size={18} />
                          </span>
                          <span className="truncate text-sm font-medium text-foreground">{alert.label}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge variant={alert.tone}>{alert.count}</Badge>
                          <Icon name="chevron-right" size={16} className="text-muted-foreground" />
                        </span>
                      </Link>
                    ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick links</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex flex-col items-start gap-2 rounded-xl border border-border/70 p-3 transition-colors hover:bg-secondary"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name={link.icon} size={18} />
                    </span>
                    <span className="text-sm font-medium text-foreground">{link.label}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
