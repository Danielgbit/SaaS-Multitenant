'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { CreateLoanInput, EmployeeLoan, LoanConcept } from '@/types/payroll'

const CreateLoanSchema = z.object({
  employee_id: z.string().uuid('ID de empleado inválido'),
  amount: z.number().positive('El monto debe ser positivo'),
  concept: z.enum(['passage', 'food', 'product', 'advance', 'other'] as const),
  interest_rate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  due_date: z.string().datetime().optional().nullable(),
})

export async function createEmployeeLoan(
  input: CreateLoanInput
): Promise<{
  success: boolean
  data?: EmployeeLoan
  error?: string
  warning?: string
  blocked?: boolean
}> {
  const parsed = CreateLoanSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    return { success: false, error: 'No se encontró organización' }
  }

  const { data: employee } = await (supabase as any)
    .from('employees')
    .select('id, name, max_debt_limit, debt_warning_threshold')
    .eq('id', input.employee_id)
    .single()

  if (!employee) {
    return { success: false, error: 'Empleado no encontrado' }
  }

  const { data: existingLoans } = await (supabase as any)
    .from('employee_loans')
    .select('remaining_amount')
    .eq('employee_id', input.employee_id)
    .in('status', ['pending', 'partial'])

  const currentDebt = (existingLoans || []).reduce(
    (sum: number, loan: any) => sum + loan.remaining_amount,
    0
  )

  const newDebt = currentDebt + input.amount
  const limit = employee.max_debt_limit || null

  let warning: string | undefined
  let blocked = false

  if (limit && newDebt > limit) {
    blocked = true
    warning = `Excedió el límite de deuda (${limit}). Se requiere aprobación manual.`
  } else if (limit && newDebt > limit * ((employee.debt_warning_threshold || 80) / 100)) {
    warning = `La deuda ha alcanzado el ${employee.debt_warning_threshold || 80}% del límite.`
  }

  if (blocked) {
    return { success: false, error: warning, blocked: true }
  }

  const { data: loan, error } = await (supabase as any)
    .from('employee_loans')
    .insert({
      employee_id: input.employee_id,
      organization_id: orgMember.organization_id,
      amount: input.amount,
      interest_rate: input.interest_rate,
      concept: input.concept,
      notes: input.notes,
      due_date: input.due_date,
      remaining_amount: input.amount,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/payroll')
  revalidatePath('/employees')
  revalidatePath(`/payroll/${input.employee_id}`)

  return { success: true, data: loan as EmployeeLoan, warning }
}

export async function getEmployeeLoans(
  employeeId: string
): Promise<{
  success: boolean
  data?: EmployeeLoan[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await (supabase as any)
    .from('employee_loans')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as EmployeeLoan[] }
}

export async function updateEmployeeLoan(
  id: string,
  status: 'pending' | 'partial' | 'paid' | 'frozen'
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { error } = await (supabase as any)
    .from('employee_loans')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/payroll')
  revalidatePath('/employees')

  return { success: true }
}
