import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Real i18n strings so the aria-label / surrounding translation resolves.
import '@/src/i18n/config'

import { SouthIndianChart } from '@/components/horoscope/south-indian-chart'
import { GRAHA_TAMIL, type ChartData } from '@matrimony/shared-core'

// Heaviest realistic case: one house (MESHA) holds four planets whose Tamil
// abbreviations are long/close enough to have collided with the sign label and
// each other before the fix. Two more occupied houses + the rest empty.
const rasiChart: ChartData = {
  chartType: 'RASI',
  placements: {
    MESHA: ['SUN', 'SATURN', 'RAHU', 'VENUS'],
    KANYA: ['MOON', 'MERCURY'],
    DHANUS: ['JUPITER'],
  },
}

const navamsaChart: ChartData = {
  chartType: 'NAVAMSA',
  placements: {
    MESHA: ['LAGNA'],
  },
}

describe('SouthIndianChart', () => {
  it('renders the sign label and every planet token in a crowded house (no drop)', () => {
    render(<SouthIndianChart chart={rasiChart} />)

    // Sign label for the crowded house is present.
    expect(screen.getByText('மேஷம்')).toBeInTheDocument()

    // Each of the four planet tokens renders — note சு (Venus) and சூ (Sun) are
    // distinct strings; assert each exactly so nothing is silently dropped.
    expect(screen.getByText(GRAHA_TAMIL.SUN)).toBeInTheDocument() // சூ
    expect(screen.getByText(GRAHA_TAMIL.SATURN)).toBeInTheDocument() // சனி
    expect(screen.getByText(GRAHA_TAMIL.RAHU)).toBeInTheDocument() // ரா
    expect(screen.getByText(GRAHA_TAMIL.VENUS)).toBeInTheDocument() // சு
  })

  it('renders all 12 zodiac sign labels and the centre title', () => {
    render(<SouthIndianChart chart={rasiChart} />)

    const signLabels = [
      'மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி',
      'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்',
    ]
    for (const label of signLabels) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }

    // Centre title for the D1 (Raasi) chart + the chart container.
    expect(screen.getByText('இராசி')).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('shows the அம்சம் centre title for the D9 (Navamsa) chart', () => {
    render(<SouthIndianChart chart={navamsaChart} />)
    expect(screen.getByText('அம்சம்')).toBeInTheDocument()
    expect(screen.getByText(GRAHA_TAMIL.LAGNA)).toBeInTheDocument() // ல
  })
})
