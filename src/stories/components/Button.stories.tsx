import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Salva cliente',
    variant: 'default',
    size: 'default',
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const Variants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const Sizes: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="default">default</Button>
      <Button size="lg">lg</Button>
    </div>
  ),
}

export const WithIcon: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus />
        Nuovo ordine
      </Button>
      <Button variant="outline">
        Continua
        <ArrowRight />
      </Button>
      <Button variant="destructive">
        <Trash2 />
        Elimina
      </Button>
    </div>
  ),
}

export const IconOnly: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="icon-xs" variant="outline" aria-label="aggiungi">
        <Plus />
      </Button>
      <Button size="icon-sm" variant="outline" aria-label="aggiungi">
        <Plus />
      </Button>
      <Button size="icon" variant="outline" aria-label="aggiungi">
        <Plus />
      </Button>
      <Button size="icon-lg" variant="outline" aria-label="aggiungi">
        <Plus />
      </Button>
    </div>
  ),
}

export const Disabled: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Default</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  ),
}
