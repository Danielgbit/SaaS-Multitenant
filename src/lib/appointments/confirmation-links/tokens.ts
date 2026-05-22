'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { ConfirmationTokenAction, ConfirmationToken } from '@/types/notifications'

const TOKEN_EXPIRY_HOURS = 72

export async function generateConfirmationToken(
  appointmentId: string,
  organizationId: string,
  action: ConfirmationTokenAction = 'confirm'
): Promise<{ success: boolean; token?: string; error?: string }> {
  const supabase = await createServiceRoleClient()

  try {
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
    const token = crypto.randomUUID()

    const { error } = await (supabase as any)
      .from('confirmation_tokens')
      .insert({
        appointment_id: appointmentId,
        organization_id: organizationId,
        token,
        action,
        expires_at: expiresAt,
      })

    if (error) {
      console.error('[generateConfirmationToken] Error:', error)
      return { success: false, error: 'Error al generar token' }
    }

    return { success: true, token }
  } catch (error) {
    console.error('[generateConfirmationToken] Fatal error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function validateConfirmationToken(
  token: string
): Promise<{
  success: boolean
  valid?: boolean
  reason?: string
  tokenData?: ConfirmationToken
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('confirmation_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      return { success: false, valid: false, reason: 'Token no encontrado' }
    }

    const now = new Date()
    const expiresAt = new Date(data.expires_at)

    if (now > expiresAt) {
      return { success: true, valid: false, reason: 'Token expirado' }
    }

    if (data.used_at) {
      return { success: true, valid: false, reason: 'Token ya usado' }
    }

    if (data.invalidated_at) {
      return { success: true, valid: false, reason: 'Token invalidado' }
    }

    return {
      success: true,
      valid: true,
      tokenData: {
        id: data.id,
        appointmentId: data.appointment_id,
        organizationId: data.organization_id,
        token: data.token,
        action: data.action as ConfirmationTokenAction,
        expiresAt: data.expires_at,
        usedAt: data.used_at || undefined,
        invalidatedAt: data.invalidated_at || undefined,
        invalidatedReason: data.invalidated_reason || undefined,
        createdAt: data.created_at,
      },
    }
  } catch (error) {
    console.error('[validateConfirmationToken] Fatal error:', error)
    return { success: false, reason: 'Error al validar token' }
  }
}

export async function useConfirmationToken(
  token: string,
  action: ConfirmationTokenAction
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServiceRoleClient()

  try {
    const { data: tokenData, error: fetchError } = await (supabase as any)
      .from('confirmation_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !tokenData) {
      return { success: false, error: 'Token no encontrado' }
    }

    if (tokenData.action !== action) {
      return { success: false, error: `Esta acción no es válida para este token. Se esperaba: ${tokenData.action}` }
    }

    const { error: updateError } = await (supabase as any)
      .from('confirmation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)
      .is('used_at', null)

    if (updateError) {
      return { success: false, error: 'Token ya fue utilizado previamente' }
    }

    return { success: true }
  } catch (error) {
    console.error('[useConfirmationToken] Fatal error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function invalidateConfirmationTokens(
  appointmentId: string,
  reason: string = 'appointment_cancelled'
): Promise<{ success: boolean; invalidated: number; error?: string }> {
  const supabase = await createServiceRoleClient()

  try {
    const { data, error } = await (supabase as any)
      .from('confirmation_tokens')
      .update({
        invalidated_at: new Date().toISOString(),
        invalidated_reason: reason,
      })
      .eq('appointment_id', appointmentId)
      .is('used_at', null)
      .select('id')

    if (error) {
      console.error('[invalidateConfirmationTokens] Error:', error)
      return { success: false, invalidated: 0, error: 'Error al invalidar tokens' }
    }

    return { success: true, invalidated: data?.length || 0 }
  } catch (error) {
    console.error('[invalidateConfirmationTokens] Fatal error:', error)
    return { success: false, invalidated: 0, error: 'Error inesperado' }
  }
}

export async function getConfirmationTokensByAppointment(
  appointmentId: string
): Promise<{ success: boolean; tokens?: ConfirmationToken[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('confirmation_tokens')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Error al cargar tokens' }
    }

    const tokens: ConfirmationToken[] = (data || []).map((t: any) => ({
      id: t.id,
      appointmentId: t.appointment_id,
      organizationId: t.organization_id,
      token: t.token,
      action: t.action as ConfirmationTokenAction,
      expiresAt: t.expires_at,
      usedAt: t.used_at || undefined,
      invalidatedAt: t.invalidated_at || undefined,
      invalidatedReason: t.invalidated_reason || undefined,
      createdAt: t.created_at,
    }))

    return { success: true, tokens }
  } catch (error) {
    console.error('[getConfirmationTokensByAppointment] Fatal error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
