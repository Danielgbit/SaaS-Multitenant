---
name: design-system-master
description: Sistema de diseño centralizado para Prügressy B2B SaaS (Wellness y Health). Todos los tokens de color, tipografía, spacing y componentes deben seguir este documento para garantizar consistencia y accesibilidad. La fuente canónica de verdad es src/hooks/useThemeColors.ts.
version: 2.1.0
lastUpdated: 2026-06-01
sourceOfTruth: src/hooks/useThemeColors.ts
---

# Sistema de Diseño Master — Prügressy B2B SaaS

Este documento define la arquitectura visual y de interacción del producto. Todas las interfaces deben seguir estrictamente estas directrices.

## Fuentes de Verdad

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useThemeColors.ts` | Hook principal — retorna todos los tokens de color dinámicamente según theme |
| `src/types/calendar.ts` | Interface `CalendarColors` (subconjunto de `ThemeColors`) para componentes del calendario |

---

# 1. Metadatos y Versionado

- **Versión:** 2.1.0
- **Última actualización:** 2026-06-01
- **Fuente canónica:** `src/hooks/useThemeColors.ts`
- **Reemplaza:** v2.0.0 (documentación incompleta y valores desyncados)

### Changelog v2.1.0
- Corregidos valores de `primaryLight` y `primaryGradient` para ambos modos
- Documentados ~22 tokens faltantes: `gradientFrom`, `gradientTo`, `gradientRefined`, `accentTeal`, `accentTealLight`, `accentTealSubtle`, `surfaceHover`, `borderFocus`, `danger`, `dangerLight`, `amber`, `amberLight`, `gold`, `goldLight`, `glass`, `shadowInput`, `transition`, `headerBg`, `headerText`, `headerTextMuted`, `whatsapp`, `whatsappLight`
- Documentados radios extendidos: `radius.button`, `radius.card`, `radius.modal`
- Documentadas sombras teal: `shadow.tealSm`, `tealMd`, `tealLg`, `tealXl`
- Eliminada referencia obsoleta a `src/hooks/useColors.ts`
- Tabla de migración actualizada con valores reales del codebase

### Changelog v2.0.0 (histórico)
- Unificados todos los hooks de color en `useThemeColors()`
- Añadidos `info`/`infoLight`, `primarySubtle` tokens
- Migrados ~44 archivos de wrappers `useColors()` locales al hook centralizado
- Estandarizado `warning` (#D97706) — eliminado uso de `#F59E0B` hardcoded

---

# 2. Identidad y Dirección Estética

**Estilo principal:** Minimalismo refinado / Editorial moderno

**Tono:** Profesional, confiable (como una clínica) pero relajante y elegante (como un spa de alta gama)

**Público objetivo:** Negocios de servicios: Spa, Clínicas dentales, Barberías premium, Centros de bienestar

El diseño debe transmitir: Confianza, Limpieza visual, Lujo discreto, Facilidad de uso

Evitar interfaces saturadas.

---

# 3. Tipografía (Typography)

## Fuentes

**Display / Encabezados:**
`Poppins` (weights 600, 700)

Uso:
- h1, h2, h3
- títulos de landing
- títulos de secciones en dashboard

**Body / UI / Dashboard:**
`Manrope`

Uso:
- párrafos
- formularios
- tablas
- dashboard
- labels
- botones

## Reglas de rendimiento
- Las fuentes deben cargarse usando: `next/font/google`
- Evitar requests externos
- Precargar solo estos pesos: 400, 500, 700

---

# 4. Paleta de Colores — Tokens Completos

**IMPORTANTE:** Todos los colores del diseño DEBEN venir de `useThemeColors()` hook. No hardcodear colores hex en componentes.

## Función useThemeColors()

```typescript
import { useThemeColors } from '@/hooks/useThemeColors'

function MiComponente() {
  const COLORS = useThemeColors()
  // Usar COLORS.primary, COLORS.warning, etc.
}
```

## Tabla de Tokens — Light Mode

