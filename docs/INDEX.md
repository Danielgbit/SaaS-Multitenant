# Índice de Documentación — Prügressy

> Última actualización: 2026-05-27
> Este índice es el punto de entrada a toda la documentación del proyecto.
> Los documentos están organizados por tipo y precedencia (CURRENT = implementado, PROPOSAL = plan futuro).

---

## Cómo usar este índice

Cada documento tiene un **STATUS** que indica su relación con la realidad del código:

| STATUS | Significado |
|--------|-------------|
| CURRENT IMPLEMENTATION | Describe funcionalidad existente en el código |
| PROPOSAL / NOT IMPLEMENTED | Describe arquitectura objetivo o plan — NO implementado |
| LEGACY / ARCHIVED | Documento histórico, contenido puede estar desactualizado |

---

## Empezar aquí

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `README.md` (raíz) | CURRENT | Qué es Prügressy, stack, setup rápido |
| `.env.example` (raíz) | CURRENT | Variables de entorno documentadas |
| `docs/setup/SETUP.md` | CURRENT | Setup paso a paso con checklist de verificación |
| `docs/architecture/CURRENT/ENVIRONMENT.md` | CURRENT | Referencia completa de variables de entorno |
| `docs/architecture/CURRENT/DATABASE.md` | CURRENT | Schema de base de datos, entidades, RLS |
| `docs/operations/DEPLOYMENT.md` | CURRENT | Despliegue a producción, orden de provisioning, rollback |

---

## Arquitectura

### Current — Implementado

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/architecture/CURRENT/ARCHITECTURE.md` | CURRENT | Visión general del sistema, stack, estructura, flujos |
| `docs/architecture/CURRENT/ENVIRONMENT.md` | CURRENT | Referencia completa de variables de entorno |
| `docs/architecture/CURRENT/CRON-JOBS.md` | CURRENT | Todos los endpoints cron programados |
| `docs/architecture/CURRENT/DATABASE.md` | CURRENT | Schema de base de datos, entidades, relaciones, RLS, legacy tables |

### Future — Propuestas y Planes

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/architecture/FUTURE/README.md` | PROPOSAL | Architecture Handbook — visión event-driven |
| `docs/architecture/FUTURE/01-domain-overview.md` | PROPOSAL | Análisis de arquitectura event-driven |
| `docs/architecture/FUTURE/02-domain-events.md` | PROPOSAL | Catálogo de 22 eventos de dominio |
| `docs/architecture/FUTURE/03-state-ownership.md` | PROPOSAL | Single Writer Principle |
| `docs/architecture/FUTURE/04-transition-authority.md` | PROPOSAL | Permisos de transición de estado |
| `docs/architecture/FUTURE/05-domain-invariants.md` | PROPOSAL | Invariantes HARD y SOFT |
| `docs/architecture/FUTURE/06-state-machines.md` | PROPOSAL | Máquinas de estado determinísticas |
| `docs/architecture/FUTURE/07-orchestrator-architecture.md` | PROPOSAL | Arquitectura de orquestadores |
| `docs/architecture/FUTURE/08-event-classification.md` | PROPOSAL | Clasificación de eventos |
| `docs/architecture/FUTURE/09-replay-and-idempotency.md` | PROPOSAL | Replay e idempotencia |
| `docs/architecture/FUTURE/10-failure-classification.md` | PROPOSAL | Taxonomía de fallos |
| `docs/architecture/FUTURE/11-source-of-truth.md` | PROPOSAL | Fuente de verdad |
| `docs/architecture/FUTURE/12-cron-architecture.md` | PROPOSAL | Arquitectura de cron detectors |
| `docs/architecture/FUTURE/13-payroll-architecture.md` | PROPOSAL | Desacoplamiento de nómina |
| `docs/architecture/FUTURE/14-observability.md` | PROPOSAL | Observabilidad y tracing |
| `docs/architecture/FUTURE/15-event-replay-operations.md` | PROPOSAL | Procedimientos operativos de replay |
| `docs/architecture/FUTURE/16-folder-structure.md` | PROPOSAL | Estructura de carpetas objetivo |
| `docs/architecture/FUTURE/17-migration-strategy.md` | PROPOSAL | Estrategia de migración Strangler Fig |

---

