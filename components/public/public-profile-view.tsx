'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { PublicProfilePreview } from '@matrimony/shared-core'

import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, focalPosition } from '@/lib/utils'
import { publicProfileApi } from '@/src/lib/api'

/**
 * Public, logged-out-friendly shareable profile preview at /p/:profileId.
 * Shows a minimal card (photo/name/age/city/religion, subject to the owner's
 * visibility) with a prominent sign-up CTA — the organic growth loop. Renders
 * a clean "not available" state when the profile can't be previewed. Mirrors
 * the existing app's PublicProfilePage.
 */
export function PublicProfileView({ profileId }: { profileId: string }) {
  const [preview, setPreview] = useState<PublicProfilePreview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    publicProfileApi
      .getPreview(profileId)
      .then((res) => {
        if (!cancelled) setPreview(res.data)
      })
      .catch(() => {
        if (!cancelled) setPreview({ available: false })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [profileId])

  if (loading) {
    return (
      <main className="min-h-dvh bg-brand-warm px-4 py-10">
        <div className="mx-auto max-w-md">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </main>
    )
  }

  if (!preview || !preview.available) {
    return (
      <main className="min-h-dvh bg-brand-warm px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <Icon name="user" size={48} className="mx-auto text-primary/40" />
          <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">Profile not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This profile is private or no longer available. Join Magizh to discover members who match your preferences.
          </p>
          <Link href="/register" className={cn(buttonVariants({ variant: 'primary' }), 'mt-6')}>
            Create a free account
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-brand-warm px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex h-64 w-full items-center justify-center bg-muted">
            {preview.primaryPhotoUrl ? (
              <img
                src={preview.primaryPhotoUrl}
                alt={preview.firstName || 'Member'}
                className="h-full w-full object-cover"
                style={{ objectPosition: focalPosition(preview.photoFocalX, preview.photoFocalY) }}
                loading="lazy"
              />
            ) : (
              <Icon name="user" size={80} className="text-primary/30" />
            )}
          </div>
          <div className="space-y-2 p-5">
            <h1 className="font-serif text-xl font-bold text-foreground">
              {preview.firstName}
              {preview.age ? <span className="font-normal text-muted-foreground">, {preview.age}</span> : null}
            </h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {preview.religion && <span>{preview.religion}</span>}
              {preview.currentCity && <span>{preview.currentCity}</span>}
            </div>
            {preview.profileId && (
              <p className="pt-1 text-xs text-muted-foreground/70">Profile ID: {preview.profileId}</p>
            )}
          </div>
        </div>

        {/* Sign-up CTA — the growth loop */}
        <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-5 text-center">
          <p className="font-medium text-foreground">Like what you see?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a free account to view full profiles, express interest, and start a conversation.
          </p>
          <Link href="/register" className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'mt-4 w-full')}>
            Create a free account
          </Link>
        </div>
      </div>
    </main>
  )
}
