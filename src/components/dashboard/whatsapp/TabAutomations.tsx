'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { Zap, Edit2, Plus, Loader2, Clock, FileText, CheckCircle, Circle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import {
  getAutomationRules,
  toggleAutomationRule,
  createAutomationRule,
  updateAutomationRule,
} from '@/actions/notifications/automations'
import { useTemplates } from '@/hooks/useTemplates'
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

const TRIGGER_DESCRIPTIONS: Record<AutomationTrigger, string> = {
  appointment_created: 'Se envía cuando un cliente agenda una nueva cita',
  appointment_reminder: 'Se envía como recordatorio antes de la cita',
  appointment_cancelled: 'Se envía cuando una cita es cancelada',
  appointment_completed: 'Se envía cuando una cita se marca como completada',
  appointment_no_show: 'Se envía cuando un cliente no asiste a su cita',
  confirmation_requested: 'Se envía para solicitar confirmación de la cita',
}

const ALL_TRIGGERS: AutomationTrigger[] = [
  'appointment_created',
  'appointment_reminder',
  'appointment_cancelled',
  'appointment_completed',
  'appointment_no_show',
  'confirmation_requested',
]

function SkeletonRow() {
  const COLORS = useThemeColors()
  return (
    <div className="flex items-center justify-between p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '20' }} />
        <div>
          <div className="h-4 w-36 rounded mb-1.5" style={{ backgroundColor: COLORS.textMuted + '20' }} />
          <div className="h-3 w-48 rounded" style={{ backgroundColor: COLORS.textMuted + '20' }} />
        </div>
      </div>
      <div className="w-20 h-7 rounded-full" style={{ backgroundColor: COLORS.textMuted + '20' }} />
    </div>
  )
}

export function TabAutomations({ organizationId }: TabAutomationsProps) {
  const COLORS = useThemeColors()
  const { templates: templatesFromHook, loading: templatesLoading } = useTemplates(organizationId, 'whatsapp')
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [creatingTrigger, setCreatingTrigger] = useState<AutomationTrigger | null>(null)

  const loadData = useCallback(async () => {
    const rulesResult = await getAutomationRules(organizationId, 'whatsapp')

    if (rulesResult.success && rulesResult.data) {
      setRules(rulesResult.data)
    }
    setRulesLoading(false)
  }, [organizationId])

  const loading = templatesLoading || rulesLoading

  useEffect(() => {
    startTransition(() => {
      loadData()
    })
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
    if (!templateId) return null
    const template = templatesFromHook.find((t) => t.id === templateId)
    return template?.name || null
  }

  const activeRulesCount = rules.filter((r) => r.isEnabled).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            {activeRulesCount > 0
              ? `${activeRulesCount} automatización${activeRulesCount !== 1 ? 'es' : ''} activa${activeRulesCount !== 1 ? 's' : ''}`
              : 'Sin automatizaciones activas'}
          </p>
        </div>
      </div>

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
            Reglas de automatización
          </span>
        </div>

        {loading ? (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : rules.length === 0 && templatesFromHook.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <Zap className="w-7 h-7" style={{ color: COLORS.textMuted }} />
            </div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Sin automatizaciones configuradas
            </p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              Crea tu primera template para habilitar automatizaciones
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {ALL_TRIGGERS.map((trigger) => {
              const rule = getRuleForTrigger(trigger)
              const hasRule = !!rule
              const templateName = rule ? getTemplateName(rule.templateId) : null

              return (
                <div
                  key={trigger}
                  className="px-4 py-4 transition-colors"
                  style={{ backgroundColor: COLORS.surface }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.surface }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: hasRule && rule!.isEnabled ? COLORS.whatsappLight : COLORS.surfaceSubtle,
                        }}
                      >
                        {hasRule && rule!.isEnabled ? (
                          <Zap className="w-5 h-5" style={{ color: COLORS.whatsapp }} />
                        ) : (
                          <Circle className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            {TRIGGER_LABELS[trigger]}
                          </p>
                          {hasRule && rule!.isEnabled && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}
                            >
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: COLORS.success }} />
                              Activo
                            </span>
                          )}
                        </div>
                        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                          {TRIGGER_DESCRIPTIONS[trigger]}
                        </p>
                        {hasRule ? (
                          <div className="flex items-center gap-4">
                            {templateName && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                                <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                                  {templateName}
                                </span>
                              </div>
                            )}
                            {rule!.delayMinutes > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                                <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                                  {rule!.delayMinutes} min retraso
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                            <span className="text-xs" style={{ color: COLORS.textMuted }}>
                              No configurado
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasRule ? (
                        <>
                          <button
                            onClick={() => setEditingRule(rule!)}
                            className="p-2 rounded-xl transition-colors"
                            style={{ color: COLORS.primary }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                            aria-label="Editar automatización"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(rule!.id, rule!.isEnabled)}
                            disabled={togglingId === rule!.id}
                            className="relative w-12 h-7 rounded-full transition-colors"
                            style={{ backgroundColor: rule!.isEnabled ? COLORS.success : COLORS.border }}
                            role="switch"
                            aria-checked={rule!.isEnabled}
                          >
                            {togglingId === rule!.id ? (
                              <Loader2 className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ color: '#FFFFFF' }} />
                            ) : (
                              <span
                                className="absolute top-1 w-5 h-5 rounded-full transition-transform"
                                style={{
                                  backgroundColor: '#FFFFFF',
                                  left: rule!.isEnabled ? '20px' : '2px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                }}
                              />
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setCreatingTrigger(trigger)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ backgroundColor: COLORS.primarySubtle, color: COLORS.primary }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primary + '30' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Crear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingRule && (
        <AutomationEditModal
          rule={editingRule}
          templates={templatesFromHook}
          onSave={(templateId, delayMinutes) => handleUpdate(editingRule.id, templateId, delayMinutes)}
          onClose={() => setEditingRule(null)}
        />
      )}

      {creatingTrigger && (
        <AutomationEditModal
          templates={templatesFromHook}
          onSave={(templateId, delayMinutes) => handleCreate(creatingTrigger, templateId, delayMinutes)}
          onClose={() => setCreatingTrigger(null)}
        />
      )}
    </div>
  )
}