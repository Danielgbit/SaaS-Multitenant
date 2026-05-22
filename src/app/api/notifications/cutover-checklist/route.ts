import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const [providerResult, templateResult, ruleResult, settingsResult] = await Promise.all([
      (supabase as any)
        .from('notification_providers')
        .select('id, channel, provider, is_enabled')
        .eq('organization_id', organizationId)
        .eq('is_enabled', true),
      (supabase as any)
        .from('message_templates')
        .select('id, channel, type, is_active')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_active', true),
      (supabase as any)
        .from('automation_rules')
        .select('id, trigger_event, channel, is_enabled')
        .eq('organization_id', organizationId)
        .eq('is_enabled', true),
      (supabase as any)
        .from('booking_settings')
        .select('use_notification_v2')
        .eq('organization_id', organizationId)
        .single(),
    ])

    const providers = providerResult?.data || []
    const templates = templateResult?.data || []
    const rules = ruleResult?.data || []
    const v2Enabled = (settingsResult?.data as any)?.use_notification_v2 === true

    const expectedTriggers = [
      'appointment_created',
      'appointment_reminder',
      'appointment_cancelled',
      'appointment_completed',
    ]

    const missingTriggers = expectedTriggers.filter(
      (t) => !rules.some((r: any) => r.trigger_event === t)
    )

    const checklist = {
      provider_configured: providers.length > 0,
      provider_details: providers.map((p: any) => ({ channel: p.channel, provider: p.provider })),
      templates_available: templates.length > 0,
      template_count: templates.length,
      automation_rules_configured: rules.length > 0,
      rule_count: rules.length,
      missing_triggers: missingTriggers,
      v2_flag_enabled: v2Enabled,
    }

    const ready = checklist.provider_configured &&
      checklist.templates_available &&
      checklist.automation_rules_configured &&
      missingTriggers.length === 0

    return NextResponse.json({
      ready,
      checklist,
      recommendation: ready
        ? '✅ Listo para activar V2. Ejecuta POST /api/notifications/seed-v2 para asegurar providers + rules.'
        : '❌ Faltan requisitos. Revisa checklist.',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
