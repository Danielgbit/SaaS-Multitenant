import type {
  NotificationChannel,
  NotificationMessage,
  SendResult,
  NotificationProviderType,
} from '@/types/notifications'

export interface NotificationChannelAdapter {
  send(message: NotificationMessage): Promise<SendResult>
  getProviderName(): NotificationProviderType
  getChannel(): NotificationChannel
}

export type ChannelFactory = (
  channel: NotificationChannel,
  config: Record<string, unknown>
) => NotificationChannelAdapter | null