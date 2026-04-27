'use server'

import { createClient } from '@/lib/supabase/server'
import type { SpaOverride } from '@/types/availability'

export async function getSpaOverrides(organizationId: string): Promise<SpaOverride[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('spa_availability_overrides')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching spa overrides:', error.message)
    return []
  }

  return data || []
}

export async function getSpaOverrideForDate(
  organizationId: string,
  date: string
): Promise<SpaOverride | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('spa_availability_overrides')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    console.error('Error fetching spa override for date:', error.message)
    return null
  }

  return data
}