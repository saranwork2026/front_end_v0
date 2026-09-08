import type { IconName } from '@/components/ui/icon'

/**
 * Single source of truth for user-facing navigation. All three surfaces read
 * from this one list so desktop and mobile can never drift:
 *   - Desktop sidebar        → full list
 *   - Mobile bottom tab bar  → items flagged `bottomNav` (max 5)
 *   - Mobile slide-over menu → items NOT in the bottom nav
 *
 * Mirrors the existing app's navConfig (same routes + icons).
 */
export interface NavItem {
  to: string
  label: string
  icon: IconName
  /** Show in the mobile bottom tab bar (max 5 for thumb-friendly spacing). */
  bottomNav?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'home', bottomNav: true },
  { to: '/search', label: 'Search', icon: 'search', bottomNav: true },
  { to: '/matches', label: 'Matches', icon: 'heart', bottomNav: true },
  { to: '/chat', label: 'Chat', icon: 'chat', bottomNav: true },
  { to: '/notifications', label: 'Notifications', icon: 'bell', bottomNav: true },
  { to: '/shortlist', label: 'Shortlist', icon: 'star' },
  { to: '/interests', label: 'Interests', icon: 'mail' },
  { to: '/profile-views', label: 'Profile Views', icon: 'eye' },
  { to: '/plans', label: 'Plans', icon: 'sparkles' },
  { to: '/referrals', label: 'Refer & Earn', icon: 'handshake' },
  { to: '/profile', label: 'Profile', icon: 'user' },
  { to: '/photos', label: 'Photos', icon: 'photo' },
  { to: '/account', label: 'Settings', icon: 'settings' },
]

export const bottomNavItems = navItems.filter((item) => item.bottomNav)
export const mobileMenuItems = navItems.filter((item) => !item.bottomNav)
