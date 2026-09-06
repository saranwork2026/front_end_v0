'use client'

import * as React from 'react'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  label?: string
  /** The selectable option values. */
  options: readonly string[]
  /** Currently selected values. */
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
  /** Optional map of option value → display label. */
  optionLabel?: (value: string) => string
  emptyHint?: string
  /**
   * When set (or when the option list is large), show a typeahead search box
   * that filters the available pills — essential for long lists (400+ castes,
   * ~200 countries). Auto-enabled when options.length > 12.
   */
  searchable?: boolean
  /** Placeholder for the search box. */
  searchPlaceholder?: string
}

/**
 * A tag-style multi-select used by Partner Preferences (spec §Partner
 * Preferences — "MultiSelect"). Selected values render as removable chips; the
 * remaining options appear as toggle pills below. Disabled state is used by the
 * "open to all" (no-bar) toggles, which clear + lock the control.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select one or more',
  disabled = false,
  optionLabel = (v) => v,
  emptyHint,
  searchable,
  searchPlaceholder = 'Type to search…',
}: MultiSelectProps) {
  const [query, setQuery] = React.useState('')

  const toggle = (option: string) => {
    if (disabled) return
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  // Auto-enable search for long lists so the pill wall stays usable.
  const showSearch = (searchable ?? options.length > 12) && !disabled
  const q = query.trim().toLowerCase()
  const available = options
    .filter((o) => !value.includes(o))
    .filter((o) => q === '' || optionLabel(o).toLowerCase().includes(q))

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}

      <div
        className={cn(
          'rounded-lg border border-input bg-card p-2.5 shadow-sm transition-colors',
          disabled && 'cursor-not-allowed bg-muted opacity-70',
        )}
      >
        {value.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {value.map((v) => (
              <li key={v}>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-sm font-medium text-primary">
                  {optionLabel(v)}
                  <button
                    type="button"
                    onClick={() => toggle(v)}
                    disabled={disabled}
                    className="inline-flex size-5 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/20 hover:text-primary disabled:pointer-events-none"
                    aria-label={`Remove ${optionLabel(v)}`}
                  >
                    <Icon name="x" size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 py-1 text-sm text-muted-foreground">
            {disabled ? (emptyHint ?? 'Open to all') : placeholder}
          </p>
        )}
      </div>

      {showSearch && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={label ? `Search ${label}` : 'Search options'}
          className="mt-1 min-h-10 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {available.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              {q ? 'No matches found' : 'All options selected'}
            </p>
          ) : (
            available.slice(0, 60).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                + {optionLabel(o)}
              </button>
            ))
          )}
          {available.length > 60 && (
            <span className="px-1 py-1 text-xs text-muted-foreground">
              +{available.length - 60} more — refine your search
            </span>
          )}
        </div>
      )}
    </div>
  )
}
