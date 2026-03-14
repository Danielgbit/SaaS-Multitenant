import { NextResponse } from 'next/server'
import { runDailyReminderScheduler } from '@/actions/whatsapp/runDailyReminderScheduler'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runDailyReminderScheduler()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Scheduler failed',
        ...result,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} appointments`,
      ...result,
    })
  } catch (error) {
    console.error('WhatsApp scheduler error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to trigger the WhatsApp reminder scheduler',
    endpoint: '/api/whatsapp/scheduler',
  })
}
