'use client'

import * as React from 'react'

import { Icon, type IconName } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: IconName
  /** Renders a show/hide toggle and manages the type internally. */
  password?: boolean
  /** Spec: register blocks paste on password fields. */
  blockPaste?: boolean
}

/**
 * Local auth field with a leading icon and optional password show/hide toggle.
 * Mirrors the spec's `IconInput`. Built on the same tokens as the design-system
 * Input so it stays visually consistent.
 */
export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  (
    { className, label, error, hint, leadingIcon, password, blockPaste, id, type, ...props },
    ref,
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const [visible, setVisible] = React.useState(false)
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
    const resolvedType = password ? (visible ? 'text' : 'password') : type

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <Icon
              name={leadingIcon}
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          )}
          <input
            id={inputId}
            ref={ref}
            type={resolvedType}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onPaste={blockPaste ? (e) => e.preventDefault() : props.onPaste}
            className={cn(
              'min-h-11 w-full rounded-lg border border-input bg-card text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70',
              'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
              'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
              leadingIcon ? 'pl-10' : 'pl-3.5',
              password ? 'pr-11' : 'pr-3.5',
              error && 'border-destructive focus-visible:ring-destructive/30',
              className,
            )}
            {...props}
          />
          {password && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
            </button>
          )}
        </div>
        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1 text-sm text-destructive"
          >
            <Icon name="alert-circle" size={14} />
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)
IconInput.displayName = 'IconInput'
