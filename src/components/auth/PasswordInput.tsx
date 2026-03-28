'use client'

import { useState, useMemo } from 'react'
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react'

interface PasswordInputProps {
  name: string
  id?: string
  label?: string
  placeholder?: string
  required?: boolean
  showStrength?: boolean
  defaultValue?: string
  className?: string
  error?: string
}

interface StrengthRule {
  test: (password: string) => boolean
  label: string
}

const STRENGTH_RULES: StrengthRule[] = [
  { test: (p) => p.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (p) => /[A-Z]/.test(p), label: 'Una mayúscula' },
  { test: (p) => /[0-9]/.test(p), label: 'Un número' },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'Un símbolo' },
]

function getStrengthLevel(password: string): { level: number; label: string; color: string } {
  const passedRules = STRENGTH_RULES.filter((rule) => rule.test(password)).length

  if (password.length === 0) return { level: 0, label: '', color: '' }
  if (passedRules <= 1) return { level: 1, label: 'Muy débil', color: 'bg-red-500' }
  if (passedRules === 2) return { level: 2, label: 'Débil', color: 'bg-orange-500' }
  if (passedRules === 3) return { level: 3, label: 'Buena', color: 'bg-yellow-500' }
  return { level: 4, label: 'Fuerte', color: 'bg-emerald-500' }
}

export function PasswordInput({
  name,
  id,
  label,
  placeholder = '••••••••',
  required = false,
  showStrength = false,
  defaultValue = '',
  className = '',
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState(defaultValue)

  const strength = useMemo(() => getStrengthLevel(password), [password])
  const passedRules = useMemo(
    () => STRENGTH_RULES.filter((rule) => rule.test(password)),
    [password]
  )

  const inputId = id || name

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-text-main dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type={showPassword ? 'text' : 'password'}
          id={inputId}
          name={name}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 rounded-lg border border-border-color dark:border-slate-600 bg-white dark:bg-slate-900/50 text-text-main dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {showStrength && password.length > 0 && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${(strength.level / 4) * 100}%` }}
              />
            </div>
            <span
              className={`text-xs font-medium ${
                strength.level <= 1
                  ? 'text-red-500'
                  : strength.level === 2
                  ? 'text-orange-500'
                  : strength.level === 3
                  ? 'text-yellow-600'
                  : 'text-emerald-500'
              }`}
            >
              {strength.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1">
            {STRENGTH_RULES.map((rule, index) => {
              const passed = rule.test(password)
              return (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ${
                    passed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {passed ? (
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span>{rule.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
