'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import type { Fabric, FabricSeason } from '@/types/database'

interface Props {
  fabrics: Fabric[]
  showPrices: boolean
}

const SEASON_LABEL: Record<FabricSeason, string> = {
  spring_summer: 'Primavera/Estate',
  autumn_winter: 'Autunno/Inverno',
  all_season: 'Tutto l\'anno',
}

type WeightBucket = 'light' | 'medium' | 'heavy' | 'all'

const WEIGHT_LABEL: Record<Exclude<WeightBucket, 'all'>, string> = {
  light: 'Leggero (≤ 240 g)',
  medium: 'Medio (240–320 g)',
  heavy: 'Pesante (> 320 g)',
}

function bucketOf(g: number | null): Exclude<WeightBucket, 'all'> | null {
  if (g == null) return null
  if (g <= 240) return 'light'
  if (g <= 320) return 'medium'
  return 'heavy'
}

export function FabricCatalog({ fabrics, showPrices }: Props) {
  const [season, setSeason] = useState<FabricSeason | 'all'>('all')
  const [weight, setWeight] = useState<WeightBucket>('all')
  const [query, setQuery] = useState('')

  const compositions = useMemo(() => {
    const set = new Set<string>()
    fabrics.forEach((f) => {
      if (f.composition) set.add(f.composition)
    })
    return Array.from(set).sort()
  }, [fabrics])

  const [composition, setComposition] = useState<string>('all')

  const filtered = useMemo(() => {
    return fabrics.filter((f) => {
      if (season !== 'all' && f.season !== season) return false
      if (weight !== 'all' && bucketOf(f.weight_grams) !== weight) return false
      if (composition !== 'all' && f.composition !== composition) return false
      if (query) {
        const q = query.toLowerCase()
        const hay = [f.name, f.mill, f.code, f.color, f.composition]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [fabrics, season, weight, composition, query])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, mulino, codice…"
          className="h-9 flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Select value={season} onChange={(v) => setSeason(v as FabricSeason | 'all')}>
          <option value="all">Stagione · tutte</option>
          <option value="spring_summer">{SEASON_LABEL.spring_summer}</option>
          <option value="autumn_winter">{SEASON_LABEL.autumn_winter}</option>
          <option value="all_season">{SEASON_LABEL.all_season}</option>
        </Select>
        <Select value={weight} onChange={(v) => setWeight(v as WeightBucket)}>
          <option value="all">Peso · tutti</option>
          <option value="light">{WEIGHT_LABEL.light}</option>
          <option value="medium">{WEIGHT_LABEL.medium}</option>
          <option value="heavy">{WEIGHT_LABEL.heavy}</option>
        </Select>
        {compositions.length > 0 && (
          <Select value={composition} onChange={setComposition}>
            <option value="all">Composizione · tutte</option>
            {compositions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm font-medium">Nessun tessuto trovato</p>
          <p className="text-xs text-muted-foreground mt-1">Cambia i filtri o prova un'altra ricerca.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((f) => (
            <li
              key={f.id}
              className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square bg-muted">
                {f.image_url ? (
                  <Image
                    src={f.image_url}
                    alt={f.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Nessuna immagine
                  </div>
                )}
              </div>
              <div className="space-y-1 px-4 py-3">
                <p className="text-sm font-medium leading-tight text-foreground line-clamp-1">{f.name}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {[f.mill, f.composition].filter(Boolean).join(' · ') || '—'}
                </p>
                {showPrices && f.price_per_meter != null && (
                  <p className="text-xs font-semibold tabular-nums text-foreground">
                    {new Intl.NumberFormat('it-IT', {
                      style: 'currency',
                      currency: f.currency ?? 'EUR',
                    }).format(f.price_per_meter)}
                    <span className="font-normal text-muted-foreground"> / m</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </select>
  )
}
