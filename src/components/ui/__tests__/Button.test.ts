import { describe, it, expect } from 'vitest'
import { buttonVariants } from '@/components/ui/Button'

describe('Button variants', () => {
  it('genera clases para variant primary', () => {
    const result = buttonVariants({ variant: 'primary' })
    expect(result).toContain('bg-[')
    expect(result).toContain('text-white')
  })

  it('genera clases para variant secondary', () => {
    const result = buttonVariants({ variant: 'secondary' })
    expect(result).toContain('border')
  })

  it('genera clases para variant ghost', () => {
    const result = buttonVariants({ variant: 'ghost' })
    expect(result).toContain('bg-transparent')
  })

  it('genera clases para variant danger', () => {
    const result = buttonVariants({ variant: 'danger' })
    expect(result).toContain('bg-[')
  })

  it('genera clases para variant link', () => {
    const result = buttonVariants({ variant: 'link' })
    expect(result).toContain('underline')
  })
})

describe('Button sizes', () => {
  it('genera clases para size sm', () => {
    const result = buttonVariants({ size: 'sm' })
    expect(result).toContain('h-8')
    expect(result).toContain('text-xs')
  })

  it('genera clases para size md', () => {
    const result = buttonVariants({ size: 'md' })
    expect(result).toContain('h-10')
    expect(result).toContain('text-sm')
  })

  it('genera clases para size lg', () => {
    const result = buttonVariants({ size: 'lg' })
    expect(result).toContain('h-12')
    expect(result).toContain('text-base')
  })

  it('genera clases para size icon', () => {
    const result = buttonVariants({ size: 'icon' })
    expect(result).toContain('h-9')
    expect(result).toContain('w-9')
    expect(result).toContain('p-0')
  })
})

describe('Button default variants', () => {
  it('usa secondary como default variant', () => {
    const result = buttonVariants()
    expect(result).toContain('border')
    expect(result).toContain('text-sm')
  })

  it('usa md como default size', () => {
    const result = buttonVariants()
    expect(result).toContain('h-10')
  })
})
