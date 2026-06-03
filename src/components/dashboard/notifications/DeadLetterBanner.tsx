'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'

interface DeadLetterBannerProps {
  count: number
}

export function DeadLetterBanner({ count }: DeadLetterBannerProps) {
  const COLORS = useThemeColors()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-l-4 p-4 shadow-sm"
      style={{
        borderColor: COLORS.border,
        borderLeftColor: COLORS.warning,
        backgroundColor: COLORS.warningLight,
        boxShadow: `0 1px 2px ${COLORS.warning}1A`,
      }}
    >
      <div className="flex items-center gap-4">
        <AlertCircle className="h-6 w-6 shrink-0" style={{ color: COLORS.warning }} />
        <div className="flex items-center gap-4 flex-1">
          <div className="font-mono text-3xl font-bold tracking-tight" style={{ color: COLORS.warning }}>
            {count}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>
              notificación(es) en dead letter
            </p>
            <p className="text-sm mt-0.5" style={{ color: COLORS.textSecondary }}>
              Revisar y decidir si reintentar o descartar.
            </p>
          </div>
        </div>
        <Link
          href="/notificaciones/dead-letter"
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-80 shrink-0"
          style={{
            backgroundColor: COLORS.warningLight,
            color: COLORS.warning,
          }}
        >
          Gestionar
        </Link>
      </div>
    </motion.div>
  )
}
