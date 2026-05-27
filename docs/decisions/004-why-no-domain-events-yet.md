# ADR-004: Por Qué No se Ha Implementado Event-Driven Architecture

> STATUS: ACCEPTED
> Date: 2026-05-27
> Source of truth: `docs/architecture/FUTURE/`, `src/actions/`

---

## Contexto

El Architecture Handbook (`docs/architecture/FUTURE/`) describe una arquitectura event-driven completa con 22 eventos de dominio, orquestadores, listeners y una tabla `domain_events`. Esta arquitectura **no está implementada**.

Pregunta recurrente de nuevos desarrolladores: "¿Por qué el código no refleja la arquitectura documentada?"

## Decisión

La arquitectura event-driven es el **objetivo**, no la realidad actual. Se ha priorizado la entrega de funcionalidad sobre la migración arquitectónica por las siguientes razones:

### 1. Costo de migración vs valor inmediato

Migrar las ~40 Server Actions a un modelo event-driven requiere:
- Reescribir cada acción para que emita eventos en lugar de mutar estado
- Implementar el event bus, consumer, orchestrators y listeners
- Shadow mode para validar equivalencia
- Migración de datos existentes

Estimación: 2-3 meses de trabajo dedicado de un dev senior.

### 2. El sistema actual funciona

Las Server Actions con side effects acoplados no son ideales, pero:
- Producen resultados correctos
- Tienen manejo de errores (aunque sea con `console.warn`)
- Son auditables via `confirmation_logs`
- Shadow mode ya está validando que V2 produciría los mismos resultados

### 3. Shadow Mode primero

Se decidió implementar Shadow Mode (ADR-001) como paso previo a la migración:
- Fase 2A: Shadow validation para flujos core
- Fase 2B: Shadow notifications para V1 vs V2
- Cuando el drift sostenido sea 0 por N días → cutover

## Consecuencias

### Positivas

- El sistema actual es estable y conocido
- Shadow mode está acumulando evidencia para la migración
- Se evita una reescritura riesgosa sin validación previa

### Negativas

- La brecha entre documentación (FUTURE/) y código real causa confusión
- Side effects acoplados producen silent failures ocasionales
- No hay replay capability para payroll (si falla, no se regenera automáticamente)

## Cuándo se Revisará Esta Decisión

- Cuando Shadow Mode reporte drift sostenido = 0 por 30 días consecutivos
- Cuando un bug en el acoplamiento actual cause pérdida de datos
- Cuando se disponga de 2-3 meses dedicados para la migración

## Referencias

- Architecture Handbook (futuro): `docs/architecture/FUTURE/`
- Shadow Mode: `docs/modules/SHADOW-MODE.md`
- Estado actual de acciones: `src/actions/`
