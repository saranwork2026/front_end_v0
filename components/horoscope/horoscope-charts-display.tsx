'use client'

import { useEffect, useState } from 'react'
import type { ChartData } from '@matrimony/shared-core'

import { profileApi } from '@/src/lib/api'
import { SouthIndianChart } from '@/components/horoscope/south-indian-chart'

/**
 * Read-only display of a member's stored Raasi (D1) + Amsam (D9) charts.
 * Fetches the caller's own charts when {@code profileId} is omitted, otherwise
 * another member's charts (the backend gates those by visibility). Renders
 * nothing when there are no charts, so it can be dropped into any profile view.
 */
export function HoroscopeChartsDisplay({ profileId }: { profileId?: string }) {
  const [charts, setCharts] = useState<ChartData[]>([])

  useEffect(() => {
    let active = true
    const req = profileId
      ? profileApi.getHoroscopeChartsForProfile(profileId)
      : profileApi.getHoroscopeCharts()
    req
      .then((res) => active && setCharts(res.data ?? []))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [profileId])

  const rasi = charts.find((c) => c.chartType === 'RASI')
  const navamsa = charts.find((c) => c.chartType === 'NAVAMSA')
  if (!rasi && !navamsa) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rasi && (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Raasi (D1)</span>
          <SouthIndianChart chart={rasi} />
        </div>
      )}
      {navamsa && (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Amsam (D9)</span>
          <SouthIndianChart chart={navamsa} />
        </div>
      )}
    </div>
  )
}
