'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import type { WhatsappCategory, WhatsappMessage } from '@/types/database'

export interface WhatsappMessageWithClient extends WhatsappMessage {
  client_first_name: string | null
  client_last_name: string | null
}

export async function getNotifications(filters?: {
  category?: WhatsappCategory | 'all'
  onlyUnread?: boolean
}): Promise<WhatsappMessageWithClient[]> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()

  let query = supabase
    .from('whatsapp_messages')
    .select(`
      *,
      clients (first_name, last_name)
    `)
    .eq('tenant_id', session.tenantId!)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.onlyUnread) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query
  if (error) return []

  return (data ?? []).map((row: {
    clients?: { first_name: string | null; last_name: string | null } | null
    [key: string]: unknown
  }) => ({
    ...(row as unknown as WhatsappMessage),
    client_first_name: row.clients?.first_name ?? null,
    client_last_name: row.clients?.last_name ?? null,
  }))
}

export async function getUnreadCount(): Promise<number> {
  const session = await requireRole(['tenant_admin', 'tenant_staff']).catch(() => null)
  if (!session?.tenantId) return 0

  const supabase = await createClient()
  const { count } = await supabase
    .from('whatsapp_messages')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', session.tenantId)
    .eq('is_read', false)

  return count ?? 0
}

export async function markAsRead(messageId: string): Promise<void> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()

  await supabase
    .from('whatsapp_messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .eq('tenant_id', session.tenantId!)

  revalidatePath('/dashboard/notifiche')
}

export async function markAllAsRead(): Promise<void> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()

  await supabase
    .from('whatsapp_messages')
    .update({ is_read: true })
    .eq('tenant_id', session.tenantId!)
    .eq('is_read', false)

  revalidatePath('/dashboard/notifiche')
}

export async function getMessagesForClient(clientId: string): Promise<WhatsappMessage[]> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()

  const { data } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('client_id', clientId)
    .eq('tenant_id', session.tenantId!)
    .order('sent_at', { ascending: false })
    .limit(50)

  return (data ?? []) as WhatsappMessage[]
}
