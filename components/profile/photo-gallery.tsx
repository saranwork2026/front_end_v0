'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { ImageLightbox } from '@/components/profile/image-lightbox'

interface PhotoGalleryProps {
  name: string
  photos: string[]
  locked: boolean
  accessState: 'none' | 'requested' | 'granted'
  onRequestAccess: () => void
}

/**
 * Photo gallery with a large active viewer + thumbnail strip and a full-screen
 * lightbox. When photos are privacy-locked it shows a blurred placeholder with
 * a "Request photo access" gate instead.
 */
export function PhotoGallery({
  name,
  photos,
  locked,
  accessState,
  onRequestAccess,
}: PhotoGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const visible = !locked || accessState === 'granted'

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
