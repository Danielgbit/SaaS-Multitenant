'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Edit2, RotateCcw, Loader2, Plus, Trash2 } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { getTemplates, resetTemplateToDefault, deleteTemplate } from '@/actions/notifications/templates'
import { TemplateEditorModal } from './TemplateEditorModal'
import type { MessageTemplate } from '@/types/notifications'

interface TabTemplatesProps {
  organizationId: string
}

const TYPE_LABELS: Record<string, string> = {
  appointment_confirmation: 'Confirmación de cita',
  appointment_reminder: 'Recordatorio',
  appointment_cancelled: 'Cancelación',
  appointment_completed: 'Completado',
  confirmation_requested: 'Solicitud de confirmación',
}

export function TabTemplates({ organizationId }: TabTemplatesProps) {
  const COLORS = useThemeColors()
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    const result = await getTemplates(organizationId, 'whatsapp')
    if (result.success && result.data) {
      setTemplates(result.data as MessageTemplate[])
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleReset = async (templateId: string) => {
    setResettingId(templateId)
    const result = await resetTemplateToDefault(templateId)
    setResettingId(null)

    if (result.success) {
      loadTemplates()
    }
  }

  const handleDelete = async (templateId: string) => {
    if (confirmDeleteId !== templateId) {
      setConfirmDeleteId(templateId)
      return
    }
    setDeletingId(templateId)
    const result = await deleteTemplate(templateId)
    setDeletingId(false)
    setConfirmDeleteId(null)

    if (result.success) {
      loadTemplates()
    }
  }

  const cancelDelete = () => {
    setConfirmDeleteId(null)
  }

  const truncateBody = (body: string, maxLength: number = 80) => {
    if (body.length <= maxLength) return body
    return body.slice(0, maxLength) + '...'
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
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
          style={{ backgroundColor: COLORS.primary }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <Plus className="w-4 h-4" />
          <span>Nueva template</span>
        </button>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: COLORS.border }}
      >
        {templates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              No hay templates de WhatsApp configurados
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 transition-colors"
                style={{ backgroundColor: COLORS.surface }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.surface }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-sm font-medium"
                        style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {template.name}
                      </span>
                      {template.isDefault && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: COLORS.infoLight, color: COLORS.info }}
                        >
                          Sistema
                        </span>
                      )}
                      {!template.isActive && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: COLORS.errorLight, color: COLORS.error }}
                        >
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mb-2"
                      style={{ color: COLORS.textMuted }}
                    >
                      {TYPE_LABELS[template.type] || template.type}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {truncateBody(template.body)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ color: COLORS.primary }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {template.isDefault ? (
                      <button
                        onClick={() => handleReset(template.id)}
                        disabled={resettingId === template.id}
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: COLORS.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        title="Resetear a valor por defecto"
                      >
                        {resettingId === template.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>
                    ) : confirmDeleteId === template.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(template.id)}
                          disabled={deletingId === template.id}
                          className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                          style={{ backgroundColor: COLORS.error, opacity: deletingId === template.id ? 0.7 : 1 }}
                        >
                          {deletingId === template.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '¿Eliminar?'}
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="px-2 py-1 rounded-lg text-xs font-medium border"
                          style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: COLORS.error }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.errorLight }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <TemplateEditorModal
          mode="create"
          organizationId={organizationId}
          onSave={loadTemplates}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingTemplate && (
        <TemplateEditorModal
          mode="edit"
          template={editingTemplate}
          onSave={loadTemplates}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  )
}