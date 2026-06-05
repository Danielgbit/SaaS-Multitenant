'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { HHMM_REGEX, timeToMinutes } from '@/schemas/common'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

const SetAvailabilitySchema = z.object({
  employee_id: z.string().uuid('ID inválido'),
  day_of_week: z.coerce.number().int().min(0).max(6, '0-6'),
  start_time: z.string().regex(HHMM_REGEX, 'Formato HH:MM'),
  end_time: z.string().regex(HHMM_REGEX, 'Formato HH:MM'),
  break_start: z.string().regex(HHMM_REGEX).optional().nullable(),
  break_end: z.string().regex(HHMM_REGEX).optional().nullable(),
  break_reason: z.string().max(200).optional().nullable(),
}).superRefine((d, ctx) => {
  if (timeToMinutes(d.start_time) >= timeToMinutes(d.end_time)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_time'], message: 'Inicio debe ser menor que fin' })
  }
  if (d.break_start || d.break_end) {
    if (!d.break_start || !d.break_end) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['break_end'], message: 'Ambos campos de descanso requeridos' })
      return
    }
    if (timeToMinutes(d.break_start) >= timeToMinutes(d.break_end)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['break_end'], message: 'Inicio de descanso debe ser menor que fin' })
    }
  }
})

/**
 * Server Action: Crea o actualiza la disponibilidad de un empleado.
 * Usa UPSERT para manejar el caso de UNIQUE constraint.
 */
export async function setAvailability(
  input: { employee_id: string; day_of_week: number; start_time: string; end_time: string; break_start?: string | null; break_end?: string | null; break_reason?: string | null }
): Promise<{ error?: string; success?: boolean }> {
  const parsed = SetAvailabilitySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabase = await createClient()

  const access = await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', parsed.data.employee_id)
    .eq('organization_id', access.context.organizationId)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no pertenece a tu organización.' }
  }

  // 4. Insertar o actualizar (UPSERT)
  const { error: upsertError } = await supabase
    .from('employee_availability')
    .upsert(
      {
        employee_id: parsed.data.employee_id,
        day_of_week: parsed.data.day_of_week,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        break_start: parsed.data.break_start || null,
        break_end: parsed.data.break_end || null,
        break_reason: parsed.data.break_reason || null,
      },
      {
        onConflict: 'employee_id,day_of_week',
      }
    )

  if (upsertError) {
    console.error('Error al guardar disponibilidad:', upsertError.message)
    return { error: 'No se pudo guardar la disponibilidad. Intenta de nuevo.' }
  }

  revalidatePath(`/employees/${input.employee_id}/availability`)
  return { success: true }
}
