'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { Zap, Edit2, Plus, Clock, FileText, CheckCircle, Circle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
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
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width="w-10" height="h-10" />
        <div className="space-y-1.5">
          <Skeleton variant="text" width="w-36" height="h-4" />
          <Skeleton variant="text" width="w-48" height="h-3" />
        </div>
      </div>
      <Skeleton variant="rectangular" width="w-20" height="h-7" />
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
          <EmptyState
            icon={<Zap className="w-7 h-7" style={{ color: COLORS.textMuted }} />}
            title="Sin automatizaciones configuradas"
            description="Crea tu primera template para habilitar automatizaciones"
          />
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {ALL_TRIGGERS.map((trigger) => {
              const rule = getRuleForTrigger(trigger)
              const hasRule = !!rule
              const templateName = rule ? getTemplateName(rule.templateId) : null

              return (
                <div
                  key={trigger}
                  className="px-4 py-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ backgroundColor: COLORS.surface }}
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
                            <Badge variant="success" size="sm" pulse>Activo</Badge>
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
                            className="p-2 rounded-xl transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/20"
                            style={{ color: COLORS.primary }}
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
                              <Spinner size="sm" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: '#FFFFFF' }} />
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