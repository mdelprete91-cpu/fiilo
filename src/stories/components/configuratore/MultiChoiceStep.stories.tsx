'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { MultiChoiceStep } from '@/components/configuratore/steps/atoms/MultiChoiceStep'

const meta: Meta<typeof MultiChoiceStep> = {
  title: 'Configuratore/Atoms/MultiChoiceStep',
  component: MultiChoiceStep,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof MultiChoiceStep>

export const PartiInContrasto: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string[]>([])
      return (
        <div className="min-h-[600px] w-full bg-background">
          <MultiChoiceStep
            question="Quali parti in contrasto?"
            description="Seleziona una o più parti — clicca Avanti quando hai finito."
            options={[
              { value: 'lapels', label: 'Bavero', description: 'Risvolto del davanti' },
              { value: 'cuffs', label: 'Polsini', description: 'Bordo manica' },
              { value: 'back_collar', label: 'Colletto posteriore', description: 'Sotto-colletto' },
            ]}
            value={value}
            onChange={(v) => setValue(v)}
            onConfirm={() => alert('Confermato: ' + value.join(', '))}
          />
        </div>
      )
    }
    return <Demo />
  },
}
