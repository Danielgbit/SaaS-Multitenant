'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorFallback } from './ErrorFallback'
import { useThemeColors } from '@/hooks/useThemeColors'
import { TrendingUp } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  chartName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChartErrorBoundary]', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const chartName = this.props.chartName || 'Gráfico'
      return (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <ErrorFallback
            title={`${chartName} no disponible`}
            description="No pudimos cargar este gráfico. Puedes intentar nuevamente."
            retry={this.handleRetry}
          />
        </div>
      )
    }

    return this.props.children
  }
}

export function ChartSkeleton() {
  const COLORS = useThemeColors()
  
  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
    </div>
  )
}
