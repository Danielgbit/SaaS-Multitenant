'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { MessageTemplate, TemplateVariable, NotificationChannel } from '@/types/notifications'
import { devLog, devError } from '@/lib/logger'

const TemplateSchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),
  channel: z.enum(['whatsapp', 'email', 'sms', 'in_app']),
  type: z.string().min(1),
  name: z.string().min(1).max(100),
  subject: z.string().max(255).optional().nullable(),
  body: z.string().min(1),
  variables: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional().default(''),
      required: z.boolean().optional().default(false),
      example: z.string().optional(),
    })
  ).optional().default([]),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
})

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subject: z.string().max(255).optional().nullable(),
  body: z.string().min(1).optional(),
  variables: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional().default(''),
      required: z.boolean().optional().default(false),
      example: z.string().optional(),
    })
  ).optional(),
  isActive: z.boolean().optional(),
})

export async function getTemplates(
  organizationId: string,
  channel?: NotificationChannel
) {
  const supabase = await createClient()

  try {
    let query = (supabase as any)
      .from('message_templates')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query.order('is_default', { ascending: false })

    if (error) {
      return { success: false, error: 'Error al cargar templates', data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    devError('Error in getTemplates:', error)
    return { success: false, error: 'Error inesperado', data: [] }
  }
}

export async function getTemplateById(templateId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !data) {
      return { success: false, error: 'Template no encontrado' }
    }

    return { success: true, data }
  } catch (error) {
    devError('Error in getTemplateById:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function createTemplate(
  input: z.infer<typeof TemplateSchema>
) {
  const validation = TemplateSchema.safeParse(input)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('message_templates')
      .insert({
        organization_id: validation.data.organizationId || null,
        channel: validation.data.channel,
        type: validation.data.type,
        name: validation.data.name,
        subject: validation.data.subject || null,
        body: validation.data.body,
        variables: validation.data.variables as TemplateVariable[],
        is_default: validation.data.isDefault,
        is_active: validation.data.isActive,
      })
      .select()
      .single()

    if (error) {
      devError('Error creating template:', error)
      return { success: false, error: 'Error al crear template' }
    }

    return { success: true, data }
  } catch (error) {
    devError('Error in createTemplate:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function updateTemplate(
  templateId: string,
  input: z.infer<typeof UpdateTemplateSchema>
) {
  const validation = UpdateTemplateSchema.safeParse(input)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const supabase = await createClient()

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (validation.data.name !== undefined) updateData.name = validation.data.name
    if (validation.data.subject !== undefined) updateData.subject = validation.data.subject
    if (validation.data.body !== undefined) updateData.body = validation.data.body
    if (validation.data.variables !== undefined) updateData.variables = validation.data.variables
    if (validation.data.isActive !== undefined) updateData.is_active = validation.data.isActive

    const { data, error } = await (supabase as any)
      .from('message_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      devError('Error updating template:', error)
      return { success: false, error: 'Error al actualizar template' }
    }

    return { success: true, data }
  } catch (error) {
    devError('Error in updateTemplate:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()

  try {
    const { error } = await (supabase as any)
      .from('message_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', templateId)
      .eq('is_default', false)

    if (error) {
      devError('Error deleting template:', error)
      return { success: false, error: 'Error al eliminar template' }
    }

    return { success: true }
  } catch (error) {
    devError('Error in deleteTemplate:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function resetTemplateToDefault(templateId: string) {
  const supabase = await createClient()

  try {
    const { data: template, error: fetchError } = await (supabase as any)
      .from('message_templates')
      .select('organization_id, channel, type')
      .eq('id', templateId)
      .single()

    if (fetchError || !template) {
      return { success: false, error: 'Template no encontrado' }
    }

    const { data: defaultTemplate, error: defaultError } = await (supabase as any)
      .from('message_templates')
      .select('*')
      .is('organization_id', null)
      .eq('channel', template.channel)
      .eq('type', template.type)
      .eq('is_default', true)
      .single()

    if (defaultError || !defaultTemplate) {
      return { success: false, error: 'No existe template por defecto para este tipo' }
    }

    const { error: updateError } = await (supabase as any)
      .from('message_templates')
      .update({
        body: defaultTemplate.body,
        subject: defaultTemplate.subject,
        variables: defaultTemplate.variables,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)

    if (updateError) {
      devError('Error resetting template:', updateError)
      return { success: false, error: 'Error al resetear template' }
    }

    return { success: true }
  } catch (error) {
    devError('Error in resetTemplateToDefault:', error)
    return { success: false, error: 'Error inesperado' }
  }
}