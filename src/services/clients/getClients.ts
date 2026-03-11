import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

/**
 * Obtiene todos los clientes de una organización.
 */
export async function getClients(organizationId: string): Promise<Client[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching clients:', error.message)
    throw new Error('No se pudieron obtener los clientes')
  }

  return data ?? []
}

/**
 * Busca clientes por nombre, teléfono o email.
 */
export async function searchClients(
  organizationId: string,
  query: string
): Promise<Client[]> {
  const supabase = await createClient()

  if (!query.trim()) {
    return getClients(organizationId)
  }

  const searchTerm = `%${query}%`

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .order('name', { ascending: true })
    .limit(10)

  if (error) {
    console.error('Error searching clients:', error.message)
    return []
  }

  return data ?? []
}

/**
 * Obtiene un cliente por ID.
 */
export async function getClientById(clientId: string): Promise<Client | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching client:', error.message)
    return null
  }

  return data
}
