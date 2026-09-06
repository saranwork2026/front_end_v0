'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  verified?: boolean
  ariaLabel?: string
  autoFocus?: boolean
}

/**
 * 6-box numeric OTP entry. Handles per-box typing, backspace, arrow keys, and
 * pasting a full code across boxes. Numeric-only per the spec's OTP rule.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  verified,
  ariaLabel = 'One-time password',
  autoFocus,
}: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const digits = React.useMemo(() => value.split('').slice(0, length), [value, length])

  function setDigit(index: number, digit: string) {
    const next = value.split('')
    next[index] = digit
    onChange(next.join('').slice(0, length))
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) return
    setDigit(index, digit)
    if (index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        setDigit(index, '')
      } else if (index > 0) {
        refs.current[index - 1]?.focus()
        setDigit(index - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      onChange(pasted)
      refs.current[Math.min(pasted.length, length - 1)]?.focus()
    }
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          value={digits[i] ?? ''}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            'h-12 w-full min-w-0 rounded-lg border bg-card text-center text-lg font-semibold text-foreground shadow-sm outline-none transition-colors',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
            'disabled:cursor-not-allowed disabled:opacity-70',
            verified ? 'border-success bg-success/5' : 'border-input',
          )}
        />
      ))}
    </div>
  )
}
