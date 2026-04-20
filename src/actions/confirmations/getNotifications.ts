'use server'

import { createClient } from '@/lib/supabase/server'
import { GetNotificationsSchema } from './schemas'
import type { Notification } from '@/types/confirmations'

export async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<Notification[]> {
  const parsed = GetNotificationsSchema.safeParse({
    userId,
    unreadOnly: options?.unreadOnly ?? false,
    limit: options?.limit ?? 50,
  })

  if (!parsed.success) {
    console.error('[getNotifications] Invalid input:', parsed.error)
    return []
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  if (user.id !== userId) {
    return []
  }

  let query = (supabase as any)
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit)

  if (parsed.data.unreadOnly) {
    query = query.eq('read', false)
  }

  const { data: notifications, error } = await query

  if (error) {
    console.error('[getNotifications] Error:', error)
    return []
  }

  return (notifications as Notification[]) || []
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return 0
  }

  if (user.id !== userId) {
    return 0
  }

  const { count, error } = await (supabase as any)
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('[getUnreadNotificationCount] Error:', error)
    return 0
  }

  return count || 0
}
