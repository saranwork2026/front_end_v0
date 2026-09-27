import { describe, it, expect } from 'vitest'

import {
  DEFAULT_MIN_HEIGHT_CM,
  DEFAULT_RELIGION,
  DEFAULT_MOTHER_TONGUE,
  DEFAULT_MARITAL_STATUS,
  DEFAULT_MANGLIK,
  DEFAULT_COUNTRY,
  DEFAULT_STATE,
  DEFAULT_PHYSICAL_STATUS,
  defaultMinAge,
  RECENTLY_JOINED_OPTIONS,
} from '../preferenceDefaults'
import { defaultSearchFilters } from '@/src/lib/search-filters'
import { defaultPreference } from '@/lib/preferences-data'

/**
 * The agreed first-load defaults are business rules the user specified, so we
 * pin them: gender-based min age (18 male / 21 female), 147 cm height floor,
 * Never Married, Tamil, Hindu, Manglik No, India / Tamil Nadu, Normal. Search
 * and Preferences must agree on the fields both support.
 */
describe('defaultMinAge', () => {
  it('should return 21 when the member is female', () => {
    expect(defaultMinAge('FEMALE')).toBe(21)
  })

  it('should return 18 when the member is male', () => {
    expect(defaultMinAge('MALE')).toBe(18)
  })

  it('should return 18 when gender is unknown', () => {
    expect(defaultMinAge(undefined)).toBe(18)
    expect(defaultMinAge(null)).toBe(18)
  })
})

describe('defaultSearchFilters', () => {
  it('should apply the agreed defaults for a male member', () => {
    const f = defaultSearchFilters('MALE')
    expect(f.minAge).toBe(18)
    expect(f.maxAge).toBeUndefined()
    expect(f.minHeightCm).toBe(DEFAULT_MIN_HEIGHT_CM)
    expect(f.maritalStatus).toBe(DEFAULT_MARITAL_STATUS)
    expect(f.motherTongue).toBe(DEFAULT_MOTHER_TONGUE)
    expect(f.religion).toBe(DEFAULT_RELIGION)
    expect(f.manglik).toBe(DEFAULT_MANGLIK)
    expect(f.country).toBe(DEFAULT_COUNTRY)
    expect(f.state).toBe(DEFAULT_STATE)
    expect(f.physicalStatus).toBe(DEFAULT_PHYSICAL_STATUS)
  })

  it('should raise the min age to 21 for a female member', () => {
    expect(defaultSearchFilters('FEMALE').minAge).toBe(21)
  })

  it('should not pre-select caste or quick filters', () => {
    const f = defaultSearchFilters('MALE')
    expect(f.caste).toBeUndefined()
    expect(f.hasPhoto).toBeUndefined()
    expect(f.verifiedOnly).toBeUndefined()
    expect(f.recentlyJoinedDays).toBeUndefined()
  })
})

describe('defaultPreference', () => {
  it('should apply the agreed defaults over the fields the prefs backend supports', () => {
    const p = defaultPreference('FEMALE')
    expect(p.minAge).toBe(21)
    expect(p.minHeightCm).toBe(DEFAULT_MIN_HEIGHT_CM)
    expect(p.manglik).toBe(DEFAULT_MANGLIK)
    expect(p.religions).toEqual([DEFAULT_RELIGION])
    expect(p.maritalStatuses).toEqual([DEFAULT_MARITAL_STATUS])
    expect(p.motherTongues).toEqual([DEFAULT_MOTHER_TONGUE])
  })

  it('should turn OFF no-bar for defaulted fields and leave it ON for the rest', () => {
    const p = defaultPreference('MALE')
    // Defaulted → no-bar off so the chosen value applies.
    expect(p.anyReligion).toBe(false)
    expect(p.anyMaritalStatus).toBe(false)
    expect(p.anyMotherTongue).toBe(false)
    // Not pre-selected → open to all.
    expect(p.anyCaste).toBe(true)
    expect(p.anyEducation).toBe(true)
    expect(p.anyLocation).toBe(true)
    expect(p.castes).toEqual([])
  })

  it('should use min age 18 for a male member', () => {
    expect(defaultPreference('MALE').minAge).toBe(18)
  })

  it('should apply the Phase 2 parity defaults (country/state/physical/dhosam)', () => {
    const p = defaultPreference('MALE')
    expect(p.countries).toEqual(['India'])
    expect(p.states).toEqual(['Tamil Nadu'])
    expect(p.physicalStatuses).toEqual(['NORMAL'])
    expect(p.dhosams).toEqual(['NONE'])
    // Their no-bar toggles are OFF so the chosen values apply.
    expect(p.anyCountry).toBe(false)
    expect(p.anyState).toBe(false)
    expect(p.anyPhysicalStatus).toBe(false)
    expect(p.anyDhosam).toBe(false)
    // Profession / nakshatra / raasi are left open-to-all.
    expect(p.anyProfession).toBe(true)
    expect(p.anyNakshatra).toBe(true)
    expect(p.anyRaasi).toBe(true)
  })
})

describe('RECENTLY_JOINED_OPTIONS', () => {
  it('should offer the 7 / 30 / 90 day windows', () => {
    expect(RECENTLY_JOINED_OPTIONS.map((o) => o.value)).toEqual([7, 30, 90])
  })
})
