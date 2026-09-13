import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  toSupportedLanguage,
  type SupportedLanguage,
} from './config'

/**
 * Single hook for reading and changing the active UI language. i18next is the
 * source of truth (react-i18next re-renders subscribers on change); this wraps
 * `changeLanguage` with localStorage persistence so the choice survives reloads.
 */
export function useLanguage() {
  const { i18n } = useTranslation()

  const language = toSupportedLanguage(i18n.language)

  const setLanguage = useCallback(
    (next: SupportedLanguage) => {
      void i18n.changeLanguage(next)
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
      } catch {
        // Ignore write failures (private mode / storage disabled).
      }
    },
    [i18n],
  )

  return { language, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES }
}
