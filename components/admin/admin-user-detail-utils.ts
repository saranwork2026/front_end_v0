import type { UserProfile } from '@matrimony/shared-core'

/**
 * Shared formatting helpers for the admin user-detail view and its dialogs.
 * Extracted so both admin-user-detail-view.tsx and admin-user-detail-dialogs.tsx
 * use the same currency/date formatting without duplication.
 */

export const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Date + time, for the account "last login" line (—/Never when absent). */
export function dateTime(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fullName(p: UserProfile): string {
  return [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || p.profileId
}

export function limit(total: number | null, remaining: number | null): string {
  if (total == null) return '—'
  if (total === -1) return 'Unlimited'
  return `${remaining ?? 0} / ${total}`
}
