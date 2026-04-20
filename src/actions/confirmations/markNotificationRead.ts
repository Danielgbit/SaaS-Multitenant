'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { MarkNotificationReadSchema, type MarkNotificationReadState } from './schemas'

export async function markNotificationRead(
  prevState: MarkNotificationReadState,
  formData: FormData
): Promise<MarkNotificationReadState> {
  const rawData = {
    notificationId: formData.get('notificationId') as string,
  }

  const parsed = MarkNotificationReadSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { notificationId } = parsed.data

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: notification, error: notifError } = await (supabase as any)
    .from('notifications')
    .select('id, user_id, organization_id')
    .eq('id', notificationId)
    .single()

  if (notifError || !notification) {
    return { error: 'Notificación no encontrada.' }
  }

  if (notification.user_id !== user.id) {
    return { error: 'No tienes permiso para marcar esta notificación.' }
  }

  const { error: updateError } = await (supabase as any)
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (updateError) {
    console.error('[markNotificationRead] Update error:', updateError)
    return { error: 'Error al marcar como leída. Intenta de nuevo.' }
  }

  try {
    // @ts-ignore
    revalidateTag(`notifications-${user.id}`)
  } catch (e) {
    console.warn('[markNotificationRead] revalidateTag error:', e)
  }

  return { success: true }
}

export async function markAllNotificationsRead(
  userId: string
): Promise<MarkNotificationReadState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  if (user.id !== userId) {
    return { error: 'No tienes permiso.' }
  }

  const { error: updateError } = await (supabase as any)
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (updateError) {
    console.error('[markAllNotificationsRead] Update error:', updateError)
    return { error: 'Error al marcar como leídas. Intenta de nuevo.' }
  }

  try {
    // @ts-ignore
    revalidateTag(`notifications-${user.id}`)
  } catch (e) {
    console.warn('[markAllNotificationsRead] revalidateTag error:', e)
  }

  return { success: true }
}
