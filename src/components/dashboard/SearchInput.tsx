'use client'

import { Search } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface SearchInputProps {
  onOpen: () => void
}

export function SearchInput({ onOpen }: SearchInputProps) {
  const COLORS = useThemeColors()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <>
      {/* Mobile: solo icono */}
      <button
        onClick={onOpen}
        className="sm:hidden p-2 rounded-xl transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
        style={{ color: COLORS.textMuted }}
        aria-label="Abrir búsqueda"
        data-testid="search-input-trigger"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Tablet+: input visible */}
      <button
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200 max-w-md w-full focus-visible:outline-none focus-visible:ring-2 cursor-text"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          color: COLORS.textMuted,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = COLORS.borderFocus
          e.currentTarget.style.boxShadow = COLORS.shadow.sm
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = COLORS.border
          e.currentTarget.style.boxShadow = 'none'
        }}
        aria-label="Abrir búsqueda"
        data-testid="search-input-trigger"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm flex-1 text-left truncate">
          Buscar clientes, turnos...
        </span>
        <kbd
          className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-mono flex-shrink-0"
          style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
        >
          ⌘K
        </kbd>
      </button>
    </>
  )
}
