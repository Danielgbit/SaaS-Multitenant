# Testing

> STATUS: CURRENT IMPLEMENTATION
> Last updated: 2026-05-27

---

## Testing Philosophy

The project prioritizes deterministic unit tests, critical business logic coverage,
lightweight CI execution, and runtime validation through shadow mode.
Heavy integration and end-to-end testing are intentionally limited
until architectural stabilization.

- **Critical business flows first** — Confirmaciones, payroll, invitaciones tienen prioridad
- **Lightweight unit coverage** — Tests en utilidades puras (date-utils, transformers, slots)
- **Manual validation aceptable** — Para UI de bajo riesgo o cambios puramente visuales
- **Shadow mode como test continuo** — La validación V1 vs V2 en producción es el test de integración más valioso

---

## Unit Tests (Vitest)

### Configuración

`vitest.config.ts` en la raíz. Coverage con `@vitest/coverage-v8`.

### Tests existentes

| Archivo | Cobertura | Tests |
|---------|-----------|-------|
| `src/lib/calendar/__tests__/date-utils.test.ts` | Utilidades de fecha del calendario | — |
| `src/lib/calendar/__tests__/transformers.test.ts` | Transformers de datos del calendario | — |
| `src/lib/calendar/__tests__/slots.test.ts` | Generación de slots disponibles | — |
| `src/lib/appointments/__tests__/create-appointment-core.test.ts` | Creación de citas | — |
| `src/lib/appointments/__tests__/update-appointment-core.test.ts` | Actualización de citas | — |
| `src/lib/__tests__/navigation.test.ts` | Utilidades de navegación | — |

### Cómo ejecutar

```bash
npm test              # Una vez
npm run test:watch    # Modo watch
npm run coverage      # Con coverage
```

### Cómo escribir tests

Colocar en `__tests__/` dentro del módulo correspondiente:

```typescript
// src/lib/<module>/__tests__/<name>.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '../my-module'

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(input)).toBe(expected)
  })
})
```

---

## Integration Testing (Playwright)

Hay un archivo `test-playwright.mjs` en la raíz del proyecto para tests de browser.

Estado actual: Setup inicial, no hay suite completa de tests E2E.

---

## Flujo de Invitación (Testing Manual)

`TESTING-INVITATION-FLOW.md` en la raíz del proyecto cubre:

| Escenario | Descripción |
|-----------|-------------|
| 1 | Empleado nuevo (sin cuenta previa) — crear, invitar, crear contraseña, login |
| 2 | Empleado existente (ya tiene cuenta) — login y aceptar invitación |
| 3 | Usuario ya logueado recibe invitación — aceptar directamente |
| 4 | Recuperación de contraseña — forgot password, reset, login |

Incluye queries SQL de verificación y cleanup scripts para repetir testing.

---

## Architecture Guard (Drift Detection)

```bash
npm run guard              # Detección de drift visual (colors, primitives, hovers)
npm run guard:ci           # Formato GitHub Actions
npm run guard:verbose      # Incluye items deferred y OVS
```

No bloquea el pipeline actualmente. Es solo visibilidad.

---

## Shadow Mode (Validación Continua)

El shadow mode ejecuta la arquitectura V2 en paralelo y compara resultados con V1:

```sql
-- Verificar drift detectado
SELECT severity, COUNT(*) FROM shadow_notification_logs GROUP BY severity;

-- Últimos drifts críticos
SELECT * FROM shadow_notification_logs WHERE severity = 'critical' ORDER BY created_at DESC;
```

Ver `docs/modules/SHADOW-MODE.md` para detalle.

---

## CI/CD

No hay GitHub Actions configurados actualmente. El pipeline de CI es responsabilidad del equipo configurar lint + test + build en PRs.

---

## Coverage Targets (Deseable)

| Área | Target actual | Target deseado |
|------|---------------|----------------|
| Utilidades puras | ✅ Bajo | > 80% |
| Server Actions | ❌ No hay | > 60% |
| Componentes UI | ❌ No hay | > 40% (critical paths) |
| E2E (Playwright) | ❌ No hay | Flujos críticos |

---

## Documentos Relacionados

- `TESTING-INVITATION-FLOW.md` — Testing manual del flujo de invitación
- `vitest.config.ts` — Configuración de Vitest
- `docs/modules/SHADOW-MODE.md` — Shadow mode como testing continuo
