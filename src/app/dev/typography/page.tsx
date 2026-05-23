'use client'

import { useState } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'

const headingSamples = [
  { class: 'text-display', label: 'Display', text: 'Bienvenido a Prügressy' },
  { class: 'text-heading-1', label: 'Heading 1', text: 'Panel de Administración' },
  { class: 'text-heading-2', label: 'Heading 2', text: 'Resumen de Ventas' },
  { class: 'text-heading-3', label: 'Heading 3', text: 'Gestión de Empleados' },
]

const bodySamples = [
  { class: 'text-body', label: 'Body', text: 'Este es el texto principal del cuerpo. Se usa en párrafos, descripciones y contenido general del dashboard. Debe ser altamente legible en todos los tamaños de pantalla.' },
  { class: 'text-body-sm', label: 'Body Small', text: 'Texto secundario usado en tablas, formularios y elementos de UI densa.' },
  { class: 'text-body-xs', label: 'Body XS', text: 'Texto auxiliar para captions y metadatos.' },
]

const uiSamples = [
  { class: 'text-label', label: 'Label', text: 'Nombre del cliente' },
  { class: 'text-caption', label: 'Caption', text: 'Ultima actualización: hoy 14:30' },
  { class: 'text-metric', label: 'Metric Value', text: '$ 2.450.000' },
  { class: 'text-metric-label', label: 'Metric Label', text: 'Ingresos del mes' },
  { class: 'text-table-header', label: 'Table Header', text: 'Nombre / Email / Rol / Estado' },
  { class: 'text-table-cell', label: 'Table Cell', text: 'admin@prueba.com' },
  { class: 'text-sidebar-nav', label: 'Sidebar Nav', text: 'Panel principal' },
  { class: 'text-sidebar-label', label: 'Sidebar Group Label', text: 'Gestión' },
]

const trackingSamples = [
  { class: 'tracking-heading', label: 'Tracking Heading', text: 'Ingresos Totales del Período' },
  { class: 'tracking-label', label: 'Tracking Label', text: 'NOMBRE DEL CLIENTE' },
  { class: 'tracking-caps', label: 'Tracking Caps', text: 'EMAIL / ROL / ESTADO' },
]

function ClassCard({ label, classStr, children }: { label: string; classStr: string; children: React.ReactNode }) {
  const COLORS = useThemeColors()
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sidebar-label" style={{ color: COLORS.textMuted }}>{label}</span>
        <code className="text-body-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.surface, color: COLORS.textSecondary, border: `1px solid ${COLORS.borderLight}` }}>.{classStr}</code>
      </div>
      <div className={classStr}>
        {children}
      </div>
    </div>
  )
}

function HeadingPreview({ weight }: { weight: number }) {
  const COLORS = useThemeColors()
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sidebar-label" style={{ color: COLORS.textMuted }}>Poppins {weight}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-heading)', fontWeight: weight, fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
        Prügressy — Gestión de Bienestar
      </p>
      <p style={{ fontFamily: 'var(--font-heading)', fontWeight: weight, fontSize: '1rem', letterSpacing: '-0.01em', lineHeight: 1.4, marginTop: 8 }}>
        La plataforma integral para spas, clínicas y centros de bienestar
      </p>
    </div>
  )
}

function BodyPreview({ text, font }: { text: string; font: string }) {
  const COLORS = useThemeColors()
  const fontName = font === 'var(--font-sans)' ? 'Manrope' : font
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sidebar-label" style={{ color: COLORS.textMuted }}>{fontName}</span>
      </div>
      <p className="text-body">{text}</p>
    </div>
  )
}

function OverflowTest({ label, text, className }: { label: string; text: string; className: string }) {
  const COLORS = useThemeColors()
  return (
    <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
      <span className="text-sidebar-label block mb-1" style={{ color: COLORS.textMuted }}>{label}</span>
      <div className="max-w-[180px] overflow-hidden border border-dashed" style={{ borderColor: COLORS.warning }}>
        <span className={className}>{text}</span>
      </div>
    </div>
  )
}

