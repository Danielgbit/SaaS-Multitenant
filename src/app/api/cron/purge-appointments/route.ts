import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'edge'

async function runPurgeForOrganization(
  supabase: any,
  organizationId: string,
  olderThanDays: number
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const { data: deleted, error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .eq('organization_id', organizationId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .is('invoice_id', null)
    .lt('end_time', cutoffDate.toISOString())
    .select('id')

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  return { success: true, deletedCount: (deleted || []).length }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()

    const { data: organizations, error: orgError } = await supabase
      .from('booking_settings')
      .select('organization_id, auto_retention_days, auto_purge_enabled')
      .eq('auto_purge_enabled', true)

    if (orgError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch organizations with auto-purge enabled',
      }, { status: 500 })
    }

    const results: Array<{
      organization_id: string
      success: boolean
      deletedCount?: number
      error?: string
    }> = []

    for (const org of organizations || []) {
      const result = await runPurgeForOrganization(
        supabase,
        org.organization_id,
        org.auto_retention_days || 90
      )
      results.push({
        organization_id: org.organization_id,
        ...result,
      })
    }

    const totalDeleted = results.reduce(
      (sum, r) => sum + (r.success ? (r.deletedCount || 0) : 0),
      0
    )

    return NextResponse.json({
      success: true,
      processed: organizations?.length || 0,
      totalDeleted,
      results,
    })
  } catch (error) {
    console.error('Purge appointments cron error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger the purge-appointments cron',
    endpoint: '/api/cron/purge-appointments',
    schedule: 'Once daily via cron-job.org (recommended: 2-3 AM)',
    note: 'Only organizations with auto_purge_enabled = true will be processed',
  })
}
