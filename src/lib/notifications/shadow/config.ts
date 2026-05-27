/**
 * Shadow Notification Configuration
 * Feature flags controlados por variables de entorno
 */

interface ShadowNotifyConfig {
  enabled: boolean
  mode: 'observe_only' | 'dual_write' | 'soft_enforce'
  batchSize: number
  processingTimeoutMinutes: number
  schedulingToleranceSeconds: number
}

import { serverEnv } from '@/lib/env/server'

export function shadowNotifyConfig(): ShadowNotifyConfig {
  const enabled = serverEnv.SHADOW_NOTIFICATION_ENABLED === 'true'
  const mode = (serverEnv.SHADOW_NOTIFICATION_MODE as ShadowNotifyConfig['mode']) || 'observe_only'
  const batchSize = serverEnv.SHADOW_BATCH_SIZE
  const processingTimeoutMinutes = serverEnv.SHADOW_PROCESSING_TIMEOUT_MIN
  const schedulingToleranceSeconds = serverEnv.SHADOW_SCHEDULING_TOLERANCE_SEC

  return {
    enabled,
    mode,
    batchSize,
    processingTimeoutMinutes,
    schedulingToleranceSeconds,
  }
}

export function isShadowNotificationEnabled(): boolean {
  return shadowNotifyConfig().enabled
}

export function getShadowMode(): 'observe_only' | 'dual_write' | 'soft_enforce' {
  return shadowNotifyConfig().mode
}
