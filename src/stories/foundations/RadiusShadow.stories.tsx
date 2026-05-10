import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const radii = [
  { name: 'sm', cls: 'rounded-sm', formula: 'calc(--radius * 0.6)' },
  { name: 'md', cls: 'rounded-md', formula: 'calc(--radius * 0.8)' },
  { name: 'lg', cls: 'rounded-lg', formula: '--radius (0.125rem · 2px)' },
  { name: 'xl', cls: 'rounded-xl', formula: 'calc(--radius * 1.4)' },
  { name: '2xl', cls: 'rounded-2xl', formula: 'calc(--radius * 1.8)' },
  { name: '3xl', cls: 'rounded-3xl', formula: 'calc(--radius * 2.2)' },
  { name: '4xl', cls: 'rounded-4xl', formula: 'calc(--radius * 2.6)' },
  { name: 'full', cls: 'rounded-full', formula: 'pillole / avatar' },
]

const shadows = [
  { name: 'shadow-card', cls: 'shadow-card', note: '0 1px 3px oklch(0 0 0 / 0.05)' },
  { name: 'shadow-sm', cls: 'shadow-sm', note: 'Tailwind · sm' },
  { name: 'shadow', cls: 'shadow', note: 'Tailwind · default' },
  { name: 'shadow-md', cls: 'shadow-md' },
  { name: 'shadow-lg', cls: 'shadow-lg' },
  { name: 'shadow-xl', cls: 'shadow-xl' },
]

const meta: Meta = {
  title: 'Foundations/Radius & Shadows',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const Radius: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {radii.map((r) => (
        <div key={r.name} className="flex flex-col gap-2">
          <div className={`h-20 w-full bg-primary ${r.cls}`} />
          <code className="text-xs font-medium">{r.name}</code>
          <code className="text-[10px] text-muted-foreground">{r.formula}</code>
        </div>
      ))}
    </div>
  ),
}

export const Shadows: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
      {shadows.map((s) => (
        <div key={s.name} className="flex flex-col gap-2">
          <div className={`h-24 w-full rounded-md bg-card ${s.cls}`} />
          <code className="text-xs font-medium">{s.name}</code>
          {s.note && <code className="text-[10px] text-muted-foreground">{s.note}</code>}
        </div>
      ))}
    </div>
  ),
}
