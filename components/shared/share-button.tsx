'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

/**
 * Reusable "share this profile" control used across surfaces (profile cards +
 * profile detail), per the frontend consistency rule. Builds the public
 * share link to the `/p/:profileId` landing page (keyed by the public
 * profileId, never the internal ULID) and offers "Copy link" + "Share on
 * WhatsApp" (a standard `wa.me` deep link — no backend dependency).
 *
 * Toasts are delegated to the parent via {@link ShareButtonProps.onToast} so
 * each page keeps its single Toaster.
 */
export interface ShareButtonProps {
  profileId: string
  /** Display name used in the prefilled WhatsApp message (optional). */
  name?: string
  /** Visual style: a compact icon-only trigger (cards) or a labelled button. */
  variant?: 'icon' | 'labelled'
  className?: string
  onToast?: (message: string, variant: 'success' | 'error' | 'info') => void
}

/** Absolute URL to the public preview page for a profile. */
export function buildShareLink(profileId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/p/${profileId}`
}

export function ShareButton({
  profileId,
  name,
  variant = 'icon',
  className,
  onToast,
}: ShareButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const link = buildShareLink(profileId)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const copyLink = async (e: React.MouseEvent) => {
    stop(e)
    setOpen(false)
    try {
      await navigator.clipboard.writeText(link)
      onToast?.(t('page.shared.shareLinkCopied'), 'success')
    } catch {
      onToast?.(t('page.shared.shareLinkCopyError'), 'error')
    }
  }

  const shareWhatsApp = (e: React.MouseEvent) => {
    stop(e)
    setOpen(false)
    const message = name
      ? t('page.shared.shareWaMessageNamed', { name, link })
      : t('page.shared.shareWaMessage', { link })
    window.open(
      'https://wa.me/?text=' + encodeURIComponent(message),
      '_blank',
      'noopener,noreferrer',
    )
  }

  const triggerClass =
    variant === 'icon'
      ? 'flex size-10 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground backdrop-blur transition-colors hover:bg-card hover:text-foreground'
      : 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted'

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={t('page.shared.shareProfileAria')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          stop(e)
          setOpen((v) => !v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') stop(e)
        }}
        className={triggerClass}
      >
        <Icon name="share" size={variant === 'icon' ? 18 : 16} />
        {variant === 'labelled' && <span>{t('page.shared.share')}</span>}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Icon name="copy" size={16} className="text-muted-foreground" />
            {t('page.shared.shareCopyLink')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={shareWhatsApp}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Icon name="chat" size={16} className="text-muted-foreground" />
            {t('page.shared.shareWhatsApp')}
          </button>
        </div>
      )}
    </div>
  )
}
