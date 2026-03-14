'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendWhatsAppActivationRequestEmail } from '@/lib/resend'

const RequestWhatsAppSchema = z.object({
  organizationId: z.string().uuid(),
  contactName: z.string().min(2),
  businessPhone: z.string().min(8),
})

export async function requestWhatsAppActivation(
  input: z.infer<typeof RequestWhatsAppSchema>
): Promise<{
  success: boolean
  error?: string
}> {
  const parsed = RequestWhatsAppSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { organizationId, contactName, businessPhone } = parsed.data
  const supabase = await createClient()

  try {
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return { success: false, error: 'Organización no encontrada' }
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('organization_id', organizationId)
      .single()

    const planId = (subscription as unknown as Record<string, unknown>)?.plan_id as string

    const { data: plan } = await supabase
      .from('plans')
      .select('name')
      .eq('id', planId)
      .single()

    await (supabase
      .from('whatsapp_activation_requests' as any)
      .insert({
        organization_id: organizationId,
        contact_name: contactName,
        business_phone: businessPhone,
        status: 'pending',
      }) as unknown as Promise<{ error: unknown }>)

    await sendWhatsAppActivationRequestEmail({
      organizationName: organization.name,
      contactName,
      businessPhone,
      planName: plan?.name || 'Unknown',
    })

    return { success: true }
  } catch (error) {
    console.error('Error requesting WhatsApp activation:', error)
    return { success: false, error: 'Error al procesar la solicitud' }
  }
}
