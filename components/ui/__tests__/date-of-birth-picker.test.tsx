import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Initialise i18n so useTranslation() returns real English strings (Day/Month/
// Year/Select) rather than raw keys — the queries below match on those labels.
import '@/src/i18n/config'

import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker'

/**
 * Controlled test wrapper: re-renders the picker with each emitted value so the
 * dropdowns reflect the latest state, exactly like a real form field would.
 */
function ControlledPicker({
  initial = '',
  onEmit,
}: {
  initial?: string
  onEmit?: (v: string) => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <DateOfBirthPicker
      label="Date of birth"
      value={value}
      onChange={(v) => {
        setValue(v)
        onEmit?.(v)
      }}
    />
  )
}

function daySelect() {
  return screen.getByLabelText('Day') as HTMLSelectElement
}
function monthSelect() {
  return screen.getByLabelText('Month') as HTMLSelectElement
}
function yearSelect() {
  return screen.getByLabelText('Year') as HTMLSelectElement
}

describe('DateOfBirthPicker', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('renders three selects and emits a zero-padded YYYY-MM-DD when all three are chosen', async () => {
    const user = userEvent.setup()
    const onEmit = vi.fn()
    render(<ControlledPicker onEmit={onEmit} />)

    expect(daySelect()).toBeInTheDocument()
    expect(monthSelect()).toBeInTheDocument()
    expect(yearSelect()).toBeInTheDocument()

    // Choose a year first so the day list is stable, then month, then day.
    await user.selectOptions(yearSelect(), '1995')
    await user.selectOptions(monthSelect(), '3') // March
    await user.selectOptions(daySelect(), '5')

    expect(onEmit).toHaveBeenLastCalledWith('1995-03-05')
  })

  function dayValues(select: HTMLSelectElement): string[] {
    return Array.from(select.querySelectorAll('option'))
      .map((o) => (o as HTMLOptionElement).value)
      .filter((v) => v !== '')
  }

  it('clamps February day options for a non-leap year (Feb 28, no Feb 29/30)', () => {
    render(<ControlledPicker initial="2001-02-15" />)
    const values = dayValues(daySelect())
    expect(values).toContain('28')
    expect(values).not.toContain('29')
    expect(values).not.toContain('30')
  })

  it('includes Feb 29 for a leap year', () => {
    render(<ControlledPicker initial="2000-02-15" />)
    const values = dayValues(daySelect())
    expect(values).toContain('29')
    expect(values).not.toContain('30')
  })

  it('clamps an out-of-range day down when the month changes to a shorter month', async () => {
    const user = userEvent.setup()
    const onEmit = vi.fn()
    // Jan 31 (a valid 31-day month) then switch to February.
    render(<ControlledPicker initial="1990-01-31" onEmit={onEmit} />)

    await user.selectOptions(monthSelect(), '2') // February 1990 → 28 days

    expect(onEmit).toHaveBeenLastCalledWith('1990-02-28')
  })

  it('pre-selects the three dropdowns from an existing YYYY-MM-DD value', () => {
    render(<ControlledPicker initial="1992-07-09" />)

    expect(yearSelect().value).toBe('1992')
    expect(monthSelect().value).toBe('7')
    expect(daySelect().value).toBe('9')
  })

  it('shows placeholders for an empty value and does not emit a complete date', async () => {
    const user = userEvent.setup()
    const onEmit = vi.fn()
    render(<ControlledPicker initial="" onEmit={onEmit} />)

    expect(daySelect().value).toBe('')
    expect(monthSelect().value).toBe('')
    expect(yearSelect().value).toBe('')

    // Picking only a month keeps the date incomplete → emits ''.
    await user.selectOptions(monthSelect(), '5')
    expect(onEmit).toHaveBeenLastCalledWith('')
    expect(onEmit).not.toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })
})
