import { describe, it, expect } from 'vitest'
import { buildUpiUri, generatePaymentRef, UPI_PAYEE } from './upi'

describe('buildUpiUri', () => {
  it('includes payee, currency and a positive amount', () => {
    const uri = buildUpiUri({ amount: 1499, ref: 'MAG-ABC123' })
    expect(uri.startsWith('upi://pay?')).toBe(true)
    const q = new URLSearchParams(uri.slice('upi://pay?'.length))
    expect(q.get('pa')).toBe(UPI_PAYEE.upiId)
    expect(q.get('pn')).toBe(UPI_PAYEE.name)
    expect(q.get('cu')).toBe('INR')
    expect(q.get('am')).toBe('1499.00')
    expect(q.get('tn')).toBe('Payment MAG-ABC123')
  })

  it('omits amount when not a positive finite number', () => {
    for (const amount of [0, -5, Number.NaN, undefined]) {
      const q = new URLSearchParams(buildUpiUri({ amount }).slice('upi://pay?'.length))
      expect(q.get('am')).toBeNull()
      expect(q.get('pa')).toBe(UPI_PAYEE.upiId)
    }
  })

  it('omits tn when no ref', () => {
    const q = new URLSearchParams(buildUpiUri({ amount: 100 }).slice('upi://pay?'.length))
    expect(q.get('tn')).toBeNull()
  })
})

describe('generatePaymentRef', () => {
  it('matches MAG-XXXXXX with unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePaymentRef()).toMatch(/^MAG-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
    }
  })

  it('is reasonably unique across many calls', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(generatePaymentRef())
    // Allow a tiny collision margin but expect near-complete uniqueness.
    expect(seen.size).toBeGreaterThan(495)
  })
})
