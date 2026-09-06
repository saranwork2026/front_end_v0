'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import { Icon } from '@/components/ui/icon'

interface ImageLightboxProps {
  images: string[]
  index: number
  open: boolean
  alt: string
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Full-screen photo viewer with keyboard navigation (Esc / ← / →), used by the
 * profile photo gallery. Locks body scroll while open.
 */
export function ImageLightbox({
  images,
  index,
  open,
  alt,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
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
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25"
      >
        <Icon name="x" size={22} />
      </button>

      {multiple && (
        <button
          type="button"
          onClick={() => onNavigate((index - 1 + images.length) % images.length)}
          aria-label="Previous photo"
          className="absolute left-3 flex size-11 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25 sm:left-6"
        >
          <Icon name="chevron-left" size={24} />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index] || '/placeholder.svg'}
        alt={alt}
        className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
      />

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => onNavigate((index + 1) % images.length)}
            aria-label="Next photo"
            className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25 sm:right-6"
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
