'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { AutomationRule, AutomationTrigger, NotificationChannel } from '@/types/notifications'
import { devLog, devError } from '@/lib/logger'

const AutomationRuleCreateSchema = z.object({
  organizationId: z.string().uuid(),
  triggerEvent: z.enum([
    'appointment_created',
    'appointment_reminder',
    'appointment_cancelled',
    'appointment_completed',
    'appointment_no_show',
    'confirmation_requested',
  ]),
  channel: z.enum(['whatsapp', 'email', 'sms', 'in_app']),
  templateId: z.string().uuid().optional().nullable(),
  delayMinutes: z.number().min(0).max(10080).optional().default(0),
  conditions: z.record(z.string(), z.unknown()).optional().default({}),
})

const AutomationRuleUpdateSchema = z.object({
  templateId: z.string().uuid().optional().nullable(),
  delayMinutes: z.number().min(0).max(10080).optional(),
  isEnabled: z.boolean().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
})

export async function getAutomationRules(
  organizationId: string,
  channel?: NotificationChannel
): Promise<{ success: boolean; data?: AutomationRule[]; error?: string }> {
  const supabase = await createClient()

  try {
    let query = (supabase as any)
      .from('automation_rules')
      .select('*')
      .eq('organization_id', organizationId)

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query

    if (error) {
      devError('Error in getAutomationRules:', error)
      return { success: false, error: 'Error al cargar reglas de automatización' }
    }

    const rules: AutomationRule[] = (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      triggerEvent: row.trigger_event as AutomationTrigger,
      channel: row.channel as NotificationChannel,
      templateId: row.template_id,
      delayMinutes: row.delay_minutes,
      isEnabled: row.is_enabled,
      conditions: row.conditions || {},
      createdAt: row.created_at,
    }))

    return { success: true, data: rules }
  } catch (error) {
    devError('Error in getAutomationRules:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function createAutomationRule(
  input: z.infer<typeof AutomationRuleCreateSchema>
): Promise<{ success: boolean; data?: AutomationRule; error?: string }> {
  const validation = AutomationRuleCreateSchema.safeParse(input)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('automation_rules')
      .insert({
        organization_id: validation.data.organizationId,
        trigger_event: validation.data.triggerEvent,
        channel: validation.data.channel,
        template_id: validation.data.templateId || null,
        delay_minutes: validation.data.delayMinutes,
        conditions: validation.data.conditions,
        is_enabled: true,
      })
      .select()
      .single()

    if (error) {
      devError('Error creating automation rule:', error)
      return { success: false, error: 'Error al crear regla' }
    }

    const rule: AutomationRule = {
      id: data.id,
      organizationId: data.organization_id,
      triggerEvent: data.trigger_event as AutomationTrigger,
      channel: data.channel as NotificationChannel,
      templateId: data.template_id,
      delayMinutes: data.delay_minutes,
      isEnabled: data.is_enabled,
      conditions: data.conditions || {},
      createdAt: data.created_at,
    }

    return { success: true, data: rule }
  } catch (error) {
    devError('Error in createAutomationRule:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function updateAutomationRule(
  ruleId: string,
  input: z.infer<typeof AutomationRuleUpdateSchema>
): Promise<{ success: boolean; error?: string }> {
  const validation = AutomationRuleUpdateSchema.safeParse(input)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const supabase = await createClient()

  try {
    const updateData: Record<string, unknown> = {}

    if (validation.data.templateId !== undefined) updateData.template_id = validation.data.templateId
    if (validation.data.delayMinutes !== undefined) updateData.delay_minutes = validation.data.delayMinutes
    if (validation.data.isEnabled !== undefined) updateData.is_enabled = validation.data.isEnabled
    if (validation.data.conditions !== undefined) updateData.conditions = validation.data.conditions

    const { error } = await (supabase as any)
      .from('automation_rules')
      .update(updateData)
      .eq('id', ruleId)

    if (error) {
      devError('Error updating automation rule:', error)
      return { success: false, error: 'Error al actualizar regla' }
    }

    return { success: true }
  } catch (error) {
    devError('Error in updateAutomationRule:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleAutomationRule(
  ruleId: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await (supabase as any)
      .from('automation_rules')
      .update({ is_enabled: isEnabled })
      .eq('id', ruleId)

    if (error) {
      devError('Error toggling automation rule:', error)
      return { success: false, error: 'Error al actualizar' }
    }

    return { success: true }
  } catch (error) {
    devError('Error in toggleAutomationRule:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function deleteAutomationRule(
  ruleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await (supabase as any)
      .from('automation_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      devError('Error deleting automation rule:', error)
      return { success: false, error: 'Error al eliminar' }
    }

    return { success: true }
  } catch (error) {
    devError('Error in deleteAutomationRule:', error)
    return { success: false, error: 'Error inesperado' }
  }
}