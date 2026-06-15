'use client'

import { useState, useEffect, useCallback, useRef, useId, useActionState } from 'react'
import { X, Package, Tag, DollarSign, Boxes, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import { Modal, Spinner } from '@/components/ui'
import { Tooltip } from '@/components/ui/Tooltip'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useConfirmClose } from '@/hooks/useConfirmClose'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'
import { saveInventoryItem, type SaveInventoryItemFormState } from '@/actions/inventory/saveInventoryItem'

type InventoryFormData = {
  name: string
  sku: string
  category: string
  unit: string
  description: string
  quantity: number
  min_quantity: number
  price: number | null
  cost_price: number | null
}

const EMPTY_FORM: InventoryFormData = {
  name: '', sku: '', category: '', unit: 'pieza', description: '',
  quantity: 0, min_quantity: 5, price: null, cost_price: null,
}

function itemToFormData(item: InventoryItem | null): InventoryFormData {
  if (!item) return EMPTY_FORM
  return {
    name: item.name ?? '',
    sku: item.sku ?? '',
    category: item.category ?? '',
    unit: item.unit ?? 'pieza',
    description: item.description ?? '',
    quantity: item.quantity ?? 0,
    min_quantity: item.min_quantity ?? 5,
    price: item.price ?? null,
    cost_price: item.cost_price ?? null,
  }
}

