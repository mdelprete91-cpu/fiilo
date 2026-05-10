import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Card>

export const Cliente: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Mario Scarano</CardTitle>
        <CardDescription>Cliente storico — 12 capi prodotti</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">Apri scheda</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Taglia</dt>
            <dd className="font-medium">50R</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</dt>
            <dd className="font-medium">€ 1.200</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Ultimo ordine</dt>
            <dd className="font-medium">Mar 4, 2026</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tessuto</dt>
            <dd className="font-medium">Loro Piana</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm">Archivia</Button>
        <Button size="sm">Nuovo ordine</Button>
      </CardFooter>
    </Card>
  ),
}

export const Stat: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Ordini aperti', value: '24', delta: '+3 questa settimana' },
        { label: 'Fatturato MTD', value: '€ 18.450', delta: '+12% vs mese scorso' },
        { label: 'Clienti attivi', value: '186', delta: '+5 nuovi' },
      ].map((s) => (
        <Card key={s.label} className="shadow-card">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-wide">
              {s.label}
            </CardDescription>
            <CardTitle className="font-heading text-3xl font-light text-ink">
              {s.value}
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <span className="text-xs text-muted-foreground">{s.delta}</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
}
