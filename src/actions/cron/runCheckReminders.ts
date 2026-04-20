'use server'

import { createClient } from '@/lib/supabase/server'

export async function runCheckReminders(): Promise<{
  success: boolean
  processed: number
  reminders: number
  alerts: number
  autoCompleted: number
  errors: string[]
}> {
  const supabase = await createClient()
  const errors: string[] = []
  let reminders = 0
  let alerts = 0
  let autoCompleted = 0

  try {
    const now = new Date()

    // =================================================================
    // 1. RECORDATORIO 5 MIN ANTES — Para empleados (máx 2 por cita)
    // =================================================================
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)
    const fourMinutesLater = new Date(now.getTime() + 4 * 60 * 1000)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    const { data: reminderAppointments, error: reminderError } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        organization_id,
        employee_id,
        end_time,
        confirmation_status,
        employees!employees_id(user_id, name),
        clients!clients_id(name)
      `)
      .gte('end_time', fourMinutesLater.toISOString())
      .lte('end_time', fiveMinutesLater.toISOString())
      .in('confirmation_status', ['scheduled'])
      .eq('status', 'confirmed')

    if (!reminderError && reminderAppointments && reminderAppointments.length > 0) {
      for (const apt of reminderAppointments) {
        try {
          // Contar cuántos reminders tiene esta cita en los últimos 10 min
          const { count: existingReminders } = await (supabase as any)
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('metadata->>appointment_id', apt.id)
            .eq('type', 'reminder')
            .gte('created_at', fiveMinutesAgo.toISOString())

          if ((existingReminders || 0) >= 2) {
            continue // Ya tiene 2 reminders, saltar
          }

          // Verificar si ya existe un reminder muy reciente (< 3 min)
          const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000)
          const { count: recentReminders } = await (supabase as any)
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('metadata->>appointment_id', apt.id)
            .eq('type', 'reminder')
            .gte('created_at', threeMinutesAgo.toISOString())

          if ((recentReminders || 0) > 0) {
            continue // Ya se envió reminder recientemente
          }

          if (apt.employees?.user_id) {
            const clientName = apt.clients?.name || 'Cliente'
            const reminderNumber = (existingReminders || 0) + 1

            await (supabase as any)
              .from('notifications')
              .insert({
                organization_id: apt.organization_id,
                user_id: apt.employees.user_id,
                type: 'reminder',
                title: reminderNumber === 1
                  ? 'Servicio por terminar'
                  : '¡Aún no has marcado el servicio!',
                message: reminderNumber === 1
                  ? `El servicio de ${clientName} está por terminar en 5 minutos`
                  : `¡No has marcado el servicio de ${clientName}! Ya pasaron 5 minutos.`,
                metadata: {
                  appointment_id: apt.id,
                  employee_id: apt.employee_id,
                  client_name: clientName,
                  reminder_number: reminderNumber,
                },
              })
            reminders++
          }
        } catch (e) {
          errors.push(`Reminder error for appointment ${apt.id}`)
        }
      }
    }

    // =================================================================
    // 2. ALERTA "SIN MARCAR" 60 MIN+ — Para asistentes
    // SELECT appointments donde hora_fin + 60 min <= ahora 
    // AND confirmation_status = 'scheduled'
    // =================================================================
    const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const { data: unmarkedAppointments, error: unmarkedError } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        organization_id,
        end_time,
        confirmation_status
      `)
      .lte('end_time', sixtyMinutesAgo.toISOString())
      .eq('confirmation_status', 'scheduled')
      .eq('status', 'confirmed')

    if (!unmarkedError && unmarkedAppointments && unmarkedAppointments.length > 0) {
      for (const apt of unmarkedAppointments) {
        try {
          // Update appointment to needs_review
          await (supabase as any)
            .from('appointments')
            .update({ confirmation_status: 'needs_review' })
            .eq('id', apt.id)

          // Notify assistants
          const { data: assistants } = await (supabase as any)
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', apt.organization_id)
            .in('role', ['owner', 'admin', 'staff'])

          if (assistants && assistants.length > 0) {
            const notifications = assistants.map((a: any) => ({
              organization_id: apt.organization_id,
              user_id: a.user_id,
              type: 'unmarked_alert',
              title: 'Cita sin marcar',
              message: `Hay una cita sin marcar hace más de 60 minutos`,
              metadata: {
                appointment_id: apt.id,
              },
            }))

            await (supabase as any)
              .from('notifications')
              .insert(notifications)
          }

          alerts++
        } catch (e) {
          errors.push(`Unmarked alert error for appointment ${apt.id}`)
        }
      }
    }

    // =================================================================
    // 3. AUTO-COMPLETADO 120 MIN+ — Sistema marca automáticamente
    // SELECT appointments donde hora_fin + 120 min <= ahora 
    // AND confirmation_status = 'needs_review'
    // =================================================================
    const oneTwentyMinutesAgo = new Date(now.getTime() - 120 * 60 * 1000)

    const { data: autoCompleteAppointments, error: autoCompleteError } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        organization_id,
        end_time,
        confirmation_status
      `)
      .lte('end_time', oneTwentyMinutesAgo.toISOString())
      .eq('confirmation_status', 'needs_review')

    if (!autoCompleteError && autoCompleteAppointments && autoCompleteAppointments.length > 0) {
      for (const apt of autoCompleteAppointments) {
        try {
          // System marks as completed
          await (supabase as any)
            .from('appointments')
            .update({ 
              confirmation_status: 'completed',
              completed_at: now.toISOString(),
            })
            .eq('id', apt.id)

          // Log the action
          await (supabase as any)
            .from('confirmation_logs')
            .insert({
              appointment_id: apt.id,
              organization_id: apt.organization_id,
              action: 'manually_set',
              performed_by: null,
              performed_by_role: 'system',
              price_before: null,
              price_after: null,
              notes: 'Auto-completado por el sistema después de 120 min',
            })

          // Notify assistants
          const { data: assistants } = await (supabase as any)
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', apt.organization_id)
            .in('role', ['owner', 'admin', 'staff'])

          if (assistants && assistants.length > 0) {
            const notifications = assistants.map((a: any) => ({
              organization_id: apt.organization_id,
              user_id: a.user_id,
              type: 'auto_completed',
              title: 'Cita auto-completada',
              message: `El sistema marcó una cita como completada automáticamente`,
              metadata: {
                appointment_id: apt.id,
              },
            }))

            await (supabase as any)
              .from('notifications')
              .insert(notifications)
          }

          autoCompleted++
        } catch (e) {
          errors.push(`Auto-complete error for appointment ${apt.id}`)
        }
      }
    }

    return {
      success: true,
      processed: reminders + alerts + autoCompleted,
      reminders,
      alerts,
      autoCompleted,
      errors,
    }
  } catch (error) {
    console.error('[runCheckReminders] Error:', error)
    return {
      success: false,
      processed: 0,
      reminders: 0,
      alerts: 0,
      autoCompleted: 0,
      errors: [...errors, String(error)],
    }
  }
}
