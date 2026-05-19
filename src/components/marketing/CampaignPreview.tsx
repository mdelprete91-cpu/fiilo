'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface CampaignPreviewProps {
  subject: string | null
  html: string | null
  recipientName?: string
}

export function CampaignPreview({
  subject,
  html,
  recipientName,
}: CampaignPreviewProps) {
  const [open, setOpen] = useState(true)

  if (!html) return null

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Anteprima newsletter</h2>
          {recipientName && (
            <p className="text-xs text-muted-foreground">
              Versione per <strong>{recipientName}</strong>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {open ? (
            <>
              <EyeOff className="size-3.5" />
              Nascondi
            </>
          ) : (
            <>
              <Eye className="size-3.5" />
              Mostra
            </>
          )}
        </button>
      </header>

      {open && (
        <div className="bg-[#f5f3ef] p-6">
          {subject && (
            <div className="mb-4 max-w-[560px] mx-auto">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Oggetto
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{subject}</div>
            </div>
          )}
          <iframe
            title="Anteprima newsletter"
            srcDoc={html}
            className="block w-full max-w-[600px] mx-auto rounded border border-border bg-white"
            style={{ height: '600px' }}
            sandbox=""
          />
        </div>
      )}
    </section>
  )
}
