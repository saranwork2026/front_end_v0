'use client'

import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * A single toggleable filter chip. When `onRemove` is passed it renders an
 * active/removable pill (an applied filter); otherwise it is a toggle option.
 */
interface FilterChipProps {
  label: string
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
}

export function FilterChip({ label, active, onClick, onRemove }: FilterChipProps) {
  if (onRemove) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1.5 pl-3 pr-1.5 text-sm font-medium text-primary">
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} filter`}
          className="rounded-full p-0.5 text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary"
        >
          <Icon name="x" size={14} />
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {active && <Icon name="check" size={14} />}
      {label}
    </button>
  )
}

/**
 * Horizontal filter bar: a "Filters" trigger button plus the currently
 * applied filter chips, with a clear-all affordance.
 */
interface FilterBarProps {
  activeFilters: string[]
  onOpen: () => void
  onRemove: (label: string) => void
  onClear: () => void
  className?: string
}

export function FilterBar({
  activeFilters,
  onOpen,
  onRemove,
  onClear,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40"
      >
        <Icon name="filter" size={16} />
        Filters
        {activeFilters.length > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {activeFilters.length}
          </span>
        )}
      </button>

      {activeFilters.map((label) => (
        <FilterChip key={label} label={label} onRemove={() => onRemove(label)} />
      ))}

      {activeFilters.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
