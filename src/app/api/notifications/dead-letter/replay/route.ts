import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { replayDeadLetterNotification } from '@/lib/notifications/admin'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dlqId } = body as { dlqId: string }

    if (!dlqId) {
      return NextResponse.json({ error: 'dlqId required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()
    const result = await replayDeadLetterNotification(supabase, dlqId)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
