'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppointmentWithDetails } from '@/types/calendar'

export interface AppointmentRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: AppointmentWithDetails
  old?: AppointmentWithDetails
}

export function setupAppointmentsRealtime(
  organizationId: string,
  onAppointmentChange: (payload: AppointmentRealtimePayload) => void
) {
  if (!organizationId) {
    return () => {}
  }

  const supabase = createClient()

  const channel = supabase
    .channel(`appointments-realtime-${organizationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        onAppointmentChange({
          eventType: payload.eventType as AppointmentRealtimePayload['eventType'],
          new: payload.new as AppointmentWithDetails | undefined,
          old: payload.old as AppointmentWithDetails | undefined,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function useAppointmentsRealtime(
  organizationId: string,
  onChange: (payload: AppointmentRealtimePayload) => void
) {
  useEffect(() => {
    if (!organizationId) return

    const cleanup = setupAppointmentsRealtime(organizationId, onChange)
    return cleanup
  }, [organizationId, onChange])
}
