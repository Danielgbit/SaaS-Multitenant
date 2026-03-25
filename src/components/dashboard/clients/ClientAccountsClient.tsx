'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Wallet,
  ChevronRight,
  Loader2,
  Search,
  CreditCard,
  PiggyBank
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { ClientAccountWithClient } from '@/types/clientAccounts'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
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
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

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

export function ClientAccountsClient({
  accounts,
  summary,
  organizationId,
}: ClientAccountsClientProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  const filteredAccounts = accounts.filter((account) =>
    account.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.error + '15' }}>
              <DollarSign className="w-4 h-4" style={{ color: COLORS.error }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Total por Cobrar
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.error }}>
            {summary ? formatCurrencyCOP(summary.total_balance) : '$0'}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Clientes Deudores
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {summary?.clients_with_balance || 0}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              En Warning
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>
            {summary?.clients_at_warning || 0}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.error + '15' }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.error }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Sobre Límite
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.error }}>
            {summary?.clients_over_limit || 0}
          </p>
        </div>
      </div>

      {/* Search */}
      <div
        className="p-4 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
        }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: COLORS.textMuted }} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm"
            style={{
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              backgroundColor: COLORS.surface,
            }}
          />
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        <h2
          className="text-xl font-semibold"
          style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
        >
          Clientes con Cuenta
        </h2>

        {filteredAccounts.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl border"
            style={{
              backgroundColor: COLORS.surfaceGlass,
              borderColor: COLORS.border,
            }}
          >
            <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.textMuted }} />
            <p className="text-lg font-medium" style={{ color: COLORS.textSecondary }}>
              No hay cuentas por cobrar
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Los clientes con compras a crédito aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAccounts.map((account) => (
              <Link
                key={account.id}
                href={`/clients/${account.client_id}/account`}
                className="block p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: COLORS.surfaceGlass,
                  borderColor:
                    account.is_over_limit
                      ? COLORS.error
                      : account.is_at_warning_threshold
                      ? COLORS.warning
                      : COLORS.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{
                        backgroundColor: COLORS.primary + '15',
                        color: COLORS.primary,
                      }}
                    >
                      {account.client?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>
                          {account.client?.name || 'Cliente'}
                        </h3>
                        {account.is_over_limit && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: COLORS.errorLight, color: COLORS.error }}
                          >
                            Sobre límite
                          </span>
                        )}
                        {account.is_at_warning_threshold && !account.is_over_limit && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: COLORS.warningLight, color: COLORS.warning }}
                          >
                            Warning
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>
                        {account.client?.phone || 'Sin teléfono'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className="text-xl font-bold"
                        style={{ color: account.balance > 0 ? COLORS.error : COLORS.success }}
                      >
                        {formatCurrencyCOP(account.balance)}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        {account.credit_limit > 0
                          ? `Límite: ${formatCurrencyCOP(account.credit_limit)}`
                          : 'Sin límite'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  </div>
                </div>

                {account.credit_limit > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: COLORS.textMuted }}>Crédito usado</span>
                      <span style={{ color: COLORS.textSecondary }}>
                        {formatCurrencyCOP(account.balance)} / {formatCurrencyCOP(account.credit_limit)}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: COLORS.surfaceSubtle }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((account.balance / account.credit_limit) * 100, 100)}%`,
                          backgroundColor: account.is_over_limit
                            ? COLORS.error
                            : account.is_at_warning_threshold
                            ? COLORS.warning
                            : COLORS.success,
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}