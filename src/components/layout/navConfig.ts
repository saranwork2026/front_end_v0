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
  /** English fallback label (used if no translation is wired). */
  label: string
  /** i18n key under `nav.*` — rendered via t() so nav is translatable. */
  labelKey: string
  icon: IconName
  /** Show in the mobile bottom tab bar (max 5 for thumb-friendly spacing). */
  bottomNav?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', labelKey: 'nav.dashboard', icon: 'home', bottomNav: true },
  { to: '/search', label: 'Search', labelKey: 'nav.search', icon: 'search', bottomNav: true },
  { to: '/matches', label: 'Matches', labelKey: 'nav.matches', icon: 'heart', bottomNav: true },
  { to: '/chat', label: 'Messages', labelKey: 'nav.chat', icon: 'chat', bottomNav: true },
  { to: '/interests', label: 'Interests', labelKey: 'nav.interests', icon: 'mail', bottomNav: true },
  // Notifications lives in the top-right bell + the slide-over menu (not the
  // bottom tab bar) to keep the tab bar to 5 core destinations.
  { to: '/notifications', label: 'Notifications', labelKey: 'nav.notifications', icon: 'bell' },
  { to: '/shortlist', label: 'Shortlist', labelKey: 'nav.shortlist', icon: 'star' },
  { to: '/profile-views', label: 'Profile Views', labelKey: 'nav.profileViews', icon: 'eye' },
  { to: '/plans', label: 'Plans', labelKey: 'nav.plans', icon: 'sparkles' },
  { to: '/referrals', label: 'Refer & Earn', labelKey: 'nav.referrals', icon: 'handshake' },
  { to: '/profile', label: 'Profile', labelKey: 'nav.profile', icon: 'user' },
  { to: '/photos', label: 'Photos', labelKey: 'nav.photos', icon: 'photo' },
  { to: '/account', label: 'Settings', labelKey: 'nav.settings', icon: 'settings' },
]

export const bottomNavItems = navItems.filter((item) => item.bottomNav)
export const mobileMenuItems = navItems.filter((item) => !item.bottomNav)
