import { describe, it, expect } from 'vitest'
import { dashboardRoutes, filterRoutesByRole } from '@/lib/navigation'

describe('dashboardRoutes', () => {
  it('contiene todas las rutas esperadas', () => {
    const hrefs = dashboardRoutes.map(r => r.href)
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/calendar')
    expect(hrefs).toContain('/horarios')
    expect(hrefs).toContain('/payroll/mi')
    expect(hrefs).toContain('/settings')
  })

  it('define /horarios como ruta de configuración', () => {
    const horarios = dashboardRoutes.find(r => r.href === '/horarios')
    expect(horarios).toBeDefined()
    expect(horarios!.group).toBe('Configuración')
  })
})

describe('filterRoutesByRole', () => {
  it('admin/owner ve 18 rutas (excluye showOnlyForEmpleado)', () => {
    const filtered = filterRoutesByRole(dashboardRoutes, 'admin')
    expect(filtered.length).toBe(18)
  })

  it('staff no ve rutas con hideForStaff', () => {
    const filtered = filterRoutesByRole(dashboardRoutes, 'staff')
    const hasHidden = filtered.some(r => r.href === '/employees')
    expect(hasHidden).toBe(false)
  })

  it('empleado solo ve rutas permitidas', () => {
    const filtered = filterRoutesByRole(dashboardRoutes, 'empleado')
    expect(filtered.some(r => r.href === '/payroll/mi')).toBe(true)
    expect(filtered.some(r => r.href === '/employees')).toBe(false)
    expect(filtered.some(r => r.href === '/horarios')).toBe(false)
  })

  it('showOnlyForEmpleado solo visible para empleado', () => {
    const adminFiltered = filterRoutesByRole(dashboardRoutes, 'admin')
    const empFiltered = filterRoutesByRole(dashboardRoutes, 'empleado')

    expect(adminFiltered.some(r => r.href === '/payroll/mi')).toBe(false)
    expect(empFiltered.some(r => r.href === '/payroll/mi')).toBe(true)
  })

  it('role null/undefined no excluye rutas sin flags', () => {
    const filtered = filterRoutesByRole(dashboardRoutes, null)
    expect(filtered.some(r => r.href === '/dashboard')).toBe(true)
  })
})
