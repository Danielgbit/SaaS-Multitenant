import type {
  NotificationChannelAdapter,
  NotificationMessage,
  SendResult,
} from './types'
import type { NotificationChannel, NotificationProviderType } from '@/types/notifications'
import { createClient } from '@/lib/supabase/server'
import { getRequestId } from '@/lib/request-context'

export class InAppChannel implements NotificationChannelAdapter {
  private organizationId: string
  private userId?: string

  constructor(config: Record<string, unknown>) {
    this.organizationId = String(config.organizationId || '')
    this.userId = config.userId ? String(config.userId) : undefined
  }

  async send(message: NotificationMessage): Promise<SendResult> {
    if (!this.userId) {
      return { success: false, error: 'In-app notification requires userId', retryable: false }
    }

    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('notifications')
      .insert({
        organization_id: this.organizationId,
        user_id: this.userId,
        type: (message.metadata?.notificationType as string) || 'reminder',
        title: (message.metadata?.title as string) || 'Notificación',
        message: message.body,
        metadata: {
          trace_id: message.metadata?.traceId || getRequestId(),
          appointment_id: message.appointmentId,
          channel: 'in_app',
          ...message.metadata,
        },
      })

    if (error) {
      return { success: false, error: error.message, retryable: true }
    }

    return { success: true }
  }

  getProviderName(): NotificationProviderType {
    return 'internal'
  }

  getChannel(): NotificationChannel {
    return 'in_app'
  }
}