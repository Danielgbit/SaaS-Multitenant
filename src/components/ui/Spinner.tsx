'use client'

import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className = '', style }: SpinnerProps) {
  return <Loader2 className={`animate-spin ${sizeMap[size]} ${className}`} style={style} />
}
