'use client'

import { useState, useCallback, startTransition } from 'react'
import { FileText, Edit2, RotateCcw, Loader2, Plus, Trash2, Sparkles, Inbox } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useTemplates } from '@/hooks/useTemplates'
import { TemplateEditorModal } from './TemplateEditorModal'
import { WHATSAPP_TEMPLATE_TYPE_LABELS } from '@/types/notifications'
import type { MessageTemplate } from '@/types/notifications'

interface TabTemplatesProps {
  organizationId: string
}

function SkeletonCard() {
  const COLORS = useThemeColors()
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 w-32 rounded" style={{ backgroundColor: COLORS.textMuted + '20' }} />
            <div className="h-4 w-12 rounded" style={{ backgroundColor: COLORS.textMuted + '20' }} />
          </div>
          <div className="h-3 w-24 rounded mb-2" style={{ backgroundColor: COLORS.textMuted + '20' }} />
          <div className="h-4 w-full rounded" style={{ backgroundColor: COLORS.textMuted + '20' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '20' }} />
          <div className="w-8 h-8 rounded-xl" style={{ backgroundColor: COLORS.textMuted + '20' }} />
        </div>
      </div>
    </div>
  )
}

export function TabTemplates({ organizationId }: TabTemplatesProps) {
  const COLORS = useThemeColors()
  const { templates, loading, error, reload, resetTemplate: resetTemplateAction, deleteTemplateAction } = useTemplates(organizationId, 'whatsapp')
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleReset = async (templateId: string) => {
    setResettingId(templateId)
    await resetTemplateAction(templateId)
    setResettingId(null)
  }

  const handleDelete = async (templateId: string) => {
    if (confirmDeleteId !== templateId) {
      setConfirmDeleteId(templateId)
      return
    }
    setDeletingId(templateId)
    await deleteTemplateAction(templateId)
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  const cancelDelete = () => {
    setConfirmDeleteId(null)
  }

  const highlightVariables = (body: string) => {
    const parts = body.split(/(\{\{[^}]+\}\})/g)
    return parts.map((part, i) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        return (
          <span
            key={i}
            className="px-1 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: COLORS.primarySubtle, color: COLORS.primary }}
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  const countVariables = (body: string) => {
    const matches = body.match(/\{\{[^}]+\}\}/g)
    return matches ? matches.length : 0
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: COLORS.textSecondary }}>
          {templates.length > 0
            ? `${templates.length} template${templates.length !== 1 ? 's' : ''} configurada${templates.length !== 1 ? 's' : ''}`
            : 'Sin templates configuradas'}
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: COLORS.primary }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
        >
          <Plus className="w-4 h-4" />
          <span>Nueva template</span>
        </button>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: COLORS.border }}
      >
        {loading ? (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : templates.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <Inbox className="w-8 h-8" style={{ color: COLORS.textMuted }} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: COLORS.primary }} />
              <p
                className="text-sm font-semibold"
                style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Sin templates de WhatsApp
              </p>
            </div>
            <p className="text-xs mb-5 max-w-xs mx-auto" style={{ color: COLORS.textMuted }}>
              Las templates te permiten enviar mensajes predefinidos a tus clientes. Crea tu primera template para comenzar.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: COLORS.primary }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <Plus className="w-4 h-4" />
              <span>Crear tu primera template</span>
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {templates.map((template) => (
              <div
                key={template.id}
                className="px-4 py-4 transition-colors"
                style={{ backgroundColor: COLORS.surface }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.surface }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: COLORS.whatsappLight }}
                    >
                      <FileText className="w-5 h-5" style={{ color: COLORS.whatsapp }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {template.name}
                        </span>
                        {template.isDefault && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: COLORS.infoLight, color: COLORS.info }}
                          >
                            Sistema
                          </span>
                        )}
                        {!template.isActive && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: COLORS.errorLight, color: COLORS.error }}
                          >
                            Inactivo
                          </span>
                        )}
                        {countVariables(template.body) > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: COLORS.primarySubtle, color: COLORS.primary }}
                          >
                            <Sparkles className="w-3 h-3" />
                            {countVariables(template.body)} var
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                        {WHATSAPP_TEMPLATE_TYPE_LABELS[template.type] || template.type}
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: COLORS.textSecondary }}
                      >
                        {highlightVariables(template.body.length > 120
                          ? template.body.slice(0, 120) + '...'
                          : template.body)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ color: COLORS.primary }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      aria-label="Editar template"
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
                        aria-label="Resetear template a valor por defecto"
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
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: COLORS.error, opacity: deletingId === template.id ? 0.7 : 1 }}
                        >
                          {deletingId === template.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '¿Eliminar?'}
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border"
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
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.errorLight ?? '#FEE2E2' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        aria-label="Eliminar template"
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
          onSave={reload}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingTemplate && (
        <TemplateEditorModal
          mode="edit"
          template={editingTemplate}
          onSave={reload}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  )
}