import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { searchMessages } from '@/lib/notifications/inspector'
import type { NotificationChannel } from '@/types/notifications'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('orgId')
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!organizationId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    }

    const result = await searchMessages(
      organizationId,
      q,
      {
        status: status || undefined,
        channel: (channel as NotificationChannel) || undefined,
      },
      { limit, offset }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/notifications/messages]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
