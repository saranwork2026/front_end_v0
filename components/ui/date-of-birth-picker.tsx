import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components/ui/select'

interface DateOfBirthPickerProps {
  /** Current value as a `YYYY-MM-DD` string, or '' when unset. */
  value: string
  /** Emits a `YYYY-MM-DD` string, or '' when the date is incomplete. */
  onChange: (isoDate: string) => void
  /** Field caption shown above the three dropdowns. */
  label?: string
  /** Validation message shown below the group. */
  error?: string
  /** Base id used to derive per-select ids (kept stable for a11y wiring). */
  id?: string
  disabled?: boolean
}

/** English fallback month names, used when Intl is unavailable. */
const FALLBACK_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Number of days in a given month (1–12) for a given year (handles leap Feb). */
function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month rolls back to the last day of `month`.
  // `year` may be NaN (year not yet chosen); default to a non-leap year so
  // February shows 28 until a year is picked, then re-clamps once known.
  const safeYear = Number.isFinite(year) ? year : 2001
  return new Date(safeYear, month, 0).getDate()
}

/** Parse a `YYYY-MM-DD` string into numeric parts; NaN for missing pieces. */
function parseIso(value: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return { y: NaN, m: NaN, d: NaN }
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

/** Format numeric parts as a zero-padded `YYYY-MM-DD` string. */
function formatIso(y: number, m: number, d: number): string {
  const yy = String(y).padStart(4, '0')
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/**
 * A friendly Day / Month / Year dropdown picker for dates of birth. Controlled
 * component: the source of truth is the `value` prop (`YYYY-MM-DD` or ''), and
 * every change emits the same format via `onChange` (or '' while incomplete).
 *
 * The year list is a UX convenience bound only (currentYear-18 down to
 * currentYear-80) — the authoritative marriage-age validation stays in the zod
 * schema / backend and is not duplicated here.
 */
export function DateOfBirthPicker({
  value,
  onChange,
  label,
  error,
  id,
  disabled,
}: DateOfBirthPickerProps) {
  const { t, i18n } = useTranslation()
  const generatedId = React.useId()
  const baseId = id ?? generatedId
  const errorId = `${baseId}-error`

  // Partial selections must survive even while the date is incomplete (a fully
  // controlled `value` would emit '' and wipe earlier picks). We hold the
  // in-progress parts locally and re-sync whenever the external `value` is set
  // to a complete date that differs from what we're showing (e.g. the form
  // resets the field or loads an existing profile).
  const [parts, setParts] = React.useState(() => parseIso(value))
  const lastValueRef = React.useRef(value)
  if (value !== lastValueRef.current) {
    lastValueRef.current = value
    // Only adopt a non-empty external value; an empty '' is what we emit while
    // mid-edit, so treating it as a reset would erase the user's partial picks.
    if (value !== '') {
      const next = parseIso(value)
      if (next.y !== parts.y || next.m !== parts.m || next.d !== parts.d) {
        setParts(next)
      }
    }
  }

  const { y, m, d } = parts
  const hasYear = Number.isFinite(y)
  const hasMonth = Number.isFinite(m)
  const hasDay = Number.isFinite(d)

  // Localized month labels (value = numeric 1–12). Prefer Intl for the active
  // language; fall back to English names if Intl throws or is unavailable.
  const monthLabels = React.useMemo<string[]>(() => {
    try {
      const fmt = new Intl.DateTimeFormat(i18n.language || 'en', { month: 'long' })
      return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2001, i, 1)))
    } catch {
      return FALLBACK_MONTHS
    }
  }, [i18n.language])

  // Descending year list: newest (18-year-old) first, oldest (80) last.
  const years = React.useMemo<number[]>(() => {
    const current = new Date().getFullYear()
    const newest = current - 18
    const oldest = current - 80
    const list: number[] = []
    for (let yr = newest; yr >= oldest; yr -= 1) list.push(yr)
    return list
  }, [])

  const maxDay = daysInMonth(y, hasMonth ? m : 1)
  const dayCount = hasMonth ? maxDay : 31

  const emit = React.useCallback(
    (ny: number, nm: number, nd: number) => {
      setParts({ y: ny, m: nm, d: nd })
      const complete = Number.isFinite(ny) && Number.isFinite(nm) && Number.isFinite(nd)
      const emitted = complete ? formatIso(ny, nm, nd) : ''
      // Keep the sync guard in step so a subsequent identical `value` prop
      // (echoed back by the parent) is not mistaken for an external reset.
      lastValueRef.current = emitted
      onChange(emitted)
    },
    [onChange],
  )

  const handleDayChange = (raw: string) => {
    const nd = raw === '' ? NaN : Number(raw)
    emit(y, m, nd)
  }

  const handleMonthChange = (raw: string) => {
    const nm = raw === '' ? NaN : Number(raw)
    // Clamp the selected day to the new month's length (e.g. 31 → Feb 28/29).
    let nd = d
    if (Number.isFinite(nm) && hasDay) {
      const max = daysInMonth(y, nm)
      if (d > max) nd = max
    }
    emit(y, nm, nd)
  }

  const handleYearChange = (raw: string) => {
    const ny = raw === '' ? NaN : Number(raw)
    // A year change can shorten February (leap → non-leap); re-clamp the day.
    let nd = d
    if (hasMonth && hasDay) {
      const max = daysInMonth(ny, m)
      if (d > max) nd = max
    }
    emit(ny, m, nd)
  }

  const placeholder = t('common.select')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span id={`${baseId}-label`} className="text-sm font-medium text-foreground">
          {label}
        </span>
      )}
      <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby={label ? `${baseId}-label` : undefined}>
        <Select
          id={`${baseId}-year`}
          label={t('common.year')}
          value={hasYear ? String(y) : ''}
          disabled={disabled}
          className={error ? 'border-destructive focus-visible:ring-destructive/30' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => handleYearChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {years.map((yr) => (
            <option key={yr} value={String(yr)}>
              {yr}
            </option>
          ))}
        </Select>

        <Select
          id={`${baseId}-month`}
          label={t('common.month')}
          value={hasMonth ? String(m) : ''}
          disabled={disabled}
          className={error ? 'border-destructive focus-visible:ring-destructive/30' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => handleMonthChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {monthLabels.map((name, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {name}
            </option>
          ))}
        </Select>

        <Select
          id={`${baseId}-day`}
          label={t('common.day')}
          value={hasDay ? String(d) : ''}
          disabled={disabled || !(hasYear && hasMonth)}
          className={error ? 'border-destructive focus-visible:ring-destructive/30' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => handleDayChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {hasYear && hasMonth
            ? Array.from({ length: dayCount }, (_, i) => i + 1).map((dayNum) => (
                <option key={dayNum} value={String(dayNum)}>
                  {dayNum}
                </option>
              ))
            : null}
        </Select>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
