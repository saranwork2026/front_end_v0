'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { adminNav } from '@/lib/admin-nav'
import { useAuthStore } from '@/src/stores/auth'
import { logout } from '@/src/lib/auth-utils'

interface AdminShellProps {
  /** Route of the active nav item, e.g. `/admin`. */
  activeHref: string
  children: React.ReactNode
}

/**
 * Admin chrome: a persistent desktop sidebar plus a header that, on mobile,
 * opens the same nav in a bottom sheet.
 *
 * UI/UX improvement (documented gap §21/§25): the real `AdminLayout` sidebar is
 * `hidden md:flex` with NO mobile navigation. This shell keeps the identical
 * nav list but makes it reachable on phones via a drawer — no items or routes
 * changed, and emoji icons are replaced with design-system `Icon`s.
 */
export function AdminShell({ activeHref, children }: AdminShellProps) {
  const [navOpen, setNavOpen] = useState(false)
  const role = useAuthStore((s) => s.role)
  const roleLabel = role === 'ADMIN_APPROVER' ? 'Approver' : role === 'ADMIN_REQUESTER' ? 'Requester' : 'Admin'

  const navList = (onNavigate?: () => void) => (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {adminNav.map((item) => {
        const active = item.href === activeHref
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon name={item.icon} size={18} />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open admin menu"
              className="flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary lg:hidden"
            >
              <Icon name="menu" size={22} />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon name="shield" size={18} />
              </span>
              <div className="leading-tight">
                <p className="font-serif text-base font-bold text-foreground">Magizh Admin</p>
                <p className="text-xs text-muted-foreground">Operations console</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground sm:flex">
              <Icon name="user" size={14} />
              {roleLabel}
            </span>
            <Button variant="ghost" size="icon" aria-label="Log out" onClick={() => void logout()}>
              <Icon name="log-out" size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-border/70 p-4 lg:block">
          <div className="sticky top-20">{navList()}</div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Mobile / tablet nav drawer */}
      <BottomSheet open={navOpen} onClose={() => setNavOpen(false)} title="Admin menu">
        {navList(() => setNavOpen(false))}
      </BottomSheet>
    </div>
  )
}
