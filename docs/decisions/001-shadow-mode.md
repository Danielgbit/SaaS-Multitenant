# ADR-001: Shadow Mode para Validación de Arquitectura

> STATUS: ACCEPTED
> Date: 2026-05-27
> Source of truth: `src/lib/notifications/shadow/`, `src/lib/shadow/`

---

## Contexto

El proyecto necesita migrar de una arquitectura de Server Actions con side effects acoplados a una arquitectura event-driven con orquestadores. La migración es riesgosa porque:

- El sistema está en producción con datos reales
- No hay tests de integración que cubran todos los flujos
- Un bug en la nueva arquitectura podría corromper datos de nómina o citas

Se necesita una forma de validar que la nueva arquitectura (V2) produce los mismos resultados que la actual (V1) sin poner en riesgo la operación.

## Decisión

Implementar un sistema de **Shadow Mode** que ejecuta V2 en paralelo a V1 sin afectar el resultado visible para el usuario.

### Modos

| Modo | Comportamiento | Estado |
|------|---------------|--------|
| `observe_only` | Solo registra comparaciones. Sin impacto en producción. | Implementado |
| `dual_write` | Ejecuta V2 en paralelo y registra ambos resultados. | Configurado, runner pendiente |
| `soft_enforce` | Alertas automáticas cuando el drift excede umbral. | Configurado, runner pendiente |

### Fases

| Fase | Ámbito | Estado |
|------|--------|--------|
| 2A | Shadow general (service:complete, appointment:cancel) | ✅ Implementado |
| 2B | Shadow notificaciones V1 vs V2 | ✅ Implementado |

## Consecuencias

### Positivas

- Permite acumular evidencia de equivalencia V1↔V2 antes del cutover
- Cero impacto en el hot path (fire-and-forget con timeout 100ms)
- Detecta 6 tipos de drift (render, template, routing, payload, scheduling, orchestration)

### Negativas

- Duplica lógica de routing y renderizado en el shadow comparator
- Consume recursos de BD (tablas de shadow logs)
- Requiere scheduler externo para el runner

## Alternativas Consideradas

| Alternativa | Razón de rechazo |
|-------------|-------------------|
| Feature flags + V2 condicional | Riesgo de bugs en producción si V2 se activa accidentalmente |
| Solo tests de integración | No cubren todos los casos borde de datos reales |
| Migración directa con rollback | Tiempo de rollback demasiado alto para datos de nómina |

## Referencias

- Implementación: `src/lib/notifications/shadow/`
- Migraciones: `20260516000000_create_shadow_validation_logs.sql` y relacionadas
