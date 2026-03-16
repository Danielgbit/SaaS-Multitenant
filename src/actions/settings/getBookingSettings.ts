'use server'

import { createClient } from '@/lib/supabase/server'

export async function getBookingSettings(organizationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('booking_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: null }
    }
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
