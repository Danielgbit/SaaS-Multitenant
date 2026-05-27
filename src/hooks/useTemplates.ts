'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getTemplates, resetTemplateToDefault, deleteTemplate } from '@/actions/notifications/templates'
import type { MessageTemplate, NotificationChannel } from '@/types/notifications'

export function useTemplates(organizationId: string, channel: NotificationChannel = 'whatsapp') {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    const id = ++fetchIdRef.current

    getTemplates(organizationId, channel).then(result => {
      if (id !== fetchIdRef.current) return
      if (result.success && result.data) {
        setTemplates(result.data as MessageTemplate[])
      } else {
        setError(result.error || 'Error al cargar templates')
      }
      setLoading(false)
    })
  }, [organizationId, channel])

  const reload = useCallback(() => {
    const id = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    getTemplates(organizationId, channel).then(result => {
      if (id !== fetchIdRef.current) return
      if (result.success && result.data) {
        setTemplates(result.data as MessageTemplate[])
      } else {
        setError(result.error || 'Error al cargar templates')
      }
      setLoading(false)
    })
  }, [organizationId, channel])

  const resetTemplate = useCallback(async (templateId: string) => {
    const result = await resetTemplateToDefault(templateId)
    if (result.success) {
      reload()
    }
    return result
  }, [reload])

  const deleteTemplateAction = useCallback(async (templateId: string) => {
    const result = await deleteTemplate(templateId)
    if (result.success) {
      reload()
    }
    return result
  }, [reload])

  return { templates, loading, error, reload, resetTemplate, deleteTemplateAction }
}
