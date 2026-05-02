import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const GetNotificationsSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = searchParams.get('limit') || '50'

    const parsed = GetNotificationsSchema.safeParse({ userId, limit })
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

    if (user.id !== parsed.data.userId) {
      return NextResponse.json({ error: 'No tienes permiso.' }, { status: 403 })
    }

    const { data: notifications, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', parsed.data.userId)
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit)

    if (error) {
      console.error('[GET /api/notifications] Error:', error)
      return NextResponse.json({ error: 'Error al obtener notificaciones.' }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (err) {
    console.error('[GET /api/notifications] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}