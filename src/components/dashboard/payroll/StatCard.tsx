'use client'

import Link from 'next/link'
import { useThemeColors } from '@/hooks/useThemeColors'

interface StatCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  bgColor: string
  href?: string
  cta?: string
}

export function StatCard({ label, value, icon: Icon, color, bgColor, href, cta }: StatCardProps) {
  const colors = useThemeColors()

  const cardContent = (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: bgColor }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-medium truncate" style={{ color: colors.textMuted }}>
          {label}
        </span>
      </div>
      <p className="text-lg md:text-xl font-bold leading-tight" style={{ color }}>
        {value}
      </p>
      {href && cta && (
        <p className="text-xs mt-1.5 group-hover:underline" style={{ color: colors.textMuted }}>
          {cta} →
        </p>
      )}
    </>
  )

  return (
    <>
      {href ? (
        <Link
          href={href}
          className="group p-4 md:p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border,
            cursor: 'pointer',
          }}
        >
          {cardContent}
        </Link>
      ) : (
        <div
          className="group p-4 md:p-5 rounded-2xl border transition-all duration-200"
          style={{
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border,
            cursor: 'default',
          }}
          role="region"
          aria-label={label}
        >
          {cardContent}
        </div>
      )}
    </>
  )
}