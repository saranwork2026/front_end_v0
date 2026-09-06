'use client'

import { useEffect, useRef } from 'react'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { steps } from '@/lib/wizard-data'

interface WizardProgressProps {
  current: number
  maxVisited: number
  onJump: (index: number) => void
}

/**
 * Step pills. Visited steps (index <= maxVisited) are clickable to jump *back*;
 * future steps are shown but disabled. On mobile the row scrolls horizontally
 * with no visible scrollbar and keeps the active pill in view.
 */
export function WizardProgress({
  current,
  maxVisited,
  onJump,
}: WizardProgressProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const activeRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [current])

  return (
    <nav aria-label="Profile steps">
      <ol
        ref={listRef}
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center md:overflow-visible"
      >
        {steps.map((step, index) => {
          const isCurrent = index === current
          const isDone = index < current
          const isVisited = index <= maxVisited
          const isJumpable = isVisited && index < current

          return (
            <li
              key={step.key}
              ref={isCurrent ? activeRef : undefined}
              className="shrink-0"
            >
              <button
                type="button"
                onClick={() => isJumpable && onJump(index)}
                disabled={!isJumpable}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  isCurrent &&
                    'border-primary bg-primary text-primary-foreground shadow-sm',
                  isDone &&
                    'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
                  !isCurrent &&
                    !isDone &&
                    'border-border bg-card text-muted-foreground',
                  isJumpable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-xs',
                    isCurrent && 'bg-primary-foreground/20',
                    isDone && 'bg-primary/15',
                    !isCurrent && !isDone && 'bg-muted',
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Icon name="check" size={13} /> : index + 1}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
