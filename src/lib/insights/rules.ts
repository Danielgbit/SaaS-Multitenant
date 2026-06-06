import type { InsightRule } from './types'

export const insightRules: InsightRule[] = [
  {
    id: 'revenue-drop',
    evaluate: (ctx) => {
      if (ctx.revenueChange < -15) {
        return {
          id: 'revenue-drop',
          type: 'critical',
          title: 'Caída de ingresos',
          description: `Los ingresos bajaron ${Math.abs(ctx.revenueChange)}% vs el período anterior`,
          metric: `${ctx.revenueChange}%`,
          category: 'revenue',
          action: { label: 'Ver detalle', href: '/facturacion' },
          dismissible: true,
          severity: 9,
        }
      }
      if (ctx.revenueChange < -5) {
        return {
          id: 'revenue-drop-mild',
          type: 'warning',
          title: 'Los ingresos están bajando',
          description: `Bajaron ${Math.abs(ctx.revenueChange)}% respecto al período anterior`,
          metric: `${ctx.revenueChange}%`,
          category: 'revenue',
          action: { label: 'Ver facturación', href: '/facturacion' },
          dismissible: true,
          severity: 5,
        }
      }
      return null
    },
  },
  {
    id: 'revenue-growth',
    evaluate: (ctx) => {
      if (ctx.revenueChange > 20) {
        return {
          id: 'revenue-growth',
          type: 'success',
          title: 'Crecimiento de ingresos',
          description: `Los ingresos crecieron ${ctx.revenueChange}% vs el período anterior`,
          metric: `+${ctx.revenueChange}%`,
          category: 'revenue',
          dismissible: true,
          severity: 7,
        }
      }
      return null
    },
  },
  {
    id: 'cancellation-spike',
    evaluate: (ctx) => {
      const cancelRate = 100 - ctx.completionRate
      if (cancelRate > 30) {
        return {
          id: 'cancellation-spike',
          type: 'critical',
          title: 'Alta tasa de cancelación',
          description: `${cancelRate.toFixed(0)}% de las citas no se completaron. Revisa las razones.`,
          metric: `${cancelRate.toFixed(0)}%`,
          category: 'operations',
          action: { label: 'Ver agenda', href: '/calendar' },
          dismissible: true,
          severity: 8,
        }
      }
      if (cancelRate > 20) {
        return {
          id: 'cancellation-warning',
          type: 'warning',
          title: 'Cancelaciones en aumento',
          description: `${cancelRate.toFixed(0)}% de las citas no se completaron.`,
          metric: `${cancelRate.toFixed(0)}%`,
          category: 'operations',
          action: { label: 'Ver agenda', href: '/calendar' },
          dismissible: true,
          severity: 5,
        }
      }
      return null
    },
  },
  {
    id: 'whatsapp-failing',
    evaluate: (ctx) => {
      if (ctx.whatsappFailedCount > 5) {
        return {
          id: 'whatsapp-failing',
          type: 'critical',
          title: 'WhatsApp con errores',
          description: `${ctx.whatsappFailedCount} mensajes fallaron recientemente. Revisa la configuración.`,
          metric: `${ctx.whatsappFailedCount} fallos`,
          category: 'alerts',
          action: { label: 'Ir a WhatsApp', href: '/whatsapp' },
          dismissible: true,
          severity: 8,
        }
      }
      if (ctx.whatsappFailedCount > 2) {
        return {
          id: 'whatsapp-warning',
          type: 'warning',
          title: 'Mensajes de WhatsApp con errores',
          description: `${ctx.whatsappFailedCount} mensajes no se pudieron enviar.`,
          metric: `${ctx.whatsappFailedCount} fallos`,
          category: 'alerts',
          action: { label: 'Ir a WhatsApp', href: '/whatsapp' },
          dismissible: true,
          severity: 5,
        }
      }
      return null
    },
  },
  {
    id: 'unconfirmed-urgent',
    evaluate: (ctx) => {
      if (ctx.unconfirmedCount > 10) {
        return {
          id: 'unconfirmed-urgent',
          type: 'warning',
          title: `${ctx.unconfirmedCount} citas sin confirmar`,
          description: 'Muchas citas están pendientes de confirmación. Envía recordatorios.',
          metric: `${ctx.unconfirmedCount} pendientes`,
          category: 'operations',
          action: { label: 'Confirmar ahora', href: '/confirmations' },
          dismissible: true,
          severity: 7,
        }
      }
      if (ctx.unconfirmedCount > 5) {
        return {
          id: 'unconfirmed-warning',
          type: 'info',
          title: `${ctx.unconfirmedCount} citas sin confirmar`,
          description: 'Revisa las citas pendientes de confirmación.',
          metric: `${ctx.unconfirmedCount} pendientes`,
          category: 'operations',
          action: { label: 'Ver confirmaciones', href: '/confirmations' },
          dismissible: true,
          severity: 4,
        }
      }
      return null
    },
  },
  {
    id: 'top-performer',
    evaluate: (ctx) => {
      if (ctx.topEmployeeName && ctx.topEmployeeRevenue && ctx.topEmployeeRevenue > 0) {
        return {
          id: 'top-performer',
          type: 'success',
          title: `${ctx.topEmployeeName} lidera el equipo`,
          description: `${ctx.topEmployeeAppointments} citas completadas, COP ${ctx.topEmployeeRevenue.toLocaleString('es-CO')} en ingresos`,
          category: 'staff',
          action: { label: 'Ver equipo', href: '/employees' },
          dismissible: true,
          severity: 3,
        }
      }
      return null
    },
  },
  {
    id: 'new-clients',
    evaluate: (ctx) => {
      if (ctx.clients > 10) {
        return {
          id: 'new-clients',
          type: 'success',
          title: `${ctx.clients} clientes nuevos`,
          description: 'Buen crecimiento de base de clientes este período.',
          metric: `+${ctx.clients}`,
          category: 'clients',
          dismissible: true,
          severity: 4,
        }
      }
      if (ctx.clients > 5) {
        return {
          id: 'new-clients-mild',
          type: 'info',
          title: `${ctx.clients} clientes nuevos`,
          description: 'Sigue creciendo tu cartera de clientes.',
          metric: `+${ctx.clients}`,
          category: 'clients',
          dismissible: true,
          severity: 2,
        }
      }
      return null
    },
  },
]
