'use client'

import { motion } from 'framer-motion'
import { Clock, Loader, CheckCircle, XCircle, Skull } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface QueueHealthCardsProps {
  queue: {
    pending: number
    processing: number
    sent: number
    failed: number
    failed_permanently: number
  }
  deadLetters: number
}

const cardConfig = [
  {
    id: 'pending',
    label: 'Pendientes',
    icon: Clock,
    colorKey: 'primary',
    showPulse: false,
  },
  {
    id: 'processing',
    label: 'Procesando',
    icon: Loader,
    colorKey: 'warning',
    showPulse: true,
  },
  {
    id: 'sent',
    label: 'Enviados',
    icon: CheckCircle,
    colorKey: 'success',
    showPulse: false,
  },
  {
    id: 'failed',
    label: 'Fallidos',
    icon: XCircle,
    colorKey: 'error',
    showPulse: true,
  },
  {
    id: 'deadLetters',
    label: 'Dead Letters',
    icon: Skull,
    colorKey: 'amber',
    showPulse: true,
  },
]

export function QueueHealthCards({ queue, deadLetters }: QueueHealthCardsProps) {
  const COLORS = useThemeColors()

  const getValue = (id: string) => {
    switch (id) {
      case 'pending':
        return queue.pending
      case 'processing':
        return queue.processing
      case 'sent':
        return queue.sent
      case 'failed':
        return queue.failed + queue.failed_permanently
      case 'deadLetters':
        return deadLetters
      default:
        return 0
    }
  }

  const getColorValue = (key: string) => {
    const colorMap: Record<string, string> = {
      primary: COLORS.primary,
      warning: COLORS.warning,
      success: COLORS.success,
      error: COLORS.error,
      amber: COLORS.amber,
    }
    return colorMap[key] || COLORS.textMuted
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cardConfig.map((card, index) => {
        const value = getValue(card.id)
        const color = getColorValue(card.colorKey)
        const Icon = card.icon

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -1 }}
            transition={{
              delay: index * 0.06,
              duration: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-xl border bg-background/70 backdrop-blur-[6px] p-4 transition-all duration-[180ms] ease-[0.22,1,0.36,1] hover:shadow-md"
            style={{
              borderColor: `${color}20`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
            </div>

            <div
              className="font-mono text-4xl font-bold tracking-tight"
              style={{ color: COLORS.textPrimary }}
            >
              {value.toLocaleString()}
            </div>

            {card.showPulse && value > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-caption font-mono text-muted-foreground">
                  {value} activos
                </span>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
