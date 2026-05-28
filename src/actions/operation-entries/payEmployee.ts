'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import type { PaymentMethod } from '@/types/cash-sessions'

export async function payEmployee(input: {
  employee_id: string; amount: number; payment_method: PaymentMethod; notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }
  const { data: emp } = await supabase.from('employees').select('id, name, organization_id').eq('id', input.employee_id).single()
  if (!emp) return { error: 'Empleado no encontrado.' }
  const { data: member } = await supabase.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', emp.organization_id).single()
  if (!member || !['owner', 'admin'].includes(member.role)) return { error: 'Sin permiso.' }
  const today = getTodayDateColombia()
  const { data: session } = await (supabase as any).from('cash_sessions').select('id').eq('organization_id', emp.organization_id).eq('session_date', today).eq('status', 'open').maybeSingle()
  if (!session) return { error: 'No hay caja abierta.' }
  if (input.amount <= 0) return { error: 'Monto debe ser > 0.' }
  const { data: entry, error } = await (supabase as any).from('operation_entries').insert({
    cash_session_id: session.id, entry_type: 'payroll_expense', entry_status: 'active', created_via: 'payroll_auto',
    direction: 'out', title: 'Pago a ' + emp.name, description: input.notes || null, amount: input.amount,
    payment_method: input.payment_method, source_type: 'payroll', source_id: input.employee_id, created_by: user.id,
  }).select('id').single()
  if (error) return { error: 'Error al registrar.' }
  revalidatePath('/caja')
  revalidatePath('/payroll')
  return { entry_id: entry.id }
}
