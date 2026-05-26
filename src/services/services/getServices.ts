import { createClient } from '@/lib/supabase/server'
import type { Service } from '@/types/services'

export async function getServices(organizationId: string): Promise<Service[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  return data ?? []
}
