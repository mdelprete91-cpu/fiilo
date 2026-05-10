import type { Meta, StoryObj } from '@storybook/nextjs-vite'

type Token = { name: string; cssVar: string; oklch: string; note?: string }

const semantic: Token[] = [
  { name: 'background', cssVar: '--background', oklch: 'oklch(0.984 0.002 80)', note: 'Bianco freddo neutro' },
  { name: 'foreground', cssVar: '--foreground', oklch: 'oklch(0.11 0.015 80)', note: 'Near-black caldo' },
  { name: 'card', cssVar: '--card', oklch: 'oklch(1 0 0)' },
  { name: 'card-foreground', cssVar: '--card-foreground', oklch: 'oklch(0.11 0.015 80)' },
  { name: 'popover', cssVar: '--popover', oklch: 'oklch(1 0 0)' },
  { name: 'popover-foreground', cssVar: '--popover-foreground', oklch: 'oklch(0.11 0.015 80)' },
  { name: 'muted', cssVar: '--muted', oklch: 'oklch(0.968 0.003 80)' },
  { name: 'muted-foreground', cssVar: '--muted-foreground', oklch: 'oklch(0.50 0.014 80)' },
  { name: 'border', cssVar: '--border', oklch: 'oklch(0.89 0.010 80)', note: 'Bordo pergamena' },
  { name: 'input', cssVar: '--input', oklch: 'oklch(0.940 0.009 85)' },
  { name: 'ring', cssVar: '--ring', oklch: 'oklch(0.28 0.07 155)' },
]

const brand: Token[] = [
  { name: 'primary', cssVar: '--primary', oklch: 'oklch(0.28 0.07 155)', note: 'Verde foresta' },
  { name: 'primary-foreground', cssVar: '--primary-foreground', oklch: 'oklch(0.97 0.006 85)' },
  { name: 'secondary', cssVar: '--secondary', oklch: 'oklch(0.960 0.016 155)', note: 'Verde chiaro' },
  { name: 'secondary-foreground', cssVar: '--secondary-foreground', oklch: 'oklch(0.28 0.07 155)' },
  { name: 'accent', cssVar: '--accent', oklch: 'oklch(0.960 0.016 155)' },
  { name: 'accent-foreground', cssVar: '--accent-foreground', oklch: 'oklch(0.28 0.07 155)' },
  { name: 'destructive', cssVar: '--destructive', oklch: 'oklch(0.577 0.245 27.325)', note: 'Rosso azione distruttiva' },
  { name: 'ink', cssVar: '--ink', oklch: 'oklch(0.10 0.015 80)', note: 'Display headings' },
  { name: 'cb-blue', cssVar: '--cb-blue', oklch: 'oklch(0.28 0.07 155)', note: 'Alias del primary' },
]

const chart: Token[] = [
  { name: 'chart-1', cssVar: '--chart-1', oklch: 'oklch(0.28 0.07 155)', note: 'Verde foresta' },
  { name: 'chart-2', cssVar: '--chart-2', oklch: 'oklch(0.58 0.13 55)', note: 'Sienna caldo' },
  { name: 'chart-3', cssVar: '--chart-3', oklch: 'oklch(0.35 0.07 250)', note: 'Navy profondo' },
  { name: 'chart-4', cssVar: '--chart-4', oklch: 'oklch(0.50 0.10 30)', note: 'Terracotta' },
  { name: 'chart-5', cssVar: '--chart-5', oklch: 'oklch(0.45 0.07 300)', note: 'Prugna' },
]

function Swatch({ token }: { token: Token }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 w-full rounded-md border border-border"
        style={{ background: `var(${token.cssVar})` }}
      />
      <div className="flex flex-col gap-0.5">
        <code className="text-xs font-medium">{token.name}</code>
        <code className="text-[10px] text-muted-foreground">{token.cssVar}</code>
        <code className="text-[10px] text-muted-foreground">{token.oklch}</code>
        {token.note && <span className="text-[10px] text-muted-foreground italic">{token.note}</span>}
      </div>
    </div>
  )
}

function Group({ title, tokens }: { title: string; tokens: Token[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-heading text-base font-medium tracking-tight">{title}</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tokens.map((t) => (
          <Swatch key={t.cssVar} token={t} />
        ))}
      </div>
    </section>
  )
}

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const Semantic: Story = {
  render: () => <Group title="Semantic" tokens={semantic} />,
}

export const Brand: Story = {
  render: () => <Group title="Brand" tokens={brand} />,
}

export const Charts: Story = {
  render: () => <Group title="Chart palette" tokens={chart} />,
}

export const All: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Group title="Brand" tokens={brand} />
      <Group title="Semantic" tokens={semantic} />
      <Group title="Chart palette" tokens={chart} />
    </div>
  ),
}
