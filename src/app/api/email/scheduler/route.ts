import { NextResponse } from 'next/server'
import { runEmailReminderScheduler } from '@/actions/email/runEmailReminderScheduler'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runEmailReminderScheduler()

    if (!result.success) {
      return NextResponse.json({
        message: 'Scheduler failed',
        ...result,
      }, { status: 500 })
    }

    return NextResponse.json({
      message: `Processed ${result.processed} appointments`,
      ...result,
    })
  } catch (error) {
    console.error('Email scheduler error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to trigger the Email reminder scheduler',
    endpoint: '/api/email/scheduler',
  })
}
