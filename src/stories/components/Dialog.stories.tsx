import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const meta: Meta = {
  title: 'Components/Dialog',
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj

export const NuovoCliente: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Nuovo cliente</Button>} />
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Nuovo cliente</DialogTitle>
          <DialogDescription>
            Aggiungi un cliente alla rubrica della sartoria.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nome
            </span>
            <Input placeholder="Mario Scarano" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Telefono
            </span>
            <Input placeholder="+39 333 1234567" />
          </label>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annulla</Button>} />
          <Button>Salva</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
