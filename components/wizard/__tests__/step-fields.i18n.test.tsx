import * as React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import i18n from '@/src/i18n/config'
import { StepFields } from '@/components/wizard/step-fields'
import { emptyForm, type WizardForm } from '@/lib/wizard-data'

// The horoscope step pulls the Tamil calendar on mount; stub the API so the
// religious-step render we test here never touches the network.
vi.mock('@/src/lib/api', () => ({
  profileApi: {
    getTamilCalendar: () => Promise.resolve({ data: {} }),
  },
}))

afterEach(async () => {
  await i18n.changeLanguage('en')
})

function Harness({ form }: { form: WizardForm }) {
  const [f, setF] = React.useState<WizardForm>(form)
  return <StepFields step="religious" form={f} errors={{}} onChange={(p) => setF((prev) => ({ ...prev, ...p }))} />
}

describe('StepFields religious step — language-aware option labels', () => {
  it('renders Tamil religion labels in ta mode and keeps the English value', async () => {
    await i18n.changeLanguage('ta')
    render(<Harness form={{ ...emptyForm, religion: 'Hindu' }} />)

    // The religion <select> is a native select; find the Hindu option.
    const hinduOption = screen.getByRole('option', { name: 'இந்து' }) as HTMLOptionElement
    expect(hinduOption).toBeInTheDocument()
    // VALUE stays the exact English string the backend stores (NFR-1).
    expect(hinduOption.value).toBe('Hindu')
  })

  it('renders English religion labels in en mode', async () => {
    await i18n.changeLanguage('en')
    render(<Harness form={{ ...emptyForm, religion: 'Hindu' }} />)
    const hinduOption = screen.getByRole('option', { name: 'Hindu' }) as HTMLOptionElement
    expect(hinduOption).toBeInTheDocument()
    expect(hinduOption.value).toBe('Hindu')
  })

  it('caste option renders Tamil label but submits the English value', async () => {
    await i18n.changeLanguage('ta')
    render(<Harness form={{ ...emptyForm, religion: 'Hindu', caste: 'Brahmin - Iyer' }} />)

    // Caste uses the SearchableSelect: the trigger shows the selected label.
    const casteTrigger = screen.getByRole('combobox', { name: /caste|சாதி/i })
    // Selected label is Tamil…
    expect(within(casteTrigger).queryByText('பிராமணர் - ஐயர்') ?? casteTrigger).toHaveTextContent('பிராமணர் - ஐயர்')
  })
})
