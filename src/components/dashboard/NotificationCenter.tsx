'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CheckCheck,
  X
} from 'lucide-react'
import type { Notification, NotificationType } from '@/types/confirmations'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useThemeColors } from '@/hooks/useThemeColors'

type FilterTab = 'all' | 'unread' | 'alerts' | 'reminders'

interface NotificationCenterProps {
  userId: string
  organizationId?: string
  role: string | null
  onOpenConfirmationsPanel?: () => void
}

const TYPE_CONFIG: Record<NotificationType, {
  icon: typeof Bell
  dotColor: string
  bgColor: string
  borderColor: string
}> = {
  reminder: {
    icon: Bell,
    dotColor: '#0EA5E9',
    bgColor: 'rgba(14, 165, 233, 0.08)',
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  service_ready: {
    icon: CheckCircle2,
    dotColor: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  unmarked_alert: {
    icon: AlertTriangle,
    dotColor: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  auto_completed: {
    icon: Clock,
    dotColor: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.08)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  confirmation_sent: {
    icon: CheckCheck,
    dotColor: '#94A3B8',
    bgColor: 'transparent',
    borderColor: 'transparent',
  },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHour < 24) return `hace ${diffHour}h`
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay} días`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function filterNotifications(notifications: Notification[], tab: FilterTab): Notification[] {
  switch (tab) {
    case 'unread':
      return notifications.filter(n => !n.read)
    case 'alerts':
      return notifications.filter(n => ['unmarked_alert', 'auto_completed'].includes(n.type))
    case 'reminders':
      return notifications.filter(n => ['reminder', 'confirmation_sent'].includes(n.type))
    default:
      return notifications
  }
}

function NotificationItem({
  notification,
  onMarkRead,
  onAction,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onAction?: (notification: Notification) => void
}) {
  const config = TYPE_CONFIG[notification.type]
  const Icon = config.icon
  const isUnread = !notification.read

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id)
    }
    if (onAction) {
      onAction(notification)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-3 rounded-xl transition-all duration-150 cursor-pointer
        ${isUnread
          ? 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 opacity-70 hover:opacity-100'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bgColor, border: `1px solid ${config.borderColor}` }}
        >
          <Icon className="w-4 h-4" style={{ color: config.dotColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? '' : 'opacity-40'}`}
              style={{ backgroundColor: config.dotColor }}
            />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {notification.title}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>

          {notification.message && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 pl-4">
              {notification.message}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

export function NotificationCenter({
  userId,
  organizationId,
  role,
  onOpenConfirmationsPanel,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const [oldestUnreadAt, setOldestUnreadAt] = useState<number | null>(null)
  const [position, setPosition] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const COLORS = useThemeColors()

  function getUrgencyLevel(unreadCount: number, oldestUnreadAt: number | null): {
    color: string
    animate: boolean
  } {
    if (unreadCount === 0) {
      return { color: COLORS.error, animate: false }
    }
    if (!oldestUnreadAt) {
      return { color: COLORS.error, animate: false }
    }

    const now = new Date().getTime()
    const diffMin = Math.floor((now - oldestUnreadAt) / 60000)

    if (diffMin < 5) return { color: COLORS.success, animate: false }
    if (diffMin < 15) return { color: COLORS.warning, animate: false }
    if (diffMin < 25) return { color: '#F97316', animate: false }
    return { color: COLORS.error, animate: true }
  }

  const urgency = getUrgencyLevel(unreadCount, oldestUnreadAt)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])

        const unread = data.notifications?.filter((n: Notification) => !n.read) || []
        setUnreadCount(unread.length)

        if (unread.length > 0) {
          const oldest = unread.reduce((a: Notification, b: Notification) =>
            new Date(a.created_at) < new Date(b.created_at) ? a : b
          )
          setOldestUnreadAt(new Date(oldest.created_at).getTime())
        } else {
          setOldestUnreadAt(null)
        }
      }
    } catch (error) {
      console.error('[NotificationCenter] Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      setPosition(buttonRef.current.getBoundingClientRect())
    }
    setIsOpen(!isOpen)
  }

  const handleMarkRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('[NotificationCenter] Error marking read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    if (!userId) return

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        setOldestUnreadAt(null)
      }
    } catch (error) {
      console.error('[NotificationCenter] Error marking all read:', error)
    }
  }

  const handleAction = (notification: Notification) => {
    switch (notification.type) {
      case 'unmarked_alert':
      case 'auto_completed':
        if (onOpenConfirmationsPanel) {
          onOpenConfirmationsPanel()
          setIsOpen(false)
        }
        break
      case 'reminder':
      case 'service_ready':
        if (notification.metadata?.appointment_id) {
          window.location.href = `/calendar?highlight=${notification.metadata.appointment_id}`
          setIsOpen(false)
        }
        break
      default:
        break
    }
  }

  const filteredNotifications = filterNotifications(notifications, activeTab)
  const unreadCountForBadge = unreadCount

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'unread', label: 'No leídas' },
    { key: 'alerts', label: 'Alertas' },
    { key: 'reminders', label: 'Recordatorios' },
  ]

  const button = (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] dark:focus-visible:ring-[#38BDF8]"
      aria-label="Notificaciones"
      aria-expanded={isOpen}
      suppressHydrationWarning
    >
      <Bell className="w-5 h-5" />
      {unreadCountForBadge > 0 && (
        <span
          className={`
            absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
            text-white text-[10px] font-bold flex items-center justify-center
            ${urgency.animate ? 'animate-pulse' : ''}
          `}
          style={{ backgroundColor: urgency.color }}
        >
          {unreadCountForBadge > 9 ? '9+' : unreadCountForBadge}
        </span>
      )}
    </button>
  )

  if (!isOpen) return button

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed z-[9999]"
      style={{
        top: position ? position.bottom + 8 : 0,
        right: position ? window.innerWidth - position.right : 0,
        left: position ? undefined : '50%',
        transform: position ? undefined : 'translateX(-50%)',
      }}
    >
        <div
          className="w-full max-w-[calc(100vw-2rem)] sm:max-w-[384px] max-h-[480px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-900/15 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-slide-down-notif"
        >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Notificaciones
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-3 py-2 border-b border-slate-200/40 dark:border-slate-700/40">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                ${activeTab === tab.key
                  ? 'bg-[#0F4C5C] text-white dark:bg-[#38BDF8] dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[360px] scrollbar-thin">
          {loading ? (
            <div className="p-2 space-y-2">
              <Skeleton variant="text" height="h-4" />
              <Skeleton variant="text" height="h-4" />
              <Skeleton variant="text" height="h-4" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-6 h-6" style={{ color: COLORS.success }} />}
              title="Todo en orden"
              description="No tienes notificaciones pendientes."
            />
          ) : (
            <div className="p-2 space-y-1">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <div className="px-4 py-3 border-t border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={handleMarkAllRead}
              className="w-full py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {button}
      {createPortal(dropdownContent, document.body)}
    </>
  )
}