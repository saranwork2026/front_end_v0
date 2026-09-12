'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GenerateChartResponse } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { profileApi } from '@/src/lib/api'
import type { WizardForm } from '@/lib/wizard-data'
import { SouthIndianChart } from '@/components/horoscope/south-indian-chart'
import { BIRTH_PLACE_OPTIONS, findBirthPlace } from '@/src/data/birthPlaceData'

/**
 * Birth-chart generation panel for the Horoscope step.
 *
 * Flow: capture birth place (label + coordinates + timezone) → Generate → review
 * the D1 (Raasi) + D9 (Amsam) charts and the derived nakshatra/raasi/lagnam →
 * Confirm (persists the charts and pre-fills the panchangam dropdowns) or
 * Regenerate. Generation is GUARDED: it needs the DOB (from Basic), the birth
 * time, and a resolvable place — otherwise the button is disabled with a clear
 * message and the manual dropdowns remain the fallback.
 */
export function HoroscopeChartPanel({
  form,
  onChange,
}: {
  form: WizardForm
  onChange: (patch: Partial<WizardForm>) => void
}) {
  const [result, setResult] = useState<GenerateChartResponse | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [ownCharts, setOwnCharts] = useState<GenerateChartResponse | null>(null)
  const [showManual, setShowManual] = useState(false)

  // When the member picks a place from the list, auto-fill coordinates + timezone.
  const selectPlace = useCallback(
    (label: string) => {
      const place = findBirthPlace(label)
      if (place) {
        onChange({
          birthPlaceLabel: place.label,
          birthLatitude: String(place.lat),
          birthLongitude: String(place.lon),
          birthTimezone: place.timezone,
        })
      } else {
        onChange({ birthPlaceLabel: label })
      }
    },
    [onChange],
  )

  // Load any previously-confirmed charts so the member sees them without
  // regenerating.
  useEffect(() => {
    let active = true
    profileApi
      .getHoroscopeCharts()
      .then((res) => {
        if (!active || !res.data || res.data.length === 0) return
        const rasi = res.data.find((c) => c.chartType === 'RASI')
        const navamsa = res.data.find((c) => c.chartType === 'NAVAMSA')
        if (rasi && navamsa) {
          setOwnCharts({
            rasiChart: rasi,
            navamsaChart: navamsa,
            nakshatra: form.nakshatra,
            padam: Number(form.padam) || 0,
            raasi: form.raasi,
            lagnam: form.lagnam,
          })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const timezone = form.birthTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  // Guard: DOB (from Basic step), birth time, and a resolvable place required.
  const missing: string[] = []
  if (!form.dob) missing.push('date of birth')
  if (!form.birthTime) missing.push('birth time')
  if (!form.birthLatitude || !form.birthLongitude) missing.push('birth place coordinates')
  const canGenerate = missing.length === 0

  const generate = useCallback(async () => {
    setError(null)
    setSaved(false)
    setGenerating(true)
    try {
      const res = await profileApi.generateHoroscopeChart({
        dateOfBirth: form.dob,
        birthTime: form.birthTime,
        latitude: Number(form.birthLatitude),
        longitude: Number(form.birthLongitude),
        timezone,
        placeLabel: form.birthPlaceLabel || undefined,
      })
      setResult(res.data)
      setOwnCharts(null)
      // Pre-fill the panchangam dropdowns from the suggestions (the member can
      // still override any of them before saving the section).
      onChange({
        nakshatra: res.data.nakshatra || form.nakshatra,
        raasi: res.data.raasi || form.raasi,
        lagnam: res.data.lagnam || form.lagnam,
      })
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status
      setError(
        status === 422
          ? 'Birth time and birth place are required to generate the chart.'
          : 'Could not generate the chart. Please check the details and try again.',
      )
    } finally {
      setGenerating(false)
    }
  }, [form, timezone, onChange])

  const confirm = useCallback(async () => {
    if (!result) return
    setSaving(true)
    setError(null)
    try {
      await profileApi.confirmHoroscopeChart({
        rasiChart: result.rasiChart,
        navamsaChart: result.navamsaChart,
        edited: false,
      })
      setSaved(true)
      setOwnCharts(result)
      setResult(null)
    } catch {
      setError('Could not save the chart. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [result])

  const showing = result ?? ownCharts

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Digital birth chart (Raasi & Amsam)</span>
        <p className="text-xs text-muted-foreground">
          Generate your Raasi (D1) and Amsam (D9) charts from your date of birth, birth time, and
          birth place. Review them and save — you can edit the values above before saving.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SearchableSelect
          label="Birth place"
          options={BIRTH_PLACE_OPTIONS}
          value={form.birthPlaceLabel}
          onChange={selectPlace}
          placeholder="Search your birth city / town…"
        />

        {form.birthPlaceLabel && !showManual && (
          <p className="text-xs text-muted-foreground">
            {form.birthLatitude && form.birthLongitude ? (
              <>
                Coordinates: {form.birthLatitude}, {form.birthLongitude} · {form.birthTimezone || timezone}.{' '}
              </>
            ) : (
              <>Place not in the list — please enter coordinates manually. </>
            )}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => setShowManual(true)}
            >
              Enter coordinates manually
            </button>
          </p>
        )}

        {(showManual || (!!form.birthPlaceLabel && !findBirthPlace(form.birthPlaceLabel))) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Latitude"
              type="number"
              inputMode="decimal"
              value={form.birthLatitude}
              onChange={(e) => onChange({ birthLatitude: e.target.value })}
              placeholder="e.g. 10.79"
            />
            <Input
              label="Longitude"
              type="number"
              inputMode="decimal"
              value={form.birthLongitude}
              onChange={(e) => onChange({ birthLongitude: e.target.value })}
              placeholder="e.g. 79.13"
            />
            <Input
              label="Timezone"
              value={form.birthTimezone}
              onChange={(e) => onChange({ birthTimezone: e.target.value })}
              placeholder={timezone}
            />
          </div>
        )}
      </div>

      {!canGenerate && (
        <p className="text-xs text-warning-foreground">
          To generate the chart, add your {missing.join(', ')}.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs text-success">Chart saved. It will be shared per your horoscope settings.</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={generate}
          loading={generating}
          disabled={!canGenerate || generating}
        >
          {showing ? 'Regenerate chart' : 'Generate chart'}
        </Button>
        {result && (
          <Button type="button" variant="success" size="sm" onClick={confirm} loading={saving}>
            Save chart
          </Button>
        )}
      </div>

      {showing && (
        <div className="mt-1 flex flex-col gap-4">
          {result && (
            <p className="text-xs text-muted-foreground">
              Nakshatra: <b>{result.nakshatra}</b> (padam {result.padam}) · Raasi: <b>{result.raasi}</b> ·
              Lagnam: <b>{result.lagnam}</b>. Check the details above and click Save chart to keep them.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Raasi (D1)</span>
              <SouthIndianChart chart={showing.rasiChart} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Amsam (D9)</span>
              <SouthIndianChart chart={showing.navamsaChart} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
