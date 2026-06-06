# Dashboard UI Consolidation

**Estado:** Iniciativa abierta.

Esta iniciativa comienza después del cierre exitoso de la Auditoría de Modales.
La auditoría anterior queda considerada finalizada y no forma parte del alcance de este documento.

---

## Contexto

La Auditoría de Modales logró:

- Estandarización mediante `Button`, `Modal` y `ConfirmModal`
- Eliminación de aproximadamente 50 modales legacy
- Cierre de los dominios críticos: Cash, Employee, Payroll, Clients, Calendar
- 327 tests distribuidos en 34 suites sin fallos
- Mejora estimada del score general de 64 a ~80

Persisten algunos componentes dentro de Dashboard que requieren evaluación individual
para determinar si conviene consolidarlos, migrarlos o mantenerlos en su estado actual.

---

## Objetivo

Reducir deuda técnica en Dashboard mediante evaluación y consolidación de componentes
de alto mantenimiento.

Esta iniciativa **NO** persigue la métrica global de "0 inline modals".

Cada archivo será evaluado individualmente bajo criterios de coste, riesgo y beneficio.

---

## Alcance

### Fase 1 — Prioridad Alta

| Archivo                | Líneas |
| ---------------------- | :----: |
| InventoryClient.tsx    |  669   |
| InventoryFormModal.tsx |  622   |
| CalendarView.tsx       |  608   |

### Fase 2 — Prioridad Media

| Archivo                 | Líneas |
| ----------------------- | :----: |
| PaymentModal.tsx        |  414   |
| TemplateEditorModal.tsx |  395   |
| CreateServiceModal.tsx  |  397   |
| EditServiceModal.tsx    |  397   |

### Fase 3 — Prioridad Baja

| Archivo                    | Líneas |
| -------------------------- | :----: |
| InvitationLinkModal.tsx    |  273   |
| InventoryMovementModal.tsx |  207   |

---

## Exclusiones

Los siguientes componentes no forman parte de esta iniciativa:

- MobileNav
- CommandPalette
- CashSessionFAB
- EmployeeActionMenu
- PeriodSelector
- NotificationCenter
- QuickActionsDropdown

**Motivo:** no pertenecen conceptualmente al sistema de modales y poseen comportamientos
específicos propios.

---

## Criterios de Evaluación

Cada archivo deberá responder las siguientes preguntas:

1. ¿Existe deuda técnica relevante?
2. ¿Existe duplicación de lógica o UI?
3. ¿La migración reduce complejidad real?
4. ¿El beneficio supera el coste de implementación?
5. ¿El riesgo de regresión es aceptable?

Si la respuesta global es negativa, el archivo podrá mantenerse sin modificaciones.

---

## Definición de "Resuelto"

Un archivo se considera resuelto cuando cumple **todos** los siguientes puntos:

- Shell de modal migrado a `<Modal>` o `<ConfirmModal>` (donde aplique)
- `createPortal` eliminado (donde existía)
- Sin regresiones funcionales introducidas
- Tests existentes continúan pasando (327/34, 0 fallos)
- Decisión documentada si se opta por no migrar

---

## Riesgos Conocidos

| Archivo | Riesgo |
|---------|--------|
| **InventoryClient.tsx** | Componente de página. Contiene modales internos. No es un modal puro. |
| **CalendarView.tsx** | Componente de página. Posible mezcla de estado y UI. Alto impacto funcional. |
| **InventoryFormModal.tsx** | Tamaño elevado. Posible acumulación histórica de lógica. |
| **InvitationLinkModal.tsx** | Uso actual de `createPortal`. Requiere evaluación antes de migrar. |
| **InventoryMovementModal.tsx** | Uso actual de `createPortal`. Verificar si sigue aportando valor. |

---

## Estimación de Esfuerzo

| Fase | Horas estimadas |
| :-- | :-------------: |
| Fase 1 — Prioridad Alta | 3–4h |
| Fase 2 — Prioridad Media | 2–3h |
| Fase 3 — Prioridad Baja | 1–2h |
| **Total** | **6–10h** |

---

## Estrategia por Archivo

Antes de modificar código, cada archivo recibirá una mini auditoría (10–15 min) para
responder:

- ¿Qué modales contiene?
- ¿Usa `createPortal`?
- ¿Usa `<Modal>` / `<ConfirmModal>` parcialmente?
- ¿Tiene lógica de negocio mezclada con UI?
- ¿Hay deuda real o solo tamaño?

Esto evita asumir que un archivo de 600+ líneas necesita la misma estrategia que un
modal clásico.

---

## Criterios de Éxito

La iniciativa será considerada exitosa si:

- Se reduce deuda técnica medible en Dashboard
- Se simplifican componentes de alto mantenimiento
- No se introducen regresiones funcionales
- Los tests continúan pasando (327/34, 0 fallos)
- Las decisiones de no migrar quedan justificadas y documentadas

---

## Fuera de Alcance

- Reestructuración completa de Dashboard
- Cambios de arquitectura de datos
- Reorganización masiva de carpetas
- Optimizaciones de rendimiento no relacionadas
- Nuevas dependencias UI
- Reapertura de la Auditoría de Modales

---

## Resultado Esperado

Dashboard más consistente y mantenible, con menor complejidad técnica y decisiones
explícitas sobre los componentes restantes.
