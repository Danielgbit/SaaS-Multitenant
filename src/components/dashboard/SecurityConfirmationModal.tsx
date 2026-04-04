'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ShieldAlert, AlertTriangle, Info, Check } from 'lucide-react'
import { 
  ROLE_SECURITY_CONFIG, 
  getPrivilegeChangeType,
  type PrivilegeChangeType 
} from '@/lib/rbac-config'

interface SecurityConfirmationModalProps {
  isOpen: boolean
  role: 'staff' | 'admin'
  employeeName?: string
  previousRole?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function SecurityConfirmationModal({
  isOpen,
  role,
  employeeName,
  previousRole,
  onConfirm,
  onCancel,
}: SecurityConfirmationModalProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const config = ROLE_SECURITY_CONFIG[role]
  const changeType = getPrivilegeChangeType(previousRole || null, role)
  const Icon = config.icon
  
  const isEscalation = changeType === 'escalation' || changeType === 'lateral'
  const isDegradation = changeType === 'degradation'
  
  useEffect(() => {
    if (isOpen && config.requiresTextConfirmation && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, config.requiresTextConfirmation])
  
  if (!isOpen) return null
  
  const canConfirm = config.requiresTextConfirmation 
    ? confirmationText.toUpperCase() === 'CONFIRMAR'
    : true
  
  const getHeaderText = () => {
    if (isEscalation) {
      return role === 'admin' 
        ? '⚠️ ESCALAMIENTO DE PRIVILEGIOS'
        : '⚠️ Asignar Acceso de Asistente'
    }
    if (isDegradation) {
      return 'ℹ️ Cambio de Privilegios'
    }
    return role === 'admin' 
      ? '⚠️ Asignar Acceso de Administrador'
      : '⚠️ Asignar Acceso de Asistente'
  }
  
  const getSubtext = () => {
    if (isEscalation && role === 'admin') {
      return `Están a punto de dar acceso de ADMINISTRADOR a ${employeeName || 'este empleado'}. Esta persona tendrá control TOTAL del sistema.`
    }
    if (previousRole && isDegradation) {
      return `Están cambiando el acceso de ${previousRole.toUpperCase()} a ${role.toUpperCase()}.`
    }
    return `Están a punto de asignar el rol de ${role.toUpperCase()} a ${employeeName || 'este empleado'}.`
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <div 
        className={`
          relative w-full max-w-md mx-4 rounded-2xl shadow-2xl
          border-2 ${config.borderColor}
          ${config.bgColor}
          transform transition-all
        `}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/10 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div 
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${isEscalation ? 'bg-red-100' : isDegradation ? 'bg-blue-100' : 'bg-amber-100'}
              `}
            >
              <Icon 
                className={`w-6 h-6 ${isEscalation ? 'text-red-500' : isDegradation ? 'text-blue-500' : 'text-amber-500'}`} 
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {getHeaderText()}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {getSubtext()}
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Esta persona tendrá acceso a:
            </p>
            <ul className="space-y-2">
              {config.permissions.map((perm, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className={`w-4 h-4 ${config.iconColor} mt-0.5 flex-shrink-0`} />
                  {perm}
                </li>
              ))}
            </ul>
          </div>
          
          {config.requiresTextConfirmation && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Escribe &quot;CONFIRMAR&quot; para proceder:
              </label>
              <input
                ref={inputRef}
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="CONFIRMAR"
                className="
                  w-full px-4 py-3 rounded-xl
                  border-2 border-slate-200
                  text-slate-900 placeholder-slate-400
                  focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100
                  transition-all
                "
              />
            </div>
          )}
          
          {isEscalation && role === 'admin' && (
            <div className="mb-6 p-3 rounded-xl bg-red-100 border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Este es el máximo nivel de acceso. Un error podría comprometer la seguridad de todos los datos.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="
              flex-1 px-4 py-3 rounded-xl
              border-2 border-slate-200
              text-slate-700 font-medium
              hover:bg-slate-100 transition-colors
            "
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`
              flex-1 px-4 py-3 rounded-xl font-medium
              transition-all flex items-center justify-center gap-2
              ${canConfirm
                ? isEscalation
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {isEscalation ? 'Sí, asignar' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}