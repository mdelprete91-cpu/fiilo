import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

const meta: Meta = {
  title: 'Components/Toggles',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const SwitchDefault: Story = {
  name: 'Switch',
  render: () => (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-3 text-sm">
        <Switch defaultChecked />
        Notifiche WhatsApp attive
      </label>
      <label className="flex items-center gap-3 text-sm">
        <Switch />
        Email di riepilogo settimanale
      </label>
      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <Switch disabled />
        Sync calendario (in arrivo)
      </label>
    </div>
  ),
}

export const CheckboxDefault: Story = {
  name: 'Checkbox',
  render: () => (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-3 text-sm">
        <Checkbox defaultChecked />
        Misure aggiornate
      </label>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox />
        Saldo riscosso
      </label>
      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <Checkbox disabled />
        Capo consegnato
      </label>
    </div>
  ),
}
