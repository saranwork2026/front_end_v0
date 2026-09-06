import type { ZodType } from 'zod'
import { VALIDATION_MESSAGES_EN } from '@matrimony/shared-core'

/**
 * Runs a shared-core zod schema and returns either the parsed data or a
 * field→message error map, so the controlled-input auth/preference forms can
 * validate against the SAME schemas the rest of the platform uses (parity with
 * the existing app). Schema messages are stable keys (e.g.
 * 'validation.password.minLength') — this maps them to English copy via
 * shared-core's VALIDATION_MESSAGES_EN.
 */
export function validateWithSchema<T>(
  schema: ZodType<T>,
  input: unknown,
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string | undefined> } {
  const result = schema.safeParse(input)
  if (result.success) return { success: true, data: result.data }

  const errors: Record<string, string | undefined> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : '_form'
    // First error per field wins (matches typical form UX).
    if (errors[field] == null) {
      errors[field] = translateMessage(issue.message)
    }
  }
  return { success: false, errors }
}

/** Map a shared-core validation KEY to English copy; pass through plain text. */
export function translateMessage(message: string): string {
  return VALIDATION_MESSAGES_EN[message] ?? message
}
