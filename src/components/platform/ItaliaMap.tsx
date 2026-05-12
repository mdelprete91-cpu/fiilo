'use client'

import { useMemo, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import Link from 'next/link'

export interface MapTenant {
  id: string
  name: string
  city: string | null
  latitude: number
  longitude: number
  last_active_at: string | null
}

interface Props {
  tenants: MapTenant[]
}

// World topojson scaricato in public/maps/world-110m.json.
// Italia: ISO numerico 380.
const GEO_URL = '/maps/world-110m.json'
const ITALY_ISO = '380'

// "Attiva" = ha avuto attività nelle ultime 24h.
const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000

function isPulsing(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() < ACTIVE_WINDOW_MS
}

export function ItaliaMap({ tenants }: Props) {
  const [hovered, setHovered] = useState<MapTenant | null>(null)

  const stats = useMemo(() => {
    const active = tenants.filter((t) => isPulsing(t.last_active_at)).length
    return { total: tenants.length, active }
  }, [tenants])

  return (
    <div className="relative flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden animate-fade-up">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Distribuzione geografica
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          <span className="text-foreground font-medium">{stats.active}</span> attive ora · <span className="text-foreground font-medium">{stats.total}</span> totali
        </p>
      </div>

      <div className="relative flex-1 min-h-[340px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 2400, center: [12.5, 42.5] }}
          width={500}
          height={400}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={1} center={[12.5, 42.5]} minZoom={1} maxZoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => geo.id === ITALY_ISO)
                  .map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: 'var(--muted)',
                          stroke: 'var(--border)',
                          strokeWidth: 0.8,
                          outline: 'none',
                        },
                        hover:   { fill: 'var(--muted)', outline: 'none' },
                        pressed: { fill: 'var(--muted)', outline: 'none' },
                      }}
                    />
                  ))
              }
            </Geographies>

            {tenants.map((t) => {
              const pulsing = isPulsing(t.last_active_at)
              return (
                <Marker
                  key={t.id}
                  coordinates={[Number(t.longitude), Number(t.latitude)]}
                  onMouseEnter={() => setHovered(t)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {pulsing && (
                    <circle
                      r={10}
                      className="fill-primary/30 animate-ping-slow origin-center"
                    />
                  )}
                  <Link href={`/platform/tenants/${t.id}`} legacyBehavior>
                    <circle
                      r={4}
                      className={
                        pulsing
                          ? 'fill-primary stroke-background cursor-pointer'
                          : 'fill-muted-foreground/60 stroke-background cursor-pointer'
                      }
                      strokeWidth={1.5}
                    />
                  </Link>
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        {hovered && (
          <div className="pointer-events-none absolute left-4 bottom-4 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
            <p className="font-medium text-foreground">{hovered.name}</p>
            {hovered.city && (
              <p className="mt-0.5 text-muted-foreground">{hovered.city}</p>
            )}
            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
              {isPulsing(hovered.last_active_at) ? 'Attiva ora' : 'Inattiva'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
