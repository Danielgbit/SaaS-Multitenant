'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { executePurge, countAppointmentsToPurge, getAppointmentsToPurge } from '@/lib/cleanup-helpers'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const PurgeSchema = z.object({
  organizationId: z.string().uuid('ID de organización inválido'),
  olderThanDays: z.number().min(1, 'Mínimo 1 día').max(365, 'Máximo 365 días'),
  dryRun: z.boolean().default(true),
})

const UpdateRetentionSettingsSchema = z.object({
  auto_retention_days: z.number().min(30).max(365).default(90),
  auto_purge_enabled: z.boolean().default(false),
})

export type PurgeResult = {
  success: boolean
  deletedCount?: number
  candidates?: Array<{
    id: string
    client_name?: string
    employee_name?: string
    start_time: string
    end_time: string
    status: string
  }>
  count?: number
  oldestDate?: string | null
  error?: string
}

export type RetentionSettingsResult = {
  success: boolean
  error?: string
}

export async function purgeAppointments(
  organizationId: string,
  olderThanDays: number,
  dryRun: boolean = true
): Promise<PurgeResult> {
  const validation = PurgeSchema.safeParse({ organizationId, olderThanDays, dryRun })

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Datos inválidos',
    }
  }

  const supabase = await createClient()

  const access = await requireOrgAccess(organizationId, ['owner', 'admin'])
  if (!access.success) return access

  try {
    if (dryRun) {
      const countResult = await countAppointmentsToPurge(organizationId, olderThanDays)
      const candidates = await getAppointmentsToPurge(organizationId, olderThanDays)

      return {
        success: true,
        candidates: candidates.slice(0, 50),
        count: countResult.count,
        oldestDate: countResult.oldestDate,
      }
    }

    const result = await executePurge(organizationId, olderThanDays)

    revalidatePath('/calendar')
    revalidatePath('/dashboard')
    revalidatePath('/payroll')

    return {
      success: true,
      deletedCount: result.deletedCount,
    }
  } catch (e) {
    console.error('[purgeAppointments] Error:', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error al purgar citas',
    }
  }
}

export async function deleteAppointmentsByIds(
  organizationId: string,
  appointmentIds: string[]
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  const supabase = await createClient()

  const access = await requireOrgAccess(organizationId, ['owner', 'admin'])
  if (!access.success) return access

  if (!appointmentIds || appointmentIds.length === 0) {
    return { success: false, error: 'No hay citas seleccionadas' }
  }

  try {
    const { data: deleted, error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('organization_id', organizationId)
      .in('id', appointmentIds)
      .select('id')

    if (deleteError) throw deleteError

    revalidatePath('/calendar')
    revalidatePath('/dashboard')
    revalidatePath('/payroll')

    return { success: true, deletedCount: (deleted || []).length }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error al eliminar',
    }
  }
}

export async function updateRetentionSettings(
  organizationId: string,
  settings: { auto_retention_days?: number; auto_purge_enabled?: boolean }
): Promise<RetentionSettingsResult> {
  const validation = UpdateRetentionSettingsSchema.safeParse(settings)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Configuración inválida',
    }
  }

  const supabase = await createClient()

  const access = await requireOrgAccess(organizationId, ['owner', 'admin'])
  if (!access.success) return access

  const { error } = await supabase
    .from('booking_settings')
    .update({
      auto_retention_days: settings.auto_retention_days,
      auto_purge_enabled: settings.auto_purge_enabled,
    })
    .eq('organization_id', organizationId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')

  return { success: true }
}

export async function getRetentionSettings(organizationId: string): Promise<{
  auto_retention_days: number
  auto_purge_enabled: boolean
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('booking_settings')
    .select('auto_retention_days, auto_purge_enabled')
    .eq('organization_id', organizationId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    auto_retention_days: data.auto_retention_days ?? 90,
    auto_purge_enabled: data.auto_purge_enabled ?? false,
  }
}
