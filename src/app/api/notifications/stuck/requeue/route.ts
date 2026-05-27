import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requeueStuckNotification } from '@/lib/notifications/admin'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { queueItemId } = body as { queueItemId: string }

    if (!queueItemId) {
      return NextResponse.json({ error: 'queueItemId required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()
    const result = await requeueStuckNotification(supabase, queueItemId)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
