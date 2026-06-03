'use client'

import { useReducedMotion, motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface NotificationsShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

function MotionSection({ children }: { children: ReactNode }) {
  const shouldReduce = useReducedMotion()

  const itemVariants: Variants = {
    hidden: { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.18,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div variants={itemVariants}>
      {children}
    </motion.div>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function NotificationsShell({ title, subtitle, children }: NotificationsShellProps) {
  const COLORS = useThemeColors()
  const shouldReduce = useReducedMotion()

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduce ? 0 : 0.06,
        delayChildren: shouldReduce ? 0 : 0.05,
      },
    },
  }

  return (
    <main className="relative">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(ellipse at center, ${hexToRgba(COLORS.primary, 0.08)} 0%, transparent 70%)`,
          }}
        />
      </div>

      <motion.div
        className="relative space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <MotionSection>
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
              {subtitle}
            </p>
          )}
        </MotionSection>

        {children}
      </motion.div>
    </main>
  )
}

export { MotionSection }
