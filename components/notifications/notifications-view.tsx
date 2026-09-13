'use client'

import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Notification, PaginatedResponse } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { notificationsApi } from '@/src/lib/api'
import { notificationStore } from '@/src/stores/notification'
import {
  formatNotificationTime,
  notificationIcon,
  notificationTone,
  toneClasses,
} from '@/src/lib/notifications'

const PAGE_SIZE = 10
type ViewState = 'ready' | 'loading' | 'empty' | 'error'

export function NotificationsView({
  state,
  initialPage = 1,
}: {
  state?: ViewState
  initialPage?: number
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(initialPage - 1) // 0-indexed internally
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [results, setResults] = useState<PaginatedResponse<Notification> | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = (message: string, variant: ToastItem['variant'] = 'info') =>
    setToasts((t) => [...t, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }])

  const load = useCallback(async () => {
    if (state === 'loading') return
    setLoading(true)
    setError(false)
    try {
      const res = await notificationsApi.getNotifications({ page, size: PAGE_SIZE })
      setResults(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, state])

  useEffect(() => {
    if (state === 'empty') {
      setResults({ content: [], totalElements: 0, totalPages: 0, size: PAGE_SIZE, number: 0 })
      setLoading(false)
      return
    }
    void load()
  }, [load, state])

  const items = results?.content ?? []
  const isLoading = state === 'loading' || loading
  const hasUnread = items.some((n) => !n.isRead)

  async function openNotification(n: Notification) {
    if (!n.isRead) {
      setResults((prev) =>
        prev ? { ...prev, content: prev.content.map((x) => (x.notificationId === n.notificationId ? { ...x, isRead: true } : x)) } : prev,
      )
      try {
        await notificationsApi.markRead(n.notificationId)
        const c = notificationStore.getState().unreadCount
        notificationStore.getState().setUnreadCount(Math.max(0, c - 1))
      } catch {
        /* non-fatal */
      }
    }
    navigate(`/notifications/${n.notificationId}`, { state: { notification: n } })
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead()
      setResults((prev) => (prev ? { ...prev, content: prev.content.map((x) => ({ ...x, isRead: true })) } : prev))
      notificationStore.getState().setUnreadCount(0)
      pushToast(t('page.notifications.markAllReadToast'), 'success')
    } catch {
      pushToast(t('page.notifications.markAllReadError'), 'error')
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{t('page.notifications.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('page.notifications.headerSubtitle')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void markAllRead()} disabled={!hasUnread}>
          {t('page.notifications.markAllRead')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">{t('page.notifications.errorLoad')}</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              {t('page.notifications.retry')}
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="bell"
          title={t('page.notifications.emptyTitle')}
          description={t('page.notifications.emptyDesc')}
        />
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((n) => {
              const tone = toneClasses[notificationTone(n.type)]
              return (
                <li key={n.notificationId}>
                  <button
                    type="button"
                    onClick={() => void openNotification(n)}
                    className={cn(
                      'flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors',
                      n.isRead ? 'border-border bg-card hover:bg-muted/50' : 'border-primary/30 bg-primary/5 hover:bg-primary/10',
                    )}
                  >
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone.wrap)}>
                      <Icon name={notificationIcon(n.type)} className={cn('h-5 w-5', tone.icon)} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn('truncate text-sm', n.isRead ? 'font-medium text-foreground' : 'font-semibold text-foreground')}>
                          {n.title}
                        </span>
                        {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label={t('page.notifications.unread')} />}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{n.message}</span>
                      <span className="mt-1.5 block text-xs text-muted-foreground/80">{formatNotificationTime(n.createdAt)}</span>
                    </span>
                    <Icon name="arrow-right" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>

          {(results?.totalPages ?? 0) > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={page} totalPages={results?.totalPages ?? 0} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </main>
  )
}
