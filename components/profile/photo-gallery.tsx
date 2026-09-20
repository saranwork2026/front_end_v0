'use client'

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { ImageLightbox } from '@/components/profile/image-lightbox'

/** Horizontal distance (px) a touch must travel before it counts as a swipe. */
const SWIPE_THRESHOLD = 40

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
 * lightbox. The main viewer supports left/right swipe to move between photos
 * (a tap still opens the lightbox). When photos are privacy-locked it shows a blurred placeholder with
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
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  // Tracks the initial touch so we can tell a horizontal swipe (change photo)
  // from a tap (open the lightbox) on the main viewer.
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const goTo = (i: number) => setActive((i + photos.length) % photos.length)

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    swiped.current = false
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || photos.length < 2) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // Only treat mostly-horizontal moves past the threshold as a swipe.
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true
      goTo(active + (dx < 0 ? 1 : -1))
    }
  }

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
        title: t('page.profile.emptyPendingTitle'),
        body: t('page.profile.emptyPendingBody'),
      },
      'owner-rejected': {
        icon: 'alert-circle',
        tone: 'danger',
        title: t('page.profile.emptyRejectedTitle'),
        body: t('page.profile.emptyRejectedBody'),
      },
      'owner-none': {
        icon: 'camera',
        tone: 'neutral',
        title: t('page.profile.emptyNoneTitle'),
        body: t('page.profile.emptyNoneBody'),
      },
      'viewer-none': {
        icon: 'user',
        tone: 'neutral',
        title: t('page.profile.emptyViewerTitle'),
        body: t('page.profile.emptyViewerBody', { name: name.split(' ')[0] }),
      },
    }
    const c = copy[emptyState]
    const isOwnerCta = emptyState === 'owner-none' || emptyState === 'owner-pending' || emptyState === 'owner-rejected'
    return (
      <section
        aria-label={t('page.profile.photosAria')}
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
                {emptyState === 'owner-none' ? t('page.profile.uploadPhoto') : emptyState === 'owner-rejected' ? t('page.profile.reUploadPhoto') : t('page.profile.managePhotos')}
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
        aria-label={t('page.profile.photosAria')}
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
              <p className="font-medium text-foreground">{t('page.profile.photosProtected')}</p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {t('page.profile.photosProtectedBody', { name: name.split(' ')[0] })}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRequestAccess}
              disabled={accessState === 'requested'}
            >
              <Icon name={accessState === 'requested' ? 'check' : 'eye'} size={16} />
              {accessState === 'requested' ? t('page.profile.requestSent') : t('page.profile.requestPhotoAccess')}
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label={t('page.profile.photosAria')}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <button
        type="button"
        onClick={() => {
          // A swipe that just changed the photo shouldn't also open the lightbox.
          if (swiped.current) {
            swiped.current = false
            return
          }
          setLightbox(true)
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={t('page.profile.openPhotoFull', { current: active + 1, total: photos.length })}
        className="group relative block aspect-[4/3] w-full touch-pan-y overflow-hidden bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:aspect-[16/10]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active] || '/placeholder.svg'}
          alt={`Photo ${active + 1} of ${name}`}
          draggable={false}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-foreground/55 px-2.5 py-1 text-xs font-medium text-background backdrop-blur">
          <Icon name="eye" size={14} />
          {t('page.profile.view')}
        </span>
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t('page.profile.showPhoto', { n: i + 1 })}
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
