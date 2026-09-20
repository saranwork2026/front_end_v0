import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { en } from './locales/en'
import { ta } from './locales/ta'

/** Supported UI languages. `en` is the fallback. */
export const SUPPORTED_LANGUAGES = ['en', 'ta'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

/** localStorage key holding the user's chosen UI language. */
export const LANGUAGE_STORAGE_KEY = 'matrimony.lang'

/** Narrow an arbitrary string to a SupportedLanguage, or fall back to default. */
export function toSupportedLanguage(value: string | null | undefined): SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
    ? (value as SupportedLanguage)
    : DEFAULT_LANGUAGE
}

/**
 * Read the persisted language before i18n initialises so first paint is in the
 * chosen language (no English flash). Guarded for environments without
 * localStorage.
 */
function readStoredLanguage(): SupportedLanguage {
  try {
    return toSupportedLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
  } catch {
    return DEFAULT_LANGUAGE
  }
}

void i18n.use(initReactI18next).init({
  resources: { en, ta },
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    // React already escapes output, so i18next escaping would double-encode.
    escapeValue: false,
  },
  returnNull: false,
})

export default i18n

// i18next / react-i18next TypeScript integration.
//
// We intentionally do NOT feed the full `Resources` tree into CustomTypeOptions.
// The en.ts locale tree is large and deeply nested; with react-i18next v15,
// typing `resources: Resources` pushes TS key inference past its recursion
// limit (TS2589 "excessively deep"), which then degrades t(...)'s return type
// to the detailed-result union (TFunctionDetailedResult | ...) instead of a
// plain `string`. That broke ~30 call sites that assign t(...) to a `string`
// (TS2322) and failed the CI `tsc --noEmit` build.
//
// Setting only `returnNull: false` keeps t(...) returning `string` (never
// `string | null`) so every existing `t(...)`-into-string usage compiles. We
// trade compile-time KEY autocomplete for a green, correct build; runtime
// behaviour is unchanged (resources are still loaded/typed at runtime via the
// init() call above, and Resources still enforces en/ta shape parity in
// locales/*.ts). `Resources` is imported there, not here.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    returnNull: false
  }
}
