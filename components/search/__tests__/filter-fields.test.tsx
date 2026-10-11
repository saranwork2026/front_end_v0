import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Real English strings so label queries match on 'Min weight (kg)' etc.
import '@/src/i18n/config'

import { FilterFields } from '@/components/search/filter-fields'
import { WEIGHT_KG_OPTIONS } from '@/src/data/numericOptions'

describe('FilterFields — weight range', () => {
  it('renders min/max weight selects populated from WEIGHT_KG_OPTIONS', () => {
    render(<FilterFields value={{}} onChange={vi.fn()} />)

    const min = screen.getByLabelText('Min weight (kg)') as HTMLSelectElement
    const max = screen.getByLabelText('Max weight (kg)') as HTMLSelectElement
    expect(min).toBeInTheDocument()
    expect(max).toBeInTheDocument()

    // "Any" placeholder + every WEIGHT_KG_OPTIONS entry.
    const values = Array.from(min.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value)
    expect(values).toContain('') // Any
    expect(values).toContain(WEIGHT_KG_OPTIONS[0].value)
    expect(values).toContain(WEIGHT_KG_OPTIONS[WEIGHT_KG_OPTIONS.length - 1].value)
  })

  it('fires onChange with minWeightKg / maxWeightKg (numbers) when selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FilterFields value={{}} onChange={onChange} />)

    await user.selectOptions(screen.getByLabelText('Min weight (kg)'), '50')
    expect(onChange).toHaveBeenLastCalledWith({ minWeightKg: 50 })

    await user.selectOptions(screen.getByLabelText('Max weight (kg)'), '80')
    expect(onChange).toHaveBeenLastCalledWith({ maxWeightKg: 80 })
  })
})
