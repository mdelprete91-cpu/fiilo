'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { ToggleStep } from '@/components/configuratore/steps/atoms/ToggleStep'

const meta: Meta<typeof ToggleStep> = {
  title: 'Configuratore/Atoms/ToggleStep',
  component: ToggleStep,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof ToggleStep>

export const AsolaLavorata: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<boolean | null>(null)
      return (
        <div className="min-h-[600px] w-full bg-background">
          <ToggleStep
            question="Asola lavorata sul bavero?"
            description="Tipica della scuola napoletana, opzionale altrove."
            yesDescription="Sì, asola dipinta a mano"
            noDescription="No, bavero senza asola"
            value={value}
            onChoice={(v) => setValue(v)}
          />
        </div>
      )
    }
    return <Demo />
  },
}
