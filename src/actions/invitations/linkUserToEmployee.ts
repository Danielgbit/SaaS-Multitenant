'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =============================================================================
// SCHEMA DE VALIDACIÓN
// =============================================================================

const LinkUserToEmployeeSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  employeeId: z.string().uuid('ID de empleado inválido'),
  organizationId: z.string().uuid().optional(),
})

export type LinkUserToEmployeeInput = z.infer<typeof LinkUserToEmployeeSchema>

// =============================================================================
// TIPOS DE RESULTADO
// =============================================================================

export type LinkUserToEmployeeErrorType =
  | 'invalid_input'
  | 'employee_not_found'
  | 'user_not_found'
  | 'already_linked'
  | 'different_organization'
  | 'link_failed'
  | 'member_creation_failed'
  | 'employee_belongs_to_different_org'

export interface LinkedEmployee {
  id: string
  name: string
  user_id: string | null
  organization_id: string
}

export interface LinkUserToEmployeeResult {
  success?: boolean
  error?: string
  errorType?: LinkUserToEmployeeErrorType
  employee?: LinkedEmployee
}

// =============================================================================
// HELPER: Verificar que el usuario existe en auth
// =============================================================================

async function verifyUserExists(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)

  if (error || !data?.user) {
    return false
  }

  return true
}

// =============================================================================
// HELPER: Verificar membresía en organización
// =============================================================================

async function ensureOrganizationMember(
  supabaseAdmin: any,
  userId: string,
  organizationId: string,
  role: string = 'empleado'
): Promise<{ success: boolean; error?: string }> {
  // Verificar si ya es miembro
  const { data: existingMember } = await supabaseAdmin
    .from('organization_members')
    .select('id, role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single()

  if (existingMember) {
    return { success: true }
  }

  // Verificar que el usuario existe en auth
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (!authUser?.user) {
    return { success: false, error: 'Usuario no encontrado en auth' }
  }

  // Crear membresía
  const { error: insertError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role: role,
    })

  if (insertError) {
    console.error('Error creating organization member:', insertError)
    return { success: false, error: 'No se pudo crear la membresía' }
  }

  return { success: true }
}

// =============================================================================
// SERVER ACTION
// =============================================================================

/**
 * Vincula un usuario de auth a un empleado existente.
 * Esta función es idempotente - si el empleado ya está vinculado, devuelve success.
 *
 * @param input - Datos de vinculación (userId, employeeId, opcionalmente organizationId)
 * @returns Resultado con éxito o error
 */
export async function linkUserToEmployee(
  input: LinkUserToEmployeeInput
): Promise<LinkUserToEmployeeResult> {
  // 1. Validar input
  const parsed = LinkUserToEmployeeSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || 'Datos inválidos',
      errorType: 'invalid_input',
    }
  }

  const { userId, employeeId, organizationId } = parsed.data

  const supabase = await createClient()
  const supabaseAdmin = await createServiceRoleClient()

  // 2. Verificar que el empleado existe
  let employeeQuery = supabase
    .from('employees')
    .select('id, name, user_id, organization_id')
    .eq('id', employeeId)

  // Si se provee organizationId, verificar que el empleado pertenece a esa org
  if (organizationId) {
    employeeQuery = employeeQuery.eq('organization_id', organizationId)
  }

  const { data: employee, error: employeeError } = await employeeQuery.single()

  if (employeeError || !employee) {
    return {
      error: 'Empleado no encontrado',
      errorType: 'employee_not_found',
    }
  }

  // 3. Verificar que el empleado no pertenece a una org diferente (si se específico)
  if (organizationId && employee.organization_id !== organizationId) {
    return {
      error: 'El empleado pertenece a una organización diferente',
      errorType: 'employee_belongs_to_different_org',
    }
  }

  // 4. Verificar que el usuario existe en auth
  const userExists = await verifyUserExists(supabaseAdmin, userId)

  if (!userExists) {
    return {
      error: 'Usuario no encontrado',
      errorType: 'user_not_found',
    }
  }

  // 5. Verificar si ya está vinculado (si es el mismo user, OK; si es otro, error)
  if (employee.user_id) {
    if (employee.user_id === userId) {
      // Ya está vinculado a este usuario - operación idempotente
      return {
        success: true,
        employee: {
          id: employee.id,
          name: employee.name,
          user_id: employee.user_id,
          organization_id: employee.organization_id,
        },
      }
    } else {
      // Ya está vinculado a otro usuario
      return {
        error: 'Este empleado ya está vinculado a otro usuario',
        errorType: 'already_linked',
      }
    }
  }

  // 6. Vincular usuario al empleado
  const { error: updateError } = await supabase
    .from('employees')
    .update({ user_id: userId })
    .eq('id', employeeId)

  if (updateError) {
    console.error('Error linking user to employee:', updateError)
    return {
      error: 'No se pudo vincular el usuario al empleado',
      errorType: 'link_failed',
    }
  }

  // 7. Asegurar que el usuario es member de la organización
  if (employee.organization_id) {
    const memberResult = await ensureOrganizationMember(
      supabaseAdmin,
      userId,
      employee.organization_id,
      'empleado' // Rol por defecto al vincular por invitación
    )

    if (!memberResult.success) {
      // Rollback: desvinculamos
      await supabase
        .from('employees')
        .update({ user_id: null })
        .eq('id', employeeId)

      return {
        error: memberResult.error || 'Error al crear membresía',
        errorType: 'member_creation_failed',
      }
    }
  }

  // 8. Revalidar
  revalidatePath('/employees')
  revalidatePath('/calendar')
  revalidatePath('/dashboard')

  return {
    success: true,
    employee: {
      id: employee.id,
      name: employee.name,
      user_id: userId,
      organization_id: employee.organization_id,
    },
  }
}

// =============================================================================
// HELPER: Desvincular usuario de empleado
// =============================================================================

/**
 * Desvincula un usuario de un empleado (rollback).
 * Usado en casos de rollback durante flujos de creación de usuario.
 */
export async function unlinkUserFromEmployee(
  employeeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({ user_id: null })
    .eq('id', employeeId)

  if (error) {
    console.error('Error unlinking user from employee:', error)
    return { success: false, error: 'No se pudo desvincular' }
  }

  revalidatePath('/employees')
  return { success: true }
}