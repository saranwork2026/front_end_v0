'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import type { PaymentMethod } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { UPI_PAYEE, buildUpiUri, generatePaymentRef } from '@/src/lib/upi'

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
const ACCEPTED_SCREENSHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_NOTE_LENGTH = 500

/** Payee details shown to the user (UPI + WhatsApp are fixed per spec). */
const PAYEE = { upiId: UPI_PAYEE.upiId, whatsapp: '+91 90000 00000' }

interface PaymentMethodOption {
  value: PaymentMethod
  labelKey: string
  hintKey: string
}

const paymentMethodOptions: PaymentMethodOption[] = [
  { value: 'UPI', labelKey: 'page.payments.methodUpi', hintKey: 'page.payments.methodUpiHint' },
  { value: 'CASH', labelKey: 'page.payments.methodCash', hintKey: 'page.payments.methodCashHint' },
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
  /**
   * Amount in INR for this payment. When provided it is pre-filled into the UPI
   * deep-link + QR (`am=<amount>`) so the user's UPI app opens with the amount
   * already set. Omit for flows where the amount isn't known here.
   */
  amount?: number
  /**
   * Backend-provided payment reference (MM-{profileId}-{paymentId}) backed by a
   * real PENDING payment row. When provided it is used for the UPI QR `tn` and
   * pre-filled into the note so an admin can match the screenshot to the row.
   * If omitted, a local MAG- reference is generated (legacy / no-initiate case).
   */
  reference?: string
}

/**
 * Shared manual-payment claim form. Radio method (UPI/CASH); for UPI it shows a
 * real scannable UPI QR + a "Pay with UPI app" deep-link button (both pre-fill
 * payee + amount), an auto-generated MAG- reference pre-filled into the note so
 * an admin can match screenshot ↔ claim, and a MANDATORY payment screenshot
 * (jpeg/png/webp ≤5MB). CASH keeps the screenshot optional. Submits the method,
 * trimmed note, and the File to the parent, which calls the manual-payment API.
 *
 * No payment gateway is involved — the UPI link/QR only launches the user's own
 * UPI app; the uploaded screenshot is still admin-verified before anything is
 * granted. The returned UPI status is never trusted here.
 */
