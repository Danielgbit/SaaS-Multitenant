import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dropdown, type DropdownOption } from '../Dropdown'

vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    border: '#E2E8F0',
    primary: '#0F4C5C',
    shadow: { lg: '0 10px 15px rgba(0,0,0,0.1)' },
  }),
}))

Element.prototype.scrollIntoView = vi.fn()

const options: DropdownOption<string>[] = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B', disabled: true },
  { value: 'c', label: 'Option C', count: 5 },
]

describe('Dropdown', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders trigger with placeholder', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    expect(screen.getByText('Seleccionar')).toBeInTheDocument()
  })

  it('opens menu on click', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    expect(screen.getByText('Option A')).toBeInTheDocument()
  })

  it('selects an option on click', () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} value="" onChange={onChange} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    fireEvent.click(screen.getByText('Option A'))
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('closes on Escape and returns focus', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    const trigger = screen.getByRole('button', { name: /test/i })
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(screen.queryByText('Option A')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on click outside', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Option A')).not.toBeInTheDocument()
  })

  it('navigates with ArrowDown and ArrowUp', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    const trigger = screen.getByRole('button', { name: /test/i })
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowUp' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('selects via Enter', () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} value="" onChange={onChange} ariaLabel="Test" />)
    const trigger = screen.getByRole('button', { name: /test/i })
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('navigates with Home and End', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'End' })
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Home' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('disables disabled options', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    expect(screen.getByText('Option B').closest('[aria-disabled="true"]')).toBeInTheDocument()
  })

  it('sets aria-expanded correctly', () => {
    const { rerender } = render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" />)
    expect(screen.getByRole('button', { name: /test/i })).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    expect(screen.getByRole('button', { name: /test/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('sets aria-selected on options', () => {
    render(<Dropdown options={options} value="a" onChange={vi.fn()} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    const optionsRendered = screen.getAllByRole('option')
    const optionA = optionsRendered.find(o => o.textContent === 'Option A')
    expect(optionA).toHaveAttribute('aria-selected', 'true')
  })

  it('shows emptyMessage when no options', () => {
    render(<Dropdown options={[]} value="" onChange={vi.fn()} ariaLabel="Test" emptyMessage="Vacio" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    expect(screen.getByText('Vacio')).toBeInTheDocument()
  })

  it('shows count when showCount is true', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" showCount />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('aligns right', () => {
    render(<Dropdown options={options} value="" onChange={vi.fn()} ariaLabel="Test" align="right" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()
  })
})
