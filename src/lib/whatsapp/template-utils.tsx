import type { ReactNode } from 'react'

export const SAMPLE_VARIABLES: Record<string, string> = {
  clientName: 'María García',
  appointmentDate: '15 de mayo de 2026',
  appointmentTime: '2:00 PM',
  businessName: 'Spa Relax',
  serviceName: 'Masaje Relajante',
  employeeName: 'Carlos López',
  confirmationLink: 'https://app.prugressy.com/confirmar/abc123',
  cancellationLink: 'https://app.prugressy.com/cancelar/abc123',
  businessPhone: '+57 300 123 4567',
  businessAddress: 'Calle 123 #45-67, Bogotá',
}

export function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{[^}]+\}\}/g)
  return matches ? matches.map((m) => m.replace(/\{\{|\}\}/g, '')) : []
}

export function countVariables(body: string): number {
  const matches = body.match(/\{\{[^}]+\}\}/g)
  return matches ? matches.length : 0
}

export function highlightVariables(body: string, primaryColor: string, primarySubtle: string): ReactNode[] {
  const parts = body.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    if (part.match(/^\{\{[^}]+\}\}$/)) {
      return (
        <span
          key={i}
          className="px-1 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: primarySubtle, color: primaryColor }}
        >
          {part}
        </span>
      )
    }
    return part
  })
}

export function renderPreview(text: string): string {
  let result = text
  Object.entries(SAMPLE_VARIABLES).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  })
  return result
}