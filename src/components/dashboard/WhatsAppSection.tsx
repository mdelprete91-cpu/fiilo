import { MessageCircle } from 'lucide-react'
import { WhatsAppMessageCard } from './WhatsAppMessageCard'
import type { WhatsappMessage } from '@/types/database'

interface Props {
  messages: WhatsappMessage[]
  clientId: string
}

export function WhatsAppSection({ messages, clientId }: Props) {
  if (messages.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </h3>
        <span className="text-[11px] text-muted-foreground">{messages.length} messaggi</span>
      </div>
      <ul className="divide-y divide-border">
        {messages.map((msg) => (
          <li key={msg.id}>
            <WhatsAppMessageCard message={msg} clientId={clientId} />
          </li>
        ))}
      </ul>
    </div>
  )
}
