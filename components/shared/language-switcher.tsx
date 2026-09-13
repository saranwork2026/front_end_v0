'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/src/i18n/useLanguage'
import type { SupportedLanguage } from '@/src/i18n/config'

/**
 * Tamil/English language toggle for the app chrome (customer + admin headers).
 * Icon-only trigger (globe + short code) that opens a small menu of languages;
 * the active choice shows a check. Persists via useLanguage → localStorage.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { language, setLanguage, supportedLanguages } = useLanguage()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const shortCode: Record<SupportedLanguage, string> = { en: 'EN', ta: 'த' }
  const languageName: Record<SupportedLanguage, string> = {
    en: t('language.english'),
    ta: t('language.tamil'),
  }

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center justify-center gap-1 rounded-lg px-2.5 text-foreground transition-colors hover:bg-secondary"
        aria-label={t('language.label')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="globe" size={18} />
        <span className="text-xs font-semibold">{shortCode[language]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-border bg-card py-1 shadow-xl"
        >
          <p className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
            {t('language.label')}
          </p>
          {supportedLanguages.map((lng) => (
            <button
              key={lng}
              type="button"
              role="menuitemradio"
              aria-checked={language === lng}
              onClick={() => {
                setLanguage(lng)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-secondary',
                language === lng ? 'font-semibold text-primary' : 'text-foreground',
              )}
            >
              <span>{languageName[lng]}</span>
              {language === lng && <Icon name="check" size={16} aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
