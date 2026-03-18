import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const now = new Date().toISOString()

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        organization_id,
        employee_id,
        start_time,
        end_time,
        status,
        client_id,
        clients (
          name,
          phone
        )
      `)
      .eq('status', 'confirmed')
      .lt('end_time', now)

    if (fetchError) {
      console.error('[check-completed] Error fetching appointments:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No appointments to process' })
    }

    let processed = 0

    for (const apt of appointments) {
      const { data: existingConfirmation } = await (supabase as any)
        .from('appointment_confirmations')
        .select('id')
        .eq('appointment_id', apt.id)
        .single()

      if (existingConfirmation) {
        continue
      }

      const { data: appointmentServices } = await supabase
        .from('appointment_services')
        .select(`
          service_id,
          services (
            name,
            price
          )
        `)
        .eq('appointment_id', apt.id)

      const services = (appointmentServices || []).map((as: any) => ({
        service_id: as.service_id,
        service_name: as.services?.name || 'Servicio',
        price: as.services?.price || 0,
        performed: true,
      }))

      const total = services.reduce((sum: number, s: any) => sum + s.price, 0)

      const { error: insertError } = await (supabase as any)
        .from('appointment_confirmations')
        .insert({
          appointment_id: apt.id,
          organization_id: apt.organization_id,
          employee_id: apt.employee_id,
          services,
          total_amount: total,
          confirmation_type: 'scheduled',
          status: 'pending_employee',
          client_name: apt.clients?.name || null,
          client_phone: apt.clients?.phone || null,
        })

      if (insertError) {
        console.error('[check-completed] Error inserting confirmation:', insertError)
        continue
      }

      processed++
    }

    return NextResponse.json({ 
      processed, 
      message: `Processed ${processed} appointments` 
    })
  } catch (error) {
    console.error('[check-completed] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
