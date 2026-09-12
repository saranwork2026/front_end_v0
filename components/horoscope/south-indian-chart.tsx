'use client'

import { GRAHA_TAMIL, type ChartData, type Graha } from '@matrimony/shared-core'

/**
 * South-Indian style birth chart — a fixed 4×4 grid where each of the 12 zodiac
 * signs occupies a fixed outer box (signs never rotate; only the planets inside
 * change). The centre 2×2 is a label block ("இராசி" / "அம்சம்").
 *
 * Pure function of the chart's placements JSON (sign → grahas). Empty boxes
 * render empty. This is the canonical render; it needs no house math because
 * the South-Indian layout pins each sign to a fixed cell.
 */

/**
 * Grid position (row, col) 0-indexed in the 4×4 for each sign, matching the
 * traditional South-Indian layout:
 *
 *   Meena    | Mesha     | Rishabha | Mithuna
 *   Kumbha   |  (label)  |  (label) | Kataka
 *   Makara   |  (label)  |  (label) | Simha
 *   Dhanus   | Vrischika | Tula     | Kanya
 */
const SIGN_CELL: Record<string, { row: number; col: number }> = {
  MEENA: { row: 0, col: 0 },
  MESHA: { row: 0, col: 1 },
  RISHABHA: { row: 0, col: 2 },
  MITHUNA: { row: 0, col: 3 },
  KUMBHA: { row: 1, col: 0 },
  KATAKA: { row: 1, col: 3 },
  MAKARA: { row: 2, col: 0 },
  SIMHA: { row: 2, col: 3 },
  DHANUS: { row: 3, col: 0 },
  VRISCHIKA: { row: 3, col: 1 },
  TULA: { row: 3, col: 2 },
  KANYA: { row: 3, col: 3 },
}

/** Short human label per sign for a subtle corner hint. */
const SIGN_SHORT: Record<string, string> = {
  MESHA: 'மேஷம்', RISHABHA: 'ரிஷபம்', MITHUNA: 'மிதுனம்', KATAKA: 'கடகம்',
  SIMHA: 'சிம்மம்', KANYA: 'கன்னி', TULA: 'துலாம்', VRISCHIKA: 'விருச்சிகம்',
  DHANUS: 'தனுசு', MAKARA: 'மகரம்', KUMBHA: 'கும்பம்', MEENA: 'மீனம்',
}

interface SouthIndianChartProps {
  chart: ChartData
  /** Centre label — defaults from chartType. */
  title?: string
  className?: string
}

export function SouthIndianChart({ chart, title, className }: SouthIndianChartProps) {
  const centreLabel = title ?? (chart.chartType === 'NAVAMSA' ? 'அம்சம்' : 'இராசி')

  // Build a 4×4 matrix of cells; null = part of the centre label block.
  const cells: (string | null)[][] = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ]
  for (const [sign, pos] of Object.entries(SIGN_CELL)) {
    cells[pos.row][pos.col] = sign
  }

  return (
    <div className={className}>
      <div
        className="relative grid aspect-square w-full max-w-xs grid-cols-4 grid-rows-4 overflow-hidden rounded-lg border border-border bg-card text-foreground"
        role="img"
        aria-label={`${centreLabel} chart`}
      >
        {cells.flatMap((rowArr, r) =>
          rowArr.map((sign, c) => {
            if (sign === null) return <span key={`${r}-${c}`} className="border border-border/40" />
            const grahas = (chart.placements[sign] ?? []) as Graha[]
            return (
              <div
                key={`${r}-${c}`}
                className="relative flex flex-wrap content-start gap-x-1.5 gap-y-0.5 border border-border/60 p-1 text-[11px] leading-tight sm:text-xs"
              >
                <span className="pointer-events-none absolute right-0.5 top-0.5 text-[8px] text-muted-foreground/60">
                  {SIGN_SHORT[sign]}
                </span>
                {grahas.map((g) => (
                  <span key={g} className="font-medium">
                    {GRAHA_TAMIL[g]}
                  </span>
                ))}
              </div>
            )
          }),
        )}

        {/* Centre label spanning the inner 2×2. */}
        <div className="pointer-events-none absolute left-1/4 top-1/4 flex h-1/2 w-1/2 items-center justify-center border border-border/40 bg-secondary/30 text-center font-serif text-sm font-semibold text-foreground">
          {centreLabel}
        </div>
      </div>
    </div>
  )
}
