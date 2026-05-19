'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Wallet,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Search,
  CreditCard,
  ChevronRight,
  X,
  Clock,
  Phone,
  Mail,
  Download,
  ArrowUpDown,
} from 'lucide-react'
import Link from 'next/link'
import type { ClientAccountWithClient } from '@/types/clientAccounts'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'

interface ClientAccountsClientProps {
  accounts: ClientAccountWithClient[]
  summary?: {
    total_balance: number
    total_credit_used: number
    total_credit_available: number
    clients_with_balance: number
    clients_at_warning: number
    clients_over_limit: number
  }
  organizationId: string
  userRole: string
}

type SortOption = 'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc' | 'last_transaction'
type FilterOption = 'all' | 'over_limit' | 'warning' | 'healthy'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'balance_desc', label: 'Por saldo (mayor)' },
  { value: 'balance_asc', label: 'Por saldo (menor)' },
  { value: 'name_asc', label: 'A - Z' },
  { value: 'name_desc', label: 'Z - A' },
  { value: 'last_transaction', label: 'Última transacción' },
]

const FILTER_CHIPS: { value: FilterOption; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: '' },
  { value: 'over_limit', label: 'Sobre límite', color: '#DC2626' },
  { value: 'warning', label: 'Warning', color: '#D97706' },
  { value: 'healthy', label: 'Al día', color: '#16A34A' },
]

