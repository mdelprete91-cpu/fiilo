import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Info_: Story = {
  name: 'Info',
  render: () => (
    <Alert className="w-[480px]">
      <Info />
      <AlertTitle>Backup notturno completato</AlertTitle>
      <AlertDescription>
        L'ultimo backup è stato eseguito alle 02:17. Tutti i dati sono al sicuro.
      </AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  render: () => (
    <Alert className="w-[480px]">
      <CheckCircle2 />
      <AlertTitle>Ordine confermato</AlertTitle>
      <AlertDescription>
        L'ordine #2401 è stato confermato e inviato in produzione.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">Vedi ordine</Button>
      </AlertAction>
    </Alert>
  ),
}

export const Warning: Story = {
  render: () => (
    <Alert className="w-[480px]" data-variant="destructive">
      <AlertCircle />
      <AlertTitle>Token WhatsApp in scadenza</AlertTitle>
      <AlertDescription>
        Il token temporaneo scade tra 4 ore. Genera un System User Access Token permanente.
      </AlertDescription>
    </Alert>
  ),
}
