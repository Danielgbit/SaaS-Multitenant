'use client'

import { motion } from 'framer-motion'

interface SystemStatusStripProps {
  queueHealth: 'healthy' | 'warning' | 'degraded'
  workerCount?: number
  lastEventSecondsAgo?: number
  isAutoRefreshing?: boolean
}

const statusConfig = {
  healthy: {
    color: 'bg-green-500',
    label: 'Queue healthy',
  },
  warning: {
    color: 'bg-yellow-500',
    label: 'Queue warning',
  },
  degraded: {
    color: 'bg-red-500',
    label: 'Queue degraded',
  },
}

export function SystemStatusStrip({
  queueHealth = 'healthy',
  workerCount,
  lastEventSecondsAgo = 0,
  isAutoRefreshing = false,
}: SystemStatusStripProps) {
  const status = statusConfig[queueHealth]

  const formatLastEvent = (seconds: number) => {
    if (seconds < 1) return 'ahora'
    if (seconds < 60) return `hace ${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `hace ${minutes}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="h-8 rounded-lg bg-muted/30 px-3 flex items-center gap-3 text-xs font-mono text-muted-foreground"
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className={`w-2 h-2 rounded-full ${status.color}`}
        />
        <span>{status.label}</span>
      </div>

      {workerCount !== undefined && workerCount > 0 && (
        <>
          <span className="text-border">│</span>
          <span>{workerCount} workers</span>
        </>
      )}

      <span className="text-border">│</span>

      <span>Last event {formatLastEvent(lastEventSecondsAgo)}</span>

      {isAutoRefreshing && (
        <>
          <span className="text-border">│</span>
          <span className="flex items-center gap-1">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              ↻
            </motion.span>
            Auto-refresh
          </span>
        </>
      )}
    </motion.div>
  )
}
