export const notificationKeys = {
  all: ['notifications'] as const,

  list: (userId: string) =>
    [...notificationKeys.all, 'list', userId] as const,

  unreadCount: (userId: string) =>
    [...notificationKeys.all, 'unread', userId] as const,

  alerts: (orgId: string) =>
    [...notificationKeys.all, 'alerts', orgId] as const,

  confirmations: (orgId: string) =>
    [...notificationKeys.all, 'confirmations', orgId] as const,
} as const
