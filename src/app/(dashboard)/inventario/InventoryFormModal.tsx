'use client'

import { useState, useEffect, useActionState } from 'react'
import { X, Package, Tag, DollarSign, Boxes, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import { Modal, Spinner } from '@/components/ui'
import { Tooltip } from '@/components/ui/Tooltip'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useConfirmClose } from '@/hooks/useConfirmClose'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'
import { saveInventoryItem, type SaveInventoryItemFormState } from '@/actions/inventory/saveInventoryItem'

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
  const [previewPrice, setPreviewPrice] = useState(item?.price ? String(item.price) : '')
  const [previewCost, setPreviewCost] = useState(item?.cost_price ? String(item.cost_price) : '')
  const [isDirty, setIsDirty] = useState(false)
  const { confirmClose } = useConfirmClose(isDirty, onClose)
  const COLORS = useThemeColors()

  useEffect(() => {
    setPreviewPrice(item?.price ? String(item.price) : '')
    setPreviewCost(item?.cost_price ? String(item.cost_price) : '')
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
    marginBottom: '6px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
  }

  const SectionHeader = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>, title: string, description?: string }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: COLORS.border }}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: COLORS.primary + '15' }}
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

  const renderField = (
    name: string,
    label: string,
    field: React.ReactNode,
    helpText?: string,
    tooltip?: string
  ) => {
    const errMsg = serverError(name)
    return (
      <div>
        <label style={labelStyle}>
          {label}
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="w-4 h-4 cursor-help" style={{ color: COLORS.textMuted }} />
            </Tooltip>
          )}
        </label>
        {field}
        {errMsg && (
          <p
            className="text-xs mt-1.5 flex items-center gap-1"
            style={{ color: COLORS.danger }}
          >
            <AlertCircle className="w-3 h-3" />
            {errMsg}
          </p>
        )}
        {helpText && !errMsg && (
          <p
            className="text-xs mt-1.5"
            style={{ color: COLORS.textMuted }}
          >
            {helpText}
          </p>
        )}
      </div>
    )
  }

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
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm"
        >
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2
            className="text-xl font-bold font-heading"
            style={{
              color: COLORS.textOnPrimary,
            }}
          >
            {item ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <p
            className="text-sm"
            style={{
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {item ? 'Actualiza la información del producto' : 'Agrega un nuevo producto al inventario'}
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
      <style jsx>{`@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      <form action={formAction} key={item?.id ?? 'new'} className="p-0">
        <input type="hidden" name="organization_id" value={organizationId} />
        <input type="hidden" name="intent" value={item ? 'update' : 'create'} />
        {item && <input type="hidden" name="id" value={item.id} />}

        {state.error && (
          <div
            className="p-4 rounded-xl text-sm mb-6 flex items-start gap-3"
            style={{
              backgroundColor: COLORS.errorLight,
              color: COLORS.danger,
            }}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error al guardar</p>
              <p className="text-sm opacity-90">{state.error}</p>
            </div>
          </div>
        )}

        {/* Section 1: Información Básica */}
        <div className="mb-8">
          <SectionHeader
            icon={Tag}
            title="Información básica"
            description="Datos generales del producto"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(
              'name',
              'Nombre del producto *',
              <input
                type="text"
                name="name"
                defaultValue={item?.name ?? ''}
                placeholder="Ej: Shampoo fortalecedor"
                style={inputStyle(!!serverError('name'))}
                className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
              />
            )}

            {renderField(
              'sku',
              'Código SKU',
              <input
                type="text"
                name="sku"
                defaultValue={item?.sku ?? ''}
                placeholder="Ej: SHM-001"
                style={inputStyle(!!serverError('sku'))}
                className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
              />,
              'Código interno de identificación'
            )}

            {renderField(
              'category',
              'Categoría',
              <div>
                <input
                  type="text"
                  name="category"
                  list="categories"
                  defaultValue={item?.category ?? ''}
                  placeholder="Seleccionar o crear categoría"
                  style={inputStyle(false)}
                  className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>,
              'Agrupa productos similares'
            )}

            <div>
              <label style={labelStyle}>Unidad de medida</label>
              <select
                name="unit"
                defaultValue={item?.unit ?? 'pieza'}
                style={inputStyle(false)}
                className={`border-2 focus:outline-none transition-colors bg-white dark:bg-slate-900 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
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
            </div>

            <div className="col-span-2">
              <label style={labelStyle}>Descripción</label>
              <textarea
                name="description"
                defaultValue={item?.description ?? ''}
                style={{ ...inputStyle(false), minHeight: '80px', resize: 'vertical' as const }}
                className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                placeholder="Descripción opcional del producto..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Inventario */}
        <div className="mb-8">
          <SectionHeader
            icon={Boxes}
            title="Control de inventario"
            description="Gestiona el stock de tu producto"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(
              'quantity',
              'Cantidad en stock',
              <input
                type="number"
                name="quantity"
                min="0"
                defaultValue={item?.quantity?.toString() ?? '0'}
                style={inputStyle(!!serverError('quantity'))}
                className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
              />,
              undefined,
              'Cantidad actual disponible en inventario'
            )}

            {renderField(
              'min_quantity',
              'Stock mínimo',
              <input
                type="number"
                name="min_quantity"
                min="0"
                defaultValue={item?.min_quantity?.toString() ?? '5'}
                style={inputStyle(!!serverError('min_quantity'))}
                className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
              />,
              'Alerta cuando el stock llegue a este número',
              'Recibirás una alerta cuando el stock alcance este nivel'
            )}
          </div>
        </div>

        {/* Section 3: Precios */}
        <div className="mb-6">
          <SectionHeader
            icon={DollarSign}
            title="Precios"
            description="Configura el precio de venta y costo"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderField(
              'price',
              'Precio de venta',
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: COLORS.textMuted }}
                >
                  $
                </span>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  defaultValue={item?.price ? String(item.price) : ''}
                  onChange={(e) => { setPreviewPrice(e.target.value); setIsDirty(true) }}
                  placeholder="0.00"
                  style={{ ...inputStyle(!!serverError('price')), paddingLeft: '32px' }}
                  className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                />
              </div>,
              'Precio al que venderás el producto'
            )}

            {renderField(
              'cost_price',
              'Precio de costo',
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: COLORS.textMuted }}
                >
                  $
                </span>
                <input
                  type="number"
                  name="cost_price"
                  step="0.01"
                  min="0"
                  defaultValue={item?.cost_price ? String(item.cost_price) : ''}
                  onChange={(e) => { setPreviewCost(e.target.value); setIsDirty(true) }}
                  placeholder="0.00"
                  style={{ ...inputStyle(!!serverError('cost_price')), paddingLeft: '32px' }}
                  className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                />
              </div>,
              'Cuánto te cuesta obtener el producto'
            )}
          </div>

          {previewPrice && previewCost && (
            <div
              className="mt-4 p-4 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <span
                className="text-sm"
                style={{ color: COLORS.textSecondary }}
              >
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

        {/* Actions */}
        <div
          className="flex gap-3 pt-6 border-t"
          style={{ borderColor: COLORS.border }}
        >
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
    </Modal>
  )
}
