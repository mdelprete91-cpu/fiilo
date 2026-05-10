import { cn } from '@/lib/utils'

interface StepFrameProps {
  question: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Shared wrapper for all atomic step components: large heading, optional
 * description, and a centered content area. Mirrors the Typeform aesthetic —
 * generous whitespace, one decision per screen.
 */
export function StepFrame({ question, description, children, className }: StepFrameProps) {
  return (
    <div className={cn('mx-auto flex w-full max-w-2xl flex-col gap-8 py-10', className)}>
      <header className="flex flex-col gap-3 text-center">
        <h1 className="font-heading text-3xl font-light text-ink md:text-4xl">{question}</h1>
        {description && (
          <p className="text-sm text-muted-foreground md:text-base">{description}</p>
        )}
      </header>
      <div className="animate-fade-up">{children}</div>
    </div>
  )
}
