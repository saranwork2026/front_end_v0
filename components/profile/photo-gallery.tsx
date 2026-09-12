'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { ImageLightbox } from '@/components/profile/image-lightbox'

/**
 * How to explain an empty gallery (no visible photos):
 *  - 'owner-pending'  — the owner is looking at their own profile and has a
 *                       photo still awaiting admin approval.
 *  - 'owner-rejected' — the owner's photo was rejected → prompt to re-upload.
 *  - 'owner-none'     — the owner has no photo at all → prompt to upload.
 *  - 'viewer-none'    — another member's profile has no approved photo yet.
 */
export type PhotoEmptyState = 'owner-pending' | 'owner-rejected' | 'owner-none' | 'viewer-none'

interface PhotoGalleryProps {
  name: string
  photos: string[]
  locked: boolean
  accessState: 'none' | 'requested' | 'granted'
  onRequestAccess: () => void
  /** Context for the empty message when there are no photos to show. */
  emptyState?: PhotoEmptyState
  /** Navigate to the photo-management page (owner empty-state CTA). */
  onManagePhotos?: () => void
}

/**
 * Photo gallery with a large active viewer + thumbnail strip and a full-screen
 * lightbox. When photos are privacy-locked it shows a blurred placeholder with
 * a "Request photo access" gate instead; when there are simply no photos to
 * show it renders a context-aware message (upload / pending / none).
 */
export function PhotoGallery({
  name,
  photos,
  locked,
  accessState,
  onRequestAccess,
  emptyState = 'viewer-none',
  onManagePhotos,
}: PhotoGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const visible = !locked || accessState === 'granted'

  // No photos to show (and not privacy-locked) → explain why, in the same box.
  if (visible && photos.length === 0) {
    const copy: Record<
      PhotoEmptyState,
      { icon: 'clock' | 'camera' | 'user' | 'alert-circle'; tone: 'neutral' | 'danger'; title: string; body: string }
    > = {
      'owner-pending': {
        icon: 'clock',
        tone: 'neutral',
        title: 'Photo pending approval',
        body: 'Your photo has been uploaded and is awaiting admin approval. It will be visible to other members once approved.',
      },
      'owner-rejected': {
        icon: 'alert-circle',
        tone: 'danger',
        title: 'Photo not approved',
        body: "Your photo wasn't approved as it didn't meet our photo guidelines. Please upload a clear photo that follows the guidelines.",
      },
      'owner-none': {
        icon: 'camera',
        tone: 'neutral',
        title: 'Add a profile photo',
        body: 'Profiles with photos get far more interest. Upload a photo to help members recognise you.',
      },
      'viewer-none': {
        icon: 'user',
        tone: 'neutral',
        title: 'No photo yet',
        body: `${name.split(' ')[0]} hasn't added an approved photo yet.`,
      },
    }
    const c = copy[emptyState]
    const isOwnerCta = emptyState === 'owner-none' || emptyState === 'owner-pending' || emptyState === 'owner-rejected'
    return (
      <section
        aria-label="Photos"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-secondary sm:aspect-[16/10]">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-3 px-6 text-center">
            <span
              className={cn(
                'flex size-14 items-center justify-center rounded-full bg-card shadow-sm',
                c.tone === 'danger' ? 'text-destructive' : 'text-primary',
              )}
            >
              <Icon name={c.icon} size={26} />
            </span>
            <div>
              <p className={cn('font-medium', c.tone === 'danger' ? 'text-destructive' : 'text-foreground')}>
                {c.title}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{c.body}</p>
            </div>
            {isOwnerCta && onManagePhotos && (
              <Button variant="secondary" size="sm" onClick={onManagePhotos}>
                <Icon name="camera" size={16} />
                {emptyState === 'owner-none' ? 'Upload photo' : emptyState === 'owner-rejected' ? 'Re-upload photo' : 'Manage photos'}
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (!visible) {
    return (
      <section
        aria-label="Photos"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-secondary sm:aspect-[16/10]">
          <div
            className="absolute inset-0 bg-gradient-to-br from-secondary to-muted"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-3 px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-card text-primary shadow-sm">
              <Icon name="lock" size={26} />
            </span>
            <div>
              <p className="font-medium text-foreground">Photos are protected</p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {name.split(' ')[0]} keeps photos private. Request access to view them.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRequestAccess}
              disabled={accessState === 'requested'}
            >
              <Icon name={accessState === 'requested' ? 'check' : 'eye'} size={16} />
              {accessState === 'requested' ? 'Request sent' : 'Request photo access'}
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Photos"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label={`Open photo ${active + 1} of ${photos.length} full screen`}
        className="group relative block aspect-[4/3] w-full overflow-hidden bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:aspect-[16/10]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active] || '/placeholder.svg'}
          alt={`Photo ${active + 1} of ${name}`}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-foreground/55 px-2.5 py-1 text-xs font-medium text-background backdrop-blur">
          <Icon name="eye" size={14} />
          View
        </span>
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60',
                i === active ? 'border-primary' : 'border-transparent opacity-75 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src || '/placeholder.svg'}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        images={photos}
        index={active}
        open={lightbox}
        alt={name}
        onClose={() => setLightbox(false)}
        onNavigate={setActive}
      />
    </section>
  )
}
