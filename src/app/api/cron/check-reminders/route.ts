import { NextResponse } from 'next/server'
import { runCheckReminders } from '@/actions/cron/runCheckReminders'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()
    const result = await runCheckReminders(supabase)

    if (!result.success) {
      return NextResponse.json({
        message: 'Check reminders failed',
        ...result,
      }, { status: 500 })
    }

    return NextResponse.json({
      message: `Processed: ${result.processed} (reminders: ${result.reminders}, alerts: ${result.alerts}, autoCompleted: ${result.autoCompleted})`,
      ...result,
    })
  } catch (error) {
    console.error('Check reminders cron error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger the check-reminders cron',
    endpoint: '/api/cron/check-reminders',
    schedule: 'Every 3 minutes via cron-job.org',
  })
}
