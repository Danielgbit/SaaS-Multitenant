'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, Edit2, Plus, Loader2 } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import {
  getAutomationRules,
  toggleAutomationRule,
  createAutomationRule,
  updateAutomationRule,
} from '@/actions/notifications/automations'
import { getTemplates } from '@/actions/notifications/templates'
import { AutomationEditModal } from './AutomationEditModal'
import type { AutomationRule, AutomationTrigger, MessageTemplate } from '@/types/notifications'

interface TabAutomationsProps {
  organizationId: string
}

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  appointment_created: 'Cita creada',
  appointment_reminder: 'Recordatorio',
  appointment_cancelled: 'Cita cancelada',
  appointment_completed: 'Cita completada',
  appointment_no_show: 'No-show',
  confirmation_requested: 'Confirmación solicitada',
}

const ALL_TRIGGERS: AutomationTrigger[] = [
  'appointment_created',
  'appointment_reminder',
  'appointment_cancelled',
  'appointment_completed',
  'appointment_no_show',
  'confirmation_requested',
]

export function TabAutomations({ organizationId }: TabAutomationsProps) {
  const COLORS = useThemeColors()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [creatingTrigger, setCreatingTrigger] = useState<AutomationTrigger | null>(null)

  const loadData = useCallback(async () => {
    const [rulesResult, templatesResult] = await Promise.all([
      getAutomationRules(organizationId, 'whatsapp'),
      getTemplates(organizationId, 'whatsapp'),
    ])

    if (rulesResult.success && rulesResult.data) {
      setRules(rulesResult.data)
    }
    if (templatesResult.success && templatesResult.data) {
      setTemplates(templatesResult.data as MessageTemplate[])
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    setTogglingId(ruleId)
    const result = await toggleAutomationRule(ruleId, !currentEnabled)
    setTogglingId(null)

    if (result.success) {
      loadData()
    }
  }

  const handleCreate = async (trigger: AutomationTrigger, templateId?: string, delayMinutes?: number) => {
    const result = await createAutomationRule({
      organizationId,
      triggerEvent: trigger,
      channel: 'whatsapp',
      templateId: templateId || null,
      delayMinutes: delayMinutes || 0,
      conditions: {},
    })

    if (result.success) {
      setCreatingTrigger(null)
      loadData()
    }
  }

  const handleUpdate = async (ruleId: string, templateId?: string, delayMinutes?: number) => {
    const result = await updateAutomationRule(ruleId, {
      templateId: templateId || null,
      delayMinutes: delayMinutes || 0,
    })

    if (result.success) {
      setEditingRule(null)
      loadData()
    }
  }

  const getRuleForTrigger = (trigger: AutomationTrigger) => {
    return rules.find((r) => r.triggerEvent === trigger)
  }

  const getTemplateName = (templateId?: string) => {
    if (!templateId) return 'Sin asignar'
    const template = templates.find((t) => t.id === templateId)
    return template?.name || 'Template no encontrado'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: COLORS.border }}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Reglas de automatización de WhatsApp
          </span>
        </div>

        <div className="divide-y" style={{ borderColor: COLORS.border }}>
          {ALL_TRIGGERS.map((trigger) => {
            const rule = getRuleForTrigger(trigger)
            const hasRule = !!rule

            return (
              <div
                key={trigger}
                className="flex items-center justify-between p-4 transition-colors"
                style={{ backgroundColor: COLORS.surface }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.surface }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: hasRule ? COLORS.whatsappLight : COLORS.surfaceSubtle }}
                  >
                    <Zap
                      className="w-5 h-5"
                      style={{ color: hasRule ? COLORS.whatsapp : COLORS.textMuted }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {TRIGGER_LABELS[trigger]}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {hasRule ? (
                        <>Template: {getTemplateName(rule.templateId)} · {rule.delayMinutes} min delay</>
                      ) : (
                        'No configurado'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasRule ? (
                    <>
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: COLORS.primary }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(rule.id, rule.isEnabled)}
                        disabled={togglingId === rule.id}
                        className="relative w-12 h-7 rounded-full transition-colors"
                        style={{ backgroundColor: rule.isEnabled ? COLORS.success : COLORS.border }}
                        role="switch"
                        aria-checked={rule.isEnabled}
                      >
                        {togglingId === rule.id ? (
                          <Loader2 className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ color: '#FFFFFF' }} />
                        ) : (
                          <span
                            className="absolute top-1 w-5 h-5 rounded-full transition-transform"
                            style={{
                              backgroundColor: '#FFFFFF',
                              left: rule.isEnabled ? '20px' : '2px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setCreatingTrigger(trigger)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: COLORS.primarySubtle, color: COLORS.primary }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primary + '30' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {editingRule && (
        <AutomationEditModal
          rule={editingRule}
          templates={templates}
          onSave={(templateId, delayMinutes) => handleUpdate(editingRule.id, templateId, delayMinutes)}
          onClose={() => setEditingRule(null)}
        />
      )}

      {creatingTrigger && (
        <AutomationEditModal
          templates={templates}
          onSave={(templateId, delayMinutes) => handleCreate(creatingTrigger, templateId, delayMinutes)}
          onClose={() => setCreatingTrigger(null)}
        />
      )}
    </div>
  )
}