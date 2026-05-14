import type { NotificationChannel } from '@/types/notifications'
import type { ChannelFactory, NotificationChannelAdapter } from './types'
import { WhatsAppChannel } from './whatsapp/whatsapp-channel'
import { ResendEmailChannel } from './email-resend.channel'
import { InAppChannel } from './in-app.channel'

export const createChannel: ChannelFactory = (
  channel: NotificationChannel,
  config: Record<string, unknown>
): NotificationChannelAdapter | null => {
  switch (channel) {
    case 'whatsapp':
      return new WhatsAppChannel(config)
    case 'email':
      return new ResendEmailChannel(config)
    case 'in_app':
      return new InAppChannel(config)
    case 'sms':
    default:
      return null
  }
}

export function isChannelSupported(channel: NotificationChannel): boolean {
  return ['whatsapp', 'email', 'in_app'].includes(channel)
}