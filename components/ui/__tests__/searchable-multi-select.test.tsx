import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'

const OPTIONS = ['India', 'United States', 'United Kingdom', 'Australia', 'Canada']

describe('SearchableMultiSelect', () => {
  it('is a closed dropdown trigger, not an always-open option list', () => {
    render(
      <SearchableMultiSelect label="Country" options={OPTIONS} value={[]} onChange={vi.fn()} />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Country' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('opens, filters, selects multiple (stays open), and closes on outside click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Harness() {
      const [value, setValue] = React.useState<string[]>([])
      return (
        <SearchableMultiSelect
          label="Country"
          options={OPTIONS}
          value={value}
          onChange={(next) => {
            setValue(next)
            onChange(next)
          }}
        />
      )
    }
    render(<Harness />)

    await user.click(screen.getByRole('combobox', { name: 'Country' }))
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true')

    // Filter the list.
    await user.type(screen.getByRole('searchbox'), 'united')
    const filtered = within(listbox).getAllByRole('option').map((o) => o.textContent)
    expect(filtered.every((t) => /united/i.test(t ?? ''))).toBe(true)

    // Select the first match; panel stays open for the next pick.
    await user.click(within(listbox).getAllByRole('option')[0])
    expect(onChange).toHaveBeenLastCalledWith(['United States'])
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Close on outside click.
    await user.click(document.body)
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('restores and renders saved values as removable chips', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SearchableMultiSelect
        label="Country"
        options={OPTIONS}
        value={['India', 'Canada']}
        onChange={onChange}
      />,
    )
    // Trigger summarizes the count; chips allow removal.
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveTextContent('2 selected')
    const removeIndia = screen.getByRole('button', { name: /remove india/i })
    await user.click(removeIndia)
    expect(onChange).toHaveBeenLastCalledWith(['Canada'])
  })

  it('is disabled and shows the empty hint when open-to-all is on', () => {
    render(
      <SearchableMultiSelect
        label="Country"
        options={OPTIONS}
        value={[]}
        disabled
        emptyHint="Open to all"
        onChange={vi.fn()}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Country' })
    expect(trigger).toBeDisabled()
    expect(trigger).toHaveTextContent('Open to all')
  })
})
