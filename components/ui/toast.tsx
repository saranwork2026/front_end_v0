'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'
import { Icon, type IconName } from '@/components/ui/icon'

export interface ToastItem {
  id: number
  message: string
  variant?: 'success' | 'error' | 'info'
}

const variantStyles: Record<
  NonNullable<ToastItem['variant']>,
  { icon: IconName; className: string }
> = {
  success: { icon: 'check', className: 'text-success' },
  error: { icon: 'alert-circle', className: 'text-destructive' },
  info: { icon: 'bell', className: 'text-primary' },
}

interface ToasterProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

/**
 * Transient feedback host. Renders an aria-live region of toasts pinned to the
 * bottom of the viewport (above the mobile action bar via safe-area padding).
 */
export function Toaster({ toasts, onDismiss }: ToasterProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:items-end sm:pb-6 sm:pr-6"
    >
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  )
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: number) => void
}) {
  const style = variantStyles[toast.variant ?? 'info']

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2',
      )}
    >
      <span className={cn('mt-0.5', style.className)}>
        <Icon name={style.icon} size={18} />
      </span>
      <p className="min-w-0 flex-1 text-sm text-foreground text-pretty">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  )
}
