// Shadow Mode Configuration - Environment-based feature flags

import type { ShadowMode, ShadowCommandType } from './types'

interface ShadowConfig {
  enabled: boolean
  mode: ShadowMode
  flows: Partial<Record<ShadowCommandType, boolean>>
  validationVersion: string
}

function parseFlowsFromEnv(): Partial<Record<ShadowCommandType, boolean>> {
  const flowsEnv = process.env.SHADOW_MODE_FLOWS

  if (!flowsEnv) {
    // Default: all flows enabled if SHADOW_MODE_ENABLED is true
    return {
      'service:complete': true,
      'service:complete_manual': true,
      'payment:confirm': true,
      'appointment:cancel': true,
      'price:adjust': true,
      'appointment:create': true,
      'cron:overdue': true,
      'cron:auto_complete': true,
    }
  }

  const flows = flowsEnv.split(',').map(f => f.trim())
  const allCommands: ShadowCommandType[] = [
    'appointment:create',
    'appointment:reschedule',
    'appointment:cancel',
    'service:complete',
    'service:complete_manual',
    'payment:confirm',
    'price:adjust',
    'cron:overdue',
    'cron:auto_complete',
  ]

  const config: Partial<Record<ShadowCommandType, boolean>> = {}
  for (const cmd of allCommands) {
    config[cmd] = flows.some(f => 
      f === cmd || 
      f === cmd.replace(':', '') || // support both 'service:complete' and 'serviceComplete'
      f === cmd.replace(':', '_')
    )
  }

  return config
}

export const shadowConfig: ShadowConfig = {
  enabled: process.env.SHADOW_MODE_ENABLED === 'true',
  mode: (process.env.SHADOW_MODE as ShadowMode) || 'observe_only',
  flows: parseFlowsFromEnv(),
  validationVersion: 'v0-shadow-phase2a',
}

export function isFlowEnabled(command: ShadowCommandType): boolean {
  if (!shadowConfig.enabled) return false
  return shadowConfig.flows[command] ?? false
}
