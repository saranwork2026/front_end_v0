/**
 * UPI deep-link / QR helpers (client-side only).
 *
 * There is NO payment gateway or PSP in this flow. These helpers only build a
 * standard UPI intent URI (`upi://pay?...`) so the user can launch any UPI app
 * (GPay, PhonePe, Paytm, BHIM) or scan a QR with the payee + amount pre-filled.
 * The returned payment is NEVER trusted as proof — the user still uploads a
 * screenshot and an admin verifies it. The generated reference below is purely
 * a human-matchable tag so an admin can tie a screenshot to the right claim.
 */

/** Fixed payee details shown to the user (same UPI ID used in the form). */
export const UPI_PAYEE = {
  /** VPA money is sent to. */
  upiId: 'saranchinnadurai-1@okaxis',
  /** Payee name shown by the UPI app. */
  name: 'Magizh Matrimony',
} as const

/** Characters used for the reference suffix — no ambiguous 0/O/1/I. */
const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generate a short, human-readable payment reference like `MAG-7K2QZ9`.
 * Prefixed `MAG-` + 6 unambiguous chars. This is a local correlation tag only
 * (not a gateway/txn id); it is pre-filled into the reference note and embedded
 * in the UPI `tn` so the admin can match the uploaded screenshot to the claim.
 */
export function generatePaymentRef(): string {
  let suffix = ''
  const n = REF_ALPHABET.length
  // crypto.getRandomValues when available (browser), else Math.random fallback.
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = new Uint8Array(6)
    cryptoObj.getRandomValues(bytes)
    for (let i = 0; i < 6; i++) suffix += REF_ALPHABET[bytes[i] % n]
  } else {
    for (let i = 0; i < 6; i++) suffix += REF_ALPHABET[Math.floor(Math.random() * n)]
  }
  return `MAG-${suffix}`
}

export interface UpiUriParams {
  /** Amount in INR. Omitted from the URI when not a positive finite number. */
  amount?: number
  /** Transaction note / reference (our MAG- reference). */
  ref?: string
}

/**
 * Build a standard UPI payment intent URI. Any UPI app can handle it, and the
 * same string encodes into a scannable QR.
 *
 *   upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 *
 * `am` is included only for a valid positive amount (UPI treats a 0/blank
 * amount as "let the user type it", which we avoid when we know the price).
 */
export function buildUpiUri({ amount, ref }: UpiUriParams = {}): string {
  const params = new URLSearchParams()
  params.set('pa', UPI_PAYEE.upiId)
  params.set('pn', UPI_PAYEE.name)
  if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
    // UPI expects a plain decimal with up to 2 fraction digits, no currency symbol.
    params.set('am', amount.toFixed(2))
  }
  params.set('cu', 'INR')
  if (ref && ref.trim()) {
    params.set('tn', `Payment ${ref.trim()}`)
  }
  return `upi://pay?${params.toString()}`
}
