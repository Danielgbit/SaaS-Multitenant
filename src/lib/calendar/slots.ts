import type { TimeSlot } from '@/types/calendar'

export function categorizeSlots(slots: TimeSlot[]): {
  morning: TimeSlot[]
  afternoon: TimeSlot[]
} {
  const morning: TimeSlot[] = []
  const afternoon: TimeSlot[] = []

  slots.forEach(s => {
    const hour = parseInt(s.start_time.split('T')[1]?.slice(0, 2) || '0', 10)
    if (hour < 13) {
      morning.push(s)
    } else {
      afternoon.push(s)
    }
  })

  return { morning, afternoon }
}
