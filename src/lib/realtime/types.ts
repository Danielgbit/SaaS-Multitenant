import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type TableName = 'appointments' | 'notifications'
export type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface ChannelConfig {
  table: TableName
  events: EventType[]
  filter?: string
}

export interface RealtimeEvent {
  table: TableName
  eventType: EventType
  payload: RealtimePostgresChangesPayload<any>
}

export type RealtimeCallback = (event: RealtimeEvent) => void
export type CleanupFn = () => void
