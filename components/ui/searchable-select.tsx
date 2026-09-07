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
 * countries) where a plain <select> is unwieldy. Type to filter; click or use
 * arrow keys + Enter to select; a clear (×) button resets it. Mirrors the
 * existing app's SearchableSelect, styled with New-FE tokens.
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
  // On touch devices focusing a text input immediately raises the keyboard.
  // Keep the field read-only on the first tap (dropdown opens, first option
  // highlighted, no keyboard); a second tap into the field enables typing and
  // brings up the keyboard.
  const [typing, setTyping] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const displayValue = open ? query : selected?.label ?? ''

  const filtered = React.useMemo(() => {
    if (!open || query.trim() === '') return options
    const q = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query, open])

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
        setHighlight(-1)
        setTyping(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function openDropdown() {
    if (disabled) return
    setOpen(true)
    setQuery('')
    setHighlight(0)
  }

  // First tap: open the list without text focus (no keyboard). Second tap while
  // already open: switch to typing mode and raise the keyboard for searching.
  function handleInputClick() {
    if (disabled) return
    if (!open) {
      openDropdown()
    } else if (!typing) {
      setTyping(true)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  function select(opt: SearchableOption) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
    setHighlight(-1)
    setTyping(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        openDropdown()
      }
      return
    }
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
      setOpen(false)
      setQuery('')
      setHighlight(-1)
      setTyping(false)
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
        <input
          id={componentId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${componentId}-listbox`}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          disabled={disabled}
          readOnly={!typing}
          placeholder={disabled ? emptyMessage : placeholder}
          value={displayValue}
          onFocus={() => {
            if (!open) openDropdown()
          }}
          onClick={handleInputClick}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(-1)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'min-h-11 w-full rounded-lg border border-input bg-card px-3.5 pr-9 text-foreground shadow-sm outline-none transition-colors',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
            'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
            error && 'border-destructive focus-visible:ring-destructive/30',
          )}
        />
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
          <ul
            id={`${componentId}-listbox`}
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card p-1 shadow-xl"
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
                    // mousedown fires before the input blur / outside-click handler
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
