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

export function shadowNotifyConfig(): ShadowNotifyConfig {
  const enabled = process.env.SHADOW_NOTIFICATION_ENABLED === 'true'
  const mode = (process.env.SHADOW_NOTIFICATION_MODE as ShadowNotifyConfig['mode']) || 'observe_only'
  const batchSize = parseInt(process.env.SHADOW_BATCH_SIZE || '20', 10)
  const processingTimeoutMinutes = parseInt(process.env.SHADOW_PROCESSING_TIMEOUT_MIN || '5', 10)
  const schedulingToleranceSeconds = parseInt(process.env.SHADOW_SCHEDULING_TOLERANCE_SEC || '60', 10)

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
