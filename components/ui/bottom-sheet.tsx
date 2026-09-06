'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

/**
 * Mobile-first sheet that slides up from the bottom edge. Used for filters,
 * quick actions, and menus on small screens. Closes on Escape / backdrop.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={cn(
          'relative z-10 max-h-[85vh] w-full overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl outline-none animate-in slide-in-from-bottom',
          className,
        )}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-2">
          <h2
            id="sheet-title"
            className="font-serif text-lg font-bold text-foreground"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-1 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto border-t border-border/70 p-5">
          {children}
        </div>
        {footer && (
          <div className="flex gap-3 border-t border-border/70 bg-secondary/40 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
