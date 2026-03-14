'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const GetInvoicesSchema = z.object({
  organizationId: z.string().uuid(),
})

export async function getInvoices(
  input: z.infer<typeof GetInvoicesSchema>
): Promise<{
  success: boolean
  data?: Record<string, unknown>[]
  error?: string
}> {
  const parsed = GetInvoicesSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { organizationId } = parsed.data
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('invoices' as any)
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching invoices:', error)
      return { success: false, error: 'Error al cargar facturas' }
    }

    return { success: true, data: (data as unknown as Record<string, unknown>[]) || [] }
  } catch (error) {
    console.error('Error in getInvoices:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