export function ManualPaymentForm({ onSubmit, submitting, onCancel, amount, reference }: ManualPaymentFormProps) {
  const { t } = useTranslation()
  const [method, setMethod] = useState<PaymentMethod>('UPI')
  // Reference used in the UPI note + QR `tn` so the admin can tie the
  // screenshot to this payment row. Prefer the backend reference
  // (MM-{profileId}-{paymentId}, backed by a real PENDING row); fall back to a
  // local MAG- reference only when the caller didn't initiate one.
  const fallbackRef = useMemo(() => generatePaymentRef(), [])
  const paymentRef = reference ?? fallbackRef
  const [note, setNote] = useState(() => `Ref: ${paymentRef}`)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showScreenshotRequired, setShowScreenshotRequired] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const upiUri = useMemo(() => buildUpiUri({ amount, ref: paymentRef }), [amount, paymentRef])

  // If the backend reference arrives after mount (e.g. the parent passes it
  // once the initiate call resolves), refresh the pre-filled note — but only
  // while it's still the untouched default, so we never clobber user edits.
  useEffect(() => {
    setNote((prev) => (prev === `Ref: ${fallbackRef}` || prev === '' ? `Ref: ${paymentRef}` : prev))
  }, [paymentRef, fallbackRef])

  // Render the UPI intent URI to a scannable QR (data URL). Only needed for UPI.
  useEffect(() => {
    if (method !== 'UPI') return
    let active = true
    QRCode.toDataURL(upiUri, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (active) setQrDataUrl(url)
      })
      .catch(() => {
        if (active) setQrDataUrl(null)
      })
    return () => {
      active = false
    }
  }, [method, upiUri])

  function handleFile(file: File | undefined) {
    setFileError(null)
    if (!file) return
    if (!ACCEPTED_SCREENSHOT_TYPES.includes(file.type)) {
      setFileError(t('page.payments.fileTypeError'))
      return
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setFileError(t('page.payments.fileSizeError'))
      return
    }
    setScreenshot(file)
    setShowScreenshotRequired(false)
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
    // Screenshot is mandatory for UPI — the whole flow relies on an admin
    // verifying proof of payment, so a UPI claim without a screenshot can't be
    // verified. CASH stays optional (verified at a branch / in person).
    if (method === 'UPI' && !screenshot) {
      setShowScreenshotRequired(true)
      return
    }
    void onSubmit({
      paymentMethod: method,
      referenceNote: note.trim(),
      screenshot: screenshot ?? undefined,
    })
  }

  const screenshotRequired = method === 'UPI'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Method radios */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground">{t('page.payments.methodLabel')}</legend>
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
                  <span className="text-sm font-medium text-foreground">{t(opt.labelKey as never)}</span>
                  <span className="text-xs text-muted-foreground">{t(opt.hintKey as never)}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* UPI QR + deep-link + ID (shown for UPI) */}
      {method === 'UPI' && (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
            {/* Real, scannable UPI QR */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={t('page.payments.qrAlt')}
                width={112}
                height={112}
                className="size-28 shrink-0 rounded-lg border border-border bg-white p-1"
              />
            ) : (
              <div className="flex size-28 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                <Icon name="refresh" size={20} />
              </div>
            )}
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('page.payments.scanToPay')}
              </span>
              <p className="text-xs text-muted-foreground text-pretty">
                {t('page.payments.scanToPayDesc')}
              </p>
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <code className="rounded-md bg-card px-2 py-1 font-mono text-sm text-foreground">
                  {PAYEE.upiId}
                </code>
                <button
                  type="button"
                  onClick={copyUpi}
                  aria-label={t('page.payments.copyUpi')}
                  className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon name={copied ? 'check' : 'copy'} size={15} />
                </button>
              </div>
              {/* Reference the admin uses to match the screenshot to this claim. */}
              <span className="text-xs text-muted-foreground">
                {t('page.payments.paymentRefLabel')}{' '}
                <code className="font-mono text-foreground">{paymentRef}</code>
              </span>
            </div>
          </div>

          {/* Deep-link: opens the user's UPI app (GPay/PhonePe/Paytm/BHIM) with
              payee + amount pre-filled. On desktop (no handler) the QR above is
              the natural fallback. */}
          <a
            href={upiUri}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icon name="share" size={16} />
            {t('page.payments.payWithUpiApp')}
          </a>
          <p className="text-center text-xs text-muted-foreground text-pretty">
            {t('page.payments.upiAppFallback')}
          </p>
        </div>
      )}

      {/* Screenshot upload (mandatory for UPI, optional for CASH) */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          {t('page.payments.screenshot')}{' '}
          <span className="font-normal text-muted-foreground">
            {screenshotRequired ? t('page.payments.required') : t('page.payments.optional')}
          </span>
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
              {t('page.payments.remove')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-card px-4 py-6 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary hover:text-primary',
              showScreenshotRequired ? 'border-destructive/60' : 'border-border',
            )}
          >
            <Icon name="upload" size={20} />
            <span className="text-sm font-medium">{t('page.payments.uploadScreenshot')}</span>
            <span className="text-xs">{t('page.payments.screenshotHint')}</span>
          </button>
        )}
        {fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
        {showScreenshotRequired && !fileError && (
          <p role="alert" className="text-sm text-destructive">
            {t('page.payments.screenshotRequired')}
          </p>
        )}
      </div>

      {/* Reference note */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="payment-note" className="text-sm font-medium text-foreground">
          {t('page.payments.referenceNote')} <span className="font-normal text-muted-foreground">{t('page.payments.optional')}</span>
        </label>
        <textarea
          id="payment-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
          rows={3}
          placeholder={t('page.payments.notePlaceholder')}
          className="w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="self-end text-xs text-muted-foreground">
          {note.length}/{MAX_NOTE_LENGTH}
        </span>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            {t('page.payments.cancel')}
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {t('page.payments.submitClaim')}
        </Button>
      </div>
    </form>
  )
}
