export type SignalSeverity = 'critical' | 'warning' | 'info' | 'success'

export type DetectorId = 'overloaded-staff' | 'underutilized-staff' | 'pending-confirmations'

export interface OperationalSignal {
  id: string
  detector: DetectorId
  severity: SignalSeverity
  priority: number
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  targetType: 'staff' | 'appointment' | 'org'
  targetId: string
  metric: {
    current: number
    threshold: number
    unit: '%' | 'count'
  }
  isAggregated?: boolean
  count?: number
  children?: string[]
}

export interface DerivedSignals {
  contextualSignals: OperationalSignal[]
  bannerSignals: OperationalSignal[]
}