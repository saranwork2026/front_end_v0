import Link from 'next/link'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/ui/icon'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProfileStrengthWidgetProps {
  /** Completion percentage 0–100. */
  strength: number
  /** Outstanding items that would raise the score. */
  missing?: string[]
  className?: string
}

/**
 * Dashboard completion nudge (spec `ProfileStrengthWidget`). Shows the profile
 * completion percentage with a progress meter and the top outstanding actions,
 * linking to the profile editor. Purely presentational — no business logic.
 */
export function ProfileStrengthWidget({
  strength,
  missing = [],
  className,
}: ProfileStrengthWidgetProps) {
  const { t } = useTranslation()
  const pct = Math.max(0, Math.min(100, Math.round(strength)))
  const complete = pct >= 100

  return (
    <section
      aria-label={t('page.shared.strengthAria')}
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Radial meter */}
        <div
          className="relative flex size-16 shrink-0 items-center justify-center rounded-full sm:size-20"
          style={{
            background: `conic-gradient(var(--color-gold) ${pct * 3.6}deg, var(--color-secondary) 0deg)`,
          }}
          role="img"
          aria-label={t('page.shared.strengthCompleteAria', { pct })}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-card font-serif text-base font-bold text-foreground sm:size-16 sm:text-lg">
            {pct}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-gold">
            <Icon name="sparkles" size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {t('page.shared.strengthLabel')}
            </span>
          </div>
          <h2 className="mt-1 text-balance font-serif text-lg font-bold text-foreground">
            {complete
              ? t('page.shared.strengthAllSet')
              : t('page.shared.strengthGetNoticed')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {complete
              ? t('page.shared.strengthAllSetDesc')
              : t('page.shared.strengthIncompleteDesc')}
          </p>
        </div>
      </div>

      {!complete && missing.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {missing.slice(0, 3).map((item) => (
            <li
              key={item}
              className="flex items-center gap-2.5 text-sm text-muted-foreground"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground/70">
                <Icon name="check" size={12} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/profile"
        className={cn(buttonVariants({ variant: complete ? 'secondary' : 'primary' }), 'mt-5 w-full sm:w-auto')}
      >
        <Icon name="edit" size={16} />
        {complete ? t('page.shared.viewProfileBtn') : t('page.shared.completeProfileBtn')}
      </Link>
    </section>
  )
}
