'use client'

import { MetricCard } from '@/components/ui/MetricCard'
import type { StatsCardProps } from './types'

export function StatsCard({ title, value, change, prefix, suffix, icon, iconColor, loading }: StatsCardProps) {
  return (
    <MetricCard
      title={title}
      value={value}
      prefix={prefix}
      suffix={suffix}
      icon={icon}
      iconColor={iconColor}
      change={change}
      trendLabel="vs período anterior"
      loading={loading}
    />
  )
}
