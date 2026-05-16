// Snapshot Capturer with drift detection
import { createClient } from '@/lib/supabase/server'
import type { ShadowSeed, AppointmentSnapshot, LegacyResult } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Captures appointment state snapshot
 * Detects if the row was modified while queued (observational, not drift)
 */
export async function captureSnapshot(
  seed: ShadowSeed,
  supabase?: SupabaseClient
): Promise<{ snapshot: AppointmentSnapshot | null; snapshotChanged: boolean; error?: string }> {
  const client = supabase || await createClient()

  try {
    const { data, error } = await (client as any)
      .from('appointments')
      .select(`
        id,
        organization_id,
        status,
        confirmation_status,
        employee_id,
        client_id,
        date,
        start_time,
        end_time,
        price_adjustment,
        payment_method,
        completed_at,
        completed_by,
        confirmed_at,
        confirmed_by,
        updated_at,
        appointment_services (
          service_id
        )
      `)
      .eq('id', seed.appointmentId)
      .single()

    if (error || !data) {
      return {
        snapshot: null,
        snapshotChanged: false,
        error: error?.message || 'Appointment not found',
      }
    }

    // Observational: did updated_at change while queued?
    // This is NOT drift — just indicates concurrent modification
    const snapshotChanged = data.updated_at !== seed.observedUpdatedAt

    if (snapshotChanged) {
      console.warn('[shadow] snapshot changed while queued', {
        appointmentId: seed.appointmentId,
        expectedUpdatedAt: seed.observedUpdatedAt,
        actualUpdatedAt: data.updated_at,
        // Check if state actually changed
        statusChanged: data.status !== seed.initialStatus,
        confirmationChanged: data.confirmation_status !== seed.initialConfirmationStatus,
      })
    }

    const snapshot: AppointmentSnapshot = {
      id: data.id,
      organization_id: data.organization_id,
      status: data.status,
      confirmation_status: data.confirmation_status,
      employee_id: data.employee_id,
      client_id: data.client_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      price_adjustment: data.price_adjustment,
      payment_method: data.payment_method,
      completed_at: data.completed_at,
      completed_by: data.completed_by,
      confirmed_at: data.confirmed_at,
      confirmed_by: data.confirmed_by,
      updated_at: data.updated_at,
      appointment_services: data.appointment_services || [],
    }

    return { snapshot, snapshotChanged }
  } catch (error) {
    console.error('[shadow] captureSnapshot error:', error)
    return {
      snapshot: null,
      snapshotChanged: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Builds legacy result from snapshot
 */
export function buildLegacyResult(snapshot: AppointmentSnapshot): LegacyResult {
  return {
    success: true,
    status: snapshot.status,
    confirmation_status: snapshot.confirmation_status,
    price_adjustment: snapshot.price_adjustment ?? undefined,
    completed_at: snapshot.completed_at ?? undefined,
    completed_by: snapshot.completed_by ?? undefined,
    confirmed_at: snapshot.confirmed_at ?? undefined,
    confirmed_by: snapshot.confirmed_by ?? undefined,
    payment_method: snapshot.payment_method ?? undefined,
  }
}
