'use client'

import { useState } from 'react'
import { User, Clock, Scissors, KeyRound } from 'lucide-react'
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
    <div className="
      bg-white/80 dark:bg-slate-800/60
      backdrop-blur-xl
      rounded-2xl 
      border border-white/20 dark:border-slate-700/50
      shadow-xl shadow-slate-200/40 dark:shadow-none
      overflow-hidden
    ">
      {/* Tab Navigation - Enhanced */}
      <nav className="
        flex border-b border-slate-100/60 dark:border-slate-700/40 
        bg-slate-50/50 dark:bg-slate-800/30
        relative
      " aria-label="Secciones">
        {/* Active tab indicator */}
        <div 
          className="absolute bottom-0 h-0.5 bg-gradient-to-r from-[#0F4C5C] to-[#38BDF8] transition-all duration-300 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            left: `${tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length)}%`
          }}
        />
        
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium
                transition-all duration-200 relative z-10
                ${isActive 
                  ? 'text-[#0F4C5C] dark:text-[#38BDF8] bg-white/50 dark:bg-slate-800/50' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/30 dark:hover:bg-slate-700/30'
                }
              `}
              aria-selected={isActive}
              role="tab"
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Tab Content */}
      <div className="p-6 sm:p-8">
        <div className="animate-fade-in">
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
    </div>
  )
}
