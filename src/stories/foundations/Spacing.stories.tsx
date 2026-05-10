import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const scale = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

const meta: Meta = {
  title: 'Foundations/Spacing',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Scala Tailwind di default · 1 unità = 0.25rem (4px)
      </p>
      <div className="flex flex-col gap-2">
        {scale.map((s) => (
          <div key={s} className="flex items-center gap-3">
            <code className="w-12 text-xs text-muted-foreground">p-{s}</code>
            <div
              className="h-4 rounded-sm bg-primary"
              style={{ width: `${s * 0.25}rem` }}
            />
            <code className="text-xs text-muted-foreground">{s * 0.25}rem · {s * 4}px</code>
          </div>
        ))}
      </div>
    </div>
  ),
}
