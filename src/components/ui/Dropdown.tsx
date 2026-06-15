'use client'

import { useState, useRef, useEffect, useCallback, useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

export interface DropdownOption<T extends string> {
  value: T
  label: string
  count?: number
  icon?: ReactNode
  disabled?: boolean
}

export interface DropdownProps<T extends string> {
  options: DropdownOption<T>[]
  value: T
  onChange: (value: T) => void
  placeholder?: string
  ariaLabel: string
  triggerIcon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'right'
  disabled?: boolean
  showCount?: boolean
  emptyMessage?: string
  className?: string
  id?: string
}

export function Dropdown<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  ariaLabel,
  triggerIcon,
  size = 'md',
  align = 'left',
  disabled = false,
  showCount = false,
  emptyMessage,
  className,
  id,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const listboxId = useId()
  const COLORS = useThemeColors()

  const selectedOption = options.find((o) => o.value === value)

  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
    triggerRef.current?.focus()
  }, [])

  const open = useCallback(() => {
    if (disabled) return
    setIsOpen(true)
    const idx = options.findIndex((o) => o.value === value && !o.disabled)
    setActiveIndex(idx >= 0 ? idx : 0)
  }, [disabled, options, value])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && optionRefs.current[activeIndex]) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, activeIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open()
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev + 1
          return next < options.length ? next : prev
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev - 1
          return next >= 0 ? next : 0
        })
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < options.length && !options[activeIndex]?.disabled) {
          onChange(options[activeIndex]!.value)
          close()
        }
        break
      case 'Tab':
        close()
        break
    }
  }

  const handleOptionClick = (option: DropdownOption<T>) => {
    if (option.disabled) return
    onChange(option.value)
    close()
  }

  const sizeStyle = (() => {
    switch (size) {
      case 'sm':
        return { padding: '6px 10px', fontSize: '12px' }
      case 'lg':
        return { padding: '10px 18px', fontSize: '14px' }
      default:
        return { padding: '8px 14px', fontSize: '13px' }
    }
  })()

  return (
    <div className={`relative inline-flex ${className ?? ''}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        style={{
          borderRadius: '10px',
          padding: sizeStyle.padding,
          color: selectedOption ? COLORS.textPrimary : COLORS.textMuted,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: isOpen ? COLORS.surfaceHover : 'transparent',
          fontSize: sizeStyle.fontSize,
          fontWeight: 500,
          gap: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        className="flex items-center transition-colors duration-200"
      >
        {triggerIcon && (
          <span style={{ color: COLORS.textMuted, display: 'inline-flex' }}>
            {triggerIcon}
          </span>
        )}
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{
            color: COLORS.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            style={{
              position: 'absolute',
              top: '100%',
              marginTop: '8px',
              [align === 'right' ? 'right' : 'left']: 0,
              minWidth: '180px',
              borderRadius: '12px',
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              boxShadow: COLORS.shadow.lg,
              zIndex: 50,
              padding: '8px',
              overflow: 'auto',
              maxHeight: '280px',
            }}
          >
            {options.length === 0 && emptyMessage && (
              <p style={{ padding: '8px 12px', fontSize: '13px', color: COLORS.textMuted }}>
                {emptyMessage}
              </p>
            )}
            {options.map((option, index) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  ref={(el) => { optionRefs.current[index] = el }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  disabled={option.disabled}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected
                      ? COLORS.primary
                      : option.disabled
                        ? COLORS.textMuted
                        : COLORS.textPrimary,
                    backgroundColor:
                      activeIndex === index && !option.disabled
                        ? COLORS.surfaceHover
                        : isSelected
                          ? `${COLORS.primary}10`
                          : 'transparent',
                    cursor: option.disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    border: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <span className="flex items-center gap-2">
                    {option.icon && (
                      <span style={{ display: 'inline-flex', color: COLORS.textMuted }}>
                        {option.icon}
                      </span>
                    )}
                    {option.label}
                  </span>
                  {showCount && option.count != null && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        backgroundColor: COLORS.border,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {option.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
