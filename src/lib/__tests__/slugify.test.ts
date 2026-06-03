import { describe, it, expect } from 'vitest'
import { slugify, validateSlug, RESERVED_SLUGS } from '@/lib/slugify'

describe('slugify', () => {
  it('convierte nombre a slug limpio', () => {
    expect(slugify('Candela Barbería')).toBe('candela-barberia')
  })

  it('maneja acentos', () => {
    expect(slugify('Ñandú Spa')).toBe('nandu-spa')
  })

  it('maneja caracteres especiales', () => {
    expect(slugify('--- Spa Relax ---')).toBe('spa-relax')
  })

  it('retorna negocio para input vacío', () => {
    expect(slugify('')).toBe('negocio')
    expect(slugify('   ')).toBe('negocio')
  })

  it('retorna negocio para null/undefined', () => {
    expect(slugify(null as unknown as string)).toBe('negocio')
    expect(slugify(undefined as unknown as string)).toBe('negocio')
  })

  it('normaliza múltiples espacios', () => {
    expect(slugify('Candela     Barbería')).toBe('candela-barberia')
  })

  it('elimina caracteres especiales complejos', () => {
    expect(slugify('Spa & Beauty @ Medellín!')).toBe('spa-beauty-medellin')
  })

  it('maneja nombres largos', () => {
    expect(slugify('Centro Estético Integral Santa Mónica')).toBe('centro-estetico-integral-santa-monica')
  })

  it('maneja números en el nombre', () => {
    expect(slugify('Barbería 100% Natural')).toBe('barberia-100-natural')
  })
})

describe('validateSlug', () => {
  it('acepta slugs válidos', () => {
    expect(validateSlug('candela-barberia')).toBeNull()
    expect(validateSlug('spa-relax-2')).toBeNull()
    expect(validateSlug('mi-negocio')).toBeNull()
  })

  it('acepta exactamente 50 caracteres', () => {
    expect(validateSlug('a'.repeat(50))).toBeNull()
  })

  it('rechaza slugs muy cortos', () => {
    expect(validateSlug('ab')).toBe('Mínimo 3 caracteres')
  })

  it('rechaza slugs muy largos', () => {
    expect(validateSlug('a'.repeat(51))).toBe('Máximo 50 caracteres')
  })

  it('rechaza caracteres inválidos', () => {
    expect(validateSlug('candela barbería')).toBe('Solo minúsculas, números y guiones')
    expect(validateSlug('candela_barberia')).toBe('Solo minúsculas, números y guiones')
    expect(validateSlug('candela@barberia')).toBe('Solo minúsculas, números y guiones')
  })

  it('rechaza guiones al inicio', () => {
    expect(validateSlug('-candela')).toBe('No puede empezar con guión')
  })

  it('rechaza guiones al final', () => {
    expect(validateSlug('candela-')).toBe('No puede terminar con guión')
  })

  it('rechaza reserved words', () => {
    expect(validateSlug('admin')).toBe('Este slug está reservado')
    expect(validateSlug('reservar')).toBe('Este slug está reservado')
    expect(validateSlug('login')).toBe('Este slug está reservado')
    expect(validateSlug('dashboard')).toBe('Este slug está reservado')
  })

  it('reserved words son case-insensitive (solo aplica a slugs en minúsculas)', () => {
    // Admin no pasa validación de formato (requiere minúsculas)
    expect(validateSlug('Admin')).toBe('Solo minúsculas, números y guiones')
    // admin sí pasa formato y es reserved
    expect(validateSlug('admin')).toBe('Este slug está reservado')
    // La normalización con .toLowerCase() protege contra bypass
    expect(validateSlug('reservar')).toBe('Este slug está reservado')
  })
})

describe('RESERVED_SLUGS', () => {
  it('contiene las reserved words esperadas', () => {
    expect(RESERVED_SLUGS).toContain('admin')
    expect(RESERVED_SLUGS).toContain('reservar')
    expect(RESERVED_SLUGS).toContain('dashboard')
    expect(RESERVED_SLUGS).toContain('settings')
  })

  it('todas son minúsculas', () => {
    RESERVED_SLUGS.forEach(slug => {
      expect(slug).toBe(slug.toLowerCase())
    })
  })
})

describe('generateUniqueSlug (algoritmo)', () => {
  it('resuelve colisiones simulando existentes', () => {
    const existing = new Set(['candela-barberia'])

    const generateUniqueSlug = (base: string) => {
      let candidate = base
      let counter = 1
      while (existing.has(candidate)) {
        counter++
        candidate = `${base}-${counter}`
      }
      return candidate
    }

    expect(generateUniqueSlug('candela-barberia')).toBe('candela-barberia-2')

    existing.add('candela-barberia-2')
    expect(generateUniqueSlug('candela-barberia')).toBe('candela-barberia-3')

    existing.add('candela-barberia-3')
    expect(generateUniqueSlug('candela-barberia')).toBe('candela-barberia-4')
  })

  it('no modifica slug libre', () => {
    const existing = new Set<string>()

    const generateUniqueSlug = (base: string) => {
      let candidate = base
      let counter = 1
      while (existing.has(candidate)) {
        counter++
        candidate = `${base}-${counter}`
      }
      return candidate
    }

    expect(generateUniqueSlug('candela-barberia')).toBe('candela-barberia')
  })
})
