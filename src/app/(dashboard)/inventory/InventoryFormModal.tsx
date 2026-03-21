'use client'

import { useState, useEffect } from 'react'
import { X, Package, Tag, DollarSign, Boxes, AlertCircle, CheckCircle, Loader2, HelpCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { createInventoryItem } from '@/actions/inventory/createInventoryItem'
import { updateInventoryItem } from '@/actions/inventory/updateInventoryItem'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    warning: '#F59E0B',
    warningLight: isDark ? '#451A03' : '#FEF3C7',
    danger: '#DC2626',
    dangerLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
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

interface FieldErrors {
  name?: string
  sku?: string
  category?: string
  quantity?: string
  min_quantity?: string
  price?: string
  cost_price?: string
}

export function InventoryFormModal({ 
  item, 
  categories, 
  organizationId, 
  isOpen, 
  onClose, 
  onSuccess 
}: InventoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const COLORS = useColors()

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    quantity: '0',
    min_quantity: '5',
    price: '',
    cost_price: '',
    unit: 'pieza',
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: item?.name || '',
        sku: item?.sku || '',
        description: item?.description || '',
        category: item?.category || '',
        quantity: item?.quantity?.toString() || '0',
        min_quantity: item?.min_quantity?.toString() || '5',
        price: item?.price?.toString() || '',
        cost_price: item?.cost_price?.toString() || '',
        unit: item?.unit || 'pieza',
      })
      setFieldErrors({})
      setTouched({})
      setError('')
    }
  }, [isOpen, item])

  if (!isOpen) return null

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'El nombre es requerido'
        if (value.length > 100) return 'Máximo 100 caracteres'
        break
      case 'sku':
        if (value.length > 50) return 'Máximo 50 caracteres'
        break
      case 'quantity':
        const qty = parseInt(value)
        if (isNaN(qty) || qty < 0) return 'Debe ser un número positivo'
        break
      case 'min_quantity':
        const minQty = parseInt(value)
        if (isNaN(minQty) || minQty < 0) return 'Debe ser un número positivo'
        break
      case 'price':
        if (value) {
          const price = parseFloat(value)
          if (isNaN(price) || price < 0) return 'Debe ser un número positivo'
        }
        break
      case 'cost_price':
        if (value) {
          const cost = parseFloat(value)
          if (isNaN(cost) || cost < 0) return 'Debe ser un número positivo'
        }
        break
    }
    return undefined
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    const error = validateField(field, formData[field as keyof typeof formData])
    setFieldErrors({ ...fieldErrors, [field]: error })
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (touched[field]) {
      const error = validateField(field, value)
      setFieldErrors({ ...fieldErrors, [field]: error })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors: FieldErrors = {}
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData])
      if (error) errors[key as keyof FieldErrors] = error
    })
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setTouched({ name: true, sku: true, quantity: true, min_quantity: true, price: true, cost_price: true })
      return
    }

    setIsSubmitting(true)
    setError('')

    const categoryValue = formData.category || newCategory

    const data = {
      id: item?.id,
      organization_id: organizationId,
      name: formData.name,
      sku: formData.sku || undefined,
      description: formData.description || undefined,
      category: categoryValue || undefined,
      quantity: parseInt(formData.quantity) || 0,
      min_quantity: parseInt(formData.min_quantity) || 5,
      price: formData.price ? parseFloat(formData.price) : undefined,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
      unit: formData.unit,
    }

    const result = item
      ? await updateInventoryItem(data as any)
      : await createInventoryItem(data as any)

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
      onClose()
    }
  }

  const inputStyle = (hasError: boolean) => ({
    fontFamily: "'Plus Jakarta Sans', sans-serif",
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
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '13px',
    fontWeight: 600 as const,
    color: COLORS.textSecondary,
    marginBottom: '6px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
  }

  const SectionHeader = ({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: COLORS.border }}>
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: COLORS.primary + '15' }}
      >
        <Icon className="w-5 h-5" style={{ color: COLORS.primary }} />
      </div>
      <div>
        <h3 
          className="font-semibold"
          style={{ 
            fontFamily: "'Cormorant Garamond', serif",
            color: COLORS.textPrimary,
            fontSize: '18px'
          }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
  ) => (
    <div>
      <label style={labelStyle}>
        {label}
        {tooltip && (
          <div className="relative">
            <HelpCircle 
              className="w-4 h-4 cursor-help"
              style={{ color: COLORS.textMuted }}
              onMouseEnter={() => setShowTooltip(name)}
              onMouseLeave={() => setShowTooltip(null)}
            />
            {showTooltip === name && (
              <div 
                className="absolute left-0 top-full mt-2 w-48 p-3 rounded-lg text-xs z-10 shadow-lg"
                style={{ 
                  backgroundColor: '#1E293B', 
                  color: '#FFFFFF',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  zIndex: 50
                }}
              >
                {tooltip}
              </div>
            )}
          </div>
        )}
      </label>
      {field}
      {fieldErrors[name as keyof FieldErrors] && touched[name] && (
        <p 
          className="text-xs mt-1.5 flex items-center gap-1"
          style={{ color: COLORS.danger, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <AlertCircle className="w-3 h-3" />
          {fieldErrors[name as keyof FieldErrors]}
        </p>
      )}
      {helpText && !fieldErrors[name as keyof FieldErrors] && (
        <p 
          className="text-xs mt-1.5"
          style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {helpText}
        </p>
      )}
    </div>
  )

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.overlay, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: COLORS.surface,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${COLORS.border}`,
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>

        {/* Header con gradiente */}
        <div 
          className="relative flex items-center justify-between p-6 border-b sticky top-0 z-10 overflow-hidden"
          style={{ 
            borderColor: COLORS.border,
            background: COLORS.primaryGradient,
            borderRadius: '16px 16px 0 0'
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
                className="text-xl font-bold"
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#FFFFFF' 
                }}
              >
                {item ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: 'rgba(255,255,255,0.8)' 
                }}
              >
                {item ? 'Actualiza la información del producto' : 'Agrega un nuevo producto al inventario'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div 
              className="p-4 rounded-xl text-sm mb-6 flex items-start gap-3"
              style={{ 
                backgroundColor: COLORS.errorLight,
                color: COLORS.danger,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error al guardar</p>
                <p className="text-sm opacity-90">{error}</p>
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
            
            <div className="grid grid-cols-2 gap-4">
              {renderField(
                'name',
                'Nombre del producto *',
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Ej: Shampoo fortalecedor"
                  style={inputStyle(!!fieldErrors.name && touched.name)}
                  className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                />
              )}

              {renderField(
                'sku',
                'Código SKU',
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  onBlur={() => handleBlur('sku')}
                  placeholder="Ej: SHM-001"
                  style={inputStyle(!!fieldErrors.sku && touched.sku)}
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
                    list="categories"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value && !categories.includes(e.target.value)) {
                        setNewCategory(e.target.value)
                      }
                    }}
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
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
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
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
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
            
            <div className="grid grid-cols-2 gap-4">
              {renderField(
                'quantity',
                'Cantidad en stock',
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  onBlur={() => handleBlur('quantity')}
                  style={inputStyle(!!fieldErrors.quantity && touched.quantity)}
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
                  min="0"
                  value={formData.min_quantity}
                  onChange={(e) => handleChange('min_quantity', e.target.value)}
                  onBlur={() => handleBlur('min_quantity')}
                  style={inputStyle(!!fieldErrors.min_quantity && touched.min_quantity)}
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
            
            <div className="grid grid-cols-2 gap-4">
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
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    onBlur={() => handleBlur('price')}
                    placeholder="0.00"
                    style={{ ...inputStyle(!!fieldErrors.price && touched.price), paddingLeft: '32px' }}
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
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => handleChange('cost_price', e.target.value)}
                    onBlur={() => handleBlur('cost_price')}
                    placeholder="0.00"
                    style={{ ...inputStyle(!!fieldErrors.cost_price && touched.cost_price), paddingLeft: '32px' }}
                    className={`border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                  />
                </div>,
                'Cuánto te cuesta obtener el producto'
              )}
            </div>

            {formData.price && formData.cost_price && (
              <div 
                className="mt-4 p-4 rounded-xl flex items-center justify-between"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <span 
                  className="text-sm"
                  style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Margen de ganancia:
                </span>
                <span 
                  className="font-bold text-lg"
                  style={{ 
                    color: parseFloat(formData.price) > parseFloat(formData.cost_price) ? COLORS.success : COLORS.danger,
                    fontFamily: "'Cormorant Garamond', serif"
                  }}
                >
                  {parseFloat(formData.price) > parseFloat(formData.cost_price) ? '+' : ''}
                  {Math.round(((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.cost_price)) * 100)}%
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
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-xl font-medium transition-all hover:opacity-90 cursor-pointer"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textSecondary,
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.surface,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: COLORS.primaryGradient,
                color: '#FFFFFF',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
      </div>
    </div>
  )
}
