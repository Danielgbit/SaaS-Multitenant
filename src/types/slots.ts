export interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
  blockedReason?: string
}
