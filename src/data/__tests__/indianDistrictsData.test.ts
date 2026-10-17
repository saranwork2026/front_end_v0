import { describe, it, expect } from 'vitest'

import {
  DISTRICTS_BY_STATE,
  DISTRICT_TA,
  districtsForState,
  hasDistrictsForState,
  districtTamilLabel,
  allDistricts,
} from '../indianDistrictsData'
import { INDIAN_STATES } from '../indianStatesData'

// The 38 Tamil Nadu districts — the authoritative FE Tamil key set (mirrored
// by the BE BiodataLabels.DISTRICT_TA via a JUnit sync guard).
const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar',
]

describe('indianDistrictsData', () => {
  it('districtsForState(Tamil Nadu) returns a non-empty list ending with Other', () => {
    const tn = districtsForState('Tamil Nadu')
    expect(tn.length).toBeGreaterThan(0)
    expect(tn[tn.length - 1].value).toBe('Other')
  })

  it('districtsForState returns [] for unknown/blank/nullish state', () => {
    expect(districtsForState('')).toEqual([])
    expect(districtsForState(null)).toEqual([])
    expect(districtsForState(undefined)).toEqual([])
    expect(districtsForState('Atlantis')).toEqual([])
  })

  it('hasDistrictsForState reflects coverage', () => {
    expect(hasDistrictsForState('Tamil Nadu')).toBe(true)
    expect(hasDistrictsForState('Atlantis')).toBe(false)
    expect(hasDistrictsForState('')).toBe(false)
  })

  it('districtTamilLabel returns Tamil for a mapped TN district', () => {
    expect(districtTamilLabel('Thanjavur')).toBe('தஞ்சாவூர்')
    expect(districtTamilLabel('Chennai')).toBe('சென்னை')
  })

  it('districtTamilLabel falls back to English when unmapped, and "" when blank', () => {
    expect(districtTamilLabel('North Goa')).toBe('North Goa')
    expect(districtTamilLabel('')).toBe('')
    expect(districtTamilLabel(null)).toBe('')
  })

  it('every DISTRICTS_BY_STATE key is a valid INDIAN_STATES value', () => {
    const validStates = new Set(INDIAN_STATES.map((s) => s.value))
    for (const key of Object.keys(DISTRICTS_BY_STATE)) {
      expect(validStates.has(key)).toBe(true)
    }
  })

  it('covers all 36 states + UTs', () => {
    expect(Object.keys(DISTRICTS_BY_STATE).length).toBe(INDIAN_STATES.length)
  })

  it('DISTRICT_TA carries all 38 Tamil Nadu districts (FE side of the sync guard)', () => {
    for (const d of TN_DISTRICTS) {
      expect(DISTRICT_TA[d]).toBeTruthy()
    }
    const tnValues = districtsForState('Tamil Nadu')
      .map((d) => d.value)
      .filter((v) => v !== 'Other')
    expect(tnValues.sort()).toEqual([...TN_DISTRICTS].sort())
  })

  it('allDistricts is de-duped and sorted', () => {
    expect(new Set(allDistricts).size).toBe(allDistricts.length)
    const sorted = [...allDistricts].sort((a, b) => a.localeCompare(b))
    expect(allDistricts).toEqual(sorted)
    expect(allDistricts).toContain('Thanjavur')
  })
})
