import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BottomSheet } from './bottom-sheet'

/**
 * Regression for the mobile "focus lost after every keystroke" bug on the
 * /search filter sheet. The sheet is opened by callers with an inline
 * `onClose={() => ...}` arrow (new identity every render). The mount effect
 * must NOT depend on that identity, otherwise it re-runs on each parent
 * re-render (every keystroke) and calls panelRef.focus(), yanking focus out of
 * the field being typed in. The effect is scoped to [open] only; this test
 * proves focus survives typing.
 */
function Harness() {
  // `city` changing on each keystroke re-renders this parent, which recreates
  // the inline onClose passed to BottomSheet — exactly the real /search setup.
  const [city, setCity] = useState('')
  return (
    <BottomSheet open onClose={() => { /* inline arrow: new identity each render */ }} title="Filters">
      <input
        aria-label="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
    </BottomSheet>
  )
}

describe('BottomSheet focus retention', () => {
  it('keeps focus in a free-text field across keystrokes (parent re-renders)', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByLabelText('City') as HTMLInputElement
    input.focus()
    expect(input).toHaveFocus()

    await user.type(input, 'Chennai')

    // The whole word landed in one field and focus never left it — proving the
    // sheet did not steal focus on the re-renders those keystrokes triggered.
    expect(input).toHaveValue('Chennai')
    expect(input).toHaveFocus()
  })

  it('still moves focus to the panel when it first opens', () => {
    const { rerender } = render(
      <BottomSheet open={false} onClose={() => {}} title="Filters">
        <input aria-label="City" />
      </BottomSheet>,
    )
    rerender(
      <BottomSheet open onClose={() => {}} title="Filters">
        <input aria-label="City" />
      </BottomSheet>,
    )
    const panel = screen.getByRole('dialog')
    expect(panel).toHaveFocus()
  })
})
