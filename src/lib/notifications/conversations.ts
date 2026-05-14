import { createClient } from '@/lib/supabase/server'
import type { NotificationConversation } from '@/types/notifications'
import { randomUUID } from 'crypto'

export async function getOrCreateConversation(
  organizationId: string,
  clientPhone: string,
  channel: string = 'whatsapp'
): Promise<NotificationConversation> {
  const supabase = await createClient()

    const { data: existing } = await (supabase as any)
      .from('notification_conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('client_phone', clientPhone)
      .eq('status', 'active')
      .single()

    if (existing) {
      return existing as unknown as NotificationConversation
    }

    const { data: created, error } = await (supabase as any)
      .from('notification_conversations')
      .insert({
        organization_id: organizationId,
        client_phone: clientPhone,
        channel,
        status: 'active',
      })
      .select()
      .single()

    if (error && error.code !== '23505') {
      throw error
    }

    if (created) {
      return created as unknown as NotificationConversation
    }

    const { data: retry } = await (supabase as any)
      .from('notification_conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('client_phone', clientPhone)
      .eq('status', 'active')
      .single()

    return retry as unknown as NotificationConversation
}

export async function linkAppointmentToConversation(
  conversationId: string,
  appointmentId: string
): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('notification_conversations')
    .update({
      appointment_id: appointmentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
}

export async function updateLastMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('notification_conversations')
    .update({
      last_message_id: messageId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
}

export async function archiveConversation(conversationId: string): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('notification_conversations')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', conversationId)
}

export async function findConversationByAppointment(
  appointmentId: string
): Promise<NotificationConversation | null> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('notification_conversations')
    .select('*')
    .eq('appointment_id', appointmentId)
    .eq('status', 'active')
    .single()

  return (data as NotificationConversation) || null
}