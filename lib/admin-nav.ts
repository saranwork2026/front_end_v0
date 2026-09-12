import type { IconName } from '@/components/ui/icon'

/**
 * Admin navigation — the single hardcoded list the spec keeps in
 * `AdminLayout.tsx` (§3.4). Mirrored 1:1 here (same items, order, routes).
 *
 * The spec flags the real admin nav as emoji-based (§13/§21 known
 * inconsistency); the only UI/UX change is mapping each item to a design-system
 * `Icon` instead of an emoji. No items added, removed, or re-routed.
 */
export interface AdminNavItem {
  label: string
  href: string
  icon: IconName
  /** Approver-only in the real app (still visible, in-page gated). */
  approverOnly?: boolean
}

export const adminNav: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'bar-chart' },
  { label: 'Moderation', href: '/admin/moderation', icon: 'shield' },
  { label: 'Users', href: '/admin/users', icon: 'users' },
  { label: 'Flagged', href: '/admin/flagged', icon: 'flag' },
  { label: 'Reports', href: '/admin/reports', icon: 'alert-circle' },
  { label: 'Plans', href: '/admin/plans', icon: 'wallet' },
  { label: 'Success Stories', href: '/admin/success-stories', icon: 'heart' },
  { label: 'Vendor Ads', href: '/admin/ad-banners', icon: 'megaphone' },
  { label: 'Verifications', href: '/admin/verifications', icon: 'circle-check' },
  { label: 'Flagged Messages', href: '/admin/flagged-messages', icon: 'chat' },
  { label: 'Broadcast', href: '/admin/broadcast', icon: 'megaphone', approverOnly: true },
  { label: 'Audit', href: '/admin/audit', icon: 'layers' },
  { label: 'Activity', href: '/admin/activity', icon: 'sparkles' },
  { label: 'Sessions', href: '/admin/sessions', icon: 'clock' },
]
