'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/notifications/logger'

interface SeedResult {
  success: boolean
  providersCreated: number
  providersSkipped: number
  rulesCreated: number
  errors: string[]
}

export async function seedNotificationV2ForOrg(
  organizationId: string
): Promise<SeedResult> {
  const supabase = await createClient()
  const errors: string[] = []
  let providersCreated = 0
  let providersSkipped = 0
  let rulesCreated = 0

  try {
    const { data: existingProviders } = await supabase
      .from('notification_providers')
      .select('channel, provider')
      .eq('organization_id', organizationId)

    const hasWhatsAppProvider = existingProviders?.some(
      (p: any) => p.channel === 'whatsapp' && p.provider === 'n8n'
    )

    if (!hasWhatsAppProvider) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('config')
        .eq('organization_id', organizationId)
        .eq('type', 'whatsapp')
        .single()

      if (integration && (integration.config as Record<string, unknown>)?.webhook_url) {
        const config = integration.config as Record<string, unknown>
        const { error: insertError } = await supabase
          .from('notification_providers')
          .insert({
            organization_id: organizationId,
            channel: 'whatsapp',
            provider: 'n8n',
            is_enabled: true,
            config: {
              webhook_url: config.webhook_url,
              api_key: config.api_key || '',
            } as any,
            rate_limit_per_min: 30,
          })

        if (insertError) {
          if (insertError.code === '23505') {
            providersSkipped++
          } else {
            errors.push(`Provider insert error: ${insertError.message}`)
          }
        } else {
          providersCreated++
        }
      }
    } else {
      providersSkipped++
    }

    const { data: existingRules } = await supabase
      .from('automation_rules')
      .select('trigger_event')
      .eq('organization_id', organizationId)
      .eq('is_enabled', true)

    const existingTriggers = new Set(
      (existingRules || []).map((r: any) => r.trigger_event)
    )

    const defaultTriggers = [
      { trigger_event: 'appointment_created', channel: 'whatsapp', delay_minutes: 0 },
      { trigger_event: 'appointment_reminder', channel: 'whatsapp', delay_minutes: 1440 },
      { trigger_event: 'appointment_cancelled', channel: 'whatsapp', delay_minutes: 0 },
      { trigger_event: 'appointment_completed', channel: 'whatsapp', delay_minutes: 0 },
      { trigger_event: 'confirmation_requested', channel: 'whatsapp', delay_minutes: 0 },
    ]

    for (const trigger of defaultTriggers) {
      if (existingTriggers.has(trigger.trigger_event)) continue

      const { error: ruleError } = await supabase
        .from('automation_rules')
        .insert({
          organization_id: organizationId,
          trigger_event: trigger.trigger_event,
          channel: trigger.channel,
          delay_minutes: trigger.delay_minutes,
          is_enabled: true,
        })

      if (ruleError) {
        errors.push(`Rule insert error (${trigger.trigger_event}): ${ruleError.message}`)
      } else {
        rulesCreated++
      }
    }

    logger.info('seed_v2_completed', {
      organizationId,
      providersCreated,
      providersSkipped,
      rulesCreated,
    })

    return { success: true, providersCreated, providersSkipped, rulesCreated, errors }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    logger.error('seed_v2_failed', { organizationId, error })
    return { success: false, providersCreated, providersSkipped, rulesCreated, errors: [error] }
  }
}

export async function seedNotificationV2ForAllOrgs(): Promise<{
  total: number
  success: number
  failed: number
  results: SeedResult[]
}> {
  const supabase = await createClient()
  const results: SeedResult[] = []

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')

  if (!orgs) {
    return { total: 0, success: 0, failed: 0, results: [] }
  }

  for (const org of orgs) {
    const result = await seedNotificationV2ForOrg(org.id)
    results.push(result)
  }

  const success = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return { total: orgs.length, success, failed, results }
}
