'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface NavLink {
  label: string
  href: string
  icon: IconName
}

const defaultLinks: NavLink[] = [
  { label: 'Matches', href: '#', icon: 'users' },
  { label: 'Search', href: '#', icon: 'search' },
  { label: 'Interests', href: '#', icon: 'heart' },
  { label: 'Messages', href: '#', icon: 'chat' },
]

interface SiteHeaderProps {
  links?: NavLink[]
  activeHref?: string
  className?: string
}

/**
 * Global application header: brand mark, desktop navigation, account actions,
 * and a mobile menu button that opens navigation in a bottom sheet.
 */
export function SiteHeader({
  links = defaultLinks,
  activeHref = links?.[0]?.href ?? defaultLinks[0].href,
  className,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="#" className="flex items-center gap-2.5" aria-label="Magizh Matrimony home">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon name="heart-filled" size={18} />
          </span>
          <span className="font-serif text-base font-bold text-foreground">
            Magizh
          </span>
        </a>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = link.href === activeHref
            return (
              <a
                key={link.label}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon name={link.icon} size={16} />
                {link.label}
              </a>
            )
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Icon name="bell" size={18} />
          </Button>
          <button
            type="button"
            aria-label="Account"
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Icon name="user" size={18} />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary md:hidden"
        >
          <Icon name="menu" size={22} />
        </button>
      </div>

      {/* Mobile navigation */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {links.map((link) => {
            const active = link.href === activeHref
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon name={link.icon} size={20} />
                {link.label}
              </a>
            )
          })}
        </nav>
        <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4">
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Icon name="user" size={20} />
            My profile
          </a>
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Icon name="settings" size={20} />
            Settings
          </a>
        </div>
      </BottomSheet>
    </header>
  )
}
