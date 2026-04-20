'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, ChevronRight, AlertTriangle, Clock, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { playServiceReadySound } from '@/lib/sound/notification'
import { toast } from 'sonner'

interface PendingConfirmation {
  id: string
  clients?: { name: string }
  employees?: { name: string }
  start_time: string
  completed_at: string | null
  confirmation_status: string
  price_adjustment: number
  notes: string | null
}

function getUrgencyLevel(completedAt: string | null): {
  level: 'normal' | 'warning' | 'urgent' | 'critical'
  color: string
  bgColor: string
  label: string
} {
  if (!completedAt) {
    return { level: 'normal', color: '#22C55E', bgColor: '#22C55E/10', label: 'Reciente' }
  }

  const now = new Date().getTime()
  const completed = new Date(completedAt).getTime()
  const diffMin = Math.floor((now - completed) / 60000)

  if (diffMin < 15) {
    return { level: 'normal', color: '#22C55E', bgColor: '#22C55E/10', label: `${diffMin} min` }
  } else if (diffMin < 25) {
    return { level: 'warning', color: '#EAB308', bgColor: '#EAB308/10', label: `${diffMin} min` }
  } else if (diffMin < 40) {
    return { level: 'urgent', color: '#F97316', bgColor: '#F97316/10', label: `${diffMin} min` }
  } else {
    return { level: 'critical', color: '#EF4444', bgColor: '#EF4444/10', label: `${diffMin} min` }
  }
}

function TimeBadge({ completedAt }: { completedAt: string | null }) {
  const urgency = getUrgencyLevel(completedAt)

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${urgency.level === 'critical' ? 'animate-pulse' : ''}
      `}
      style={{
        backgroundColor: urgency.bgColor,
        color: urgency.color,
      }}
    >
      <Clock className="w-3 h-3" />
      {urgency.label}
      {urgency.level === 'urgent' && <AlertTriangle className="w-3 h-3" />}
      {urgency.level === 'critical' && <AlertTriangle className="w-3 h-3" />}
    </span>
  )
}

interface ConfirmBannerProps {
  organizationId: string
  onOpenPanel: () => void
}

export function ConfirmBanner({ organizationId, onOpenPanel }: ConfirmBannerProps) {
  const [pending, setPending] = useState<PendingConfirmation[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [lastCount, setLastCount] = useState(0)

  const fetchPending = useCallback(async () => {
    const supabase = createClient()

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        start_time,
        completed_at,
        confirmation_status,
        price_adjustment,
        notes,
        clients!clients_id(name),
        employees!employees_id(name)
      `)
      .eq('organization_id', organizationId)
      .in('confirmation_status', ['completed', 'needs_review'])
      .order('completed_at', { ascending: true })

    if (!error && data) {
      const newCount = data.length
      if (newCount > 0 && newCount > lastCount) {
        playServiceReadySound()
        toast.warning(
          `${newCount} servicio${newCount > 1 ? 's' : ''} pendiente${newCount > 1 ? 's' : ''} de cobro`,
          {
            duration: 10000,
            action: {
              label: 'Ir a Cobrar',
              onClick: onOpenPanel,
            },
          }
        )
      }
      setPending(data)
      setLastCount(newCount)
      setDismissed(false)
    }
    setLoading(false)
  }, [organizationId, lastCount, onOpenPanel])

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 60000)
    return () => clearInterval(interval)
  }, [fetchPending])

  if (loading || pending.length === 0 || dismissed) {
    return null
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-30 animate-in slide-in-from-top duration-300">
      <div
        className={`
          mx-auto max-w-3xl mx-auto px-4 py-3 rounded-b-2xl
          bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30
          border-b border-l border-r border-amber-200 dark:border-amber-800/40
          shadow-lg
        `}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pending.length > 9 ? '9+' : pending.length}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {pending.length} servicio{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''} de cobro
                </span>

                {pending.length <= 3 ? (
                  pending.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300"
                    >
                      <span className="font-medium">{p.clients?.name || 'Cliente'}</span>
                      <TimeBadge completedAt={p.completed_at} />
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {pending.slice(0, 2).map((p) => p.clients?.name || 'Cliente').join(', ')}...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onOpenPanel}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-amber-600 hover:bg-amber-700 text-white
                transition-colors
              `}
            >
              Ver Panel
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              aria-label="Minimizar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
