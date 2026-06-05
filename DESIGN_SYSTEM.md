# Design System Lock v1

## 1. Objetivo

Fuente única de verdad del sistema de colores. Define tokens oficiales, reglas de uso y excepciones aprobadas.

## 2. Tokens Oficiales

### Primarios

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `primary` | `#0F4C5C` | `#38BDF8` | CTA principal, focus rings |
| `primaryLight` | `#14B8A6` | `#2DD4BF` | Variante secundaria |
| `primarySubtle` | `#0F4C5C10` | `#38BDF815` | Fondos sutiles |
| `primaryGradient` | `linear-gradient(135deg, #0F4C5C, #115E59)` | `linear-gradient(135deg, #38BDF8, #2DD4BF)` | Headers, CTAs prominentes |
| `textOnPrimary` | `#FFFFFF` | `#0F172A` | Texto sobre primary **obligatorio** |

### Superficies

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `surface` | `#FFFFFF` | `#0F172A` | Fondos de página, modales |
| `surfaceSubtle` | `#F8FAFC` | `#1E293B` | Cards, paneles secundarios |
| `surfaceHover` | `#F1F5F9` | `#334155` | Hover, filas interactivas |
| `surfaceGlass` | `rgba(255,255,255,0.8)` | `rgba(30,41,59,0.7)` | Overlays translúcidos |

### Bordes

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `border` | `#E2E8F0` | `#334155` | Bordes generales |
| `borderLight` | `#F0F3F4` | `#1E293B` | Bordes sutiles |
| `borderFocus` | `#0F4C5C` | `#38BDF8` | Focus rings |

### Texto

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `textPrimary` | `#0F172A` | `#F1F5F9` | Texto principal |
| `textSecondary` | `#475569` | `#94A3B8` | Texto secundario |
| `textMuted` | `#94A3B8` | `#64748B` | Texto deshabilitado |

### Estado

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `success` | `#16A34A` | `#16A34A` | Éxito |
| `successLight` | `#D1FAE5` | `#064E3B` | Background éxito |
| `warning` | `#D97706` | `#D97706` | Advertencia |
| `warningLight` | `#FEF3C7` | `#78350F` | Background advertencia |
| `error` | `#DC2626` | `#DC2626` | Error |
| `errorLight` | `#FEE2E2` | `#450A0A` | Background error |
| `info` | `#0EA5E9` | `#0EA5E9` | Informativo |
| `infoLight` | `#E0F2FE` | `#0C4A6E` | Background info |
| `orange` | `#F97316` | `#F97316` | Atención intermedia |
| `orangeLight` | `#FFF7ED` | `#7C2D12` | Background atención |

### Texto sobre Estado

| Token | Valor | Uso |
|-------|-------|-----|
| `textOnSuccess` | `#FFFFFF` | Texto sobre `success` |
| `textOnWarning` | `#FFFFFF` | Texto sobre `warning` |
| `textOnError` | `#FFFFFF` | Texto sobre `error` |

### Especiales

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `overlay` | `rgba(15,23,42,0.4)` | `rgba(0,0,0,0.7)` | Backdrop modales |
| `headerBg` | `#FAFAF9` | `#1E293B` | Header/sidebar |
| `whatsapp` | `#0F4C5C` | `#25D366` | WhatsApp branding |

> Los valores hex son la implementación actual. El contrato se define por el nombre semántico del token, no por su valor hex.

## 3. Aliases Heredados

Estos tokens existen en runtime pero **no deben usarse en código nuevo**:

| Alias | Equivalente | Razón |
|-------|-------------|-------|
| `danger` | `error` | Duplicado |
| `dangerLight` | `errorLight` | Duplicado |
| `amber` | `warning` | Duplicado |
| `amberLight` | `warningLight` | Duplicado |
| `gold` | `warning` | Duplicado |
| `goldLight` | `warningLight` | Duplicado |
| `glass` | `surfaceGlass` | Nombre ambiguo |

## 4. Reglas de Uso

### ✅ Obligatorio

- Botones primarios → `COLORS.textOnPrimary`
- Status colors → tokens semánticos (`success`, `warning`, `error`)
- Fondos → `surface`, `surfaceSubtle`, `surfaceHover`
- Bordes → `border`, `borderLight`, `borderFocus`
- Texto → `textPrimary`, `textSecondary`, `textMuted`
- Overlays → `COLORS.overlay`
- Nuevos componentes → 0 hex hardcoded en inline styles

