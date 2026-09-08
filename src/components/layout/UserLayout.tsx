import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { navItems, bottomNavItems, mobileMenuItems } from './navConfig'
import { useAuthStore } from '@/src/stores/auth'
import { useNotificationStore } from '@/src/stores/notification'
import { notificationsApi } from '@/src/lib/api'
import { notificationStore } from '@/src/stores/notification'
import { logout } from '@/src/lib/auth-utils'

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <Icon name="heart" size={18} />
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight text-primary">Magizh</span>
    </span>
  )
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  )

export function UserLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  // During the registration wizard the bottom tab bar is not needed — hiding it
  // lets the wizard's Prev / Save & continue footer freeze flush to the bottom.
  const hideBottomNav = location.pathname === '/profile/wizard'
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const profileId = useAuthStore((s) => s.profileId)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const avatarInitial = profileId?.charAt(0).toUpperCase() ?? 'U'

  // Poll unread notification count (mirrors the existing app's 60s poll).
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await notificationsApi.getUnreadCount()
        if (active) notificationStore.getState().setUnreadCount(res.data.unreadCount ?? 0)
      } catch {
        // Silent — a failed count poll shouldn't disrupt the UI.
      }
    }
    void load()
    const interval = notificationStore.getState().pollingInterval
    const id = setInterval(() => void load(), interval)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  // Close avatar dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    if (avatarOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [avatarOpen])

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              <Icon name={item.icon} size={20} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-11 items-center justify-center rounded-md text-foreground hover:bg-secondary md:hidden"
            aria-label="Open menu"
          >
            <Icon name="menu" size={22} />
          </button>

          <span className="ml-1 md:hidden">
            <Brand />
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative mr-1 flex size-11 items-center justify-center rounded-md text-foreground hover:bg-secondary"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          >
            <Icon name="bell" size={22} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="relative" ref={avatarRef}>
            <button
              type="button"
              onClick={() => setAvatarOpen((v) => !v)}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-shadow hover:ring-2 hover:ring-primary/30"
              aria-label="Account menu"
              aria-expanded={avatarOpen}
              aria-haspopup="true"
            >
              {avatarInitial}
            </button>
            {avatarOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                {profileId && (
                  <div className="border-b border-border px-4 py-2">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="truncate text-sm font-medium text-foreground">{profileId}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAvatarOpen(false)
                    navigate('/profile')
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary"
                >
                  <Icon name="user" size={16} /> Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarOpen(false)
                    navigate('/account')
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary"
                >
                  <Icon name="settings" size={16} /> Settings
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarOpen(false)
                    void logout()
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5"
                >
                  <Icon name="log-out" size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main
          className={cn(
            'relative min-h-0 flex-1 overflow-y-auto md:pb-0',
            hideBottomNav ? 'pb-0' : 'pb-[calc(4rem+env(safe-area-inset-bottom))]',
          )}
        >
          <Outlet />
        </main>

        {/* Mobile bottom nav — hidden during the registration wizard */}
        {!hideBottomNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.10)] md:hidden"
          aria-label="Primary"
        >
          <div className="flex items-center justify-around px-2 py-1">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'mx-1 flex min-h-11 min-w-11 flex-col items-center justify-center rounded-md text-[11px] transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon name={item.icon} size={22} />
                <span className="mt-0.5">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        )}
      </div>

      {/* Mobile slide-over menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-foreground/30"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 flex-col bg-card shadow-xl">
            <div className="flex h-14 items-center border-b border-border px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="ml-auto flex size-11 items-center justify-center rounded-md text-foreground hover:bg-secondary"
                aria-label="Close menu"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Secondary">
              {mobileMenuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass}
                >
                  <Icon name={item.icon} size={20} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
