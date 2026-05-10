import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const SchedaCliente: Story = {
  render: () => (
    <Tabs defaultValue="anagrafica" className="w-[520px]">
      <TabsList>
        <TabsTrigger value="anagrafica">Anagrafica</TabsTrigger>
        <TabsTrigger value="misure">Misure</TabsTrigger>
        <TabsTrigger value="ordini">Ordini</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
      </TabsList>
      <TabsContent value="anagrafica" className="pt-4 text-sm text-foreground">
        Mario Scarano · Cliente storico dal 2018
      </TabsContent>
      <TabsContent value="misure" className="pt-4 text-sm text-foreground">
        Petto 102cm · Vita 88cm · Cavallo 78cm
      </TabsContent>
      <TabsContent value="ordini" className="pt-4 text-sm text-foreground">
        12 ordini totali · 1 in produzione
      </TabsContent>
      <TabsContent value="whatsapp" className="pt-4 text-sm text-foreground">
        24 messaggi · ultimo ricevuto 3h fa
      </TabsContent>
    </Tabs>
  ),
}