export default function DevTypographyPage() {
  const COLORS = useThemeColors()
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { id: 'all', label: 'Todo' },
    { id: 'headings', label: 'Headings' },
    { id: 'body', label: 'Body' },
    { id: 'ui', label: 'UI Elements' },
    { id: 'overflow', label: 'Overflow Test' },
    { id: 'tracking', label: 'Tracking' },
  ]

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: COLORS.surface, color: COLORS.textPrimary }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-display mb-2">Typography System — Prügressy</h1>
          <p className="text-body-sm" style={{ color: COLORS.textSecondary }}>
            Poppins (600, 700) · {''}
            Manrope (variable) · {''}
            Sistema de tokens semánticos
          </p>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab.id ? COLORS.primary : COLORS.surfaceSubtle,
                color: activeTab === tab.id ? '#fff' : COLORS.textSecondary,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Headings */}
        {(activeTab === 'all' || activeTab === 'headings') && (
          <section className="mb-12">
            <h2 className="text-heading-1 mb-6">Headings — Poppins</h2>
            <div className="space-y-4">
              {headingSamples.map(s => (
                <ClassCard key={s.class} label={s.label} classStr={s.class}>
                  {s.text}
                </ClassCard>
              ))}
            </div>
            <h3 className="text-heading-3 mt-8 mb-4">Poppins Weight Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <HeadingPreview weight={600} />
              <HeadingPreview weight={700} />
            </div>
          </section>
        )}

        {/* Body */}
        {(activeTab === 'all' || activeTab === 'body') && (
          <section className="mb-12">
            <h2 className="text-heading-1 mb-6">Body — Manrope</h2>
            <div className="space-y-4">
              {bodySamples.map(s => (
                <ClassCard key={s.class} label={s.label} classStr={s.class}>
                  {s.text}
                </ClassCard>
              ))}
            </div>
            <h3 className="text-heading-3 mt-8 mb-4">Manrope Variable Weights</h3>
            <div className="grid grid-cols-2 gap-4">
              <BodyPreview text="Manrope 400 — El texto body principal del sistema. Diseñado para máxima legibilidad en dashboards." font="var(--font-sans)" />
              <BodyPreview text="Manrope 500 — Peso medio para labels y UI navigation. Buen equilibrio entre jerarquía y legibilidad." font="var(--font-sans)" />
              <BodyPreview text="Manrope 600 — Semibold para énfasis moderado en tablas y formularios. Sin llegar a ser heading." font="var(--font-sans)" />
            </div>
          </section>
        )}

        {/* UI Elements */}
        {(activeTab === 'all' || activeTab === 'ui') && (
          <section className="mb-12">
            <h2 className="text-heading-1 mb-6">UI Elements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uiSamples.map(s => (
                <ClassCard key={s.class} label={s.label} classStr={s.class}>
                  {s.text}
                </ClassCard>
              ))}
            </div>

            <h3 className="text-heading-3 mt-8 mb-4">Buttons Preview</h3>
            <div className="flex flex-wrap gap-4">
              <button className="text-btn px-6 py-2.5 rounded-xl" style={{ backgroundColor: COLORS.primary, color: '#fff' }}>
                Botón Primario
              </button>
              <button className="text-btn-sm px-4 py-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }}>
                Botón Secundario
              </button>
              <button className="text-btn-sm px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.error, color: '#fff' }}>
                Eliminar
              </button>
              <button className="text-btn-sm px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.success, color: '#fff' }}>
                Guardar
              </button>
            </div>

            <h3 className="text-heading-3 mt-8 mb-4">Badges Preview</h3>
            <div className="flex flex-wrap gap-3">
              <span className="text-label px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.primarySubtle, color: COLORS.primary }}>Activo</span>
              <span className="text-label px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.successLight, color: COLORS.success }}>Completado</span>
              <span className="text-label px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.warningLight, color: COLORS.warning }}>Pendiente</span>
              <span className="text-label px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.errorLight, color: COLORS.error }}>Cancelado</span>
            </div>
          </section>
        )}

        {/* Overflow Test */}
        {(activeTab === 'all' || activeTab === 'overflow') && (
          <section className="mb-12">
            <h2 className="text-heading-1 mb-6">Overflow Test (180px container)</h2>
            <p className="text-body-sm mb-4" style={{ color: COLORS.textSecondary }}>
              Simula componentes sensibles al cambio de métrica tipográfica. 
              Si el texto se corta o desborda, hay que ajustar el contenedor.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <OverflowTest label="Sidebar Org Name" text="Centro de Bienestar & Spa" className="font-heading text-lg font-bold tracking-tight truncate" />
              <OverflowTest label="Sidebar Nav" text="Panel de Administración" className="font-sans text-sm font-medium truncate" />
              <OverflowTest label="KPI Value" text="$ 2.450.000" className="font-heading text-3xl font-bold tracking-tight" />
              <OverflowTest label="Table Cell" text="maria.garcia@clinica spa.com" className="font-sans text-sm truncate" />
              <OverflowTest label="Badge Text" text="Pendiente de aprobación" className="text-label truncate" />
              <OverflowTest label="Metric Label" text="Crecimiento interanual" className="font-sans text-sm font-medium truncate" />
            </div>
          </section>
        )}

        {/* Tracking */}
        {(activeTab === 'all' || activeTab === 'tracking') && (
          <section className="mb-12">
            <h2 className="text-heading-1 mb-6">Tracking Tokens</h2>
            <div className="space-y-4">
              {trackingSamples.map(s => (
                <ClassCard key={s.class} label={s.label} classStr={s.class}>
                  {s.text}
                </ClassCard>
              ))}
            </div>
          </section>
        )}

        {/* Font Information */}
        <section className="mb-12">
          <h2 className="text-heading-1 mb-6">Font Information</h2>
          <Card variant="surface" className="p-6">
            <div className="space-y-4">
              <div>
                <span className="text-label block mb-1" style={{ color: COLORS.textMuted }}>Headings Font</span>
                <p className="text-heading-2">Poppins — 600, 700</p>
                <p className="text-body-sm" style={{ color: COLORS.textSecondary }}>CSS Variable: var(--font-heading)</p>
              </div>
              <div>
                <span className="text-label block mb-1" style={{ color: COLORS.textMuted }}>Body/UI Font</span>
                <p className="font-sans text-xl font-semibold">Manrope — Variable (400-700)</p>
                <p className="text-body-sm" style={{ color: COLORS.textSecondary }}>CSS Variable: var(--font-sans)</p>
              </div>
              <div>
                <span className="text-label block mb-1" style={{ color: COLORS.textMuted }}>Mono Font</span>
                <p className="text-body-sm" style={{ fontFamily: 'var(--font-mono)', color: COLORS.textPrimary }}>JetBrains Mono / Fira Code</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
