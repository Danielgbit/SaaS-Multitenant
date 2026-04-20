'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Clock, AlertTriangle, ChevronRight, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { playReminderSound } from '@/lib/sound/notification'
import { toast } from 'sonner'

interface ReminderNotification {
  id: string
  type: string
  title: string
  message: string | null
  metadata: Record<string, unknown>
  created_at: string
  read: boolean
}

interface AppointmentInfo {
  id: string
  client_name: string
  service_name?: string
  start_time: string
  end_time: string
}

function getTimeUntilEnd(endTime: string): { minutes: number; label: string; urgency: 'normal' | 'warning' | 'urgent' } {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const diffMs = end - now
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin <= 0) {
    return { minutes: 0, label: '¡Por terminar!', urgency: 'urgent' }
  } else if (diffMin <= 5) {
    return { minutes: diffMin, label: `${diffMin} min`, urgency: diffMin <= 2 ? 'urgent' : 'warning' }
  } else {
    return { minutes: diffMin, label: `${diffMin} min`, urgency: 'normal' }
  }
}

function ReminderCard({
  reminder,
  onDismiss
}: {
  reminder: ReminderNotification
  onDismiss: (id: string) => void
}) {
  const metadata = reminder.metadata as {
    appointment_id?: string
    client_name?: string
    end_time?: string
  }

  const endTime = metadata?.end_time || ''
  const timeInfo = endTime ? getTimeUntilEnd(endTime) : null

  const urgencyColors = {
    normal: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-900 dark:text-blue-100' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-900 dark:text-amber-100' },
    urgent: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800/40', text: 'text-red-900 dark:text-red-100' },
  }

  const colors = urgencyColors[timeInfo?.urgency || 'normal']

  return (
    <div
      className={`
        relative p-3 rounded-xl border transition-all duration-200
        ${colors.bg} ${colors.border}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {timeInfo?.urgency === 'urgent' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
            <span className={`font-semibold text-sm ${colors.text}`}>
              {reminder.title}
            </span>
          </div>
          <p className={`text-sm ${colors.text} opacity-80`}>
            {reminder.message}
          </p>
          {timeInfo && (
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="w-3 h-3 opacity-60" />
              <span className={`text-xs ${colors.text} opacity-60`}>
                {timeInfo.label}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(reminder.id)}
          className="p-1 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  )
}

interface ReminderBannerProps {
  userId: string
  onOpenAppointment?: (appointmentId: string) => void
}

export function ReminderBanner({ userId, onOpenAppointment }: ReminderBannerProps) {
  const [reminders, setReminders] = useState<ReminderNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [lastCount, setLastCount] = useState(0)

  const fetchReminders = useCallback(async () => {
    const supabase = createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'reminder')
      .eq('read', false)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false })

    if (!error && data) {
      const newCount = data.length
      if (newCount > 0 && newCount > lastCount) {
        playReminderSound()
        const latestReminder = data[0]
        toast.info(latestReminder.message, {
          duration: 8000,
          icon: <Bell className="w-4 h-4" />,
        })
      }
      setReminders(data)
      setLastCount(newCount)
      setDismissed(false)
    }
    setLoading(false)
  }, [userId, lastCount])

  useEffect(() => {
    fetchReminders()
    const interval = setInterval(fetchReminders, 60000)
    return () => clearInterval(interval)
  }, [fetchReminders])

  const handleDismiss = async (notificationId: string) => {
    const supabase = createClient()
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    setReminders(prev => prev.filter(r => r.id !== notificationId))
  }

  if (loading || reminders.length === 0 || dismissed) {
    return null
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-30 animate-in slide-in-from-top duration-300">
      <div
        className={`
          mx-auto max-w-3xl px-4 py-3 rounded-b-2xl
          bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30
          border-b border-l border-r border-blue-200 dark:border-blue-800/40
          shadow-lg
        `}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                {reminders.length}
              </span>
            </div>
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Recordatorios de hoy
            </span>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {reminders.slice(0, 3).map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onDismiss={handleDismiss}
            />
          ))}
          {reminders.length > 3 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
              +{reminders.length - 3} más. Ve a tu agenda para ver todos.
            </p>
          )}
        </div>

        <div className="flex items-center justify-center mt-3">
          <a
            href="/calendar"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Ir a mi agenda
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
