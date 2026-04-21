'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Clock, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react'
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

interface ReminderBannerProps {
  userId: string
  onOpenAppointment?: (appointmentId: string) => void
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

function getUrgencyStyles(urgency: 'normal' | 'warning' | 'urgent') {
  const configs = {
    normal: {
      border: 'border-l-[#0F4C5C] dark:border-l-[#38BDF8]',
      bg: 'bg-white/80 dark:bg-slate-800/80',
      hoverBg: 'hover:bg-white dark:hover:bg-slate-800',
      textPrimary: 'text-[#0F172A] dark:text-[#F8FAFC]',
      textSecondary: 'text-[#475569] dark:text-[#94A3B8]',
      iconBg: 'bg-[#E6F1F4] dark:bg-[#38BDF8]/10',
      iconColor: 'text-[#0F4C5C] dark:text-[#38BDF8]',
    },
    warning: {
      border: 'border-l-[#D97706]',
      bg: 'bg-amber-50/80 dark:bg-amber-900/20',
      hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/30',
      textPrimary: 'text-amber-900 dark:text-amber-100',
      textSecondary: 'text-amber-700 dark:text-amber-200',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-300',
    },
    urgent: {
      border: 'border-l-[#DC2626]',
      bg: 'bg-red-50/80 dark:bg-red-900/20',
      hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/30',
      textPrimary: 'text-red-900 dark:text-red-100',
      textSecondary: 'text-red-700 dark:text-red-200',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-300',
    },
  }
  return configs[urgency]
}

function ReminderCard({
  reminder,
  onOpenAppointment,
  index,
  hasBeenShown
}: {
  reminder: ReminderNotification
  onOpenAppointment: (id: string) => void
  index: number
  hasBeenShown: boolean
}) {
  const metadata = reminder.metadata as {
    appointment_id?: string
    client_name?: string
    end_time?: string
  }

  const endTime = metadata?.end_time || ''
  const timeInfo = endTime ? getTimeUntilEnd(endTime) : null
  const urgency = timeInfo?.urgency || 'normal'
  const styles = getUrgencyStyles(urgency)

  const handleClick = () => {
    if (metadata.appointment_id) {
      onOpenAppointment(metadata.appointment_id)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!metadata.appointment_id}
      className={`
        w-full text-left p-4 rounded-xl
        ${styles.bg} ${styles.border}
        border-l-4 shadow-sm
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2
        ${metadata.appointment_id ? `cursor-pointer ${styles.hoverBg}` : 'cursor-default'}
        group
        ${hasBeenShown ? 'animate-fadeSlideIn' : ''}
      `}
      style={{
        animationDelay: hasBeenShown ? `${index * 150}ms` : '0ms',
        animationFillMode: 'both',
      }}
      aria-label={`Ver detalles del servicio: ${reminder.title}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${styles.iconBg} flex-shrink-0`}>
          {urgency === 'urgent' ? (
            <AlertTriangle className={`w-4 h-4 ${styles.iconColor}`} />
          ) : (
            <Clock className={`w-4 h-4 ${styles.iconColor}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${styles.textPrimary}`}>
              {reminder.title}
            </span>
            {urgency === 'urgent' && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 text-[10px] font-medium">
                Urgente
              </span>
            )}
          </div>
          <p className={`text-sm ${styles.textSecondary} line-clamp-1`}>
            {reminder.message}
          </p>
          {timeInfo && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className={`w-3.5 h-3.5 ${styles.textSecondary}`} />
              <span className={`text-xs font-medium ${styles.textSecondary}`}>
                {timeInfo.label}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className={`w-4 h-4 ${styles.textSecondary}`} />
        </div>
      </div>
    </button>
  )
}

export function ReminderBanner({ userId, onOpenAppointment }: ReminderBannerProps) {
  const [reminders, setReminders] = useState<ReminderNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)

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
      if (newCount > 0 && !hasAnimatedIn) {
        setHasAnimatedIn(true)
      }
      setReminders(data)
    }
    setLoading(false)
  }, [userId, hasAnimatedIn])

  useEffect(() => {
    fetchReminders()
    const interval = setInterval(fetchReminders, 60000)
    return () => clearInterval(interval)
  }, [fetchReminders])

  const handleDismissAll = () => {
    setDismissed(true)
  }

  const handleViewService = () => {
    const firstReminder = reminders[0]
    const appointmentId = firstReminder?.metadata?.appointment_id as string | undefined
    if (appointmentId && onOpenAppointment) {
      onOpenAppointment(appointmentId)
    }
  }

  if (loading || reminders.length === 0 || dismissed) {
    return null
  }

  return (
    <div
      className="
        w-full rounded-2xl
        backdrop-blur-xl
        bg-white/70 dark:bg-slate-800/70
        border border-[#0F4C5C]/20 dark:border-[#38BDF8]/20
        shadow-lg shadow-[#0F4C5C]/5
        overflow-hidden
        animate-slideInFromTop
      "
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0F4C5C]/10 dark:border-[#38BDF8]/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-1.5 rounded-lg bg-[#E6F1F4] dark:bg-[#38BDF8]/10">
              <Bell className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
            </div>
            {reminders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0F4C5C] dark:bg-[#38BDF8] text-white text-[10px] font-bold flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Recordatorios de hoy
          </span>
        </div>

        <button
          onClick={handleDismissAll}
          className="
            p-1.5 rounded-lg
            text-[#475569] dark:text-[#94A3B8]
            hover:bg-[#0F4C5C]/10 dark:hover:bg-[#38BDF8]/10
            transition-colors duration-200
            cursor-pointer
          "
          aria-label="Cerrar recordatorios"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {reminders.slice(0, 3).map((reminder, index) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onOpenAppointment={onOpenAppointment || (() => {})}
            index={index}
            hasBeenShown={hasAnimatedIn}
          />
        ))}
        {reminders.length > 3 && (
          <p className="text-xs text-center text-[#475569] dark:text-[#94A3B8] py-1">
            +{reminders.length - 3} más. Ve a tu agenda para ver todos.
          </p>
        )}
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={handleViewService}
          disabled={!reminders[0]?.metadata?.appointment_id}
          className="
            w-full py-2.5 px-4 rounded-xl
            bg-[#0F4C5C] dark:bg-[#38BDF8]
            text-white text-sm font-medium
            flex items-center justify-center gap-2
            transition-colors duration-200
            cursor-pointer
            hover:bg-[#0C3E4A] dark:hover:bg-[#0EA5E9]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Sparkles className="w-4 h-4" />
          Ver servicio
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideInFromTop {
          animation: slideInFromTop 300ms ease-out;
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 200ms ease-out forwards;
          opacity: 0;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}} />
    </div>
  )
}