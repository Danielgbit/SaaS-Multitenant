import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getMessageInspectorData } from '@/lib/notifications/inspector'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const { data: message } = await (supabase as any)
      .from('notification_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const organizationId = message.organization_id
    const inspectorData = await getMessageInspectorData(id, organizationId)

    return NextResponse.json(inspectorData)
  } catch (error) {
    console.error('[GET /api/notifications/messages/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
