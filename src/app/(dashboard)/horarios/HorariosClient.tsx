'use client'

import { useState } from 'react'
import { Clock, Check } from 'lucide-react'
import { SpaHoursSection } from './components/SpaHoursSection'
import { GlobalOverridesSection } from './components/GlobalOverridesSection'
import { EmployeeSchedulesSection } from './components/EmployeeSchedulesSection'
import { updateBookingSettings } from '@/actions/settings/updateBookingSettings'
import type { SpaHours, SpaOverride, EmployeeWithSchedules } from '@/types/availability'

interface HorariosClientProps {
  organizationId: string
  spaHours: SpaHours
  spaOverrides: SpaOverride[]
  employees: EmployeeWithSchedules[]
}

export function HorariosClient({
  organizationId,
  spaHours: initialSpaHours,
  spaOverrides,
  employees,
}: HorariosClientProps) {
  const [spaHours, setSpaHours] = useState(initialSpaHours)
  const [isSavingSpaHours, setIsSavingSpaHours] = useState(false)
  const [spaHoursSaved, setSpaHoursSaved] = useState(false)

  async function handleSpaHoursSave() {
    setIsSavingSpaHours(true)
    setSpaHoursSaved(false)

    const result = await updateBookingSettings(organizationId, spaHours)

    setIsSavingSpaHours(false)
    if (result.success) {
      setSpaHoursSaved(true)
      setTimeout(() => setSpaHoursSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Horarios
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Configura el horario de tu spa y la disponibilidad de tu equipo.
        </p>
      </header>

      <SpaHoursSection
        spaHours={spaHours}
        onSpaHoursChange={setSpaHours}
        onSave={handleSpaHoursSave}
        isSaving={isSavingSpaHours}
        saved={spaHoursSaved}
      />

      <GlobalOverridesSection
        organizationId={organizationId}
        overrides={spaOverrides}
      />

      <EmployeeSchedulesSection
        organizationId={organizationId}
        employees={employees}
      />
    </div>
  )
}