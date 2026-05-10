import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CheckCircle2, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
  },
  args: { children: 'In lavorazione', variant: 'default' },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {}

export const Variants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
}

export const StatiOrdine: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        <Clock />
        In attesa
      </Badge>
      <Badge>
        <CheckCircle2 />
        Confermato
      </Badge>
      <Badge variant="outline">In produzione</Badge>
      <Badge variant="destructive">Scaduto</Badge>
    </div>
  ),
}
