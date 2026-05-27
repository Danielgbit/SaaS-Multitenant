# ADR-002: Arquitectura de Notificaciones Multicanal (V2)

> STATUS: ACCEPTED
> Date: 2026-05-27
> Source of truth: `src/lib/notifications/`, `docs/modules/WHATSAPP.md`

---

## Contexto

El sistema original de notificaciones tenía implementaciones separadas por canal:
- WhatsApp: tablas `whatsapp_settings`, `whatsapp_messages`, `whatsapp_logs` + lógica en `src/actions/whatsapp/`
- Email: tablas `email_settings`, `email_logs` + lógica en `src/actions/email/`

Cada canal tenía su propia cola, su propia configuración y su propia lógica de envío. Esto producía:
- Código duplicado para el mismo patrón (queue → send → log → retry)
- Sin unified observability (cada canal loggeaba distinto)
- Sin automation rules (los triggers de envío estaban hardcodeados en acciones)

## Decisión

Implementar una arquitectura multicanal unificada (V2) con:

### Componentes

1. **Channel Adapters** — Interfaz `NotificationChannelAdapter` con implementaciones por canal (N8NWhatsApp, ResendEmail, InApp). Pluggable via factory pattern.
2. **Notification Orchestrator** — Punto de entrada único que resuelve automation rules, renderiza templates y queuea mensajes.
3. **Template Engine** — Motor de renderizado con cache LRU (TTL 5 min). Soportando system defaults + overrides por org.
4. **Unified Queue** — `notification_queue` con SKIP LOCKED, idempotency keys, retry con exponential backoff.
5. **Automation Rules** — Reglas trigger → canal → template con delay configurable.

### Schema

| Tabla | Propósito |
|-------|-----------|
| `notification_providers` | Credenciales por org por canal |
| `notification_queue` | Cola unificada |
| `message_templates` | Templates versionables |
| `automation_rules` | Reglas de automatización |
| `notification_messages` | Historial de mensajes |
| `notification_events` | Timeline de eventos |

### Por qué N8N como middleware WhatsApp

- Cada organización necesita su propio número de WhatsApp Business
- El SaaS no puede integrar directamente con WhatsApp Cloud API multi-tenant
- N8N permite que cada org gestione su instancia de WhatsApp
- El SaaS solo necesita saber la URL del webhook N8N de cada organización

## Consecuencias

### Positivas

- Un solo patrón para todos los canales (queue, send, log, retry)
- Observabilidad unificada via `notification_events`
- Automation rules configurables por organización
- Templates personalizables por organización
- Shadow mode para validar V1 vs V2 sin riesgo

### Negativas

- Migración de datos legacy (whatsapp_messages → notification_queue) pendiente
- Legacy tables conviviendo hasta migración completa
- N8N agrega latencia y un punto de falla externo para WhatsApp

## Alternativas Consideradas

| Alternativa | Razón de rechazo |
|-------------|-------------------|
| Seguir con V1 + agregar canales incrementalmente | La deuda técnica de V1 empeoraría; no hay unified observability |
| Usar servicio externo de notificaciones (Courier, Knock) | Costo recurrente, pérdida de control sobre templates y datos |
| SQS + workers | Mayor complejidad operacional, Supabase queue es suficiente para el volumen actual |

## Referencias

- Implementación: `src/lib/notifications/`
- Channel adapters: `src/lib/notifications/channels/`
- Documentación detallada: `docs/modules/WHATSAPP.md`
- Migraciones V2: `20260513*` y siguientes
