'use client'

import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-[20px] transition-all duration-200', {
  variants: {
    variant: {
      surface: 'bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-700/60',
      glass: 'bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-white/20 dark:border-white/10',
      floating: 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 dark:border-white/15',
    },
    hover: {
      none: '',
      lift: 'hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(15,76,92,0.1)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] cursor-pointer',
      glow: 'hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(20,184,166,0.12)] dark:hover:shadow-[0_8px_40px_rgba(45,212,191,0.08)] cursor-pointer',
    },
  },
  defaultVariants: {
    variant: 'surface',
    hover: 'none',
  },
})

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, variant = 'surface', hover = 'none', className = '', style }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, hover }), className)}
      style={style}
    >
      {children}
    </div>
  )
}
