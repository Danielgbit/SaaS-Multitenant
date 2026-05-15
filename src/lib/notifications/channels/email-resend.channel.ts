import type {
  NotificationChannelAdapter,
  NotificationMessage,
  SendResult,
} from './types'
import type { NotificationChannel, NotificationProviderType } from '@/types/notifications'
import { sendEmail, EMAIL_FROM } from '@/lib/resend'

export class ResendEmailChannel implements NotificationChannelAdapter {
  private fromEmail: string

  constructor(config: Record<string, unknown>) {
    this.fromEmail = config.from_email ? String(config.from_email) : EMAIL_FROM
  }

  async send(message: NotificationMessage): Promise<SendResult> {
    if (!message.subject) {
      return { success: false, error: 'Email sin subject', retryable: false }
    }

    if (!message.toAddress || !message.toAddress.includes('@')) {
      return { success: false, error: 'Email inválido', retryable: false }
    }

    const result = await sendEmail({
      to: message.toAddress,
      subject: message.subject,
      html: message.body,
    })

    if (!result.success) {
      const errorStr = String(result.error || 'Unknown error')
      const isRetryable = !errorStr.includes('invalid') && !errorStr.includes('Invalid')
      return {
        success: false,
        error: errorStr,
        retryable: isRetryable,
      }
    }

    return {
      success: true,
      providerMessageId: (result.data as any)?.id as string | undefined,
      rawResponse: result.data,
    }
  }

  getProviderName(): NotificationProviderType {
    return 'resend'
  }

  getChannel(): NotificationChannel {
    return 'email'
  }
}