import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const MarkReadSchema = z.object({
  notificationId: z.string().uuid('ID de notificación inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = MarkReadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const { data: notification, error: notifError } = await (supabase as any)
      .from('notifications')
      .select('id, user_id')
      .eq('id', parsed.data.notificationId)
      .single()

    if (notifError || !notification) {
      return NextResponse.json({ error: 'Notificación no encontrada.' }, { status: 404 })
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso.' }, { status: 403 })
    }

    const { error: updateError } = await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', parsed.data.notificationId)

    if (updateError) {
      console.error('[POST /api/notifications/mark-read] Update error:', updateError)
      return NextResponse.json({ error: 'Error al marcar como leída.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/notifications/mark-read] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}