'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FlaggedMessage, PaginatedResponse } from '@matrimony/shared-core'

import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { Dialog } from '@/components/ui/dialog'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { adminApi } from '@/src/lib/api'

const PAGE_SIZE = 20

type PendingAction = { message: FlaggedMessage; action: 'REMOVE' | 'DISMISS' }

function flaggedDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminFlaggedMessagesView(_props: { state?: 'ready' | 'loading' | 'empty' }) {
  const [page, setPage] = useState(0)
  const [messages, setMessages] = useState<FlaggedMessage[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function pushToast(message: string, variant: ToastItem['variant'] = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adminApi.getFlaggedMessages(page, PAGE_SIZE)
      const data = res.data as PaginatedResponse<FlaggedMessage>
      setMessages(data.content ?? [])
      setTotalPages(data.totalPages ?? 0)
      setTotalElements(data.totalElements ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  async function confirmAction() {
    if (!pending) return
    setSubmitting(true)
    try {
      if (pending.action === 'REMOVE') {
        await adminApi.deleteFlaggedMessage(pending.message.messageId)
        pushToast('Message removed from the conversation.', 'success')
      } else {
        await adminApi.dismissMessageFlag(pending.message.messageId)
        pushToast('Flag dismissed.', 'success')
      }
      setMessages((prev) => prev.filter((m) => m.messageId !== pending.message.messageId))
      setPending(null)
    } catch {
      pushToast('Something went wrong. Try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-foreground">Flagged messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat messages members have flagged for review. Remove abusive content to retract it from
          the conversation, or dismiss the flag if it is acceptable.
        </p>
      </header>

      {!loading && !error && messages.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {totalElements} flagged {totalElements === 1 ? 'message' : 'messages'}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">We could not load flagged messages. Please try again.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon="chat"
          title="No flagged messages"
          description="Member-flagged chat messages will appear here."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.messageId} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  {m.senderProfileId ? (
                    <Link
                      to={`/admin/users/${m.senderProfileId}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {m.senderName ?? m.senderProfileId}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{m.senderName ?? 'Unknown'}</span>
                  )}
                  {m.flaggedByProfileId && (
                    <span className="text-xs text-muted-foreground">· flagged by {m.flaggedByProfileId}</span>
                  )}
                  {m.flagReason && (
                    <Badge variant="warning" className="ml-1">
                      {m.flagReason}
                    </Badge>
                  )}
                </div>

                <blockquote className="mt-3 whitespace-pre-wrap break-words rounded-lg border-l-2 border-destructive/60 bg-destructive/5 px-3 py-2 text-sm text-foreground">
                  {m.content}
                </blockquote>

                <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">#{m.messageId}</span> · {flaggedDate(m.sentAt)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPending({ message: m, action: 'DISMISS' })}
                    >
                      Dismiss flag
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPending({ message: m, action: 'REMOVE' })}
                    >
                      Remove message
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <Dialog
        open={pending !== null}
        onClose={() => !submitting && setPending(null)}
        title={pending?.action === 'REMOVE' ? 'Remove this message?' : 'Dismiss this flag?'}
      >
        {pending && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {pending.action === 'REMOVE'
                ? 'The message will be retracted from the conversation for both members. This cannot be undone.'
                : 'The report will be closed and the message will stay visible in the conversation.'}
            </p>
            <blockquote className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {pending.message.content}
            </blockquote>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPending(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant={pending.action === 'REMOVE' ? 'danger' : 'primary'}
                onClick={confirmAction}
                loading={submitting}
              >
                {pending.action === 'REMOVE' ? 'Remove message' : 'Dismiss flag'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
