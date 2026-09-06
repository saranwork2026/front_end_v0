import Link from 'next/link'
import type { ReactNode } from 'react'

import { Icon } from '@/components/ui/icon'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  /** Optional slot rendered above the title (e.g. an "invited by" pill or back link). */
  banner?: ReactNode
}

/**
 * Shared wrapper for every auth screen: warm brand gradient, centered card,
 * logo + tagline header, and legal footer. Matches the spec's PublicLayout
 * ("narrow centered card on a warm gradient; logo + tagline header").
 */
export function AuthShell({ title, subtitle, children, footer, banner }: AuthShellProps) {
  return (
    <main className="relative flex min-h-dvh flex-col bg-brand-warm px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-brand-maroon opacity-[0.06]" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="flex flex-col items-center gap-2 pb-6 text-center">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Icon name="heart" size={20} />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight text-primary">
              Magizh
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">Where hearts meet & families unite</p>
        </header>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          {banner}
          <div className="flex flex-col gap-1.5 pb-6">
            <h1 className="text-balance font-serif text-2xl font-semibold text-foreground">
              {title}
            </h1>
            {subtitle && <p className="text-pretty text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="pt-5 text-center text-sm text-muted-foreground">{footer}</div>}

        <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-8 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy-policy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
          <span className="w-full text-center text-muted-foreground/70 sm:w-auto">
            © {new Date().getFullYear()} Magizh Matrimony
          </span>
        </footer>
      </div>
    </main>
  )
}
