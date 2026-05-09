'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

function useColors() {
  return useThemeColors()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

const CONCEPT_LABELS: Record<string, string> = {
  passage: 'Pasaje',
  food: 'Comida',
  product: 'Producto',
  advance: 'Anticipo',
  other: 'Otro',
}

interface ClientAccountSummary {
  balance: number
  total_purchased: number
  total_paid: number
  credit_limit: number | null
  is_over_limit: boolean
  is_at_warning_threshold: boolean
  client: { id: string; name: string; phone: string | null }
}

interface EmployeeLoanSummary {
  id: string
  amount: number
  remaining_amount: number
  concept: string
  status: string
  created_at: string
  employee: { id: string; name: string }
}

interface DebtsOverviewProps {
  clientAccounts: ClientAccountSummary[]
  employeeLoans: EmployeeLoanSummary[]
}

export function DebtsOverview({ clientAccounts, employeeLoans }: DebtsOverviewProps) {
  const COLORS = useColors()
  const [tab, setTab] = useState<'all' | 'clients' | 'employees'>('all')

  const totalClientDebt = clientAccounts.reduce((s, a) => s + a.balance, 0)
  const totalEmployeeDebt = employeeLoans.reduce((s, l) => s + (l.remaining_amount || 0), 0)
  const totalCombined = totalClientDebt + totalEmployeeDebt

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Resumen de Deudas
              </p>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
              >
                Cuentas por Cobrar
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: COLORS.textMuted }}>Total General</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{formatCurrency(totalCombined)}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {clientAccounts.length} clientes · {employeeLoans.length} empleados
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: COLORS.textMuted }}>Clientes</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>{formatCurrency(totalClientDebt)}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{clientAccounts.length} cuentas activas</p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: COLORS.textMuted }}>Empleados</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>{formatCurrency(totalEmployeeDebt)}</p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{employeeLoans.length} préstamos activos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all' as const, label: 'Todas las deudas' },
          { id: 'clients' as const, label: 'Clientes' },
          { id: 'employees' as const, label: 'Empleados' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: tab === t.id ? COLORS.primary : COLORS.surfaceSubtle,
              color: tab === t.id ? '#fff' : COLORS.textSecondary,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Client Accounts */}
      {(tab === 'all' || tab === 'clients') && clientAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
            Clientes con Saldo Pendiente
          </h2>
          <div className="space-y-2">
            {clientAccounts.map((acct) => (
              <Link
                key={acct.client.id}
                href={`/clients/${acct.client.id}/account`}
                className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-sm cursor-pointer"
                style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: acct.is_over_limit ? COLORS.error : COLORS.primary }}
                  >
                    {acct.client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                      {acct.client.name}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {acct.client.phone || 'Sin teléfono'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: acct.is_over_limit ? COLORS.error : COLORS.warning }}>
                      {formatCurrency(acct.balance)}
                    </p>
                    {acct.credit_limit && (
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        {Math.round((acct.balance / acct.credit_limit) * 100)}% del límite
                      </p>
                    )}
                  </div>
                  {acct.is_over_limit && (
                    <AlertTriangle className="w-4 h-4" style={{ color: COLORS.error }} />
                  )}
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/clients/accounts"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: COLORS.primary }}
            >
              Ver cuentas por cobrar →
            </Link>
          </div>
        </div>
      )}

      {/* Employee Loans */}
      {(tab === 'all' || tab === 'employees') && employeeLoans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
            Préstamos de Empleados
          </h2>
          <div className="space-y-2">
            {employeeLoans.map((loan) => (
              <Link
                key={loan.id}
                href={`/payroll/${loan.employee.id}`}
                className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-sm cursor-pointer"
                style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: COLORS.warning }}
                  >
                    {loan.employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                      {loan.employee.name}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {CONCEPT_LABELS[loan.concept] || loan.concept} · {new Date(loan.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: COLORS.warning }}>
                      {formatCurrency(loan.remaining_amount)}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {loan.status === 'partial' ? 'Abono parcial' : 'Pendiente'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/payroll"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: COLORS.primary }}
            >
              Ir a nómina →
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {clientAccounts.length === 0 && employeeLoans.length === 0 && (
        <div
          className="text-center py-16 px-6 rounded-2xl border border-dashed"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <DollarSign className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            No hay deudas activas. ¡Todo al día!
          </p>
        </div>
      )}
    </div>
  )
}
