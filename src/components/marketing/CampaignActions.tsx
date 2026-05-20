'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  approveAndSendAction,
  cancelCampaignAction,
} from '@/lib/actions/newsletter'
import type { NewsletterStatus } from '@/lib/newsletter/types'

interface CampaignActionsProps {
  campaignId: string
  status: NewsletterStatus
  recipientsCount: number
}

export function CampaignActions({
  campaignId,
  status,
  recipientsCount,
}: CampaignActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  if (status === 'sent' || status === 'cancelled' || status === 'sending') {
    return null
  }

  function handleApproveAndSend() {
    startTransition(async () => {
      const res = await approveAndSendAction(campaignId)
      if (!res.success) {
        toast.error("Errore durante l'invio", { description: res.error })
        return
      }
      const { sent = 0, failed = 0 } = res
      if (failed > 0) {
        toast.warning(`Inviate ${sent}, fallite ${failed}`, {
          description: 'Controlla i destinatari per i dettagli.',
        })
      } else {
        toast.success(`Newsletter inviata a ${sent} destinatari`)
      }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  function handleCancel() {
    if (typeof window !== 'undefined' && !window.confirm('Annullare questa comunicazione? Non sarà più inviabile.')) return
    startTransition(async () => {
      const res = await cancelCampaignAction(campaignId)
      if (!res.success) {
        toast.error('Errore', { description: res.error })
        return
      }
      toast.success('Comunicazione annullata')
      router.refresh()
    })
  }

  const needsDoubleConfirm = recipientsCount > 100

  return (
    <div className="flex flex-wrap items-center gap-3">
      {recipientsCount > 0 ? (
        <>
          <Button disabled={isPending} onClick={() => setConfirmOpen(true)}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Approva e invia tutto
          </Button>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {needsDoubleConfirm
                    ? `Inviare a ${recipientsCount} destinatari?`
                    : "Confermi l'invio?"}
                </DialogTitle>
                <DialogDescription>
                  {needsDoubleConfirm ? (
                    <>
                      Stai per inviare la newsletter a <strong>{recipientsCount}</strong>{' '}
                      persone. Questa azione non può essere annullata. Verifica di aver
                      revisionato l'anteprima prima di procedere.
                    </>
                  ) : (
                    <>
                      Verrà inviata l'email a <strong>{recipientsCount}</strong>{' '}
                      {recipientsCount === 1 ? 'destinatario' : 'destinatari'}. Questa
                      azione non può essere annullata.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setConfirmOpen(false)}
                >
                  Annulla
                </Button>
                <Button disabled={isPending} onClick={handleApproveAndSend}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sì, invia ora
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nessun destinatario disponibile. Verifica che alcuni clienti abbiano dato
          il consenso a ricevere email.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={handleCancel}
      >
        <X className="mr-2 h-4 w-4" />
        Annulla comunicazione
      </Button>
    </div>
  )
}
