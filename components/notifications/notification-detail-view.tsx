'use client'

import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Notification } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { notificationsApi } from '@/src/lib/api'
import { notificationStore } from '@/src/stores/notification'
import {
  formatNotificationFull,
  notificationHref,
  notificationIcon,
  notificationTone,
  toneClasses,
} from '@/src/lib/notifications'

export function NotificationDetailView({ id }: { id: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const stateNotification = (location.state as { notification?: Notification } | null)?.notification

  const [notification, setNotification] = useState<Notification | undefined>(stateNotification)
  const [loading, setLoading] = useState(!stateNotification)
  const [notFound, setNotFound] = useState(false)

  // No single-notification GET endpoint: resolve from router state, else scan the list.
  useEffect(() => {
    let cancelled = false
    if (stateNotification) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await notificationsApi.getNotifications({ page: 0, size: 100 })
        const found = res.data.content.find((n) => String(n.notificationId) === id)
        if (cancelled) return
        if (found) setNotification(found)
        else setNotFound(true)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, stateNotification])

  // Mark read on open if it was unread.
  useEffect(() => {
    if (!notification || notification.isRead) return
    ;(async () => {
      try {
        await notificationsApi.markRead(notification.notificationId)
        const c = notificationStore.getState().unreadCount
        notificationStore.getState().setUnreadCount(Math.max(0, c - 1))
      } catch {
        /* non-fatal */
      }
    })()
  }, [notification])

  const href = notification ? notificationHref(notification) : undefined
  const tone = notification ? toneClasses[notificationTone(notification.type)] : undefined

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <button
        type="button"
        onClick={() => navigate('/notifications')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="arrow-left" className="h-4 w-4" />
        All notifications
      </button>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-start gap-4 border-b border-border p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="space-y-2 p-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ) : notFound || !notification ? (
        <EmptyState
          icon="bell"
          title="Notification not found"
          description="This notification may have been removed or is no longer available."
        />
      ) : (
        <article className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-start gap-4 border-b border-border p-6">
            <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', tone?.wrap)}>
              <Icon name={notificationIcon(notification.type)} className={cn('h-6 w-6', tone?.icon)} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-xl text-foreground text-balance sm:text-2xl">{notification.title}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{formatNotificationFull(notification.createdAt)}</p>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm leading-relaxed text-foreground/90">{notification.message}</p>

            {href && (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <RouterLink to={href} className={cn(buttonVariants({ variant: 'primary' }), 'sm:w-auto')}>
                  View
                  <Icon name="arrow-right" className="h-4 w-4" />
                </RouterLink>
                <Button variant="ghost" onClick={() => navigate('/notifications')} className="sm:w-auto">
                  Back to inbox
                </Button>
              </div>
            )}
          </div>
        </article>
      )}
    </main>
  )
}
