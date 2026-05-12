'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'dark', label: 'Scuro', icon: Moon },
] as const

/**
 * Three-way segmented control for picking light / system / dark.
 * Persists via next-themes (localStorage key `theme`).
 *
 * Renders nothing until mounted to avoid hydration mismatch (next-themes
 * resolves the theme on the client only).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="px-2 py-2">
      <p className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Tema
      </p>
      <div className="inline-flex w-full rounded-md border border-border bg-muted/40 p-0.5">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          const selected = mounted && theme === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={selected}
              aria-label={opt.label}
              title={opt.label}
              className={cn(
                'flex flex-1 items-center justify-center rounded-sm py-1.5 transition-colors',
                selected
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
