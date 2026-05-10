'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { ChoiceStep } from '@/components/configuratore/steps/atoms/ChoiceStep'

const meta: Meta<typeof ChoiceStep> = {
  title: 'Configuratore/Atoms/ChoiceStep',
  component: ChoiceStep,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof ChoiceStep>

export const TaglioGiacca: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string | null>(null)
      return (
        <div className="min-h-[600px] w-full bg-background">
          <ChoiceStep
            question="Che taglio per la giacca?"
            description="Seleziona la vestibilità: una decisione per schermata, vai avanti automaticamente."
            options={[
              { value: 'slim', label: 'Slim', description: 'Aderente, vita rientrata' },
              { value: 'fitted', label: 'Regolare', description: 'Equilibrato, taglio moderno' },
              { value: 'classic', label: 'Classico', description: 'Comodo, taglio tradizionale' },
            ]}
            value={value}
            onChoice={(v) => setValue(v)}
          />
        </div>
      )
    }
    return <Demo />
  },
}

export const Grid: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string | null>(null)
      return (
        <div className="min-h-[600px] w-full bg-background">
          <ChoiceStep
            question="Tipo di capo"
            description="Su 6+ opzioni il layout passa automaticamente a griglia."
            options={[
              { value: 'suit_2pc', label: 'Abito 2 pezzi' },
              { value: 'suit_3pc', label: 'Abito 3 pezzi' },
              { value: 'jacket', label: 'Solo giacca' },
              { value: 'trousers', label: 'Solo pantaloni' },
              { value: 'tuxedo', label: 'Smoking' },
              { value: 'coat', label: 'Cappotto' },
            ]}
            value={value}
            onChoice={(v) => setValue(v)}
          />
        </div>
      )
    }
    return <Demo />
  },
}
