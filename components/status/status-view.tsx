'use client'

import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import { statusConfig, type ProfileStatus } from '@/lib/status-data'

const toneMedallion: Record<string, string> = {
  warning: 'bg-warning/12 text-warning',
  danger: 'bg-destructive/12 text-destructive',
  success: 'bg-success/12 text-success',
  primary: 'bg-primary/10 text-primary',
}

const timelineDot: Record<string, string> = {
  done: 'bg-success text-success-foreground',
  current: 'bg-primary text-primary-foreground',
  upcoming: 'bg-muted text-muted-foreground',
}

interface StatusViewProps {
  status: ProfileStatus
  /** When true, show the state switcher (design-preview only, not the real page). */
  preview?: boolean
}

export function StatusView({ status, preview = false }: StatusViewProps) {
  const config = statusConfig[status]

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col justify-center px-4 py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Header band */}
        <div className="flex flex-col items-center gap-4 border-b border-border px-6 py-8 text-center sm:px-10 sm:py-10">
          <span
            className={cn(
              'flex size-16 items-center justify-center rounded-full',
              toneMedallion[config.tone],
            )}
            aria-hidden="true"
          >
            <Icon name={config.icon} className="size-8" />
          </span>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {config.eyebrow}
            </span>
            <h1 className="font-serif text-2xl text-balance text-foreground sm:text-3xl">
              {config.title}
            </h1>
            <StatusBadge status={config.status} />
          </div>

          <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
            {config.body}
          </p>
        </div>

        {/* Body: timeline or reviewer note */}
        {(config.timeline || config.note) && (
          <div className="border-b border-border px-6 py-6 sm:px-10">
            {config.timeline && (
              <ol className="flex flex-col gap-4">
                {config.timeline.map((step, index) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        timelineDot[step.state],
                      )}
                    >
                      {step.state === 'done' ? (
                        <Icon name="check" className="size-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-sm',
                        step.state === 'upcoming'
                          ? 'text-muted-foreground'
                          : 'font-medium text-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {config.note && (
              <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <Icon
                  name="alert-circle"
                  className="size-5 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    Reviewer note
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {config.note}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 px-6 py-6 sm:px-10">
          <div className="flex flex-col gap-3 sm:flex-row">
            {config.actions.map((action, index) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={cn(
                  buttonVariants({
                    variant: action.variant,
                    size: 'lg',
                  }),
                  index === 0 ? 'sm:flex-1' : '',
                  'w-full sm:w-auto',
                )}
              >
                {action.label}
                {index === 0 && action.variant === 'primary' && (
                  <Icon name="arrow-right" className="size-4" />
                )}
              </Link>
            ))}
          </div>

          {config.helper && (
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {config.helper}
            </p>
          )}
        </div>
      </div>

      {/* Status switcher for design-preview only (?preview=1). */}
      {preview && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Preview states:</span>
          {(Object.keys(statusConfig) as ProfileStatus[]).map((s) => (
            <Link
              key={s}
              href={`/profile/status?preview=1&state=${s}`}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                s === status
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {s}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
