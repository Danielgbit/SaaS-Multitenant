import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { TableName, EventType, RealtimeEvent, RealtimeCallback, CleanupFn } from './types'

const SUBSCRIPTIONS: { table: TableName; events: EventType[]; filter?: string }[] = [
  { table: 'appointments', events: ['*'], filter: undefined },
  { table: 'notifications', events: ['INSERT'], filter: undefined },
]

class RealtimeManager {
  private supabase = createClient()
  private orgId: string | null = null
  private channels = new Map<string, RealtimeChannel>()
  private listeners = new Map<string, Set<RealtimeCallback>>()
  private reconnectAttempts = new Map<string, number>()
  private maxReconnectAttempts = 5
  private reconnectTimers = new Map<string, NodeJS.Timeout>()

  init(organizationId: string) {
    if (this.orgId === organizationId) return

    const prevOrgId = this.orgId
    this.orgId = organizationId

    if (prevOrgId) {
      SUBSCRIPTIONS.forEach(({ table }) => {
        const key = this.channelKey(table, prevOrgId)
        this.removeChannel(key)
      })
    }

    SUBSCRIPTIONS.forEach(({ table, events }) => {
      const key = this.channelKey(table, organizationId)
      const filter = `organization_id=eq.${organizationId}`
      this.createChannel(key, table, events, filter)
    })
  }

  on(table: TableName, callback: RealtimeCallback): CleanupFn {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set())
    }
    this.listeners.get(table)!.add(callback)

    return () => {
      this.listeners.get(table)?.delete(callback)
    }
  }

  destroy() {
    this.channels.forEach((_, key) => this.removeChannel(key))
    this.listeners.clear()
    this.orgId = null
  }

  private channelKey(table: TableName, orgId: string) {
    return `${table}:${orgId}`
  }

  private createChannel(key: string, table: TableName, events: EventType[], filter: string) {
    const channelName = `unified-${table}-${this.orgId}`
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: events[0], schema: 'public', table, filter },
        (payload) => {
          this.listeners.get(table)?.forEach(cb => {
            try {
              cb({ table, eventType: payload.eventType as EventType, payload })
            } catch (e) {
              console.error(`[realtime] Error in ${table} listener:`, e)
            }
          })
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          this.handleDisconnect(key, table, events, filter)
        }
      })

    this.channels.set(key, channel)
    this.reconnectAttempts.set(key, 0)
  }

  private removeChannel(key: string) {
    const channel = this.channels.get(key)
    if (channel) {
      this.supabase.removeChannel(channel)
    }
    this.channels.delete(key)
    this.reconnectAttempts.delete(key)

    const timer = this.reconnectTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(key)
    }
  }

  private handleDisconnect(key: string, table: TableName, events: EventType[], filter: string) {
    const attempts = this.reconnectAttempts.get(key) || 0
    if (attempts >= this.maxReconnectAttempts) return

    this.reconnectAttempts.set(key, attempts + 1)
    const delay = Math.min(1000 * 2 ** (attempts + 1), 30000)

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(key)
      this.removeChannel(key)
      this.createChannel(key, table, events, filter)
    }, delay)

    this.reconnectTimers.set(key, timer)
  }
}

export const realtimeManager = new RealtimeManager()
