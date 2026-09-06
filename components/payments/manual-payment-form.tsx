'use client'

import { useRef, useState } from 'react'
import type { PaymentMethod } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
const ACCEPTED_SCREENSHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_NOTE_LENGTH = 500

/** Payee details shown to the user (UPI + WhatsApp are fixed per spec). */
const PAYEE = { upiId: 'magizhmatrimony@upi', whatsapp: '+91 90000 00000' }

interface PaymentMethodOption {
  value: PaymentMethod
  label: string
  hint: string
}

const paymentMethodOptions: PaymentMethodOption[] = [
  { value: 'UPI', label: 'UPI transfer', hint: 'Pay to our UPI ID and share the reference.' },
  { value: 'CASH', label: 'Cash / branch', hint: 'Pay at a branch and note the receipt number.' },
]

interface ManualPaymentFormProps {
  onSubmit: (data: {
    paymentMethod: PaymentMethod
    referenceNote: string
    screenshot?: File
  }) => void | Promise<void>
  submitting?: boolean
  /** Optional cancel handler; parent decides where Cancel routes. */
  onCancel?: () => void
}

/**
 * Shared manual-payment claim form. Radio method (UPI/CASH), a UPI QR
 * placeholder, an optional screenshot upload (jpeg/png/webp ≤5MB), and a
 * reference note (≤500 chars). Submits the selected method, trimmed note, and
 * the actual File to the parent, which calls `paymentsApi.submitManualPayment`.
 */
export function ManualPaymentForm({ onSubmit, submitting, onCancel }: ManualPaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('UPI')
  const [note, setNote] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    setFileError(null)
    if (!file) return
    if (!ACCEPTED_SCREENSHOT_TYPES.includes(file.type)) {
      setFileError('Use a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setFileError('Screenshot must be 5MB or smaller.')
      return
    }
    setScreenshot(file)
  }

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(PAYEE.upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fileError) return
    void onSubmit({
      paymentMethod: method,
      referenceNote: note.trim(),
      screenshot: screenshot ?? undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Method radios */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground">Payment method</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {paymentMethodOptions.map((opt) => {
            const active = method === opt.value
            return (
              <label
                key={opt.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                  active
                    ? 'border-primary bg-secondary'
                    : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={opt.value}
                  checked={active}
                  onChange={() => setMethod(opt.value)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.hint}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* UPI QR + ID (shown for UPI) */}
      {method === 'UPI' && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:gap-4">
          <QrPlaceholder />
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pay to UPI ID
            </span>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <code className="rounded-md bg-card px-2 py-1 font-mono text-sm text-foreground">
                {PAYEE.upiId}
              </code>
              <button
                type="button"
                onClick={copyUpi}
                aria-label="Copy UPI ID"
                className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Icon name={copied ? 'check' : 'copy'} size={15} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">
              After paying, upload the screenshot below or share it on WhatsApp{' '}
              <span className="font-medium text-foreground">{PAYEE.whatsapp}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Screenshot upload (optional) */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Payment screenshot <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_SCREENSHOT_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {screenshot ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <span className="flex min-w-0 items-center gap-2">
              <Icon name="photo" size={18} className="shrink-0 text-primary" />
              <span className="truncate text-sm text-foreground">{screenshot.name}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setScreenshot(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-card px-4 py-6 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary hover:text-primary"
          >
            <Icon name="upload" size={20} />
            <span className="text-sm font-medium">Upload screenshot</span>
            <span className="text-xs">JPG, PNG or WEBP up to 5MB</span>
          </button>
        )}
        {fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
      </div>

      {/* Reference note */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="payment-note" className="text-sm font-medium text-foreground">
          Reference note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="payment-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
          rows={3}
          placeholder="Transaction ID, sender name, or any detail that helps us match your payment."
          className="w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="self-end text-xs text-muted-foreground">
          {note.length}/{MAX_NOTE_LENGTH}
        </span>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          Submit payment claim
        </Button>
      </div>
    </form>
  )
}

/** Inline QR placeholder (UPI QR is a placeholder, not a real code). */
function QrPlaceholder() {
  return (
    <div
      aria-hidden
      className="grid size-28 shrink-0 grid-cols-5 gap-1 rounded-lg border border-border bg-card p-2"
    >
      {Array.from({ length: 25 }).map((_, i) => {
        // Deterministic pseudo-pattern so it reads as a QR without being one.
        const filled = [0, 1, 2, 4, 5, 8, 10, 12, 14, 16, 18, 20, 22, 24, 6, 9, 15].includes(i)
        return (
          <span
            key={i}
            className={cn('rounded-[2px]', filled ? 'bg-foreground' : 'bg-transparent')}
          />
        )
      })}
    </div>
  )
}
