'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import type { AutomationRule, MessageTemplate } from '@/types/notifications'

interface AutomationEditModalProps {
  rule?: AutomationRule
  templates: MessageTemplate[]
  onSave: (templateId?: string, delayMinutes?: number) => void
  onClose: () => void
}

export function AutomationEditModal({ rule, templates, onSave, onClose }: AutomationEditModalProps) {
  const [templateId, setTemplateId] = useState(rule?.templateId || '')
  const [delayMinutes, setDelayMinutes] = useState(rule?.delayMinutes || 0)
  const [saving, setSaving] = useState(false)

  const handleSave = () => { setSaving(true); onSave(templateId || undefined, delayMinutes); setSaving(false) }

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Automatización"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Guardar</Button>
        </>
      }>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Plantilla</label>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm">
            <option value="">Seleccionar plantilla...</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Minutos de retraso</label>
          <input type="number" value={delayMinutes} onChange={e => setDelayMinutes(parseInt(e.target.value) || 0)}
            className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm" min="0" />
        </div>
      </div>
    </Modal>
  )
}
