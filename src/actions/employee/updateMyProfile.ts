'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateMyProfile(input: { name: string; phone?: string | null }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) return { error: 'No tienes un perfil de empleado vinculado.' }

  const name = input.name?.trim()
  if (!name) return { error: 'El nombre es requerido.' }

  const { error } = await supabase
    .from('employees')
    .update({ name, phone: input.phone?.trim() || null })
    .eq('id', employee.id)
    .eq('organization_id', employee.organization_id)

  if (error) {
    console.error('Error updating my profile:', error.message)
    return { error: 'No se pudo actualizar el perfil.' }
  }

  revalidatePath('/mi')
  return { success: true }
}
