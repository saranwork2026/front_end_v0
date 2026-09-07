'use client'

import * as React from 'react'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

export interface SearchableOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  label?: string
  options: SearchableOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  id?: string
  /** Shown as the disabled placeholder when there are no options yet. */
  emptyMessage?: string
}

/**
 * Typeahead/searchable dropdown for large option lists (400+ castes, ~200
 * countries) where a plain <select> is unwieldy.
 *
 * Mobile keyboard behaviour: the trigger is a plain <button>, so the first tap
 * only opens the list (no keyboard). The search <input> lives inside the open
 * panel and is NOT auto-focused, so the on-screen keyboard appears only when
 * the user deliberately taps the search box to start typing.
 */
export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Type to search…',
  error,
  disabled = false,
  id,
  emptyMessage = 'No options available',
}: SearchableSelectProps) {
  const generatedId = React.useId()
  const componentId = id ?? generatedId
  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = React.useMemo(() => {
    if (query.trim() === '') return options
    const q = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const closeDropdown = React.useCallback(() => {
    setOpen(false)
    setQuery('')
    setHighlight(-1)
  }, [])

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [closeDropdown])

  function openDropdown() {
    if (disabled) return
    setOpen(true)
    setQuery('')
    setHighlight(0)
  }

  function toggleDropdown() {
    if (disabled) return
    if (open) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  function select(opt: SearchableOption) {
    onChange(opt.value)
    closeDropdown()
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
      if (highlight >= 0 && filtered[highlight]) select(filtered[highlight])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeDropdown()
    }
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
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={toggleDropdown}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3.5 pr-9 text-left text-foreground shadow-sm outline-none transition-colors',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
            'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
            open && 'border-primary ring-2 ring-ring/40',
            error && 'border-destructive focus-visible:ring-destructive/30',
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {disabled ? emptyMessage : selected?.label ?? placeholder}
          </span>
        </button>

        {value && !disabled ? (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
            }}
            aria-label="Clear selection"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="x" size={16} />
          </button>
        ) : (
          <Icon
            name="chevron-down"
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        )}

        {open && !disabled && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-border bg-card p-1 shadow-xl">
            <div className="relative p-1">
              <input
                ref={searchRef}
                type="text"
                role="searchbox"
                aria-controls={`${componentId}-listbox`}
                aria-autocomplete="list"
                autoComplete="off"
                placeholder={placeholder}
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
              className="mt-1 max-h-56 overflow-auto p-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matches found</li>
              ) : (
                filtered.map((opt, index) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(e) => {
                      // mousedown fires before the outside-click handler
                      e.preventDefault()
                      select(opt)
                    }}
                    className={cn(
                      'cursor-pointer rounded-md px-3 py-2 text-sm transition-colors',
                      index === highlight ? 'bg-secondary' : 'hover:bg-secondary/60',
                      opt.value === value ? 'font-medium text-primary' : 'text-foreground',
                    )}
                  >
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