| Token | Valor Light | Descripción |
|-------|-------------|-------------|
| `primary` | #0F4C5C | Color primario (teal oscuro) |
| `primaryLight` | #14B8A6 | Variante clara del primario (teal) |
| `primaryGradient` | linear-gradient(135deg, #0F4C5C 0%, #115E59 100%) | Gradiente para botones headers |
| `gradientFrom` | #0F4C5C | Color inicial del gradiente |
| `gradientTo` | #115E59 | Color final del gradiente |
| `gradientRefined` | linear-gradient(135deg, #0F4C5C 0%, #134E4A 100%) | Gradiente refinado alternativo |
| `primarySubtle` | #0F4C5C10 | Background sutil primario (alpha 10%) |
| `accentTeal` | #14B8A6 | Acento teal para highlights |
| `accentTealLight` | #14B8A610 | Background sutil accent teal |
| `accentTealSubtle` | #2DD4BF15 | Fondo muy sutil accent teal |
| `surface` | #FFFFFF | Fondo principal de superficies |
| `surfaceSubtle` | #F8FAFC | Fondo sutil para cards, inputs |
| `surfaceGlass` | rgba(255, 255, 255, 0.8) | Efecto glass para overlays |
| `surfaceGlassStrong` | rgba(255, 255, 255, 0.95) | Glass más sólido |
| `surfaceHover` | #F1F5F9 | Hover state para superficies |
| `border` | #E2E8F0 | Bordes default |
| `borderLight` | #F0F3F4 | Bordes sutiles |
| `borderFocus` | #0F4C5C | Borde en focus |
| `textPrimary` | #0F172A | Texto principal |
| `textSecondary` | #475569 | Texto secundario |
| `textMuted` | #94A3B8 | Texto terciario, placeholders |
| `success` | #16A34A | Estados de éxito |
| `successLight` | #D1FAE5 | Background sutil éxito |
| `warning` | #D97706 | Estados de advertencia |
| `warningLight` | #FEF3C7 | Background sutil warning |
| `error` | #DC2626 | Estados de error |
| `errorLight` | #FEE2E2 | Background sutil error |
| `danger` | #DC2626 | Alias de error para contextos de peligro |
| `dangerLight` | #FEE2E2 | Background sutil danger |
| `amber` | #F59E0B | Color ámbar para estados intermedios |
| `amberLight` | #FEF3C7 | Background sutil amber |
| `gold` | #F59E0B | Color dorado para achievements/premium |
| `goldLight` | #FEF3C7 | Background sutil gold |
| `info` | #0EA5E9 | Estados informativos |
| `infoLight` | #E0F2FE | Background sutil info |
| `overlay` | rgba(15, 23, 42, 0.4) | Overlay oscuro para modales |
| `glass` | rgba(255, 255, 255, 0.9) | Efecto glass general |
| `headerBg` | #FAFAF9 | Fondo del header |
| `headerText` | #0F172A | Texto del header |
| `headerTextMuted` | #475569 | Texto secundario del header |
| `whatsapp` | #0F4C5C | Color WhatsApp (usa primary) |
| `whatsappLight` | #0F4C5C10 | Background sutil WhatsApp |

## Tabla de Tokens — Dark Mode

| Token | Valor Dark | Descripción |
|-------|------------|-------------|
| `primary` | #38BDF8 | Color primario (sky blue) |
| `primaryLight` | #2DD4BF | Variante clara del primario (teal) |
| `primaryGradient` | linear-gradient(135deg, #38BDF8 0%, #2DD4BF 100%) | Gradiente para dark mode |
| `gradientFrom` | #38BDF8 | Color inicial del gradiente |
| `gradientTo` | #2DD4BF | Color final del gradiente |
| `gradientRefined` | linear-gradient(135deg, #38BDF8 0%, #2DD4BF 100%) | Gradiente refinado alternativo |
| `primarySubtle` | #38BDF815 | Background sutil primario (alpha 10%) |
| `accentTeal` | #2DD4BF | Acento teal para highlights |
| `accentTealLight` | #14B8A615 | Background sutil accent teal |
| `accentTealSubtle` | #2DD4BF20 | Fondo muy sutil accent teal |
| `surface` | #0F172A | Fondo principal (slate 900) |
| `surfaceSubtle` | #1E293B | Fondo sutil (slate 800) |
| `surfaceGlass` | rgba(30, 41, 59, 0.7) | Efecto glass |
| `surfaceGlassStrong` | rgba(30, 41, 59, 0.85) | Glass más sólido |
| `surfaceHover` | #334155 | Hover state para superficies |
| `border` | #334155 | Bordes default |
| `borderLight` | #1E293B | Bordes sutiles |
| `borderFocus` | #38BDF8 | Borde en focus |
| `textPrimary` | #F1F5F9 | Texto principal (slate 100) |
| `textSecondary` | #94A3B8 | Texto secundario (slate 400) |
| `textMuted` | #64748B | Texto terciario (slate 500) |
| `success` | #16A34A | Sin cambio en dark |
| `successLight` | #064E3B | Background sutil éxito |
| `warning` | #D97706 | Sin cambio en dark |
| `warningLight` | #78350F | Background sutil warning |
| `error` | #DC2626 | Sin cambio en dark |
| `errorLight` | #450A0A | Background sutil error |
| `danger` | #DC2626 | Alias de error para contextos de peligro |
| `dangerLight` | #450A0A | Background sutil danger |
| `amber` | #F59E0B | Color ámbar (sin cambio) |
| `amberLight` | #78350F | Background sutil amber |
| `gold` | #F59E0B | Color dorado (sin cambio) |
| `goldLight` | #78350F | Background sutil gold |
| `info` | #0EA5E9 | Sin cambio en dark |
| `infoLight` | #0C4A6E | Background sutil info |
| `overlay` | rgba(0, 0, 0, 0.7) | Overlay oscuro |
| `glass` | rgba(15, 23, 42, 0.8) | Efecto glass general |
| `headerBg` | #1E293B | Fondo del header |
| `headerText` | #F1F5F9 | Texto del header |
| `headerTextMuted` | #94A3B8 | Texto secundario del header |
| `whatsapp` | #25D366 | Color WhatsApp (green) |
| `whatsappLight` | #25D36615 | Background sutil WhatsApp |

---

# 5. Spacing System (8pt Grid)

| Token | Valor | Uso recomendado |
|-------|-------|-----------------|
| `sm` | 6px | Inputs pequeños |
| `md` | 10px | Buttons, inputs |
| `lg` | 16px | Cards |
| `xl` | 24px | Modals |
| `button` | 12px | Botones |
| `card` | 20px | Tarjetas decorativas |
| `modal` | 28px | Modales |
| `pill` | 9999px | Badges, chips |

---

# 7. Shadow System

| Token | Valor Light | Valor Dark | Uso |
|-------|-------------|------------|-----|
| `sm` | 0 1px 2px rgba(0,0,0,0.05) | 0 1px 2px rgba(0,0,0,0.05) | Cards, elementos menores |
| `md` | 0 4px 6px rgba(0,0,0,0.1) | 0 4px 6px rgba(0,0,0,0.1) | Dropdowns, popovers |
| `lg` | 0 10px 15px rgba(0,0,0,0.1) | 0 10px 15px rgba(0,0,0,0.1) | Modals, dialogs |
| `xl` | 0 20px 25px rgba(0,0,0,0.15) | 0 20px 25px rgba(0,0,0,0.15) | Overlays grandes |
| `tealSm` | 0 2px 8px rgba(15,76,92,0.04) | 0 2px 8px rgba(0,0,0,0.2) | Sombra teal sutil |
| `tealMd` | 0 4px 24px rgba(15,76,92,0.06) | 0 4px 24px rgba(0,0,0,0.3) | Sombra teal media |
| `tealLg` | 0 8px 40px rgba(15,76,92,0.10) | 0 8px 40px rgba(0,0,0,0.4) | Sombra teal grande |
| `tealXl` | 0 16px 64px rgba(15,76,92,0.14) | 0 16px 64px rgba(0,0,0,0.5) | Sombra teal extra grande |

Además existe `shadowInput`: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` (light) / `0 1px 2px rgba(0,0,0,0.3)` (dark).

---

# 8. Layout System

**Max widths recomendados:**
- Dashboard → 1280px
- Landing → 1200px
- Forms → 640px

**Grid system:** 12 column grid

**Gap recomendado:** `gap-6` (24px)

---

# 9. Componentes Base

Todos los componentes deben seguir el design system.

**Core Components:**
Button, Input, Select, Textarea, Checkbox, Radio, Switch, Badge, Card, Modal, Tooltip, Dropdown, Tabs, Table, Pagination, Toast

---

# 10. Estados de Interacción

Todos los componentes interactivos deben soportar:
- Default
- Hover
- Focus
- Active
- Disabled
- Loading

**Focus accesible:** `focus-visible:ring-2 focus-visible:ring-offset-2`

---

# 11. Botones

**Token de transición:** `COLORS.transition` → `all 200ms ease`

**Animaciones permitidas:** `transition-colors duration-200`
Evitar escalados agresivos.

**Touch targets mínimo:** 44x44px en mobile.

Todos los elementos clicables deben usar: `cursor-pointer`

---

# 12. Iconografía

**Librerías permitidas:**
- Lucide Icons (recomendado)
- Heroicons

**Nunca usar emojis** en el SaaS.

**Tamaños de iconos:**
| Token | Valor |
|-------|-------|
| xs | 16px |
| sm | 18px |
| md | 20px |
| lg | 24px |
| xl | 32px |

---

# 13. Glassmorphism (Uso limitado)

Para navbar o panel flotante.

**Light mode:** `bg-white/80 backdrop-blur-md border-b border-gray-200`

**Dark mode:** `bg-slate-900/80 backdrop-blur-md border-b border-white/10`

---

# 14. Motion & Animations

**Duraciones permitidas:**
- 150ms
- 200ms
- 300ms

**Tipos de animación recomendados:**
- opacity
- translate
- scale (máximo 1.02)

**Evitar:** bounce, elastic, large scale animations

---

# 15. Accesibilidad

Todos los elementos interactivos deben cumplir WCAG AA.

Botones con iconos deben incluir `aria-label`.

**Ejemplo:**
```tsx
<button aria-label="Cerrar modal">
  <XIcon />
</button>
```

**Touch targets mínimo:** 44px

---

# 16. Arquitectura HTML Semántica

Cada página debe tener exactamente 1 `h1`.

**Jerarquía:** h1 → h2 → h3

Nunca saltar niveles.

---

# 17. Imágenes

Todas las imágenes deben usar `next/image`.

**Formato:** WebP

Todas deben tener atributo `alt` descriptivo.

---

# 18. Reglas Generales de UX

**Prioridades del diseño:**
1. Claridad
2. Legibilidad
3. Jerarquía visual
4. Simplicidad

**Evitar:**
- interfaces saturadas
- animaciones innecesarias
- componentes inconsistentes

El objetivo es construir Prügressy como un SaaS que se sienta: premium, profesional, rápido y confiable.

---

# 19. Guía de Migración (para archivos heredados)

## Antes (❌ Incorrecto)
```tsx
function MiComponente() {
  const DS = {
    primary: '#0F4C5C',
    warning: '#F59E0B', // hardcoded - NO USAR
    // ...
  }
}
```

## Después (✅ Correcto)
```tsx
import { useThemeColors } from '@/hooks/useThemeColors'

function MiComponente() {
  const COLORS = useThemeColors()
  // COLORS.primary, COLORS.warning, etc.
}
```

## Colores hardcoded a evitar

| Color hardcoded | Ocurrencias en `src/` | Token correcto |
|-----------------|----------------------|----------------|
| `#0F4C5C` | ~310 | `COLORS.primary` |
| `#38BDF8` | ~215 | `COLORS.primary` (dark) |
| `#FFFFFF` | ~85 | `COLORS.surface` |
| `#475569` | ~83 | `COLORS.textSecondary` |
| `#0F172A` | ~72 | `COLORS.textPrimary` |
| `#E2E8F0` | ~53 | `COLORS.border` |
| `#1E293B` | ~28 | `COLORS.surface` (dark) |
| `#0C3E4A` | ~28 | Usar `COLORS.primaryGradient` |
| `#DC2626` | ~27 | `COLORS.error` |
| `#16A34A` | ~26 | `COLORS.success` |
| `#F59E0B` | ~24 | `COLORS.warning` |
| `#0EA5E9` | ~23 | `COLORS.info` |
| `#94A3B8` | ~23 | `COLORS.textMuted` |
| `#F8FAFC` | ~22 | `COLORS.surfaceSubtle` |
| `#64748B` | ~21 | `COLORS.textMuted` |
| `#D97706` | ~13 | `COLORS.warning` |
| `#F1F5F9` | ~13 | `COLORS.surfaceHover` |
| `#E6F1F4` | ~5 | `COLORS.primaryLight` (legacy) |
| `#334155` | ~2 | `COLORS.border` (dark) |
| `#2DD4BF` | ~6 | `COLORS.primaryLight` (dark) / `COLORS.accentTeal` |
| `#14B8A6` | ~3 | `COLORS.primaryLight` / `COLORS.accentTeal` |

---

# 20. Integración con otras Skills

Esta skill trabaja en sinergia con:
- **`frontend-design`**: Para ejecución práctica del frontend
- **`ui-ux-pro-max`**: Para patrones avanzados y heurísticas
- **`seo-audit`**: Para optimización de SEO técnico
- **`skill-generator`**: Para creación de nuevas skills

---

## Notas de Implementación

- El hook `useThemeColors` maneja hidratación correctamente (evita flash de color incorrecto)
- El hook usa `resolvedTheme` de `next-themes` para detectar el theme real
- El token `isDark` indica el estado actual del theme
- Todos los componentes que usen colores DEBEN usar el hook o recibir `COLORS` como prop