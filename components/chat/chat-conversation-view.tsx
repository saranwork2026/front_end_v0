'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { ApiError, Conversation, Message } from '@matrimony/shared-core'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { authStore, chatApi } from '@/src/lib/api'
import { connectChatSocket, disconnectChatSocket, type ChatSocketHandle } from '@/src/lib/chatSocket'

type ConversationState = 'ready' | 'loading' | 'blocked'

const PAGE_SIZE = 20
const POLL_INTERVAL_MS = 10_000
const TYPING_STOP_DELAY_MS = 3_000
const MESSAGE_MAX = 2000

// The WebSocket handshake goes to the backend origin directly (not through the
// /api/v1 REST prefix) — strip that suffix off the configured API base URL. In
// dev this resolves to '' (same-origin) and the SockJS handshake to the Vite
// dev server has no WS route, so the client stays disconnected and the REST
// polling fallback drives delivery — exactly the designed resilience path.
const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/api\/v1\/?$/, '')

interface Props {
  profileId: string
  state?: ConversationState
}

function clockTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso))
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date()
  yest.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yest)) return 'Yesterday'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

export function ChatConversationView({ profileId, state = 'ready' }: Props) {
  const currentProfileId = authStore.getState().profileId

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(state !== 'blocked')
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<'quota' | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isBlocked, setIsBlocked] = useState(state === 'blocked')
  const [connected, setConnected] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const socketRef = useRef<ChatSocketHandle | null>(null)
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingSentRef = useRef(false)
  const partnerTypingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // De-dup-by-messageId append, shared by the WS handler and the REST polling
  // fallback so a message delivered by one path is never duplicated.
  const appendIncoming = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.messageId))
      const uniqueNew = incoming.filter((m) => !ids.has(m.messageId))
      if (uniqueNew.length === 0) return prev
      return [...prev, ...uniqueNew]
    })
  }, [])

  const clearPartnerTyping = useCallback(() => {
    if (partnerTypingClearRef.current) {
      clearTimeout(partnerTypingClearRef.current)
      partnerTypingClearRef.current = null
    }
    setPartnerTyping(false)
  }, [])

  // Conversation metadata (name + isBlocked) — no per-partner endpoint exists,
  // so find it in the conversations list (mirrors the existing app).
  useEffect(() => {
    if (!profileId || state === 'blocked') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await chatApi.getConversations()
        const conv = res.data.find((c) => c.otherProfileId === profileId)
        if (cancelled || !conv) return
        setConversation(conv)
        setIsBlocked(conv.isBlocked)
      } catch {
        /* non-critical */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profileId, state])

  // Initial message load.
  useEffect(() => {
    if (!profileId || state === 'blocked') return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await chatApi.getMessages(profileId, { page: 0, size: PAGE_SIZE })
        if (cancelled) return
        // API returns newest-first; reverse for oldest-first display.
        setMessages([...res.data.content].reverse())
        setTotalPages(res.data.totalPages)
        setCurrentPage(0)
      } catch {
        if (!cancelled) setError('We could not load this conversation. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profileId, state])

  useLayoutEffect(() => {
    if (!loading && (messages.length > 0 || partnerTyping)) scrollToBottom()
  }, [loading, messages.length, partnerTyping, scrollToBottom])

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !profileId) return
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await chatApi.getMessages(profileId, { page: 0, size: PAGE_SIZE })
        appendIncoming([...res.data.content].reverse())
      } catch {
        /* silent fail for polling */
      }
    }, POLL_INTERVAL_MS)
  }, [profileId, appendIncoming])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  // Live delivery via STOMP-over-SockJS, with REST polling fallback while
  // disconnected.
  useEffect(() => {
    if (!profileId || isBlocked || state === 'blocked') return

    startPolling()

    const handle = connectChatSocket(WS_BASE_URL, {
      onMessage: (message) => {
        if (message.senderProfileId === profileId) clearPartnerTyping()
        appendIncoming([message])
      },
      onTyping: (event) => {
        if (event.fromProfileId !== profileId) return
        if (partnerTypingClearRef.current) clearTimeout(partnerTypingClearRef.current)
        if (event.typing) {
          setPartnerTyping(true)
          partnerTypingClearRef.current = setTimeout(() => setPartnerTyping(false), TYPING_STOP_DELAY_MS + 2000)
        } else {
          setPartnerTyping(false)
        }
      },
      onReadReceipt: (event) => {
        if (event.byProfileId !== profileId) return
        setMessages((prev) =>
          prev.some((m) => m.senderProfileId === currentProfileId && !m.isRead)
            ? prev.map((m) => (m.senderProfileId === currentProfileId ? { ...m, isRead: true } : m))
            : prev,
        )
      },
      onConnect: () => {
        setConnected(true)
        stopPolling()
      },
      onDisconnect: () => {
        setConnected(false)
        startPolling()
      },
    })
    socketRef.current = handle

    return () => {
      disconnectChatSocket(socketRef.current)
      socketRef.current = null
      stopPolling()
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
      if (partnerTypingClearRef.current) clearTimeout(partnerTypingClearRef.current)
      typingSentRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, isBlocked, state])

  async function handleLoadOlder() {
    if (!profileId || loadingOlder) return
    const nextPage = currentPage + 1
    if (nextPage >= totalPages) return
    setLoadingOlder(true)
    try {
      const res = await chatApi.getMessages(profileId, { page: nextPage, size: PAGE_SIZE })
      const older = [...res.data.content].reverse()
      setMessages((prev) => [...older, ...prev])
      setCurrentPage(nextPage)
      setTotalPages(res.data.totalPages)
    } catch {
      setError('We could not load older messages.')
    } finally {
      setLoadingOlder(false)
    }
  }

  const signalTyping = useCallback(() => {
    const handle = socketRef.current
    if (!handle || !profileId) return
    if (!typingSentRef.current) {
      handle.sendTyping(profileId, true)
      typingSentRef.current = true
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
    typingStopTimerRef.current = setTimeout(() => {
      handle.sendTyping(profileId, false)
      typingSentRef.current = false
    }, TYPING_STOP_DELAY_MS)
  }, [profileId])

  const signalStopTyping = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current)
      typingStopTimerRef.current = null
    }
    if (typingSentRef.current && socketRef.current && profileId) {
      socketRef.current.sendTyping(profileId, false)
    }
    typingSentRef.current = false
  }, [profileId])

  async function send() {
    const body = draft.trim()
    if (!profileId || !body || body.length > MESSAGE_MAX || sending || isBlocked) return
    setSending(true)
    setError(null)
    setErrorKind(null)
    try {
      const res = await chatApi.sendMessage({ toProfileId: profileId, content: body })
      const sent: Message = {
        messageId: res.data.messageId,
        senderProfileId: currentProfileId || '',
        content: body,
        sentAt: res.data.sentAt,
        isRead: false,
      }
      setMessages((prev) => [...prev, sent])
      signalStopTyping()
      setDraft('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      setTimeout(scrollToBottom, 100)
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      const code = apiError?.errorCode
      if (code === 'CHAT_NOT_ALLOWED') {
        setIsBlocked(true)
      } else if (code === 'MESSAGE_PAYMENT_REQUIRED' || code === 'MESSAGE_QUOTA_EXHAUSTED') {
        // No messaging quota (no plan or exhausted) — surface the upgrade CTA
        // ("View plans" link below) so the member can buy a plan to continue.
        setErrorKind('quota')
        setError('Upgrade your plan to send messages.')
      } else {
        setError(apiError?.message || 'Something went wrong while sending. Please try again.')
      }
    } finally {
      setSending(false)
    }
  }

  function autoGrow() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      void send()
    }
  }

  const grouped = useMemo(() => groupByDay(messages), [messages])
  const remaining = MESSAGE_MAX - draft.length
  const partnerName = conversation
    ? [conversation.otherFirstName, conversation.otherLastName].filter(Boolean).join(' ').trim()
    : profileId
  const firstName = partnerName.split(' ')[0] || partnerName
  const hasOlderPages = currentPage + 1 < totalPages

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur sm:px-4">
        <Link
          href="/chat"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Back to conversations"
        >
          <Icon name="arrow-left" className="size-5" />
        </Link>
        <div className="relative shrink-0">
          <div className="size-9 overflow-hidden rounded-full bg-secondary">
            {conversation?.otherPrimaryPhotoUrl ? (
              <img src={conversation.otherPrimaryPhotoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center font-serif text-sm text-muted-foreground">
                {partnerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${profileId}`} className="block truncate font-medium text-foreground hover:underline">
            {partnerName}
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', connected ? 'bg-success' : 'bg-muted-foreground')} aria-hidden />
            {partnerTyping ? 'typing…' : connected ? 'Live' : 'Reconnecting…'}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4" role="log" aria-live="polite">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {!isBlocked && (
            <p className="mx-auto max-w-sm rounded-lg bg-secondary/60 px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground">
              You are connected with {firstName}. Please keep the conversation respectful.
            </p>
          )}

          {hasOlderPages && !loading && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => void handleLoadOlder()}
                disabled={loadingOlder}
                className="text-sm font-medium text-primary underline underline-offset-4 disabled:text-muted-foreground"
              >
                {loadingOlder ? 'Loading…' : 'Load older messages'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : messages.length === 0 && !isBlocked ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No messages yet. Say hello to start the conversation.
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex justify-center">
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((m) => (
                  <Bubble key={m.messageId} message={m} own={m.senderProfileId === currentProfileId} />
                ))}
              </div>
            ))
          )}

          {partnerTyping ? <TypingIndicator /> : null}
        </div>
      </div>

      {error ? (
        <div role="alert" className="border-t border-destructive/30 bg-destructive/5 px-4 py-2.5 text-center text-sm text-destructive">
          {error}
          {errorKind === 'quota' ? (
            <Link href="/plans" className="ml-1 font-medium underline underline-offset-4">
              View plans
            </Link>
          ) : null}
        </div>
      ) : null}

      {isBlocked ? (
        <div className="border-t border-border bg-card px-4 py-4 text-center text-sm text-muted-foreground">
          You cannot message this member.{' '}
          <Link href={`/profile/${profileId}`} className="font-medium text-primary underline underline-offset-4">
            View profile
          </Link>
        </div>
      ) : (
        <div className="border-t border-border bg-card px-3 py-3 sm:px-4">
          <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => {
                  const v = e.target.value.slice(0, MESSAGE_MAX)
                  setDraft(v)
                  if (v.trim()) signalTyping()
                  else signalStopTyping()
                  autoGrow()
                }}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={MESSAGE_MAX}
                placeholder="Write a message…"
                aria-label="Message"
                className="block w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              {draft.length > MESSAGE_MAX - 200 ? (
                <p className={cn('mt-1 pr-1 text-right text-xs', remaining < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                  {remaining} characters left
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim() || remaining < 0 || sending}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Icon name="send" className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Bubble({ message: m, own }: { message: Message; own: boolean }) {
  return (
    <div className={cn('flex', own ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[70%]',
          own ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-card text-foreground ring-1 ring-border',
        )}
      >
        <p className="whitespace-pre-wrap break-words text-pretty">{m.content}</p>
        <div className={cn('mt-1 flex items-center justify-end gap-1', own ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          <span className="text-[10px]">{clockTime(m.sentAt)}</span>
          {own ? <StatusTick isRead={m.isRead} /> : null}
        </div>
      </div>
    </div>
  )
}

function StatusTick({ isRead }: { isRead?: boolean }) {
  return (
    <span className="relative inline-flex" aria-label={isRead ? 'Seen' : 'Sent'}>
      <Icon name="check" className="size-3" />
      {isRead ? <Icon name="check" className="-ml-1.5 size-3" /> : null}
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 ring-1 ring-border">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return <span className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" role="status" aria-label="Loading messages" />
}

function groupByDay(messages: Message[]) {
  const groups: Array<{ label: string; messages: Message[] }> = []
  for (const m of messages) {
    const label = dayLabel(m.sentAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.messages.push(m)
    else groups.push({ label, messages: [m] })
  }
  return groups
}
