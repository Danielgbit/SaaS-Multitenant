'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Search, SearchX, X, ArrowUpRight, ArrowDownRight, CircleDot, Receipt, Package, Users, Banknote } from 'lucide-react'
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/cash-sessions'
import { Badge } from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import { formatTime12h } from '@/lib/utils/date-formatters'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }

const GROUP_FILTERS = [
  { key: 'all', label: 'Todo', icon: <CircleDot className="w-3 h-3" /> },
  { key: 'operational', label: 'Operacional', icon: <ArrowUpRight className="w-3 h-3" /> },
  { key: 'inventory', label: 'Inventario', icon: <Package className="w-3 h-3" /> },
  { key: 'payroll', label: 'Nómina', icon: <Users className="w-3 h-3" /> },
  { key: 'system', label: 'Sistema', icon: <Receipt className="w-3 h-3" /> },
]

function getEntryIcon(entryType: string) {
  switch (entryType) {
    case 'income': return <ArrowUpRight className="w-3 h-3" />
    case 'expense': return <ArrowDownRight className="w-3 h-3" />
    case 'payroll_expense': return <Users className="w-3 h-3" />
    case 'product_sale': return <Receipt className="w-3 h-3" />
    case 'account_payment': return <Banknote className="w-3 h-3" />
    case 'inventory_purchase': return <Package className="w-3 h-3" />
    case 'inventory_out': return <Package className="w-3 h-3" />
    default: return <CircleDot className="w-3 h-3" />
  }
}

function getEntryBadgeVariant(entryType: string): BadgeVariant {
  switch (entryType) {
    case 'income': return 'success'
    case 'expense': return 'error'
    case 'payroll_expense': return 'warning'
    case 'product_sale': return 'primary'
    case 'account_payment': return 'success'
    case 'inventory_purchase': return 'info'
    case 'inventory_out': return 'info'
    case 'adjustment': return 'neutral'
    case 'note': return 'neutral'
    case 'break': return 'neutral'
    default: return 'neutral'
  }
}

function EmptyStateIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
      <rect x="10" y="20" width="60" height="45" rx="6" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.15"/>
      <rect x="15" y="28" width="30" height="8" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="15" y="40" width="20" height="6" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="15" y="50" width="25" height="6" rx="2" fill="currentColor" opacity="0.1"/>
      <circle cx="58" cy="54" r="12" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2"/>
      <path d="M54 54L57 57L62 51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
      <path d="M40 12V20M40 12L35 16M40 12L45 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25"/>
    </svg>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function CashTimeline({ entries, onVoid }: { entries: any[]; onVoid?: (entry: any) => void }) {
  const COLORS = useThemeColors()
  const [groupFilter, setGroupFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchInput, 300)

  const visibleEntries = useMemo(() => {
    let result = groupFilter === 'all'
      ? entries
      : entries.filter((e: any) => e.entry_group === groupFilter)

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((e: any) =>
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.entry_type || '').toLowerCase().includes(q)
      )
    }

    return result.slice(0, 200)
  }, [entries, groupFilter, debouncedSearch])

  const hasEntries = entries?.length > 0

  const handleClearSearch = () => {
    setSearchInput('')
    searchRef.current?.focus()
  }

  if (!hasEntries) {
    return (
      <div
        className="rounded-[20px] p-10 text-center flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadow.md }}
      >
        <div style={{ color: COLORS.textMuted }}>
          <EmptyStateIllustration />
        </div>
        <h3 className="text-base font-semibold mb-1" style={{ color: COLORS.textPrimary }}>Sin movimientos hoy</h3>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Los ingresos aparecerán automáticamente</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-[20px] flex flex-col"
      style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadow.md }}
    >
      <div className="p-4 lg:p-5 border-b" style={{ borderColor: COLORS.border }}>
        <h2 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Movimientos del día</h2>
      </div>

      <div className="px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 p-1 rounded-xl w-fit min-w-max" style={{ backgroundColor: COLORS.surfaceSubtle }}>
          {GROUP_FILTERS.map((f) => {
            const isActive = groupFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setGroupFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8] ${isActive ? '' : 'hover:opacity-70'}`}
                style={{
                  backgroundColor: isActive ? COLORS.surface : 'transparent',
                  color: isActive ? COLORS.primary : COLORS.textMuted,
                  boxShadow: isActive ? COLORS.shadow.sm : 'none',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {f.icon}
                  {f.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: COLORS.textMuted }} />
          <input
            ref={searchRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSearchInput(''); searchRef.current?.blur() } }}
            placeholder="Buscar movimientos..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl outline-none transition-all"
            style={{
              backgroundColor: COLORS.surfaceSubtle,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textPrimary,
            }}
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
              style={{ color: COLORS.textMuted }}
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="p-10 text-center">
          <SearchX className="w-8 h-8 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
          <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>Sin resultados</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Intenta con otros términos</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {visibleEntries.map((e: any) => {
            const isVoided = e.entry_status === 'voided'
            const directionColor = isVoided
              ? COLORS.textMuted
              : e.direction === 'in'
                ? COLORS.success
                : e.direction === 'out'
                  ? COLORS.error
                  : COLORS.textSecondary

            const leftBorderColor = isVoided
              ? COLORS.textMuted
              : e.direction === 'in'
                ? COLORS.success
                : e.direction === 'out'
                  ? COLORS.error
                  : COLORS.border

            return (
              <div
                key={e.id}
                className={`flex items-start gap-4 px-5 py-3.5 transition-colors cursor-default ${isVoided ? 'opacity-50' : ''}`}
                style={{
                  borderLeft: `3px solid ${leftBorderColor}`,
                  backgroundColor: isVoided ? 'transparent' : COLORS.surface,
                  opacity: isVoided ? 0.5 : 1,
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => { if (!isVoided) e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                onMouseLeave={(e) => { if (!isVoided) e.currentTarget.style.backgroundColor = COLORS.surface }}
              >
                <div className="flex flex-col items-center gap-1 mt-0.5 w-10 lg:w-12 shrink-0">
                  <span className="text-xs font-mono" style={{ color: COLORS.textMuted }}>{formatTime12h(e.created_at)}</span>
                  <span className="text-lg leading-none" style={{ color: directionColor }}>
                    {e.direction === 'in' ? '↑' : e.direction === 'out' ? '↓' : '•'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getEntryBadgeVariant(e.entry_type)} size="sm">
                      {getEntryIcon(e.entry_type)}
                      {(ENTRY_TYPE_LABELS as any)[e.entry_type] || e.entry_type}
                    </Badge>
                    {isVoided && (
                      <Badge variant="error" size="sm">Anulado</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1.5 leading-snug truncate min-w-0" style={{ color: COLORS.textPrimary }}>{e.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {e.direction && (
                      <>
                        <span className="text-sm font-semibold" style={{ color: directionColor }}>
                          {e.direction === 'in' ? '+ ' : '- '}{fmt(e.amount)}
                        </span>
                        {e.payment_method && (
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>
                            {(PAYMENT_METHOD_LABELS as any)[e.payment_method]}
                          </span>
                        )}
                      </>
                    )}
                    {!e.direction && e.entry_type === 'inventory_out' && e.metadata?.estimated_cost && (
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>
                        Costo est.: {fmt(e.metadata.estimated_cost)}
                      </span>
                    )}
                  </div>
                </div>

                {onVoid && !isVoided && (
                  <button
                    onClick={() => onVoid(e)}
                    className="p-1.5 rounded-lg shrink-0 transition-all hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                    style={{ color: COLORS.textMuted }}
                    aria-label="Anular movimiento"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
          {entries.length > 200 && (
            <div className="p-3 text-center text-xs" style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSubtle }}>
              Mostrando 200 de {entries.length} movimientos
            </div>
          )}
        </div>
      )}
    </div>
  )
}
