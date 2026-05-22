import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Callback = () => void

class RealtimeManager {
  private orgId: string | null = null
  private appointmentsChannel: RealtimeChannel | null = null
  private notificationsChannel: RealtimeChannel | null = null
  private appointmentsListeners = new Set<Callback>()
  private notificationsListeners = new Set<Callback>()
  private supabase: ReturnType<typeof createClient> | null = null

  init(organizationId: string) {
    if (this.orgId === organizationId) return
    this.destroy()

    this.orgId = organizationId
    this.supabase = createClient()

    this.appointmentsChannel = this.supabase
      .channel(`realtime-appointments-${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `organization_id=eq.${organizationId}`,
      }, () => {
        this.appointmentsListeners.forEach(cb => cb())
      })
      .subscribe()

    this.notificationsChannel = this.supabase
      .channel(`realtime-notifications-${organizationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `organization_id=eq.${organizationId}`,
      }, () => {
        this.notificationsListeners.forEach(cb => cb())
      })
      .subscribe()
  }

  onAppointmentsChange(cb: Callback): () => void {
    this.appointmentsListeners.add(cb)
    return () => { this.appointmentsListeners.delete(cb) }
  }

  onNotificationsInsert(cb: Callback): () => void {
    this.notificationsListeners.add(cb)
    return () => { this.notificationsListeners.delete(cb) }
  }

  private destroy() {
    if (this.supabase) {
      if (this.appointmentsChannel) {
        this.supabase.removeChannel(this.appointmentsChannel)
        this.appointmentsChannel = null
      }
      if (this.notificationsChannel) {
        this.supabase.removeChannel(this.notificationsChannel)
        this.notificationsChannel = null
      }
    }
    this.appointmentsListeners.clear()
    this.notificationsListeners.clear()
    this.supabase = null
    this.orgId = null
  }
}

export const realtimeManager = new RealtimeManager()
