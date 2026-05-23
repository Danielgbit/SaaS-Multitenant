'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { AutomationRule, MessageTemplate } from '@/types/notifications'

interface AutomationEditModalProps {
  rule?: AutomationRule
  templates: MessageTemplate[]
  onSave: (templateId?: string, delayMinutes?: number) => void
  onClose: () => void
}

export function AutomationEditModal({ rule, templates, onSave, onClose }: AutomationEditModalProps) {
  const COLORS = useThemeColors()
  const [templateId, setTemplateId] = useState(rule?.templateId || '')
  const [delayMinutes, setDelayMinutes] = useState(rule?.delayMinutes || 0)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    onSave(templateId || undefined, delayMinutes)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.overlay }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-2xl border shadow-xl"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            {rule ? 'Editar automatización' : 'Crear automatización'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textMuted }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              Template de mensaje
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border transition-colors outline-none"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border }}
            >
              <option value="">Seleccionar template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              Retraso (minutos)
            </label>
            <input
              type="number"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
              min={0}
              max={10080}
              className="w-full px-4 py-3 rounded-xl border transition-colors outline-none"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border }}
            />
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              0 = enviar inmediatamente
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 p-5 border-t"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textSecondary }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{
              backgroundColor: COLORS.primary,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving && <Spinner size="sm" />}
            <span>{rule ? 'Guardar' : 'Crear'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}