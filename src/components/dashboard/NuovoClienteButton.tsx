'use client'

import { Plus } from 'lucide-react'
import { useNuovoCliente } from './NuovoClienteModal'

interface Props {
  variant?: 'primary' | 'ghost' | 'inline'
  label?: string
  className?: string
}

/**
 * Bottone "Nuovo cliente" che apre la modale globale.
 * Da usare dovunque serva un trigger di creazione cliente rapida.
 */
export function NuovoClienteButton({
  variant = 'primary',
  label = 'Nuovo cliente',
  className,
}: Props) {
  const { open } = useNuovoCliente()

  const base =
    variant === 'primary'
      ? 'shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors will-change-transform'
      : variant === 'ghost'
        ? 'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        : 'text-xs font-medium text-primary hover:text-primary/80 transition-colors'

  return (
    <button type="button" onClick={open} className={className ?? base}>
      <Plus className={variant === 'inline' ? 'h-3 w-3 inline' : 'h-4 w-4'} />
      {label}
    </button>
  )
}