### ❌ Prohibido

- `style={{ color: '#xxxxxx' }}` — usar tokens
- `style={{ backgroundColor: '#xxxxxx' }}` — usar tokens
- `COLORS.isDark ? '#hex' : '#hex'` — usar tokens existentes
- Usar aliases heredados en código nuevo
- Introducir nuevos tokens sin migración formal

### ✅ Permitido (excepciones aprobadas)

| Categoría | Ejemplo | Justificación |
|-----------|---------|---------------|
| Glass-morphism | `color: '#FFFFFF'` sobre gradiente | Efecto visual, no superficie UI |
| Toggle knobs | `backgroundColor: '#FFFFFF'` | Patrón UI estándar |
| Spinners | `color: '#FFFFFF'` sobre toggle | Necesita contraste máximo |
| Decorativos | `backgroundColor: '#FFFFFF'` con opacity < 100% | Círculos decorativos, overlays sutiles |
| Meta tags | `app/layout.tsx` | Browser chrome, no UI |
| Landing | `precios/page.tsx` | Gradiente autocontenido |
| Config | `rbac-config.ts` | Constantes de configuración |

## 5. Matriz de Migración

| Hex | Token | Contexto |
|-----|-------|----------|
| `#FFFFFF` sobre primary/gradient | `COLORS.textOnPrimary` | CTA, badges, headers |
| `#16A34A`, `#22C55E` | `COLORS.success` | Status éxito |
| `#D97706`, `#EAB308` | `COLORS.warning` | Status advertencia |
| `#DC2626`, `#EF4444` | `COLORS.error` | Status error |
| `#F97316` | `COLORS.orange` | Atención intermedia |
| `#0EA5E9` | `COLORS.info` | Informativo |
| `#FFFFFF` (background, botón secundario) | `COLORS.surface` | Fondo UI |
| `#F59E0B` | `COLORS.warning` | Amber/warning status |
| `#475569` | `COLORS.textSecondary` | Texto secundario |
| `#0F172A` | `COLORS.textPrimary` | Texto principal |
| `#94A3B8` | `COLORS.textMuted` | Texto deshabilitado |
| `#E2E8F0` | `COLORS.border` | Bordes generales |

## 6. Exenciones Activas Aprobadas

| Archivo | Exención | Tipo |
|---------|----------|------|
| `src/app/layout.tsx` | Exento por archivo en ESLint config | Permanente |
| `src/app/precios/page.tsx` | Exento por archivo en ESLint config | Permanente |
| `src/lib/rbac-config.ts` | Exento por archivo en ESLint config | Permanente |
| `CalendarToolbar.tsx L70` | `// eslint-disable-next-line` — glass effect | Decorativo |
| `LoanModal.tsx L127` | `decorativeBg` via variable | Decorativo |
| `TabAutomations.tsx` | `spinnerColor`, `toggleThumbBg` via variables | Decorativo |
| `TabSettings.tsx` | `toggleThumbBg` via variable | Decorativo |

## 7. PR Checklist

```markdown
## Theme Compliance Checklist

- [ ] No hex colors en `style={{ }}` inline styles (usar `COLORS.*` tokens)
- [ ] Botones primarios usan `COLORS.textOnPrimary`
- [ ] Status colors usan `COLORS.success/warning/error`
- [ ] No hay patrones `isDark ? '#hex' : '#hex'`
- [ ] Toda excepción está documentada en `DESIGN_SYSTEM.md`
- [ ] `npm run lint` → sin errores
- [ ] `npx tsc --noEmit` → sin errores nuevos
- [ ] Verificación visual: light mode OK / dark mode OK
```

## 8. Historial

| Hito | Baseline | Descripción |
|------|----------|-------------|
| Inicial | 76 warnings | Antes de la migración |
| Etapa 1 | 76 → 63 | Freeze + guardrail ESLint |
| Etapa 2 | 63 → 52 | PR P0/P1 consolidado |
| Etapa 3 | 52 → 32 | Migración por módulos |
| Nuevos tokens | 32 → 24 | `orange`, `textOnSuccess`, `textOnWarning`, `textOnError` |
| ESLint error | 24 → 15 → 0 | Regla a `error` + exenciones documentadas |
| Refactor final | 0 → 0 | ActiveAlerts + HealthSummaryCards migrados |
