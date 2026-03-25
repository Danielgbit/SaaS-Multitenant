import type { Database } from '@/../types/supabase'

type ClientRow = Database['public']['Tables']['clients']['Row']

export type ConfirmationMethod = 'whatsapp' | 'phone_call' | 'in_person' | 'none'
export type PreferredContact = 'whatsapp' | 'phone' | 'email'

export type ClientWithConfirmation = ClientRow & {
  confirmation_method: ConfirmationMethod | null
  confirmations_enabled: boolean | null
  preferred_contact: PreferredContact | null
}

export type CreateClientInput = {
  organization_id: string
  name: string
  phone?: string | null
  email?: string | null
  notes?: string | null
  confirmation_method?: ConfirmationMethod
  confirmations_enabled?: boolean
  preferred_contact?: PreferredContact | null
}

export type UpdateClientInput = {
  id: string
  organization_id: string
  name?: string
  phone?: string | null
  email?: string | null
  notes?: string | null
  confirmation_method?: ConfirmationMethod
  confirmations_enabled?: boolean
  preferred_contact?: PreferredContact | null
}

export const CONFIRMATION_METHODS: Record<ConfirmationMethod, { label: string; icon: string; description: string }> = {
  whatsapp: {
    label: 'WhatsApp',
    icon: '📱',
    description: 'Confirmación automática por WhatsApp',
  },
  phone_call: {
    label: 'Llamada',
    icon: '📞',
    description: 'Ya confirmado por llamada del staff',
  },
  in_person: {
    label: 'En persona',
    icon: '👤',
    description: 'Confirmado presencialmente',
  },
  none: {
    label: 'Sin confirmación',
    icon: '⏸️',
    description: 'No desea recibir mensajes',
  },
}

export const PREFERRED_CONTACTS: Record<PreferredContact, { label: string; icon: string }> = {
  whatsapp: { label: 'WhatsApp', icon: '📱' },
  phone: { label: 'Llamada', icon: '📞' },
  email: { label: 'Email', icon: '✉️' },
}
