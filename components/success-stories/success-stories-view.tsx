'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SuccessStory } from '@matrimony/shared-core'

import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { successStoryApi } from '@/src/lib/api'

/**
 * Public gallery of approved (published) success stories — a marketing surface,
 * reachable logged-out. Also usable while logged in with a CTA to submit.
 * Mirrors the existing app's SuccessStoriesPage.
 */
export function SuccessStoriesView() {
  const { t } = useTranslation()
  const [stories, setStories] = useState<SuccessStory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    successStoryApi
      .getPublished(0, 24)
      .then((res) => {
        if (!cancelled) setStories(res.data.content ?? [])
      })
      .catch(() => {
        if (!cancelled) setStories([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-dvh bg-brand-warm">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="mb-8 flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-primary">{t('page.successStories.title')}</h1>
            <p className="mt-1 text-muted-foreground">{t('page.successStories.subtitle')}</p>
          </div>
          <Link href="/success-stories/submit" className={cn(buttonVariants({ variant: 'primary' }))}>
            <Icon name="heart" size={16} />
            {t('page.successStories.shareStory')}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <EmptyState
            icon="heart"
            title={t('page.successStories.emptyTitle')}
            description={t('page.successStories.emptyDesc')}
            action={
              <Link href="/success-stories/submit" className={cn(buttonVariants({ variant: 'primary' }))}>
                {t('page.successStories.shareStory')}
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <article
                key={s.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                {s.photoUrl ? (
                  <img
                    src={s.photoUrl}
                    alt={t('page.successStories.coupleAlt', { bride: s.brideName, groom: s.groomName })}
                    className="h-52 w-full bg-muted object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-primary/5">
                    <Icon name="heart" size={48} className="text-primary/40" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    {s.brideName} &amp; {s.groomName}
                  </h2>
                  {s.marriageDate && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('page.successStories.marriedOn', {
                        date: new Date(s.marriageDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                        }),
                      })}
                    </p>
                  )}
                  <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm text-muted-foreground">
                    {s.story}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
