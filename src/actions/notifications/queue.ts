'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NotificationQueueItem, QueueItemStatus } from '@/types/notifications'

const QueueFiltersSchema = z.object({
  status: z.enum(['pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'failed_permanently', 'cancelled']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export interface QueueStats {
  sentToday: number
  deliveredToday: number
  failedToday: number
  pending: number
  stuckCount: number
  deliveryRate: number
}

export async function getQueueStats(organizationId: string): Promise<{ success: boolean; data?: QueueStats; error?: string }> {
  const supabase = await createClient()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString()

    const [sentResult, deliveredResult, failedResult, pendingResult, stuckResult] = await Promise.all([
      (supabase as any)
        .from('notification_queue')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'sent')
        .gte('created_at', todayIso),

      (supabase as any)
        .from('notification_queue')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'delivered')
        .gte('created_at', todayIso),

      (supabase as any)
        .from('notification_queue')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('status', ['failed', 'failed_permanently'])
        .gte('created_at', todayIso),

      (supabase as any)
        .from('notification_queue')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),

      (supabase as any)
        .from('notification_queue')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'processing')
        .lt('claimed_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()),
    ])

    const sentToday = sentResult.count || 0
    const deliveredToday = deliveredResult.count || 0
    const failedToday = failedResult.count || 0
    const pending = pendingResult.count || 0
    const stuckCount = stuckResult.count || 0

    const totalProcessed = sentToday + deliveredToday + failedToday
    const deliveryRate = totalProcessed > 0 ? Math.round((deliveredToday / totalProcessed) * 100) : 0

    return {
      success: true,
      data: { sentToday, deliveredToday, failedToday, pending, stuckCount, deliveryRate },
    }
  } catch (error) {
    console.error('Error in getQueueStats:', error)
    return { success: false, error: 'Error al cargar estadísticas' }
  }
}

export async function getQueueItems(
  organizationId: string,
  rawFilters?: z.infer<typeof QueueFiltersSchema>
) {
  const validation = QueueFiltersSchema.safeParse(rawFilters || {})

  if (!validation.success) {
    return { success: false, error: 'Filtros inválidos', data: { items: [], total: 0, page: 1, totalPages: 0 } }
  }

  const { status, page, limit, dateFrom, dateTo } = validation.data
  const offset = (page - 1) * limit

  const supabase = await createClient()

  try {
    let query = (supabase as any)
      .from('notification_queue')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('scheduled_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('scheduled_at', dateTo)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error in getQueueItems:', error)
      return { success: false, error: 'Error al cargar cola', data: { items: [], total: 0, page: 1, totalPages: 0 } }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    const items: NotificationQueueItem[] = (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      appointmentId: row.appointment_id,
      channel: row.channel,
      templateId: row.template_id,
      toAddress: row.to_address,
      renderedBody: row.rendered_body,
      subject: row.subject,
      variables: row.variables || {},
      status: row.status as QueueItemStatus,
      idempotencyKey: row.idempotency_key,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      lastError: row.last_error,
      nextRetryAt: row.next_retry_at,
      providerMessageId: row.provider_message_id,
      providerResponse: row.provider_response,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      traceId: row.trace_id,
      claimedAt: row.claimed_at,
      createdAt: row.created_at,
    }))

    return {
      success: true,
      data: { items, total, page, totalPages },
    }
  } catch (error) {
    console.error('Error in getQueueItems:', error)
    return { success: false, error: 'Error inesperado', data: { items: [], total: 0, page: 1, totalPages: 0 } }
  }
}

export async function getRecentItems(
  organizationId: string,
  limit: number = 10
): Promise<{ success: boolean; data?: NotificationQueueItem[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('notification_queue')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error in getRecentItems:', error)
      return { success: false, error: 'Error al cargar mensajes recientes' }
    }

    const items: NotificationQueueItem[] = (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      appointmentId: row.appointment_id,
      channel: row.channel,
      templateId: row.template_id,
      toAddress: row.to_address,
      renderedBody: row.rendered_body,
      subject: row.subject,
      variables: row.variables || {},
      status: row.status as QueueItemStatus,
      idempotencyKey: row.idempotency_key,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      lastError: row.last_error,
      nextRetryAt: row.next_retry_at,
      providerMessageId: row.provider_message_id,
      providerResponse: row.provider_response,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      traceId: row.trace_id,
      claimedAt: row.claimed_at,
      createdAt: row.created_at,
    }))

    return { success: true, data: items }
  } catch (error) {
    console.error('Error in getRecentItems:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function retryQueueItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await (supabase as any)
      .from('notification_queue')
      .update({
        status: 'pending',
        last_error: null,
        attempts: 0,
        next_retry_at: null,
        claimed_at: null,
        processing_timeout_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .in('status', ['failed', 'failed_permanently'])

    if (error) {
      console.error('Error retrying queue item:', error)
      return { success: false, error: 'Error al reintentar mensaje' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in retryQueueItem:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function cancelQueueItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await (supabase as any)
      .from('notification_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('status', 'pending')

    if (error) {
      console.error('Error cancelling queue item:', error)
      return { success: false, error: 'Error al cancelar mensaje' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in cancelQueueItem:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function retryMultipleQueueItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (itemIds.length === 0) return { success: true }
  const supabase = await createClient()

  try {
    const { error } = await (supabase as any)
      .from('notification_queue')
      .update({
        status: 'pending',
        last_error: null,
        attempts: 0,
        next_retry_at: null,
        claimed_at: null,
        processing_timeout_at: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', itemIds)
      .in('status', ['failed', 'failed_permanently'])

    if (error) {
      console.error('Error retrying multiple queue items:', error)
      return { success: false, error: 'Error al reintentar mensajes' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in retryMultipleQueueItems:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function cancelMultipleQueueItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (itemIds.length === 0) return { success: true }
  const supabase = await createClient()

  try {
    const { error } = await (supabase as any)
      .from('notification_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .in('id', itemIds)
      .eq('status', 'pending')

    if (error) {
      console.error('Error cancelling multiple queue items:', error)
      return { success: false, error: 'Error al cancelar mensajes' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in cancelMultipleQueueItems:', error)
    return { success: false, error: 'Error inesperado' }
  }
}