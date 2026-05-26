'use client'

import { useState, useCallback, useEffect } from 'react'
import { getTemplates, resetTemplateToDefault, deleteTemplate } from '@/actions/notifications/templates'
import type { MessageTemplate, NotificationChannel } from '@/types/notifications'

export function useTemplates(organizationId: string, channel: NotificationChannel = 'whatsapp') {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getTemplates(organizationId, channel)
    if (result.success && result.data) {
      setTemplates(result.data as MessageTemplate[])
    } else {
      setError(result.error || 'Error al cargar templates')
    }
    setLoading(false)
  }, [organizationId, channel])

  const resetTemplate = useCallback(async (templateId: string) => {
    const result = await resetTemplateToDefault(templateId)
    if (result.success) {
      await load()
    }
    return result
  }, [load])

  const deleteTemplateAction = useCallback(async (templateId: string) => {
    const result = await deleteTemplate(templateId)
    if (result.success) {
      await load()
    }
    return result
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  return { templates, loading, error, reload: load, resetTemplate, deleteTemplateAction }
}
