/**
 * Shadow Seeder
 * Captura mínima del envío V1 - zero queries, zero blocking
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '../logger'
import { SHADOW_SNAPSHOT_VERSION, V1Snapshot } from './types'

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `sha256:${Math.abs(hash).toString(16)}`
}

export async function enqueueShadowSeed(v1Result: {
  appointmentId: string
  organizationId: string
  to: string
  templateName: string
  templateVariables: Record<string, string>
  renderedMessage: string
  status: 'sent' | 'failed'
  responseStatus?: number
  errorMessage?: string
  sentAt: string
  providerUrl: string
  channel: 'whatsapp' | 'email' | 'in_app'
}): Promise<void> {
  try {
    const signal = AbortSignal.timeout(100)
    const supabase = await createClient()

    const v1Snapshot: V1Snapshot = {
      appointmentId: v1Result.appointmentId,
      organizationId: v1Result.organizationId,
      to: v1Result.to,
      templateName: v1Result.templateName,
      templateVariables: v1Result.templateVariables,
      renderedMessage: v1Result.renderedMessage,
      renderedMessageHash: hashString(v1Result.renderedMessage),
      status: v1Result.status,
      responseStatus: v1Result.responseStatus,
      errorMessage: v1Result.errorMessage,
      sentAt: v1Result.sentAt,
      providerUrl: v1Result.providerUrl,
      channel: v1Result.channel,
    }

    const { error } = await (supabase as any)
      .from('shadow_notification_seeds')
      .insert({
        organization_id: v1Result.organizationId,
        appointment_id: v1Result.appointmentId,
        v1_snapshot: v1Snapshot as unknown as Record<string, unknown>,
        snapshot_version: SHADOW_SNAPSHOT_VERSION,
        correlation_id: crypto.randomUUID(),
        status: 'pending',
      })

    if (error) {
      logger.warn('shadow_seed_insert_failed', {
        error: error.message,
        appointmentId: v1Result.appointmentId,
      })
    } else {
      logger.debug('shadow_seed_created', {
        appointmentId: v1Result.appointmentId,
        status: v1Result.status,
      })
    }
  } catch (e) {
    const error = e as Error
    logger.warn('shadow_seed_exception', {
      error: error.message,
      appointmentId: v1Result.appointmentId,
    })
  }
}
