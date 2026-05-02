import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const MarkAllReadSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = MarkAllReadSchema.safeParse(body)
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

    const { error: updateError } = await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('user_id', parsed.data.userId)
      .eq('read', false)

    if (updateError) {
      console.error('[POST /api/notifications/mark-all-read] Update error:', updateError)
      return NextResponse.json({ error: 'Error al marcar como leídas.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/notifications/mark-all-read] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}