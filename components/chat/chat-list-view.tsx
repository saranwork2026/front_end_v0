'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import type { Conversation } from '@matrimony/shared-core'

import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn, focalPosition } from '@/lib/utils'
import { chatApi } from '@/src/lib/api'

type ViewState = 'ready' | 'loading' | 'empty' | 'error'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

type TFunc = ReturnType<typeof useTranslation>['t']

function relativeTime(iso: string, t: TFunc): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < MIN) return t('page.chat.timeJustNow')
  if (diff < HOUR) return t('page.chat.timeMin', { count: Math.floor(diff / MIN) })
  if (diff < DAY) return t('page.chat.timeHr', { count: Math.floor(diff / HOUR) })
  if (diff < 7 * DAY) return t('page.chat.timeDay', { count: Math.floor(diff / DAY) })
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function fullName(c: Conversation): string {
  return [c.otherFirstName, c.otherLastName].filter(Boolean).join(' ').trim() || c.otherProfileId
}

export function ChatListView({ state }: { state?: ViewState }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])

  const load = useCallback(async () => {
    if (state === 'loading') return
    setLoading(true)
    setError(false)
    try {
      const res = await chatApi.getConversations()
      const sorted = [...res.data].sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })
      setConversations(sorted)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [state])

  useEffect(() => {
    if (state === 'empty') {
      setConversations([])
      setLoading(false)
      return
    }
    void load()
  }, [load, state])

  const isLoading = state === 'loading' || loading

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{t('page.chat.eyebrow')}</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground text-balance">{t('page.chat.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('page.chat.subtitle')}
          </p>
        </header>

        {isLoading ? (
          <ConversationSkeleton />
        ) : error ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-medium">{t('page.chat.errorLoad')}</p>
            <Button variant="secondary" className="mt-3" onClick={() => void load()}>
              {t('page.chat.tryAgain')}
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="chat"
            title={t('page.chat.emptyTitle')}
            description={t('page.chat.emptyDesc')}
            action={
              <Link href="/search" className={buttonVariants({ variant: 'primary' })}>
                {t('page.chat.findMatches')}
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {conversations.map((c) => (
              <ConversationRow key={c.otherProfileId} conversation={c} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function ConversationRow({ conversation: c }: { conversation: Conversation }) {
  const { t } = useTranslation()
  const name = fullName(c)
  return (
    <li>
      <Link
        href={`/chat/${c.otherProfileId}`}
        className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-secondary/60 sm:px-4"
      >
        <Avatar name={name} photoUrl={c.otherPrimaryPhotoUrl} focalX={c.otherPhotoFocalX} focalY={c.otherPhotoFocalY} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">{name}</span>
            {c.isBlocked && (
              <Icon name="lock" className="size-3.5 shrink-0 text-muted-foreground" aria-label={t('page.chat.blocked')} />
            )}
            {c.lastMessageAt && (
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relativeTime(c.lastMessageAt, t)}</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {c.lastMessage ?? t('page.chat.noMessages')}
          </p>
        </div>
      </Link>
    </li>
  )
}

function Avatar({
  name,
  photoUrl,
  focalX,
  focalY,
}: {
  name: string
  photoUrl: string | null
  focalX?: number | null
  focalY?: number | null
}) {
  return (
    <div className="relative shrink-0">
      <div className="size-12 overflow-hidden rounded-full bg-secondary">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="size-full object-cover"
            style={{ objectPosition: focalPosition(focalX, focalY) }}
          />
        ) : (
          <span className="flex size-full items-center justify-center font-serif text-lg text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}

function ConversationSkeleton() {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-full max-w-sm" />
          </div>
        </li>
      ))}
    </ul>
  )
}
