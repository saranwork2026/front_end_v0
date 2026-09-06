'use client'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface PaginationProps {
  /** 0-indexed current page */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function windowedPages(page: number, totalPages: number): number[] {
  const start = Math.max(0, Math.min(page - 2, totalPages - 5))
  const end = Math.min(totalPages, start + 5)
  const pages: number[] = []
  for (let i = start; i < end; i++) pages.push(i)
  return pages
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = windowedPages(page, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-col items-center gap-2', className)}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="chevron-left" size={18} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'flex size-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
              p === page
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-secondary',
            )}
          >
            {p + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Page {page + 1} of {totalPages}
      </p>
    </nav>
  )
}
