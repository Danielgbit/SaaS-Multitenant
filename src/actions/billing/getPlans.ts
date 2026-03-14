'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getPlans(): Promise<{
  success: boolean
  data?: Array<Record<string, unknown>>
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return { success: false, error: 'Error al cargar planes' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getPlans:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function getPlan(planId: string): Promise<{
  success: boolean
  data?: Record<string, unknown>
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error || !data) {
      return { success: false, error: 'Plan no encontrado' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getPlan:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