function formatLastTransaction(dateStr: string | null): string {
  if (!dateStr) return 'Sin actividad'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function exportToCSV(accounts: ClientAccountWithClient[]) {
  const headers = ['Cliente', 'Teléfono', 'Email', 'Saldo', 'Límite de Crédito', 'Estado', 'Última Transacción']
  const rows = accounts.map((a) => [
    a.client?.name || '',
    a.client?.phone || '',
    a.client?.email || '',
    a.balance.toString(),
    a.credit_limit.toString(),
    a.is_over_limit ? 'Sobre límite' : a.is_at_warning_threshold ? 'Warning' : 'Normal',
    a.last_transaction_at ? new Date(a.last_transaction_at).toLocaleDateString('es-CO') : '',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cuentas-por-cobrar-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getStatusLabel(account: ClientAccountWithClient): { label: string; color: string; bg: string } | null {
  if (account.is_over_limit) return { label: 'Sobre límite', color: '#DC2626', bg: '#FEE2E2' }
  if (account.is_at_warning_threshold) return { label: 'Warning', color: '#D97706', bg: '#FEF3C7' }
  if (account.balance > 0) return { label: 'Al día', color: '#16A34A', bg: '#D1FAE5' }
  return null
}

export function ClientAccountsClient({
  accounts,
  summary,
  organizationId,
}: ClientAccountsClientProps) {
  const COLORS = useThemeColors()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('balance_desc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const sortBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node) &&
        sortBtnRef.current &&
        !sortBtnRef.current.contains(e.target as Node)
      ) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const processedAccounts = useMemo(() => {
    let result = [...accounts]

    if (filterBy === 'over_limit') {
      result = result.filter((a) => a.is_over_limit)
    } else if (filterBy === 'warning') {
      result = result.filter((a) => a.is_at_warning_threshold && !a.is_over_limit)
    } else if (filterBy === 'healthy') {
      result = result.filter((a) => !a.is_at_warning_threshold && !a.is_over_limit)
    }

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.client?.name?.toLowerCase().includes(q) ||
          a.client?.phone?.includes(debouncedQuery) ||
          a.client?.email?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'balance_desc':
          return b.balance - a.balance
        case 'balance_asc':
          return a.balance - b.balance
        case 'name_asc':
          return (a.client?.name || '').localeCompare(b.client?.name || '')
        case 'name_desc':
          return (b.client?.name || '').localeCompare(a.client?.name || '')
        case 'last_transaction': {
          const aDate = a.last_transaction_at ? new Date(a.last_transaction_at).getTime() : 0
          const bDate = b.last_transaction_at ? new Date(b.last_transaction_at).getTime() : 0
          return bDate - aDate
        }
        default:
          return 0
      }
    })

    return result
  }, [accounts, debouncedQuery, sortBy, filterBy])

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Ordenar'

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: COLORS.surfaceSubtle }}>
          <div className="h-4 w-24 rounded mb-2" style={{ backgroundColor: COLORS.border }} />
          <div className="h-8 w-56 rounded mb-2" style={{ backgroundColor: COLORS.border }} />
          <div className="h-4 w-40 rounded" style={{ backgroundColor: COLORS.border }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border"
              style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: COLORS.border }} />
                <div className="h-3 w-24 rounded" style={{ backgroundColor: COLORS.border }} />
              </div>
              <div className="h-7 w-28 rounded" style={{ backgroundColor: COLORS.border }} />
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}>
          <div className="h-11 rounded-xl" style={{ backgroundColor: COLORS.border }} />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border"
              style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: COLORS.border }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded" style={{ backgroundColor: COLORS.border }} />
                  <div className="h-3 w-24 rounded" style={{ backgroundColor: COLORS.border }} />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-5 w-20 rounded ml-auto" style={{ backgroundColor: COLORS.border }} />
                  <div className="h-3 w-14 rounded ml-auto" style={{ backgroundColor: COLORS.border }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/[0.03] rounded-full" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Gestión de Cartera
              </p>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Cuentas por Cobrar
              </h1>
              <p className="text-sm mt-1 text-white/80">
                Controla las ventas a crédito de tus clientes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCSV(processedAccounts)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {summary && (
          <div className="relative mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              {summary.clients_with_balance} clientes con saldo
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              {formatCurrencyCOP(summary.total_balance)} en cartera
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              {summary.clients_at_warning + summary.clients_over_limit} en riesgo
            </span>
          </div>
        )}
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total por Cobrar */}
        <div
          className="relative p-4 md:p-5 rounded-2xl border transition-all duration-200"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}>
              <DollarSign className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Total por Cobrar
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {summary ? formatCurrencyCOP(summary.total_balance) : '$0'}
          </p>
          {summary && summary.total_credit_available > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
              <div className="flex justify-between text-xs" style={{ color: COLORS.textMuted }}>
                <span>Crédito disponible</span>
                <span style={{ color: COLORS.success }}>{formatCurrencyCOP(summary.total_credit_available)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Clientes Deudores */}
        <div
          className="relative p-4 md:p-5 rounded-2xl border transition-all duration-200"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Clientes Deudores
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {summary?.clients_with_balance || 0}
          </p>
          {accounts.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((summary?.clients_with_balance || 0) / accounts.length * 100, 100)}%`,
                    backgroundColor: COLORS.warning,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* En Warning */}
        <div
          className="relative p-4 md:p-5 rounded-2xl border transition-all duration-200"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.amberLight || COLORS.warning + '15' }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              En Warning
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold" style={{ color: COLORS.warning }}>
            {summary?.clients_at_warning || 0}
          </p>
          {summary && summary.clients_with_balance > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
              <div className="flex justify-between text-xs" style={{ color: COLORS.textMuted }}>
                <span>Del total deudores</span>
                <span style={{ color: COLORS.warning }}>
                  {Math.round((summary.clients_at_warning / Math.max(summary.clients_with_balance, 1)) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sobre Límite */}
        <div
          className="relative p-4 md:p-5 rounded-2xl border transition-all duration-200"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.error + '15' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: COLORS.error }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Sobre Límite
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold" style={{ color: COLORS.error }}>
            {summary?.clients_over_limit || 0}
          </p>
          {summary && summary.clients_over_limit > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
              <div className="flex justify-between text-xs" style={{ color: COLORS.textMuted }}>
                <span>Requiere atención</span>
                <span style={{ color: COLORS.error }}>
                  {Math.round((summary.clients_over_limit / Math.max(summary.clients_with_balance, 1)) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: COLORS.textMuted }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border text-sm transition-all duration-200"
              style={{
                borderColor: searchQuery ? COLORS.primary : COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary
                e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}15`
              }}
              onBlur={(e) => {
                if (!searchQuery) e.currentTarget.style.borderColor = COLORS.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              ref={sortBtnRef}
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 w-full sm:w-auto"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
            >
              <ArrowUpDown className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <span className="sm:hidden">Ordenar</span>
            </button>

            {showSortMenu && (
              <div
                ref={sortMenuRef}
                className="absolute right-0 top-full mt-1 w-56 rounded-xl border shadow-lg overflow-hidden z-20"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortMenu(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-150"
                    style={{
                      color: sortBy === option.value ? COLORS.primary : COLORS.textPrimary,
                      backgroundColor: sortBy === option.value ? COLORS.primary + '10' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (sortBy !== option.value) e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle
                    }}
                    onMouseLeave={(e) => {
                      if (sortBy !== option.value) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_CHIPS.map((chip) => {
            const isActive = filterBy === chip.value
            return (
              <button
                key={chip.value}
                onClick={() => setFilterBy(chip.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                style={{
                  backgroundColor: isActive ? COLORS.primary : 'transparent',
                  color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                  border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`,
                }}
              >
                {chip.color && chip.value !== 'all' && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isActive ? '#FFFFFF' : chip.color }}
                  />
                )}
                {chip.label}
              </button>
            )
          })}

          {(debouncedQuery || filterBy !== 'all' || sortBy !== 'balance_desc') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setDebouncedQuery('')
                setFilterBy('all')
                setSortBy('balance_desc')
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ml-auto"
              style={{
                color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Accounts List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Clientes con Cuenta
          </h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSubtle }}>
            {processedAccounts.length} de {accounts.length}
          </span>
        </div>

        {processedAccounts.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl border"
            style={{
              backgroundColor: COLORS.surfaceGlass,
              borderColor: COLORS.border,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ backgroundColor: COLORS.primary + '15' }}
            >
              <CreditCard className="w-10 h-10" style={{ color: COLORS.primary }} />
            </div>
            <p className="text-lg font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
              {debouncedQuery || filterBy !== 'all'
                ? 'Sin resultados para esta búsqueda'
                : 'No hay cuentas por cobrar'}
            </p>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: COLORS.textSecondary }}>
              {debouncedQuery || filterBy !== 'all'
                ? 'Intenta con otros términos de búsqueda o ajusta los filtros aplicados.'
                : 'Los clientes con compras a crédito aparecerán aquí automáticamente.'}
            </p>
            {(debouncedQuery || filterBy !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setDebouncedQuery('')
                  setFilterBy('all')
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200"
                style={{ backgroundColor: COLORS.primary }}
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {processedAccounts.map((account, index) => {
              const status = getStatusLabel(account)
              const progressPct = account.credit_limit > 0
                ? Math.min((account.balance / account.credit_limit) * 100, 100)
                : 0
              const progressColor = account.is_over_limit
                ? COLORS.error
                : account.is_at_warning_threshold
                ? COLORS.warning
                : COLORS.success
              const accentColor = account.is_over_limit
                ? COLORS.error
                : account.is_at_warning_threshold
                ? COLORS.warning
                : COLORS.success

              return (
                <Link
                  key={account.id}
                  href={`/clients/${account.client_id}/account`}
                  className="relative block rounded-2xl border transition-all duration-200 overflow-hidden group"
                  style={{
                    backgroundColor: COLORS.surfaceGlass,
                    borderColor: COLORS.border,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.12)'
                    e.currentTarget.style.borderColor = accentColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = COLORS.border
                  }}
                >
                  {/* Accent border */}
                  <div
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-200 group-hover:top-0 group-hover:bottom-0"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div className="p-4 md:p-5 pl-5 md:pl-6">
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: avatar + info */}
                      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm md:text-lg font-bold text-white shrink-0 transition-transform duration-200 group-hover:scale-110"
                          style={{
                            background: COLORS.primaryGradient,
                            boxShadow: '0 4px 12px rgba(15, 76, 92, 0.25)',
                          }}
                        >
                          {account.client?.name?.charAt(0).toUpperCase() || '?'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className="font-semibold text-sm md:text-base truncate"
                              style={{ color: COLORS.textPrimary }}
                            >
                              {account.client?.name || 'Cliente'}
                            </h3>
                            {status && (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium shrink-0"
                                style={{
                                  backgroundColor: (COLORS.isDark ? status.color + '25' : status.bg),
                                  color: status.color,
                                }}
                              >
                                {status.label}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            {account.client?.phone && (
                              <span className="inline-flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                                <Phone className="w-3 h-3" />
                                <span className="truncate max-w-[120px] md:max-w-none">{account.client.phone}</span>
                              </span>
                            )}
                            {account.client?.email && (
                              <span className="hidden md:inline-flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{account.client.email}</span>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                              <Clock className="w-3 h-3" />
                              {formatLastTransaction(account.last_transaction_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: balance + chevron */}
                      <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <div className="text-right">
                          <p
                            className="text-base md:text-xl font-bold"
                            style={{ color: account.balance > 0 ? COLORS.textPrimary : COLORS.success }}
                          >
                            {formatCurrencyCOP(account.balance)}
                          </p>
                          <p className="text-[10px] md:text-xs" style={{ color: COLORS.textMuted }}>
                            {account.credit_limit > 0
                              ? `Límite: ${formatCurrencyCOP(account.credit_limit)}`
                              : 'Sin límite'}
                          </p>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 md:w-5 md:h-5 transition-all duration-200 group-hover:translate-x-0.5"
                          style={{ color: COLORS.textMuted }}
                        />
                      </div>
                    </div>

                    {/* Progress bar */}
                    {account.credit_limit > 0 && (
                      <div className="mt-3 md:mt-4">
                        <div className="flex justify-between text-[10px] md:text-xs mb-1">
                          <span style={{ color: COLORS.textMuted }}>Crédito usado</span>
                          <span style={{ color: COLORS.textSecondary }}>
                            {formatCurrencyCOP(account.balance)} / {formatCurrencyCOP(account.credit_limit)}
                          </span>
                        </div>
                        <div
                          className="h-1.5 md:h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: COLORS.surfaceSubtle }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: progressColor,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
