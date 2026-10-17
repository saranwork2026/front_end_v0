import { describe, it, expect } from 'vitest'

import {
  emptyPreference,
  validatePreference,
  districtOptions,
  type PartnerPreference,
} from '@/lib/preferences-data'

describe('preferences-data district support', () => {
  it('emptyPreference starts with no districts and open-to-all', () => {
    expect(emptyPreference.districts).toEqual([])
    expect(emptyPreference.anyDistrict).toBe(true)
  })

  it('districtOptions is a flat, de-duped, non-empty list', () => {
    expect(districtOptions.length).toBeGreaterThan(0)
    expect(new Set(districtOptions).size).toBe(districtOptions.length)
    expect(districtOptions).toContain('Thanjavur')
  })

  it('validatePreference flags more than 20 districts', () => {
    const tooMany: PartnerPreference = {
      ...emptyPreference,
      anyDistrict: false,
      districts: Array.from({ length: 21 }, (_, i) => `D${i}`),
    }
    expect(validatePreference(tooMany).districts).toBeTruthy()
  })

  it('validatePreference accepts up to 20 districts', () => {
    const ok: PartnerPreference = {
      ...emptyPreference,
      anyDistrict: false,
      districts: Array.from({ length: 20 }, (_, i) => `D${i}`),
    }
    expect(validatePreference(ok).districts).toBeUndefined()
  })
})
