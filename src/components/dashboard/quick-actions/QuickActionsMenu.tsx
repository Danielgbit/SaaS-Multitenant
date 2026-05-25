'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface QuickAction {
  label: string
  icon: ReactNode
  onClick?: () => void
  href?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

interface QuickActionsMenuProps {
  actions: QuickAction[]
}

export function QuickActionsMenu({ actions }: QuickActionsMenuProps) {
  return (
    <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
      {actions.map((action) => (
        <QuickActionButton key={action.label} action={action} />
      ))}
    </div>
  )
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const baseClass = 'w-8 h-8 rounded-lg flex items-center justify-center transition-colors'

  const variantClass = {
    default: 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400',
    success: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    warning: 'hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    danger: 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400',
  }[action.variant || 'default']

  if (action.href) {
    return (
      <a
        href={action.href}
        className={`${baseClass} ${variantClass}`}
        title={action.label}
        target={action.href.startsWith('http') ? '_blank' : undefined}
        rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {action.icon}
      </a>
    )
  }

  return (
    <button
      onClick={action.onClick}
      className={`${baseClass} ${variantClass}`}
      title={action.label}
      type="button"
    >
      {action.icon}
    </button>
  )
}