## Módulos de Negocio

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/modules/CONFIRMATIONS.md` | CURRENT | Sistema de confirmaciones v2 (flujo A + B) |
| `docs/modules/WHATSAPP.md` | CURRENT | Arquitectura de notificaciones WhatsApp v2 |
| `docs/modules/EMPLOYEE-INVITE.md` | CURRENT | Flujo de invitación de empleados + recuperación de contraseña |
| `docs/modules/SHADOW-MODE.md` | CURRENT | Shadow Mode — validación en paralelo de arquitectura |
| `docs/modules/PAYROLL.md` | CURRENT | Arquitectura de nómina (V1+V2, fire-and-forget, failure tolerance) |
| `docs/modules/DATA-RETENTION.md` | CURRENT | Sistema de purga y retención de datos |

---

## Governance

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/governance/ARCHITECTURE_GOVERNANCE.md` | CURRENT | Políticas de frontend, patrones permitidos/prohibidos |
| `docs/governance/ARCHITECTURE_SNAPSHOT.md` | CURRENT | Historial de enforcement y estado por módulo |
| `docs/governance/OPERATIONAL_VISUAL_SYSTEMS.md` | CURRENT | Registro OVS — sistemas visuales operacionales |
| `docs/governance/WARN-TAXONOMY-v1.md` | CURRENT | Taxonomía de clasificación WARN para architecture guard |
| `docs/governance/README-WARN-REVIEW.md` | CURRENT | Guía de revisión de WARN entries |
| `docs/governance/DOCUMENTATION_POLICY.md` | CURRENT | Políticas de mantenimiento documental |

---

## Operaciones

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/operations/DEPLOYMENT.md` | CURRENT | Despliegue a producción, orden de provisioning, rollback |
| `docs/operations/SECURITY.md` | CURRENT | Rate limiting, webhooks, CSRF, RLS, checklist de seguridad |
| `docs/operations/TROUBLESHOOTING.md` | CURRENT | Errores comunes por síntoma observable |
| `docs/operations/TESTING.md` | CURRENT | Tests unitarios, Playwright, shadow mode, philosophy |

---

## Auditorías

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/audits/CALENDAR_AUDIT.md` | CURRENT | Auditoría de arquitectura del módulo Calendar |
| `docs/audits/CONFIRMATIONS_QA_REPORT.md` | CURRENT | QA post-migración del módulo Confirmations |
| `docs/audits/UI-UX-PATTERN.md` | CURRENT | Patrón de diseño UX/UI del dashboard |
| `docs/audits/FASE0-AUDIT-TYPOGRAPHY.md` | CURRENT | Audit de componentes sensibles a cambio tipográfico |

---

## Archivo

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/archive/DOMAIN_EVENT_ARCHITECTURE.md` | LEGACY | Documento monolítico de event-driven (reemplazado por FUTURE/) |
| `docs/archive/ARCHITECTURE-CONFIRMATIONS.md` | LEGACY | Arquitectura v1 de confirmaciones (reemplazado por CONFIRMATIONS.md) |

---

## Decisiones Arquitectónicas (ADRs)

| Documento | STATUS | Descripción |
|-----------|--------|-------------|
| `docs/decisions/001-shadow-mode.md` | ACCEPTED | Shadow Mode para validación de arquitectura |
| `docs/decisions/002-notification-provider-architecture.md` | ACCEPTED | Arquitectura de notificaciones multicanal v2 |
| `docs/decisions/003-proxy-middleware-consolidation.md` | ACCEPTED | Proxy middleware vs Next.js middleware |
| `docs/decisions/004-why-no-domain-events-yet.md` | ACCEPTED | Por qué no se ha implementado event-driven aún |

---

## Documentos raíz del proyecto

| Documento | Descripción |
|-----------|-------------|
| `README.md` | Portal de entrada al proyecto |
| `ROADMAP.md` | Roadmap de producto y estado por módulo |
| `.env.example` | Template de variables de entorno |
| `TESTING-INVITATION-FLOW.md` | Guía de testing del flujo de invitación |

---

## Mantenimiento

Este índice se actualiza manualmente. Reglas:

- Nuevo documento en `docs/` → agregar entrada aquí
- Documento movido → actualizar ruta
- Documento archivado → mover a `docs/archive/` con banner LEGACY

Ver `docs/governance/DOCUMENTATION_POLICY.md` para las políticas completas.
