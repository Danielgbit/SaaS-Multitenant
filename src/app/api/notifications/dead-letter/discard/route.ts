import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

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

    // Mark as discarded
    const { error } = await (supabase as any)
      .from('dead_letter_notifications')
      .update({ replay_status: 'discarded' })
      .eq('id', dlqId)
      .eq('replay_status', 'pending')

    if (error) {
      console.error('[notifications/discard] error:', error)
      return NextResponse.json({ error: 'Failed to discard' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications/discard] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
