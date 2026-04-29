'use client'

import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SpecialDaysPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-2xl mx-auto p-6">
        {/* Back button */}
        <Link
          href="/horarios"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al calendario
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Días Especiales</h1>
          </div>
          <p className="text-sm text-slate-400">Guía rápida para owners nuevos</p>
        </div>

        {/* Section: What is */}
        <div className="bg-slate-800/80 rounded-xl p-5 mb-4 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-[#38BDF8] uppercase tracking-wider mb-3">
            ¿Qué es?
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Los días especiales te permiten definir horarios diferentes para fechas específicas.
            Son útiles cuando el spa cierra o cambia su horario por razones especiales.
          </p>
        </div>

        {/* Section: When to use */}
        <div className="bg-slate-800/80 rounded-xl p-5 mb-4 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-[#38BDF8] uppercase tracking-wider mb-3">
            ¿Cuándo usarlos?
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 text-xs">
              Feriados
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 text-xs">
              Mantenimiento
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 text-xs">
              Eventos especiales
            </span>
          </div>
        </div>

        {/* Section: How to create */}
        <div className="bg-slate-800/80 rounded-xl p-5 mb-4 border border-slate-700/50">
          <h2 className="text-sm font-semibold text-[#38BDF8] uppercase tracking-wider mb-3">
            ¿Cómo crear uno?
          </h2>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-[#38BDF8] font-medium">1.</span>
              <span>Ve a Configuración → Horarios</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#38BDF8] font-medium">2.</span>
              <span>En "Días Especiales", click en "+ Agregar día"</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#38BDF8] font-medium">3.</span>
              <span>Selecciona la fecha y agrega una razón (opcional)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#38BDF8] font-medium">4.</span>
              <span>Elige: "Día completo" o define horario específico</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#38BDF8] font-medium">5.</span>
              <span>Click "Crear"</span>
            </li>
          </ol>
        </div>

        {/* Section: Tips */}
        <div className="bg-amber-500/10 rounded-xl p-5 mb-4 border border-amber-500/30">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
            💡 Tips importantes
          </h2>
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li>• Los días especiales solo afectan la disponibilidad del spa</li>
            <li>• No modifican los horarios de los empleados</li>
            <li>• Para eliminar, click en el icono X junto al día</li>
          </ul>
        </div>

        {/* Help footer */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-4">
          <AlertCircle className="w-4 h-4" />
          <span>¿Necesitas ayuda?</span>
          <a href="/support" className="text-[#38BDF8] hover:underline">
            Contactar soporte →
          </a>
        </div>
      </div>
    </div>
  )
}