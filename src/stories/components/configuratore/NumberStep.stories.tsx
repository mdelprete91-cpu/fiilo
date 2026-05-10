'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { NumberStep } from '@/components/configuratore/steps/atoms/NumberStep'

const meta: Meta<typeof NumberStep> = {
  title: 'Configuratore/Atoms/NumberStep',
  component: NumberStep,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof NumberStep>

export const LarghezzaBavero: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<number | null>(8.5)
      return (
        <div className="min-h-[600px] w-full bg-background">
          <NumberStep
            question="Larghezza bavero"
            description="In centimetri. Tipico: 7–10 cm."
            value={value}
            onChange={setValue}
            onConfirm={() => alert('Avanti con ' + value + ' cm')}
            min={5}
            max={12}
            step={0.5}
            unit="cm"
            placeholder="es. 8.5"
          />
        </div>
      )
    }
    return <Demo />
  },
}
