/**
 * Canonical WhatsApp provider resolver.
 *
 * Reads only from notification_providers.
 * No legacy fallback.
 *
 * TODO post-MVP:
 * Add DB uniqueness constraint:
 * UNIQUE (organization_id, channel) WHERE enabled = true
 */

import { createClient } from '@/lib/supabase/server'

type ProviderConfig = Record<string, unknown>

export type WhatsappProviderConfig = {
  organizationId: string
  provider: string
  webhookUrl?: string
  apiKey?: string
  config: ProviderConfig
  source: 'notification_providers'
}

type NotificationProviderRow = {
  organization_id: string
  channel: string
  provider: string | null
  is_enabled: boolean | null
  config: ProviderConfig | null
  created_at: string
}

export async function getWhatsappProvider(
  organizationId: string
): Promise<WhatsappProviderConfig | null> {
  if (!organizationId) {
    console.error('[WhatsApp] Missing organizationId')
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_providers')
    .select('organization_id, channel, provider, is_enabled, config, created_at')
    .eq('organization_id', organizationId)
    .eq('channel', 'whatsapp')
    .eq('is_enabled', true)
    .order('created_at', { ascending: false })
    .limit(2)

  if (error) {
    console.error('[WhatsApp] Failed to fetch provider', {
      organizationId,
      error,
    })
    return null
  }

  const row = data?.[0]

  if (!row) {
    console.error('[WhatsApp] Provider missing', { organizationId })
    return null
  }

  if (data && data.length > 1) {
    console.error('[WhatsApp] Multiple active providers found', {
      organizationId,
      count: data.length,
    })
  }

  if (!row.provider) {
    console.error('[WhatsApp] Provider field is null', { organizationId })
    return null
  }

  const config = (row.config ?? {}) as ProviderConfig

  return {
    organizationId: row.organization_id,
    provider: row.provider,
    webhookUrl:
      typeof config.webhook_url === 'string'
        ? config.webhook_url
        : undefined,
    apiKey:
      typeof config.api_key === 'string'
        ? config.api_key
        : undefined,
    config,
    source: 'notification_providers',
  }
}

export async function getWhatsappProviderOrgs(): Promise<
  WhatsappProviderConfig[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_providers')
    .select('organization_id, channel, provider, is_enabled, config, created_at')
    .eq('channel', 'whatsapp')
    .eq('is_enabled', true)
    .order('organization_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[WhatsApp] Failed to fetch providers', { error })
    return []
  }

  const rows = (data ?? []) as NotificationProviderRow[]
  const deduped = new Map<string, WhatsappProviderConfig>()

  for (const row of rows) {
    if (deduped.has(row.organization_id)) continue

    if (!row.provider) {
      console.error('[WhatsApp] Skipping org with null provider', {
        organizationId: row.organization_id,
      })
      continue
    }

    const config = (row.config ?? {}) as ProviderConfig

    deduped.set(row.organization_id, {
      organizationId: row.organization_id,
      provider: row.provider,
      webhookUrl:
        typeof config.webhook_url === 'string'
          ? config.webhook_url
          : undefined,
      apiKey:
        typeof config.api_key === 'string'
          ? config.api_key
          : undefined,
      config,
      source: 'notification_providers',
    })
  }

  return [...deduped.values()]
}
