import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from '@/components/ui/input'

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: { placeholder: 'Mario Scarano' },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  decorators: [(Story) => <div className="w-72">{Story()}</div>],
}

export const States: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Read-only" readOnly defaultValue="Valore bloccato" />
      <Input
        placeholder="Errore"
        aria-invalid
        defaultValue="email-non-valida"
      />
    </div>
  ),
}

export const Form: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <form className="flex w-80 flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Nome
        </span>
        <Input placeholder="Mario Scarano" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Email
        </span>
        <Input type="email" placeholder="mario@scarano.it" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Telefono
        </span>
        <Input type="tel" placeholder="+39 333 1234567" />
      </label>
    </form>
  ),
}
