'use client'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface CaptchaFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}

/**
 * Lightweight stand-in for the spec's CaptchaField. A single "I'm not a robot"
 * checkbox — enough to exercise the required-captcha validation path without a
 * real provider.
 */
export function CaptchaField({ checked, onChange, error }: CaptchaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50',
          error ? 'border-destructive' : 'border-input hover:border-primary/30',
        )}
      >
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded border transition-colors',
            checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
          )}
        >
          {checked && <Icon name="check" size={14} />}
        </span>
        <span className="flex-1 text-foreground">I&apos;m not a robot</span>
        <Icon name="shield" size={20} className="text-muted-foreground" />
      </button>
      {error && (
        <p role="alert" className="flex items-center gap-1 text-sm text-destructive">
          <Icon name="alert-circle" size={14} />
          {error}
        </p>
      )}
    </div>
  )
}
