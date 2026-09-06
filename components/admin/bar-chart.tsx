'use client'

import { cn } from '@/lib/utils'

export interface BarDatum {
  label: string
  value: number
}

interface BarChartProps {
  data: BarDatum[]
  /** Accessible caption describing the series. */
  caption: string
  /** Formats the value in the tooltip/label. Defaults to locale integer. */
  formatValue?: (value: number) => string
  className?: string
}

/**
 * Lightweight, dependency-free vertical bar chart for the admin analytics
 * cards (stands in for the spec's `analyticsCharts.tsx`). Pure CSS/flex so it
 * stays crisp at every breakpoint and needs no client charting library.
 */
export function BarChart({
  data,
  caption,
  formatValue = (v) => v.toLocaleString('en-IN'),
  className,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <div role="img" aria-label={caption} className="flex items-end gap-2 sm:gap-3">
        {data.map((d) => {
          const pct = Math.round((d.value / max) * 100)
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-md bg-primary/85 transition-[height] hover:bg-primary"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                  title={`${d.label}: ${formatValue(d.value)}`}
                />
              </div>
              <span className="w-full truncate text-center text-[11px] font-medium text-muted-foreground">
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  )
}
