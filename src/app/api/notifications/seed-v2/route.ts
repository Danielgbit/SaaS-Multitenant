import { NextResponse } from 'next/server'
import { seedNotificationV2ForOrg, seedNotificationV2ForAllOrgs } from '@/actions/notifications/seedV2'
import { serverEnv } from '@/lib/env/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = serverEnv.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const organizationId = body.organizationId as string | undefined

    const result = organizationId
      ? await seedNotificationV2ForOrg(organizationId)
      : await seedNotificationV2ForAllOrgs()

    return NextResponse.json(result)
  } catch (error) {
    console.error('[seed-v2] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
