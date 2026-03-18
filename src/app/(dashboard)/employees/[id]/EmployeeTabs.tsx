'use client'

import { useState } from 'react'
import { User, Clock, Scissors, KeyRound, Check, ChevronRight } from 'lucide-react'
import type { Employee } from '@/types/employees'
import type { EmployeeAvailability } from '@/types/availability'
import type { Service } from '@/types/services'
import { EmployeeService } from '@/services/employees/getEmployeeServices'
import { EmployeeInfoTab } from './EmployeeInfoTab'
import { EmployeeAvailabilityTab } from './EmployeeAvailabilityTab'
import { EmployeeServicesTab } from './EmployeeServicesTab'
import { EmployeeAccessTab } from './EmployeeAccessTab'
import type { Invitation } from '@/types/invitations'

interface EmployeeTabsProps {
  employee: Employee
  availability: EmployeeAvailability[]
  allServices: Service[]
  employeeServices: EmployeeService[]
  pendingInvitation: Invitation | null | undefined
  organizationId: string
  currentUserRole: string
}

type TabId = 'info' | 'availability' | 'services' | 'access'

const tabs = [
  { id: 'info' as const, label: 'Información', icon: User },
  { id: 'availability' as const, label: 'Horario', icon: Clock },
  { id: 'services' as const, label: 'Servicios', icon: Scissors },
  { id: 'access' as const, label: 'Acceso', icon: KeyRound },
]

export function EmployeeTabs({
  employee,
  availability,
  allServices,
  employeeServices,
  pendingInvitation,
  organizationId,
  currentUserRole,
}: EmployeeTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('info')

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
      {/* Tab Navigation */}
      <nav className="flex border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30" aria-label="Secciones">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium
                transition-all duration-200 relative
                ${isActive 
                  ? 'text-[#0F4C5C] dark:text-[#38BDF8] bg-white dark:bg-slate-800' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-700/30'
                }
              `}
              aria-selected={isActive}
              role="tab"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F4C5C] to-[#38BDF8]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'info' && (
          <EmployeeInfoTab 
            employee={employee} 
            organizationId={organizationId} 
          />
        )}

        {activeTab === 'availability' && (
          <EmployeeAvailabilityTab 
            employeeId={employee.id}
            availability={availability}
          />
        )}

        {activeTab === 'services' && (
          <EmployeeServicesTab 
            employeeId={employee.id}
            allServices={allServices}
            employeeServices={employeeServices}
          />
        )}

        {activeTab === 'access' && (
          <EmployeeAccessTab 
            employee={employee}
            pendingInvitation={pendingInvitation}
            currentUserRole={currentUserRole}
          />
        )}
      </div>
    </div>
  )
}
