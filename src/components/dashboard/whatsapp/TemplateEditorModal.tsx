'use client'

import { useState } from 'react'
import { X, Save, RotateCcw, Loader2, Plus, Trash2 } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { updateTemplate, resetTemplateToDefault, createTemplate, deleteTemplate } from '@/actions/notifications/templates'
import { STANDARD_VARIABLES, WHATSAPP_TEMPLATE_TYPES, WHATSAPP_TEMPLATE_TYPE_LABELS, type MessageTemplate, type TemplateType } from '@/types/notifications'

interface TemplateEditorModalProps {
  mode: 'create' | 'edit'
  template?: MessageTemplate
  organizationId?: string
  onSave: () => void
  onClose: () => void
}

const SAMPLE_VARIABLES: Record<string, string> = {
  clientName: 'María García',
  appointmentDate: '15 de mayo de 2026',
  appointmentTime: '2:00 PM',
  businessName: 'Spa Relax',
  serviceName: 'Masaje Relajante',
  employeeName: 'Carlos López',
  confirmationLink: 'https://app.prugressy.com/confirmar/abc123',
  cancellationLink: 'https://app.prugressy.com/cancelar/abc123',
  businessPhone: '+57 300 123 4567',
  businessAddress: 'Calle 123 #45-67, Bogotá',
}

export function TemplateEditorModal({ mode, template, organizationId, onSave, onClose }: TemplateEditorModalProps) {
  const COLORS = useThemeColors()
  const isCreate = mode === 'create'
  const isEdit = mode === 'edit'

  const [name, setName] = useState(template?.name ?? '')
  const [templateType, setTemplateType] = useState<TemplateType>(template?.type ?? 'appointment_confirmation')
  const [body, setBody] = useState(template?.body ?? '')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; templateType?: string; body?: string }>({})

  const validate = () => {
    const errors: { name?: string; templateType?: string; body?: string } = {}
    if (isCreate && !name.trim()) errors.name = 'El nombre es requerido'
    if (isCreate && !templateType) errors.templateType = 'El tipo es requerido'
    if (!body.trim()) errors.body = 'El cuerpo del mensaje es requerido'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)

    let result
    if (isCreate) {
      result = await createTemplate({
        organizationId: organizationId ?? null,
        channel: 'whatsapp',
        type: templateType,
        name: name.trim(),
        body: body.trim(),
        variables: STANDARD_VARIABLES,
        isDefault: false,
        isActive: true,
      })
    } else {
      result = await updateTemplate(template!.id, { body: body.trim() })
    }

    setSaving(false)

    if (result.success) {
      setToast({ type: 'success', message: isCreate ? 'Template creada' : 'Template guardada' })
      setTimeout(() => {
        onSave()
        onClose()
      }, 1000)
    } else {
      setToast({ type: 'error', message: result.error || 'Error al guardar' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const handleReset = async () => {
    setResetting(true)
    const result = await resetTemplateToDefault(template!.id)
    setResetting(false)

    if (result.success) {
      setToast({ type: 'success', message: 'Template reseteada al valor por defecto' })
      setTimeout(() => {
        onSave()
        onClose()
      }, 1000)
    } else {
      setToast({ type: 'error', message: result.error || 'Error al resetear' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    const result = await deleteTemplate(template!.id)
    setDeleting(false)

    if (result.success) {
      setToast({ type: 'success', message: 'Template eliminada' })
      setTimeout(() => {
        onSave()
        onClose()
      }, 1000)
    } else {
      setToast({ type: 'error', message: result.error || 'Error al eliminar' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const cancelDelete = () => {
    setConfirmDelete(false)
  }

  const renderPreview = (text: string) => {
    let result = text
    Object.entries(SAMPLE_VARIABLES).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })
    return result
  }

  const insertVariable = (varName: string) => {
    setBody((prev) => prev + `{{${varName}}}`)
  }

  const inputStyle = (hasError?: string) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: '12px',
    border: `1px solid ${hasError ? COLORS.error : COLORS.border}`,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.overlay }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {isCreate ? 'Nueva template' : 'Editar template'}
            </h2>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {isCreate ? 'WhatsApp' : (WHATSAPP_TEMPLATE_TYPE_LABELS[template!.type] || template!.type)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: COLORS.textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {toast && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: toast.type === 'success' ? COLORS.successLight : COLORS.errorLight,
                color: toast.type === 'success' ? COLORS.success : COLORS.error,
              }}
            >
              {toast.message}
            </div>
          )}

          {isCreate && (
            <>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textSecondary }}
                >
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Confirmación personalizada"
                  style={inputStyle(fieldErrors.name)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = fieldErrors.name ? COLORS.error : COLORS.border }}
                />
                {fieldErrors.name && (
                  <p className="text-xs mt-1" style={{ color: COLORS.error }}>{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textSecondary }}
                >
                  Tipo
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                  style={inputStyle(fieldErrors.templateType)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = fieldErrors.templateType ? COLORS.error : COLORS.border }}
                >
                  {WHATSAPP_TEMPLATE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {fieldErrors.templateType && (
                  <p className="text-xs mt-1" style={{ color: COLORS.error }}>{fieldErrors.templateType}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              Variables disponibles
            </label>
            <div className="flex flex-wrap gap-2">
              {STANDARD_VARIABLES.map((v) => (
                <button
                  key={v.name}
                  onClick={() => insertVariable(v.name)}
                  className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: COLORS.primarySubtle,
                    color: COLORS.primary,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primary + '30' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                  title={`${v.description}: ${v.example || ''}`}
                >
                  {`{{${v.name}}}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              Cuerpo del mensaje
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-xl border transition-colors outline-none resize-none"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: fieldErrors.body ? COLORS.error : COLORS.border,
                color: COLORS.textPrimary,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = fieldErrors.body ? COLORS.error : COLORS.border }}
            />
            {fieldErrors.body && (
              <p className="text-xs mt-1" style={{ color: COLORS.error }}>{fieldErrors.body}</p>
            )}
          </div>

          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: COLORS.surfaceSubtle,
              borderColor: COLORS.border,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: COLORS.textMuted }}
            >
              Vista previa
            </p>
            <p
              className="text-sm whitespace-pre-wrap"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {renderPreview(body) || 'Escribe el cuerpo del mensaje para ver la vista previa...'}
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-between p-5 border-t"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
        >
          <div className="flex items-center gap-2">
            {isEdit && !template!.isDefault && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>¿Eliminar?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: COLORS.error, opacity: deleting ? 0.7 : 1 }}
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sí'}
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium border"
                    style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    borderColor: COLORS.error,
                    color: COLORS.error,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.errorLight ?? '#FEE2E2' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              )
            )}

            {isEdit && template!.isDefault && (
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.textSecondary,
                  opacity: resetting ? 0.5 : 1,
                  cursor: resetting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!resetting) e.currentTarget.style.backgroundColor = COLORS.surfaceHover
                }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Resetear a defecto</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: COLORS.textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isCreate ? 'Crear' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}