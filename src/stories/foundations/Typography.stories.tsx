import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

const sample = 'Sartoria su misura — gestionale per atelier italiani'

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <code className="text-xs text-muted-foreground">font-heading · 4xl · 300</code>
        <p className="font-heading text-4xl font-light text-ink">{sample}</p>
      </div>
      <div>
        <code className="text-xs text-muted-foreground">font-heading · 3xl · 400</code>
        <p className="font-heading text-3xl text-ink">{sample}</p>
      </div>
      <div>
        <code className="text-xs text-muted-foreground">2xl · 500</code>
        <p className="text-2xl font-medium text-foreground">{sample}</p>
      </div>
      <div>
        <code className="text-xs text-muted-foreground">xl · 400</code>
        <p className="text-xl text-foreground">{sample}</p>
      </div>
      <div>
        <code className="text-xs text-muted-foreground">base · 400 (body)</code>
        <p className="text-base text-foreground">{sample}</p>
      </div>
      <div>
        <code className="text-xs text-muted-foreground">sm · 400 (UI label)</code>
        <p className="text-sm text-foreground">{sample}</p>
      </div>
      <div>
        <code className="text-xs text-muted-foreground">xs · 500 (caption)</code>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sezione · Cliente
        </p>
      </div>
    </div>
  ),
}

export const Weights: Story = {
  render: () => (
    <div className="flex flex-col gap-3 text-2xl">
      <p className="font-light">300 — DM Sans Light · Display</p>
      <p className="font-normal">400 — DM Sans Regular · Body</p>
      <p className="font-medium">500 — DM Sans Medium · CTA / label</p>
    </div>
  ),
}

export const Mono: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <code className="text-xs text-muted-foreground">font-mono · Geist Mono</code>
      <pre className="rounded-md bg-muted p-4 font-mono text-sm">
        {`const cliente = {\n  nome: "Scarano",\n  taglia: "50R",\n  saldo: 1200,\n}`}
      </pre>
    </div>
  ),
}
