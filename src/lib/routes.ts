import { dashboardRoutes, routeKey } from './navigation'

const ROUTE_MAP_EXTENSIONS: Record<string, { label: string }> = {
  'mi-payroll': { label: 'Mi Nómina' },
  'mi-schedule': { label: 'Mi Horario' },
  'payroll-mi': { label: 'Mi Nómina' },
  'clients-accounts': { label: 'Cuentas por Cobrar' },
  'notificaciones-validacion': { label: 'Validación V2' },
  'notificaciones-messages': { label: 'Inspector' },
  'notificaciones-dead-letter': { label: 'Dead Letter' },
}

export const ROUTE_MAP: Record<string, { label: string }> = Object.fromEntries(
  dashboardRoutes.map(r => [routeKey(r.href), { label: r.label }])
)

for (const [key, value] of Object.entries(ROUTE_MAP_EXTENSIONS)) {
  ROUTE_MAP[key] = value
}