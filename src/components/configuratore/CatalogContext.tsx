'use client'

import { createContext, useContext } from 'react'
import type { Fabric, Lining, Button as ButtonType, ThreadColor } from '@/types/database'

export interface Catalog {
  fabrics: Fabric[]
  linings: Lining[]
  buttons: ButtonType[]
  threadColors: ThreadColor[]
}

const CatalogContext = createContext<Catalog | null>(null)

export function CatalogProvider({ value, children }: { value: Catalog; children: React.ReactNode }) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): Catalog {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return ctx
}
