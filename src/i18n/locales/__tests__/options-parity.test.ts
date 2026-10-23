import { describe, it, expect } from 'vitest'

import { en } from '@/src/i18n/locales/en'
import { ta } from '@/src/i18n/locales/ta'

/**
 * Runtime set-equality guard mirroring the compile-time `Resources = typeof en`
 * parity: every `options.*` key present in en.ts must exist in ta.ts and vice
 * versa (one level deep, plus the two-level `caste.<Religion>` sub-tables), so
 * a missing Tamil key can never ship with a visibly-English hole.
 */

type Rec = Record<string, unknown>

function keysOf(obj: unknown): string[] {
  return obj && typeof obj === 'object' ? Object.keys(obj as Rec).sort() : []
}

const enOptions = (en.translation as Rec).options as Rec
const taOptions = (ta.translation as Rec).options as Rec

describe('en/ta options.* key parity', () => {
  it('top-level options.* namespaces match', () => {
    expect(keysOf(taOptions)).toEqual(keysOf(enOptions))
  })

  it('every namespace has an identical key set in en and ta', () => {
    for (const ns of keysOf(enOptions)) {
      if (ns === 'caste') continue // two-level, checked separately
      expect(keysOf(taOptions[ns]), `options.${ns} keys differ`).toEqual(keysOf(enOptions[ns]))
    }
  })

  it('caste religion sub-tables match key-for-key', () => {
    const enCaste = enOptions.caste as Rec
    const taCaste = taOptions.caste as Rec
    expect(keysOf(taCaste)).toEqual(keysOf(enCaste))
    for (const religion of keysOf(enCaste)) {
      expect(keysOf(taCaste[religion]), `options.caste.${religion} keys differ`).toEqual(
        keysOf(enCaste[religion]),
      )
    }
  })

  it('options.country has exactly the 9 authored diaspora keys in both locales', () => {
    const expected = [
      'Australia',
      'Canada',
      'India',
      'Malaysia',
      'Singapore',
      'Sri Lanka',
      'United Arab Emirates',
      'United Kingdom',
      'United States',
    ]
    expect(keysOf(enOptions.country)).toEqual(expected)
    expect(keysOf(taOptions.country)).toEqual(expected)
  })
})
