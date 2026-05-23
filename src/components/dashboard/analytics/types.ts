import { ReactNode } from 'react'

export type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

export interface StatsCardProps {
  title: string
  value: number
  change?: number
  prefix?: string
  suffix?: string
  icon?: ReactNode
  iconColor?: string
  loading: boolean
  sparkline?: number[]
}

export interface TrendChartProps {
  data?: Array<{
    date: string
    label: string
    appointments: number
    completed: number
    revenue: number
  }>
  loading: boolean
}

export interface TopServicesListProps {
  services: Array<{
    serviceId: string
    serviceName: string
    count: number
    percentage: number
    revenue: number
  }>
  loading: boolean
}
