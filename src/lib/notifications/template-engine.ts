import { createClient } from '@/lib/supabase/server'
import type { MessageTemplate, TemplateVariable } from '@/types/notifications'

const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
  template: MessageTemplate
  fetchedAt: number
}

const templateCache = new Map<string, CacheEntry>()

function getCacheKey(orgId: string | null, channel: string, type: string): string {
  return `${orgId || 'system'}_${channel}_${type}`
}

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < TEMPLATE_CACHE_TTL_MS
}

export async function renderTemplate(
  templateId: string,
  variables: Record<string, string>
): Promise<{ subject?: string; body: string } | null> {
  const supabase = await createClient()

  const { data: template, error } = await (supabase as any)
    .from('message_templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_active', true)
    .single()

  if (error || !template) {
    return null
  }

  return {
    subject: template.subject || undefined,
    body: replacePlaceholders(template.body, variables),
  }
}

export async function getDefaultTemplate(
  organizationId: string,
  channel: string,
  type: string
): Promise<MessageTemplate | null> {
  const cacheKey = getCacheKey(organizationId, channel, type)
  const cached = templateCache.get(cacheKey)

  if (cached && isCacheValid(cached)) {
    return cached.template
  }

  const supabase = await createClient()

  const { data: customTemplate, error: customError } = await (supabase as any)
    .from('message_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('channel', channel)
    .eq('type', type)
    .eq('is_active', true)
    .single()

  if (!customError && customTemplate) {
    templateCache.set(cacheKey, { template: customTemplate as MessageTemplate, fetchedAt: Date.now() })
    return customTemplate as MessageTemplate
  }

  const { data: defaultTemplate, error: defaultError } = await (supabase as any)
    .from('message_templates')
    .select('*')
    .is('organization_id', null)
    .eq('channel', channel)
    .eq('type', type)
    .eq('is_default', true)
    .eq('is_active', true)
    .single()

  if (defaultError || !defaultTemplate) {
    return null
  }

  templateCache.set(cacheKey, { template: defaultTemplate as MessageTemplate, fetchedAt: Date.now() })
  return defaultTemplate as MessageTemplate
}

export async function getTemplateWithRender(
  organizationId: string,
  channel: string,
  type: string,
  variables: Record<string, string>
): Promise<{ subject?: string; body: string } | null> {
  const template = await getDefaultTemplate(organizationId, channel, type)

  if (!template) {
    return null
  }

  return {
    subject: template.subject || undefined,
    body: replacePlaceholders(template.body, variables),
  }
}

export function replacePlaceholders(
  text: string,
  variables: Record<string, string>
): string {
  let result = text

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(placeholder, value || `{{${key}}}`)
  }

  return result
}

export async function previewTemplate(
  templateId: string,
  sampleVariables: Record<string, string>
): Promise<{ subject?: string; body: string } | null> {
  const supabase = await createClient()

  const { data: template, error } = await (supabase as any)
    .from('message_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error || !template) {
    return null
  }

  return {
    subject: template.subject || undefined,
    body: replacePlaceholders(template.body, sampleVariables),
  }
}

export function extractVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const matches: string[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1])
    }
  }

  return matches
}

export function validateVariables(
  templateVariables: TemplateVariable[],
  providedVariables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const tv of templateVariables) {
    if (tv.required && !providedVariables[tv.name]) {
      missing.push(tv.name)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

export function clearTemplateCache(): void {
  templateCache.clear()
}