interface InventoryFormModalProps {
  item: InventoryItem | null
  categories: string[]
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InventoryFormModal({
  item,
  categories,
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: InventoryFormModalProps) {
  const [state, formAction, isPending] = useActionState(saveInventoryItem, { success: false })
  const [formData, setFormData] = useState<InventoryFormData>(() => itemToFormData(item))
  const initialSnapshot = useRef<InventoryFormData>(itemToFormData(item))
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialSnapshot.current)
  const { confirmClose, dialog: closeDialog } = useConfirmClose(isDirty, onClose)
  const COLORS = useThemeColors()
  const formId = useId()

  const fieldIds = {
    name: `${formId}-name`,
    sku: `${formId}-sku`,
    category: `${formId}-category`,
    unit: `${formId}-unit`,
    description: `${formId}-description`,
    quantity: `${formId}-quantity`,
    min_quantity: `${formId}-min_quantity`,
    price: `${formId}-price`,
    cost_price: `${formId}-cost_price`,
  }

  useEffect(() => {
    const initial = itemToFormData(item)
    setFormData(initial)
    initialSnapshot.current = initial
  }, [item])

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  const serverError = (fieldName: string): string | undefined => {
    if (!state.fieldErrors) return undefined
    const key = fieldName as keyof typeof state.fieldErrors
    return state.fieldErrors[key]?.[0]
  }

  const inputStyle = (hasError: boolean) => ({
    borderRadius: '10px',
    borderColor: hasError ? COLORS.danger : COLORS.border,
    padding: '12px 16px',
    color: COLORS.textPrimary,
    width: '100%' as const,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: COLORS.surface,
  })

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 600 as const,
    color: COLORS.textSecondary,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
  }

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.boxShadow = `0 0 0 3px ${COLORS.borderFocus}40`
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.boxShadow = 'none'
    },
  }

  const handleFieldChange = useCallback(<K extends keyof InventoryFormData>(
    name: K,
    value: InventoryFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleNumericChange = useCallback(
    (name: 'quantity' | 'min_quantity' | 'price' | 'cost_price') =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const raw = e.target.value
        if (name === 'quantity' || name === 'min_quantity') {
          handleFieldChange(name, raw === '' ? 0 : parseInt(raw, 10) || 0)
        } else {
          handleFieldChange(name, raw === '' ? null : parseFloat(raw) || null)
        }
      },
    [handleFieldChange]
  )

  const previewPrice = formData.price != null ? String(formData.price) : ''
  const previewCost = formData.cost_price != null ? String(formData.cost_price) : ''

  const renderField = (
    name: keyof typeof fieldIds,
    label: string,
    field: React.ReactNode,
    helpText?: string,
    tooltip?: string
  ) => {
    const errMsg = serverError(name)
    return (
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label htmlFor={fieldIds[name]} style={labelStyle}>{label}</label>
          {tooltip && (
            <Tooltip content={tooltip}>
              <button type="button" aria-label="Mas informacion" className="inline-flex items-center cursor-help">
                <HelpCircle className="w-4 h-4" style={{ color: COLORS.textMuted }} aria-hidden="true" />
              </button>
            </Tooltip>
          )}
        </div>
        {field}
        {errMsg && (
          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: COLORS.danger }}>
            <AlertCircle className="w-3 h-3" />
            {errMsg}
          </p>
        )}
        {helpText && !errMsg && (
          <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>
            {helpText}
          </p>
        )}
      </div>
    )
  }

  const SectionHeader = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>, title: string, description?: string }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: COLORS.border }}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${COLORS.primary}15` }}
      >
        <Icon className="w-5 h-5" style={{ color: COLORS.primary }} />
      </div>
      <div>
        <h3
          className="font-semibold font-heading"
          style={{
            color: COLORS.textPrimary,
            fontSize: '18px',
          }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {description}
          </p>
        )}
      </div>
    </div>
  )

  const header = (
    <div
      className="relative flex items-center justify-between p-6 border-b sticky top-0 z-10 overflow-hidden"
      style={{
        borderColor: COLORS.border,
        background: COLORS.primaryGradient,
        borderRadius: '16px 16px 0 0',
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.textOnPrimary }}>
            {item ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {item ? 'Actualiza la informacion del producto' : 'Agrega un nuevo producto al inventario'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={confirmClose}
        className="p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={confirmClose}
      title={item ? 'Editar producto' : 'Nuevo producto'}
      header={header}
      size="lg"
      scrollable={true}
    >
      <form action={formAction} key={item?.id ?? 'new'} className="p-0">
        <input type="hidden" name="organization_id" value={organizationId} />
        <input type="hidden" name="intent" value={item ? 'update' : 'create'} />
        {item && <input type="hidden" name="id" value={item.id} />}

        {state.error && (
          <div
            className="p-4 rounded-xl text-sm mb-6 flex items-start gap-3"
            style={{ backgroundColor: COLORS.errorLight, color: COLORS.danger }}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error al guardar</p>
              <p className="text-sm opacity-90">{state.error}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <SectionHeader icon={Tag} title="Informacion basica" description="Datos generales del producto" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(
              'name',
              'Nombre del producto *',
              <input
                type="text"
                name="name"
                id={fieldIds.name}
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                {...focusHandlers}
                placeholder="Ej: Shampoo fortalecedor"
                style={inputStyle(!!serverError('name'))}
                className="border-2 focus:outline-none transition-colors"
              />
            )}

            {renderField(
              'sku',
              'Codigo SKU',
              <input
                type="text"
                name="sku"
                id={fieldIds.sku}
                value={formData.sku}
                onChange={(e) => handleFieldChange('sku', e.target.value)}
                {...focusHandlers}
                placeholder="Ej: SHM-001"
                style={inputStyle(!!serverError('sku'))}
                className="border-2 focus:outline-none transition-colors"
              />,
              'Codigo interno de identificacion'
            )}

            {renderField(
              'category',
              'Categoria',
              <div>
                <input
                  type="text"
                  name="category"
                  id={fieldIds.category}
                  list="categories"
                  value={formData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  {...focusHandlers}
                  placeholder="Seleccionar o crear categoria"
                  style={inputStyle(false)}
                  className="border-2 focus:outline-none transition-colors"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>,
              'Agrupa productos similares'
            )}

            {renderField(
              'unit',
              'Unidad de medida',
              <select
                name="unit"
                id={fieldIds.unit}
                value={formData.unit}
                onChange={(e) => handleFieldChange('unit', e.target.value)}
                {...focusHandlers}
                style={inputStyle(false)}
                className="border-2 focus:outline-none transition-colors"
              >
                <option value="pieza">Pieza</option>
                <option value="kg">Kilogramo (kg)</option>
                <option value="g">Gramo (g)</option>
                <option value="lt">Litro (L)</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="caja">Caja</option>
                <option value="paquete">Paquete</option>
                <option value="sobre">Sobre</option>
                <option value="tubo">Tubo</option>
                <option value="frasco">Frasco</option>
              </select>
            )}

            {renderField(
              'description',
              'Descripcion',
              <textarea
                name="description"
                id={fieldIds.description}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                {...focusHandlers}
                style={{ ...inputStyle(false), minHeight: '80px', resize: 'vertical' as const }}
                className="border-2 focus:outline-none transition-colors"
                placeholder="Descripcion opcional del producto..."
              />
            )}
          </div>
        </div>

        <div className="mb-8">
          <SectionHeader icon={Boxes} title="Control de inventario" description="Gestiona el stock de tu producto" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(
              'quantity',
              'Cantidad en stock',
              <input
                type="number"
                name="quantity"
                id={fieldIds.quantity}
                min="0"
                value={formData.quantity}
                onChange={handleNumericChange('quantity')}
                {...focusHandlers}
                style={inputStyle(!!serverError('quantity'))}
                className="border-2 focus:outline-none transition-colors"
              />,
              undefined,
              'Cantidad actual disponible en inventario'
            )}

            {renderField(
              'min_quantity',
              'Stock minimo',
              <input
                type="number"
                name="min_quantity"
                id={fieldIds.min_quantity}
                min="0"
                value={formData.min_quantity}
                onChange={handleNumericChange('min_quantity')}
                {...focusHandlers}
                style={inputStyle(!!serverError('min_quantity'))}
                className="border-2 focus:outline-none transition-colors"
              />,
              'Alerta cuando el stock llegue a este numero',
              'Recibiras una alerta cuando el stock alcance este nivel'
            )}
          </div>
        </div>

        <div className="mb-6">
          <SectionHeader icon={DollarSign} title="Precios" description="Configura el precio de venta y costo" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(
              'price',
              'Precio de venta',
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: COLORS.textMuted }}>
                  $
                </span>
                <input
                  type="number"
                  name="price"
                  id={fieldIds.price}
                  step="0.01"
                  min="0"
                  value={formData.price ?? ''}
                  onChange={handleNumericChange('price')}
                  {...focusHandlers}
                  placeholder="0.00"
                  style={{ ...inputStyle(!!serverError('price')), paddingLeft: '32px' }}
                  className="border-2 focus:outline-none transition-colors"
                />
              </div>,
              'Precio al que venderas el producto'
            )}

            {renderField(
              'cost_price',
              'Precio de costo',
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: COLORS.textMuted }}>
                  $
                </span>
                <input
                  type="number"
                  name="cost_price"
                  id={fieldIds.cost_price}
                  step="0.01"
                  min="0"
                  value={formData.cost_price ?? ''}
                  onChange={handleNumericChange('cost_price')}
                  {...focusHandlers}
                  placeholder="0.00"
                  style={{ ...inputStyle(!!serverError('cost_price')), paddingLeft: '32px' }}
                  className="border-2 focus:outline-none transition-colors"
                />
              </div>,
              'Cuanto te cuesta obtener el producto'
            )}
          </div>

          {previewPrice && previewCost && (
            <div className="mt-4 p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: COLORS.surfaceSubtle }}>
              <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                Margen de ganancia:
              </span>
              <span
                className="font-bold text-lg font-heading"
                style={{
                  color: parseFloat(previewPrice) > parseFloat(previewCost) ? COLORS.success : COLORS.danger,
                }}
              >
                {parseFloat(previewCost) > 0 ? (
                  <>
                    {parseFloat(previewPrice) > parseFloat(previewCost) ? '+' : ''}
                    {Math.round(((parseFloat(previewPrice) - parseFloat(previewCost)) / parseFloat(previewCost)) * 100)}%
                  </>
                ) : '\u2014'}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6 border-t" style={{ borderColor: COLORS.border }}>
          <button
            type="button"
            onClick={confirmClose}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium text-base transition-all hover:opacity-90 cursor-pointer"
            style={{
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: COLORS.primaryGradient,
              color: COLORS.textOnPrimary,
            }}
          >
            {isPending ? (
              <>
                <Spinner size="sm" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {item ? 'Actualizar producto' : 'Crear producto'}
              </>
            )}
          </button>
        </div>
      </form>
      {closeDialog}
    </Modal>
  )
}
