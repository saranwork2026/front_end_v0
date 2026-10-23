import { describe, it, expect } from 'vitest'

import { RELIGIONS, CASTES_BY_RELIGION } from '@/src/data/religionCasteData'
import { RAASI_OPTIONS, NAKSHATRA_OPTIONS } from '@/src/data/horoscopeData'
import { HIGHEST_EDUCATION_OPTIONS } from '@/src/data/educationOptions'
import { COUNTRIES } from '@/src/data/countryData'

/**
 * NFR-1 guard: the option `value`s the backend stores and matching/search
 * depend on must NEVER change — only the displayed label switches with
 * language. These snapshots lock the exact value strings; a diff here means a
 * value was altered (which would silently break matching) and must fail CI.
 */

describe('option VALUES are immutable (NFR-1)', () => {
  it('RELIGIONS values', () => {
    expect(RELIGIONS.map((r) => r.value)).toEqual([
      'Hindu',
      'Muslim',
      'Christian',
      'Sikh',
      'Jain',
      'Buddhist',
      'Parsi',
      'Jewish',
      'Inter-Religion',
      'No Religious Belief',
      'Prefer not to say',
      'Other',
    ])
  })

  it('CASTES_BY_RELIGION.Hindu values', () => {
    expect(CASTES_BY_RELIGION.Hindu.map((c) => c.value)).toEqual([
      'Adi Dravida', 'Agamudayar', 'Ambalakarar', 'Arunthathiyar', 'Arya Vysya',
      'Badaga', 'Balija Naidu', 'Boyer', 'Brahmin - Iyengar', 'Brahmin - Iyer',
      'Brahmin - Gurukkal', 'Brahmin - Smartha', 'Brahmin - Sri Vaishnava',
      'Chettiar', 'Nattukottai Chettiar (Nagarathar)', 'Vaniya Chettiar',
      'Devanga Chettiar', 'Devandra Kula Vellalar', 'Gramani', 'Isai Vellalar',
      'Kongu Vellala Gounder', 'Vettuva Gounder', 'Urali Gounder', 'Gounder',
      'Kammavar Naidu', 'Kamma', 'Karuneegar', 'Kongu Chettiar', 'Kshatriya',
      'Kulalar', 'Kuravan', 'Kurumbar', 'Labbai', 'Maruthuvar', 'Meenavar',
      'Mudaliar - Sengunthar', 'Mudaliar - Thuluva Vellalar', 'Mudaliar - Arcot',
      'Mudaliar - Isai Vellalar', 'Mudaliar', 'Mukkulathor',
      'Muthuraja / Muthuracha', 'Nadar', 'Naicker', 'Naidu', 'Pallar',
      'Pandaram', 'Parkava Kulam', 'Pillai - Saiva', 'Pillai - Vellalar',
      'Pillai', 'Reddy', 'Senguntha Mudaliyar', 'Sourashtra', 'Sozhiya Vellalar',
      'Thevar (Mukkulathor)', 'Kallar', 'Maravar', 'Agamudayar Thevar',
      'Vaniyar', 'Vannar', 'Vannia Kula Kshatriyar (Vanniyar)', 'Vellalar',
      'Vishwakarma (Viswabrahmin)', 'Yadava (Konar)', 'Yadav', 'Other',
    ])
  })

  it('CASTES_BY_RELIGION.Christian includes the dotted value verbatim', () => {
    expect(CASTES_BY_RELIGION.Christian.map((c) => c.value)).toContain('St. Thomas Evangelical')
  })

  it('RAASI_OPTIONS values', () => {
    expect(RAASI_OPTIONS.map((r) => r.value)).toEqual([
      'Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni', 'Thulam',
      'Viruchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam',
    ])
  })

  it('NAKSHATRA_OPTIONS values', () => {
    expect(NAKSHATRA_OPTIONS.map((n) => n.value)).toEqual([
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
      'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
      'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
      'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada',
      'Revati',
    ])
  })

  it('HIGHEST_EDUCATION_OPTIONS values', () => {
    expect(HIGHEST_EDUCATION_OPTIONS.map((e) => e.value)).toEqual([
      'SSLC', 'HSC', 'Diploma', 'Bachelor', 'Master', 'Doctorate',
      'Professional', 'Other',
    ])
  })

  it('COUNTRIES values are full names (not ISO codes) and lead with India', () => {
    const values = COUNTRIES.map((c) => c.value)
    expect(values[0]).toBe('India')
    expect(values).toContain('United Arab Emirates')
    expect(values).toContain('Singapore')
  })
})
