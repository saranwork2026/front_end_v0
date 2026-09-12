'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  EventPolicyView,
  ChannelPolicyView,
  NotificationPolicyChannel,
} from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { adminApi } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/auth'

const CHANNELS: NotificationPolicyChannel[] = ['IN_APP', 'PUSH', 'EMAIL', 'SMS']

const CHANNEL_LABEL: Record<NotificationPolicyChannel, string> = {
  IN_APP: 'In-App',
  PUSH: 'Push',
  EMAIL: 'Email',
  SMS: 'SMS',
}

const CATEGORY_LABEL: Record<string, string> = {
  ACCOUNT: 'Account',
  PROFILE: 'Profile',
  INTEREST: 'Interests',
  ACCESS: 'Access Requests',
  MESSAGING: 'Messaging',
  SUBSCRIPTION: 'Subscription & Payments',
  ANNOUNCEMENT: 'Announcements',
}

function prettifyEvent(eventType: string): string {
  return eventType
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** A single togglable channel cell. */
function ChannelToggle({
  policy,
  canEdit,
  busy,
  onToggle,
}: {
  policy: ChannelPolicyView | undefined
  canEdit: boolean
  busy: boolean
  onToggle: (next: boolean) => void
}) {
  if (!policy) {
    return (
      <td className="px-3 py-2.5 text-center align-middle">
        <span className="text-muted-foreground/40" aria-label="Not applicable">
          —
        </span>
      </td>
    )
  }

  const locked = policy.mandatory || !policy.adapterAvailable || !canEdit
  const note = policy.mandatory ? 'Required' : !policy.adapterAvailable ? 'Unavailable' : undefined

  return (
    <td className="px-3 py-2.5 text-center align-middle">
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          role="switch"
          aria-checked={policy.enabled}
          aria-label={`${CHANNEL_LABEL[policy.channel]} ${policy.enabled ? 'on' : 'off'}`}
          disabled={locked || busy}
          onClick={() => onToggle(!policy.enabled)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
            policy.enabled ? 'bg-primary' : 'bg-muted-foreground/30',
            locked || busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          <span
            className={cn(
              'inline-block size-5 transform rounded-full bg-white shadow transition-transform',
              policy.enabled ? 'translate-x-5' : 'translate-x-1',
            )}
          />
        </button>
        {note && (
          <span className="flex items-center gap-0.5 text-[10px] leading-tight text-muted-foreground">
            {policy.mandatory && <Icon name="lock" className="size-2.5" />}
            {note}
          </span>
        )}
      </div>
    </td>
  )
}

export function AdminNotificationPolicyView() {
  const role = useAuthStore((s) => s.role)
  // Global, high-impact setting — edits are approver-only (mirrors broadcast).
  const canEdit = role === 'ADMIN_APPROVER'

  const [rows, setRows] = useState<EventPolicyView[]>([])
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function pushToast(message: string, variant: ToastItem['variant']) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setErrored(false)
    try {
      const res = await adminApi.getNotificationPolicy()
      setRows(res.data ?? [])
    } catch {
      setErrored(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const findChannel = (row: EventPolicyView, channel: NotificationPolicyChannel) =>
    row.channels.find((c) => c.channel === channel)

  async function handleToggleChannel(
    row: EventPolicyView,
    channel: NotificationPolicyChannel,
    enabled: boolean,
  ) {
    const current = findChannel(row, channel)
    if (!current) return
    setBusyKey(`${row.eventType}:${channel}`)
    try {
      await adminApi.updateNotificationChannel(row.eventType, channel, {
        enabled,
        mandatory: current.mandatory,
      })
      pushToast('Notification setting updated.', 'success')
      await load()
    } catch {
      pushToast('Could not update the setting. Please try again.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleToggleAll(row: EventPolicyView, enabled: boolean) {
    setBusyKey(`${row.eventType}:ALL`)
    try {
      await adminApi.toggleNotificationEventChannels(row.eventType, { enabled })
      pushToast('Notification setting updated.', 'success')
      await load()
    } catch {
      pushToast('Could not update the setting. Please try again.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleReset(row: EventPolicyView) {
    setBusyKey(`${row.eventType}:RESET`)
    try {
      await adminApi.resetNotificationEvent(row.eventType)
      pushToast('Reset to defaults.', 'success')
      await load()
    } catch {
      pushToast('Could not reset. Please try again.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, EventPolicyView[]>()
    for (const row of rows) {
      const list = map.get(row.category) ?? []
      list.push(row)
      map.set(row.category, list)
    }
    return Array.from(map.entries())
  }, [rows])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-2">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Notification Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control which channels are used for each notification event. Toggle a single channel, or use All on / All off
          for an event.
        </p>
      </div>

      {!canEdit && (
        <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4">
          <Icon name="lock" className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-foreground">Read-only access</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Only an admin approver can change notification settings. You can view the current configuration below.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      ) : errored ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-12 text-center">
          <Icon name="alert-circle" className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Could not load notification settings.</p>
          <Button variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
          <Icon name="bell" className="size-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No notification events</p>
          <p className="text-sm text-muted-foreground">Notification events will appear here once configured.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, events]) => (
            <section key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[category] ?? category}
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-3 py-2.5 text-left font-medium">Event</th>
                      {CHANNELS.map((c) => (
                        <th key={c} className="px-3 py-2.5 text-center font-medium">
                          {CHANNEL_LABEL[c]}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((row) => {
                      const rowBusy = busyKey?.startsWith(`${row.eventType}:`) ?? false
                      return (
                        <tr key={row.eventType} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2.5 align-middle">
                            <span className="font-medium text-foreground">{prettifyEvent(row.eventType)}</span>
                          </td>
                          {CHANNELS.map((c) => (
                            <ChannelToggle
                              key={c}
                              policy={findChannel(row, c)}
                              canEdit={canEdit}
                              busy={rowBusy}
                              onToggle={(next) => void handleToggleChannel(row, c, next)}
                            />
                          ))}
                          <td className="px-3 py-2.5 align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!canEdit || rowBusy}
                                onClick={() => void handleToggleAll(row, true)}
                              >
                                All on
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!canEdit || rowBusy}
                                onClick={() => void handleToggleAll(row, false)}
                              >
                                All off
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Reset to defaults"
                                disabled={!canEdit || rowBusy}
                                onClick={() => void handleReset(row)}
                              >
                                <Icon name="refresh" className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-4 text-xs text-muted-foreground">
        Required channels (e.g. OTP, payment and account emails) are always on and cannot be turned off. Push shows as
        unavailable until push delivery is enabled. Reset reverts an event to its default channels.
      </div>

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
