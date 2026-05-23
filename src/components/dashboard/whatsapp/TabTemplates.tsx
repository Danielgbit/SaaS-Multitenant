'use client'

import { useState, startTransition } from 'react'
import { FileText, Edit2, RotateCcw, Plus, Sparkles, Inbox } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { useTemplates } from '@/hooks/useTemplates'
import { TemplateEditorModal } from './TemplateEditorModal'
import { DeleteButton } from './ConfirmDeleteButton'
import { WHATSAPP_TEMPLATE_TYPE_LABELS } from '@/types/notifications'
import { highlightVariables, countVariables } from '@/lib/whatsapp/template-utils'
import type { MessageTemplate } from '@/types/notifications'

interface TabTemplatesProps {
  organizationId: string
}

function SkeletonCard() {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width="w-32" height="h-4" />
            <Skeleton variant="text" width="w-12" height="h-4" />
          </div>
          <Skeleton variant="text" width="w-24" height="h-3" />
          <Skeleton variant="text" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width="w-8" height="h-8" />
          <Skeleton variant="circular" width="w-8" height="h-8" />
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: COLORS.textSecondary }}>
          {templates.length > 0
            ? `${templates.length} template${templates.length !== 1 ? 's' : ''} configurada${templates.length !== 1 ? 's' : ''}`
            : 'Sin templates configuradas'}
        </p>
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
          <EmptyState
            icon={<Inbox className="w-8 h-8" style={{ color: COLORS.textMuted }} />}
            title="Sin templates de WhatsApp"
            description="Las templates te permiten enviar mensajes predefinidos a tus clientes. Crea tu primera template para comenzar."
            action={
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
            }
          />
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {templates.map((template) => (
              <div
                key={template.id}
                className="px-4 py-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ backgroundColor: COLORS.surface }}
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
                          style={{ color: COLORS.textPrimary }}
                        >
                          {template.name}
                        </span>
                        {template.isDefault && (
                          <Badge variant="info" size="sm">Sistema</Badge>
                        )}
                        {!template.isActive && (
                          <Badge variant="error" size="sm">Inactivo</Badge>
                        )}
                        {countVariables(template.body) > 0 && (
                          <Badge variant="primary" size="sm">
                            <Sparkles className="w-3 h-3" />
                            {countVariables(template.body)} var
                          </Badge>
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
                          : template.body, COLORS.primary, COLORS.primarySubtle)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 rounded-xl transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/20"
                      style={{ color: COLORS.primary }}
                      aria-label="Editar template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {template.isDefault ? (
                      <button
                        onClick={() => handleReset(template.id)}
                        disabled={resettingId === template.id}
                        className="p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        style={{ color: COLORS.textMuted }}
                        aria-label="Resetear template a valor por defecto"
                      >
                        {resettingId === template.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <DeleteButton
                        onDelete={() => handleDelete(template.id)}
                        deleting={deletingId === template.id}
                        confirmDelete={confirmDeleteId === template.id}
                        onSetConfirmDelete={(v) => { if (!v) setConfirmDeleteId(null) }}
                      />
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