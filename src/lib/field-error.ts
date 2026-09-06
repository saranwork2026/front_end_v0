import { VALIDATION_MESSAGES_EN } from '@matrimony/shared-core'

/**
 * The shared-core zod schemas emit STABLE KEYS (e.g. 'validation.password.minLength')
 * rather than human sentences, so they can be localised. The existing app maps
 * them through i18n; here (i18n deferred) we resolve them to the canonical
 * English copy exported by shared-core. Also interpolates {{min}} placeholders.
 */
export function fieldError(message?: string): string | undefined {
  if (!message) return undefined
  const resolved = VALIDATION_MESSAGES_EN[message]
  if (!resolved) return message // already a plain sentence, or unknown key
  return resolved
}
