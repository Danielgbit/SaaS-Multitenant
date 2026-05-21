import { logger } from '@/lib/notifications/logger'
import type { SendResult, QueueItemStatus } from '@/types/notifications'
import type { WhatsAppProvider, ParsedWebhook, WhatsAppSendParams } from './types'

export class MockProvider implements WhatsAppProvider {
  readonly name = 'mock'

  constructor(_config: Record<string, unknown>) {}

  async sendMessage(params: WhatsAppSendParams): Promise<SendResult> {
    const payload = {
      endpoint: 'mock://whatsapp/send',
      timestamp: new Date().toISOString(),
      to: params.to,
      text: params.body,
      variables: params.variables,
      appointmentId: params.appointmentId,
      traceId: params.traceId,
      metadata: { mock: true },
    }

    logger.debug('MockProvider sendMessage', {
      to: params.to,
      bodyLength: params.body?.length,
      appointmentId: params.appointmentId,
      traceId: params.traceId,
    })

    if (params.to.includes('999')) {
      return { success: false, retryable: true, error: 'Mock: simulated failure' }
    }

    return {
      success: true,
      providerMessageId: `mock_${Date.now()}`,
      mock: true,
      mockPayload: payload,
    }
  }

  async validateWebhook(_request: Request, _body: string): Promise<boolean> {
    return true
  }

  parseWebhook(payload: Record<string, unknown>): ParsedWebhook {
    return {
      providerMessageId: `mock_${Date.now()}`,
      status: 'delivered',
      fromPhone: '573000000000',
      text: typeof payload.text === 'string' ? payload.text : 'confirmar',
      timestamp: new Date().toISOString(),
      rawPayload: payload,
    }
  }

  normalizeDeliveryStatus(_providerStatus: string): { status: QueueItemStatus; retryable: boolean } {
    return { status: 'delivered', retryable: false }
  }
}
