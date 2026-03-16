'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const BookingSettingsSchema = z.object({
  organization_id: z.string().uuid(),
  slot_interval: z.number().min(15).max(120).default(30),
  buffer_minutes: z.number().min(0).max(60).default(0),
  max_days_ahead: z.number().min(1).max(365).default(60),
  min_notice_hours: z.number().min(0).max(168).default(24),
  timezone: z.string().default('UTC'),
  online_booking_enabled: z.boolean().default(true),
})

export type BookingSettings = z.infer<typeof BookingSettingsSchema>

export async function updateBookingSettings(
  organizationId: string,
  settings: Partial<BookingSettings>
) {
  const supabase = await createClient()

  const validation = BookingSettingsSchema.safeParse({
    organization_id: organizationId,
    ...settings,
  })

  if (!validation.success) {
    return { 
      success: false, 
      error: 'Datos de configuración inválidos',
      details: validation.error.flatten() 
    }
  }

  const { error } = await supabase
    .from('booking_settings')
    .upsert({
      organization_id: organizationId,
      ...settings,
    }, {
      onConflict: 'organization_id'
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/calendar')
  revalidatePath('/reservar')

  return { success: true }
}
