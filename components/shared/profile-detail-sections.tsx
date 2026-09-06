import type { ReactNode } from 'react'

import { Icon, type IconName } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

export interface DetailField {
  label: string
  value: ReactNode
  /** Render the value in a monospaced face (ids, references). */
  mono?: boolean
}

export interface DetailSectionGroup {
  /** Optional heading rendered above the field grid. */
  title?: string
  /** Optional leading icon shown next to the title. */
  icon?: IconName
  fields: DetailField[]
}

interface ProfileDetailSectionsProps {
  sections: DetailSectionGroup[]
  /** Field columns at the `sm` breakpoint and up. Defaults to 3. */
  columns?: 2 | 3
  className?: string
}

const columnClass: Record<2 | 3, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

/**
 * Read-only, presentational profile field groups. Each group is a bordered
 * card containing a responsive grid of label/value pairs. Shared across the
 * profile detail page and admin review surfaces (moderation, user detail,
 * reports) so every read-only profile summary looks and behaves the same.
 */
export function ProfileDetailSections({
  sections,
  columns = 3,
  className,
}: ProfileDetailSectionsProps) {
  return (
    <div className={cn('grid gap-4', className)}>
      {sections.map((section, i) => (
        <section
          key={section.title ?? i}
          className="rounded-xl border border-border bg-secondary/40 p-4"
        >
          {section.title && (
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              {section.icon && (
                <span className="text-primary">
                  <Icon name={section.icon} size={16} />
                </span>
              )}
              {section.title}
            </p>
          )}
          <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-3', columnClass[columns])}>
            {section.fields.map((field) => (
              <div key={field.label} className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {field.label}
                </dt>
                <dd
                  className={cn(
                    'mt-0.5 truncate text-sm text-foreground',
                    field.mono && 'font-mono',
                  )}
                >
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
