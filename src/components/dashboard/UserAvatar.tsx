'use client'

import { User } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface UserAvatarProps {
  name?: string | null
  email?: string | null
  className?: string
}

export function UserAvatar({ name, email, className = '' }: UserAvatarProps) {
  const COLORS = useThemeColors()
  const initials = getInitials(name || email)

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border border-white/20 ${className}`}
      style={{ background: COLORS.primaryGradient }}
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <User className="w-4 h-4" />
      )}
    </div>
  )
}

function getInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return ''
  
  const parts = nameOrEmail.split(' ').filter(Boolean)
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  
  const name = nameOrEmail.split('@')[0]
  return name.charAt(0).toUpperCase()
}
