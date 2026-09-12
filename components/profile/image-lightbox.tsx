'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { Icon } from '@/components/ui/icon'

/** Horizontal distance (px) a touch must travel before it counts as a swipe. */
const SWIPE_THRESHOLD = 40

interface ImageLightboxProps {
  images: string[]
  index: number
  open: boolean
  alt: string
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Full-screen photo viewer with keyboard navigation (Esc / ← / →) and touch
 * swipe (left/right to change photo), used by the profile photo gallery. The
 * close button sits at the image's top-right corner. Locks body scroll while open.
 */
export function ImageLightbox({
  images,
  index,
  open,
  alt,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || images.length < 2) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onNavigate((index + 1) % images.length)
      else onNavigate((index - 1 + images.length) % images.length)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length)
      if (e.key === 'ArrowLeft')
        onNavigate((index - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, index, images.length, onClose, onNavigate])

  if (!open || typeof document === 'undefined' || images.length === 0) return null

  const multiple = images.length > 1

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/90 p-4 animate-in fade-in"
    >
      {multiple && (
        <button
          type="button"
          onClick={() => onNavigate((index - 1 + images.length) % images.length)}
          aria-label="Previous photo"
          className="absolute left-3 z-10 flex size-11 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25 sm:left-6"
        >
          <Icon name="chevron-left" size={24} />
        </button>
      )}

      {/*
        Wrapper shrinks to the rendered image size (inline-block + object-contain),
        so the close button anchors to the IMAGE's top-right corner rather than the
        far corner of the screen. Slightly overhung so it hugs the edge cleanly.
      */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="absolute -right-3 -top-3 z-10 flex size-10 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-black/10 transition-colors hover:bg-background/90"
        >
          <Icon name="x" size={20} />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index] || '/placeholder.svg'}
          alt={alt}
          draggable={false}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="max-h-[85vh] max-w-full touch-pan-y rounded-lg object-contain shadow-2xl"
        />
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => onNavigate((index + 1) % images.length)}
            aria-label="Next photo"
            className="absolute right-3 z-10 flex size-11 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25 sm:right-6"
          >
            <Icon name="chevron-right" size={24} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-background/15 px-3 py-1 text-sm font-medium text-background backdrop-blur">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}
