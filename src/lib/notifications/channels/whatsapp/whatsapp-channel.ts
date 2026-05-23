import type { NotificationChannelAdapter, NotificationMessage, SendResult } from '../types'
import type { NotificationChannel, NotificationProviderType } from '@/types/notifications'
import type { WhatsAppProvider } from './providers/types'
import { WasenderProvider } from './providers/wasender'
import { N8NProvider } from './providers/n8n'
import { MockProvider } from './providers/mock'

export class WhatsAppChannel implements NotificationChannelAdapter {
  private provider: WhatsAppProvider

  constructor(config: Record<string, unknown>) {
    const providerType = (config.provider as string) || 'n8n'

    switch (providerType) {
      case 'wasender':
        this.provider = new WasenderProvider(config)
        break
      case 'evolution':
      case 'twilio':
        throw new Error(`Provider ${providerType} no implementado`)
      case 'mock':
        this.provider = new MockProvider(config) as WhatsAppProvider
        break
      case 'n8n':
      default:
        this.provider = new N8NProvider(config)
        break
    }
  }

  async send(message: NotificationMessage): Promise<SendResult> {
    return this.provider.sendMessage({
      to: message.toAddress,
      body: message.body,
      variables: message.variables || {},
      appointmentId: message.appointmentId,
      traceId: (message.metadata?.traceId as string) || '',
      attemptNumber: (message.metadata?.attemptNumber as number) || undefined,
    })
  }

  getProviderName(): NotificationProviderType {
    return this.provider.name as NotificationProviderType
  }

  getChannel(): NotificationChannel {
    return 'whatsapp'
  }

  getProvider(): WhatsAppProvider {
    return this.provider
  }
}