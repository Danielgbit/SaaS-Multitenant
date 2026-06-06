'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import { z } from 'zod'
import { coercePositiveNumber } from '@/schemas/common'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const PayEmployeeSchema = z.object({
  employee_id: z.string().uuid(),
  amount: coercePositiveNumber({ message: 'Monto debe ser > 0' }),
  payment_method: z.string().min(1, 'Método de pago requerido'),
  notes: z.string().max(500).optional().nullable(),
})

export async function payEmployee(input: {
  employee_id: string; amount: number; payment_method: string; notes?: string | null
}) {
  const parsed = PayEmployeeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabase = await createClient()

  const { data: emp } = await supabase.from('employees').select('id, name, organization_id').eq('id', parsed.data.employee_id).single()
  if (!emp) return { error: 'Empleado no encontrado.' }

  const access = await requireOrgAccess(emp.organization_id, ['owner', 'admin'])
  if (!access.success) return { error: access.error }

  const today = getTodayDateColombia()
  const { data: session } = await supabase.from('cash_sessions').select('id').eq('organization_id', emp.organization_id).eq('session_date', today).eq('status', 'open').maybeSingle()
  if (!session) return { error: 'No hay caja abierta.' }

  const { employee_id, amount, payment_method, notes } = parsed.data
  const { data: entry, error } = await supabase.from('operation_entries').insert({
    cash_session_id: session.id, entry_type: 'payroll_expense', entry_status: 'active', created_via: 'payroll_auto',
    direction: 'out', title: 'Pago a ' + emp.name, description: notes || null, amount,
    payment_method, source_type: 'payroll', source_id: employee_id, created_by: access.context.userId,
  }).select('id').single()
  if (error) return { error: 'Error al registrar.' }
  revalidatePath('/caja')
  revalidatePath('/nomina')
  return { entry_id: entry.id }
}
