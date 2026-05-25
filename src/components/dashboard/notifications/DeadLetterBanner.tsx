'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface DeadLetterBannerProps {
  count: number
}

export function DeadLetterBanner({ count }: DeadLetterBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-l-4 p-4 shadow-sm"
      style={{
        borderColor: 'hsl(var(--border))',
        borderLeftColor: 'hsl(var(--warning))',
        backgroundColor: 'hsl(var(--warning) / 0.05)',
        boxShadow: '0 1px 2px hsl(var(--warning) / 0.1)',
      }}
    >
      <div className="flex items-center gap-4">
        <AlertCircle className="h-6 w-6 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
        <div className="flex items-center gap-4 flex-1">
          <div className="font-mono text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--warning))' }}>
            {count}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
              notificación(es) en dead letter
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--text-secondary))' }}>
              Revisar y decidir si reintentar o descartar.
            </p>
          </div>
        </div>
        <Link
          href="/notificaciones/dead-letter"
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-80 shrink-0"
          style={{
            backgroundColor: 'hsl(var(--warning) / 0.1)',
            color: 'hsl(var(--warning))',
          }}
        >
          Gestionar
        </Link>
      </div>
    </motion.div>
  )
}
