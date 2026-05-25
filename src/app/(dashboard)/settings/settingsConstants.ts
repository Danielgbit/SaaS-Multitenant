import { Settings, Building2, Clock, Bell, Database } from 'lucide-react'

export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Madrid', label: 'España (Madrid)' },
  { value: 'Europe/London', label: 'Reino Unido (Londres)' },
  { value: 'America/New_York', label: 'EE.UU. (Nueva York)' },
  { value: 'America/Los_Angeles', label: 'EE.UU. (Los Ángeles)' },
  { value: 'America/Mexico_City', label: 'México' },
  { value: 'America/Bogota', label: 'Colombia' },
  { value: 'America/Buenos_Aires', label: 'Argentina' },
  { value: 'America/Sao_Paulo', label: 'Brasil' },
]

export const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'organization', label: 'Organización', icon: Building2 },
  { id: 'schedule', label: 'Horario', icon: Clock },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'data-retention', label: 'Retención', icon: Database },
]

export interface BookingSettings {
  slot_interval: number
  buffer_minutes: number
  max_days_ahead: number
  min_notice_hours: number
  timezone: string
  online_booking_enabled: boolean
  spa_opening_time: string
  spa_closing_time: string
  auto_retention_days: number
  auto_purge_enabled: boolean
}

export interface OrganizationSettings {
  name: string
  slug: string
}

export const defaultBookingSettings: Required<BookingSettings> = {
  slot_interval: 30,
  buffer_minutes: 0,
  max_days_ahead: 60,
  min_notice_hours: 24,
  timezone: 'Europe/Madrid',
  online_booking_enabled: true,
  spa_opening_time: '09:00',
  spa_closing_time: '20:00',
  auto_retention_days: 90,
  auto_purge_enabled: false,
}
