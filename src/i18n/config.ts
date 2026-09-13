import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { en, type Resources } from './locales/en'
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

// Give t(...) full key + type safety across the app.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: Resources
  }
}
