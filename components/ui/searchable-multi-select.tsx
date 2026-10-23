'use client'

import * as React from 'react'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface SearchableMultiSelectProps {
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
  /** Placeholder for the in-panel search box. */
  searchPlaceholder?: string
  /** Shown as the trigger text when disabled (e.g. "Open to all"). */
  emptyHint?: string
  id?: string
  /**
   * Id of an external element labelling this control. Used when the visible
   * label is rendered by a parent (e.g. the Field header) so we associate the
   * trigger with it instead of duplicating the label text.
   */
  labelledBy?: string
}

/**
 * A searchable multi-selection DROPDOWN (combobox + popup listbox), used by
 * Partner Preferences for Country / community (religion, caste) and the other
 * list criteria. Unlike the inline pill-wall MultiSelect it replaces, this
 * presents a disclosure trigger that opens a filterable listbox; options toggle
 * on click and the panel stays open so several values can be picked in a row.
 * Selected values render as removable chips under the trigger and are restored
 * from the controlled `value` (saved preferences) on mount.
 *
 * Mobile keyboard behaviour mirrors SearchableSelect: the trigger is a plain
 * <button> (first tap only opens), and the search <input> is not auto-focused,
 * so the on-screen keyboard appears only when the user taps the search box.
 */
export function SearchableMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select one or more',
  disabled = false,
  optionLabel = (v) => v,
  searchPlaceholder = 'Type to search…',
  emptyHint,
  id,
  labelledBy,
}: SearchableMultiSelectProps) {
  const generatedId = React.useId()
  const componentId = id ?? generatedId
  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(-1)
  const [dropUp, setDropUp] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const filtered = React.useMemo(
    () =>
      // FR-5: match the localized label OR the English value (`o`).
      options.filter(
        (o) => q === '' || optionLabel(o).toLowerCase().includes(q) || o.toLowerCase().includes(q),
      ),
    // optionLabel is stable per render; options/q drive the filter.
    [options, q, optionLabel],
  )

  const closeDropdown = React.useCallback(() => {
    setOpen(false)
    setQuery('')
    setHighlight(-1)
  }, [])

  React.useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, closeDropdown])

  function openDropdown() {
    if (disabled) return
    const trigger = containerRef.current?.getBoundingClientRect()
    if (trigger) {
      let scrollParent: Element | null = containerRef.current?.parentElement ?? null
      while (scrollParent && scrollParent !== document.documentElement) {
        const style = window.getComputedStyle(scrollParent)
        if (/auto|scroll|overlay/.test(style.overflow + style.overflowY)) break
        scrollParent = scrollParent.parentElement
      }
      const containerBottom = scrollParent
        ? scrollParent.getBoundingClientRect().bottom
        : window.innerHeight
      const containerTop = scrollParent ? scrollParent.getBoundingClientRect().top : 0
      const spaceBelow = containerBottom - trigger.bottom
      const spaceAbove = trigger.top - containerTop
      const PANEL_APPROX = 300
      setDropUp(spaceBelow < PANEL_APPROX && spaceAbove > spaceBelow)
    }
    setOpen(true)
    setQuery('')
    setHighlight(0)
  }

  function toggleDropdown() {
    if (disabled) return
    if (open) closeDropdown()
    else openDropdown()
  }

  function toggleOption(option: string) {
    if (value.includes(option)) onChange(value.filter((v) => v !== option))
    else onChange([...value, option])
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      openDropdown()
    } else if (e.key === 'Escape') {
      closeDropdown()
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((p) => Math.min(p + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((p) => Math.max(p - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight >= 0 && filtered[highlight]) toggleOption(filtered[highlight])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeDropdown()
    }
  }

  const triggerSummary =
    value.length === 0
      ? disabled
        ? (emptyHint ?? 'Open to all')
        : placeholder
      : value.length === 1
        ? optionLabel(value[0])
        : `${value.length} selected`

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={componentId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          id={componentId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${componentId}-listbox`}
          aria-labelledby={!label && labelledBy ? labelledBy : undefined}
          aria-label={!label && !labelledBy ? 'Select options' : undefined}
          disabled={disabled}
          onClick={toggleDropdown}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3.5 pr-9 text-left text-foreground shadow-sm outline-none transition-colors',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
            'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
            open && 'border-primary ring-2 ring-ring/40',
          )}
        >
          <span className={cn('truncate', value.length === 0 && 'text-muted-foreground')}>
            {triggerSummary}
          </span>
        </button>

        <Icon
          name="chevron-down"
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        {open && !disabled && (
          <div
            className={cn(
              'absolute left-0 right-0 z-30 rounded-lg border border-border bg-card p-1 shadow-xl',
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            <div className="relative p-1">
              <input
                type="text"
                role="searchbox"
                aria-controls={`${componentId}-listbox`}
                aria-autocomplete="list"
                aria-labelledby={!label && labelledBy ? labelledBy : undefined}
                aria-label={label ? `Search ${label}` : labelledBy ? undefined : 'Search options'}
                autoComplete="off"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlight(0)
                }}
                onKeyDown={handleSearchKeyDown}
                className={cn(
                  'min-h-10 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground outline-none transition-colors',
                  'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
                )}
              />
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            <ul
              id={`${componentId}-listbox`}
              role="listbox"
              aria-multiselectable="true"
              className="mt-1 max-h-56 overflow-auto p-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matches found</li>
              ) : (
                filtered.map((opt, index) => {
                  const isSelected = value.includes(opt)
                  return (
                    <li
                      key={opt}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(index)}
                      onMouseDown={(e) => {
                        // mousedown fires before the outside-click handler, and
                        // we preventDefault so the panel stays open for the next
                        // selection (multi-select).
                        e.preventDefault()
                        toggleOption(opt)
                      }}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        index === highlight ? 'bg-secondary' : 'hover:bg-secondary/60',
                        isSelected ? 'font-medium text-primary' : 'text-foreground',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded border',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input',
                        )}
                      >
                        {isSelected && <Icon name="check" size={12} />}
                      </span>
                      {optionLabel(opt)}
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Selected values as removable chips (restored from controlled value). */}
      {!disabled && value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 pt-1">
          {value.map((v) => (
            <li key={v}>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-sm font-medium text-primary">
                {optionLabel(v)}
                <button
                  type="button"
                  onClick={() => toggleOption(v)}
                  className="inline-flex size-5 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/20 hover:text-primary"
                  aria-label={`Remove ${optionLabel(v)}`}
                >
                  <Icon name="x" size={13} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
