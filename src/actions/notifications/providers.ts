'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { NotificationProvider, NotificationChannel, NotificationProviderType } from '@/types/notifications'
import type { Json } from '@/../types/supabase'
import { toCamelCase } from '@/lib/utils/transform'

const ProviderUpsertSchema = z.object({
  organizationId: z.string().uuid(),
  channel: z.enum(['whatsapp', 'email', 'sms', 'in_app']),
  provider: z.enum(['wasender', 'n8n', 'evolution', 'meta', 'twilio', 'resend', 'internal']),
  config: z.record(z.string(), z.unknown()).optional(),
  rateLimitPerMin: z.number().min(1).max(1000).optional().default(30),
  rateLimitPerDay: z.number().min(1).max(100000).optional(),
  isEnabled: z.boolean().optional().default(false),
})

export async function getProvider(
  organizationId: string,
  channel?: NotificationChannel
): Promise<{ success: boolean; data?: NotificationProvider | null; error?: string }> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('notification_providers')
      .select('*')
      .eq('organization_id', organizationId)

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error in getProvider:', error)
      return { success: false, error: 'Error al cargar proveedor' }
    }

    if (!data || data.length === 0) {
      return { success: true, data: null }
    }

    const provider: NotificationProvider = {
      id: data[0].id,
      organizationId: data[0].organization_id,
      channel: data[0].channel as NotificationChannel,
      provider: data[0].provider as NotificationProviderType,
      isEnabled: data[0].is_enabled ?? false,
      config: (data[0].config ?? {}) as unknown as Record<string, unknown>,
      rateLimitPerMin: data[0].rate_limit_per_min ?? 0,
      rateLimitPerDay: data[0].rate_limit_per_day ?? undefined,
      createdAt: data[0].created_at ?? '',
      updatedAt: data[0].updated_at ?? '',
    }

    return { success: true, data: channel ? provider : provider }
  } catch (error) {
    console.error('Error in getProvider:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function upsertProvider(
  input: z.infer<typeof ProviderUpsertSchema>
): Promise<{ success: boolean; data?: NotificationProvider; error?: string }> {
  const validation = ProviderUpsertSchema.safeParse(input)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const supabase = await createClient()

  try {
    const existingResult = await supabase
      .from('notification_providers')
      .select('id')
      .eq('organization_id', validation.data.organizationId)
      .eq('channel', validation.data.channel)
      .eq('provider', validation.data.provider)
      .single()

    const providerData = {
      organization_id: validation.data.organizationId,
      channel: validation.data.channel,
      provider: validation.data.provider,
      config: (validation.data.config ?? {}) as unknown as Json,
      rate_limit_per_min: validation.data.rateLimitPerMin,
      rate_limit_per_day: validation.data.rateLimitPerDay ?? null,
      is_enabled: validation.data.isEnabled,
      updated_at: new Date().toISOString(),
    }

    if (existingResult.data) {
      const { data, error } = await (supabase
        .from('notification_providers')
        .update(providerData as unknown as Partial<never>)
        .eq('id', existingResult.data.id)
        .select()
        .single() as unknown as { data: unknown; error: unknown })

      if (error) {
        console.error('Error updating provider:', error)
        return { success: false, error: 'Error al actualizar proveedor' }
      }

      return { success: true, data: mapRowToProvider(data) }
    } else {
      const { data, error } = await (supabase
        .from('notification_providers')
        .insert(providerData as unknown as Partial<never>)
        .select()
        .single() as unknown as { data: unknown; error: unknown })

      if (error) {
        console.error('Error creating provider:', error)
        return { success: false, error: 'Error al crear proveedor' }
      }

      return { success: true, data: mapRowToProvider(data) }
    }
  } catch (error) {
    console.error('Error in upsertProvider:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleProvider(
  id: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notification_providers')
      .update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error toggling provider:', error)
      return { success: false, error: 'Error al actualizar estado' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in toggleProvider:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function testProviderConnection(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('notification_providers')
      .select('config')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { success: false, error: 'Proveedor no encontrado' }
    }

    const webhookUrl = (data.config as unknown as Record<string, unknown>)?.webhook_url as string | undefined

    if (!webhookUrl) {
      return { success: false, error: 'Webhook URL no configurada' }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(webhookUrl, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok || response.status === 200 || response.status === 405) {
        return { success: true }
      } else {
        return { success: false, error: `Webhook respondió con estado ${response.status}` }
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return { success: false, error: 'Timeout: El webhook no respondió en 5 segundos' }
      }
      return { success: false, error: 'No se pudo conectar al webhook' }
    }
  } catch (error) {
    console.error('Error in testProviderConnection:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

function mapRowToProvider(row: unknown): NotificationProvider {
  return toCamelCase<NotificationProvider>(row as Record<string, unknown>)
}