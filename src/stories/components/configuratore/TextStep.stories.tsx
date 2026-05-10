'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { TextStep } from '@/components/configuratore/steps/atoms/TextStep'

const meta: Meta<typeof TextStep> = {
  title: 'Configuratore/Atoms/TextStep',
  component: TextStep,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof TextStep>

export const Monogramma: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string | null>(null)
      return (
        <div className="min-h-[600px] w-full bg-background">
          <TextStep
            question="Testo del monogramma"
            description="Massimo 3 caratteri — verrà ricamato sulla fodera interna."
            value={value}
            onChange={setValue}
            onConfirm={() => alert('Monogramma: ' + value)}
            placeholder="MS"
            maxLength={3}
            required
          />
        </div>
      )
    }
    return <Demo />
  },
}
