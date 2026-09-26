import { VALIDATION_MESSAGES_EN } from '@matrimony/shared-core'

/**
 * The shared-core zod schemas emit STABLE KEYS (e.g. 'validation.password.minLength')
 * rather than human sentences, so they can be localised. The existing app maps
 * them through i18n; here (i18n deferred) we resolve them to the canonical
 * English copy exported by shared-core.
 *
 * Some messages carry a runtime value using the convention `key||{json-params}`
 * (e.g. `validation.age.minMale||{"min":21}`) — the same convention
 * profile.schema.ts uses. We split on `||`, parse the params, resolve the key
 * to its English copy, then interpolate `{{param}}` placeholders.
 */
export function fieldError(message?: string): string | undefined {
  if (!message) return undefined

  const [key, rawParams] = message.split('||')
  const resolved = VALIDATION_MESSAGES_EN[key]
  if (!resolved) return message // already a plain sentence, or unknown key

  if (!rawParams) return resolved

  let params: Record<string, unknown> = {}
  try {
    params = JSON.parse(rawParams)
  } catch {
    return resolved
  }

  return resolved.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{{${name}}}`,
  )
}
