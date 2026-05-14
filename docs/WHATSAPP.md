# WhatsApp — Arquitectura del Módulo

## 1. Visión General

El módulo `/whatsapp` gestiona el envío de mensajes de WhatsApp a clientes del SaaS. Forma parte del **sistema de notificaciones v2**, diseñado para ser multicanal (WhatsApp, email, in-app), extensible mediante adaptadores (channel adapters) y configurable por organización mediante reglas de automatización.

### 1.1 Propósito

- Enviar recordatorios automáticos de citas
- Notificar cambios, cancelaciones y confirmaciones
- Solicitar confirmación de asistencia al cliente
- Permitir que el cliente responda "confirmar" o "cancelar" desde WhatsApp
- Proveer templates editables por organización

### 1.2 Sistemas: Legacy vs v2

| Aspecto | Legacy (v1) | Nueva (v2) |
|---------|-------------|------------|
| Config proveedor | `whatsapp_settings` | `notification_providers` |
| Cola de mensajes | `whatsapp_messages` | `notification_queue` |
| Logs | `whatsapp_logs` | Status tracking en `notification_queue` |
| Templates | Hardcodeadas en `whatsApp.ts` | `message_templates` con versioning |
| Automatización | Manual (scheduler) | `automation_rules` con triggers |
| Channel adapter | Fetch directo en actions | Pluggable via factory pattern |
| Confirmación cliente | ❌ No existía | `confirmation_tokens` + webhook replies |

Ambos sistemas **conviven** actualmente para no romrer funcionalidad existente. El nuevo sistema v2 es el que se documenta aquí.

---

## 2. Arquitectura del Sistema

```
                         ┌─────────────────────────┐
                         │   Appointment Event      │
                         │ (created/reminder/etc.)  │
                         └────────────┬────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │   NotificationOrchestrator      │
                    │   (src/lib/notifications/)      │
                    │                                 │
                    │  1. Fetch appointment data      │
                    │  2. Resolve automation_rules    │
                    │  3. Resolve provider config     │
                    │  4. Render template             │
                    │  5. Queue notification          │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌──────────────────┐    ┌──────────────────────┐
          │ delayMinutes > 0 │    │  delayMinutes === 0  │
          │                  │    │                      │
          │ INSERT queue     │    │ INSERT queue + send  │
          │ status=pending   │    │ inmediato            │
          └────────┬─────────┘    └──────────┬───────────┘
                   │                         │
                   └────────────┬────────────┘
                                │
                                ▼
              ┌──────────────────────────────────┐
              │  Cron: /api/cron/process-        │
              │  notifications (cada 5 min)      │
              │                                  │
              │  1. Recover stuck jobs (>10min)  │
              │  2. Claim batch (SKIP LOCKED)    │
              │  3. Rate limit check             │
              │  4. createChannel(adapter)       │
              │  5. adapter.send(message)        │
              │  6. Update status                │
              └────────────┬─────────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │    Channel Adapter       │
              │  (N8NWhatsAppChannel)    │
              │                          │
              │  POST /webhook           │
              │  { phone, message, ... } │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │     N8N / Pipedream      │
              │   (middleware opcional)  │
              └────────────┬─────────────┘
                           │
              ┌────────────┴─────────────┐
              │                          │
              ▼                          ▼
   ┌───────────────────┐    ┌──────────────────────┐
   │ Evolution API     │    │ WhatsApp Cloud API   │
   │ (self-hosted)     │    │ (Meta official)      │
   └─────────┬─────────┘    └──────────┬───────────┘
             │                         │
             └────────────┬────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │  📱 Cliente │
                    └──────────┘

Respuesta del cliente ("confirmar"/"cancelar")
                          │
                          ▼
              ┌──────────────────────────┐
              │  Webhook:                │
              │  /api/webhooks/          │
              │  notifications           │
              │                          │
              │  1. Delivery status      │
              │  2. Client keyword reply │
              │  3. Update appointment   │
              └──────────────────────────┘
```

---

## 3. Componentes del Sistema

### 3.1 Notification Orchestrator

**Archivo:** `src/lib/notifications/orchestrator.ts`

Es el punto de entrada de todo el flujo de notificaciones. Se invoca cuando ocurre un evento de cita (creación, recordatorio, cancelación, etc.).

**Flujo interno:**

```
NotificationOrchestrator(trigger, appointmentId)
  │
  ├── 1. Fetch appointment con joins (cliente, empleado, servicios, org)
  │
  ├── 2. Query automation_rules WHERE
  │        organization_id = :org
  │        trigger_event  = :trigger
  │        is_enabled     = true
  │
  ├── 3. Para cada regla activa:
  │      ├── Obtener provider config (notification_providers)
  │      ├── Render template via template-engine
  │      ├── Construir variables (cliente, fecha, hora, etc.)
  │      ├── Generar idempotencyKey
  │      ├── INSERT notification_queue
  │      └── Si delayMinutes === 0 → send inmediato via channel adapter
  │
  └── Retornar resultado { queued, sent, errors }
```

**Funciones exportadas:**

| Función | Trigger | Cuándo se usa |
|---------|---------|---------------|
| `dispatchAppointmentCreated` | `appointment_created` | Cita creada desde dashboard o booking público |
| `dispatchAppointmentReminder` | `appointment_reminder` | Programado por automation rule con delay |
| `dispatchAppointmentCancelled` | `appointment_cancelled` | Cita cancelada por cliente o negocio |
| `dispatchAppointmentCompleted` | `appointment_completed` | Servicio completado |
| `dispatchAppointmentNoShow` | `appointment_no_show` | Cliente no asistió |
| `dispatchConfirmationRequest` | `confirmation_requested` | Solicitar confirmación al cliente |

### 3.2 Template Engine

**Archivo:** `src/lib/notifications/template-engine.ts`

Motor de renderizado de templates con caché LRU en memoria (TTL: 5 minutos).

**Flujo:**

```
getTemplateWithRender(organizationId, channel, type, variables)
  │
  ├── 1. Buscar template custom (organization_id = :org)
  │         Si existe → renderizar con replacePlaceholders()
  │
  └── 2. Si no existe → buscar system default (organization_id IS NULL)
            Si existe → renderizar
            Si no existe → error
```

**Variables estándar disponibles (11):**

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{clientName}}` | Nombre del cliente | María García |
| `{{appointmentDate}}` | Fecha de la cita | 15 de mayo de 2026 |
| `{{appointmentTime}}` | Hora de la cita | 2:00 PM |
| `{{businessName}}` | Nombre del negocio | Spa Relax |
| `{{serviceName}}` | Nombre del servicio | Masaje Relajante |
| `{{employeeName}}` | Nombre del empleado | Carlos López |
| `{{confirmationLink}}` | Link para confirmar | `https://app/confirmar/abc` |
| `{{cancellationLink}}` | Link para cancelar | `https://app/cancelar/abc` |
| `{{rescheduleLink}}` | Link para reprogramar | `https://app/reprogramar/abc` |
| `{{businessPhone}}` | Teléfono del negocio | +57 300 123 4567 |
| `{{businessAddress}}` | Dirección del negocio | Calle 123 #45-67 |

**Caché:**

```typescript
const TEMPLATE_CACHE_TTL_MS = 300000 // 5 minutos
// In-memory Map<orgId_channel_type, { template, timestamp }>
```

### 3.3 Notification Queue

**Tabla:** `notification_queue`

Cola de mensajes con control de estados, reintentos y auditoría.

**Diagrama de estados:**

```
                  ┌──────────┐
     ┌────────────│ pending  │◄────────────┐
     │            └────┬─────┘             │
     │                 │                   │
     │          ┌──────┴──────┐            │
     │          │             │            │
     │     ┌────▼────┐  ┌─────▼─────┐     │
     │     │processing│  │ cancelled │     │
     │     └──┬────┬──┘  └───────────┘     │
     │        │    │                       │
     │  ┌─────▼┐ ┌─▼────────┐             │
     │  │ sent │ │ failed   │─────────────┘
     │  └──┬───┘ └──────────┘  (retry si attempt < max)
     │     │
     │  ┌──▼──────┐   ┌──────────────────┐
     │  │delivered│   │failed_permanently │
     │  └──┬──────┘   └──────────────────┘
     │     │
     │  ┌──▼──┐
     │  │ read│
     │  └─────┘
```

**Campos clave:**

| Campo | Propósito |
|-------|-----------|
| `idempotency_key` | Evita duplicados (UNIQUE con organization_id) |
| `attempts` | Contador de reintentos (max 3) |
| `last_error` | Último error registrado |
| `next_retry_at` | Próximo reintento (exponential backoff) |
| `provider_message_id` | ID del mensaje en el proveedor externo |
| `claimed_at` | Timestamp cuando el cron tomó el item |
| `processing_timeout_at` | Si pasa >10min, se considera stuck |

**Concurrencia:** Usa `SKIP LOCKED` para evitar race conditions entre múltiples instancias del cron.

### 3.4 Channel Adapters

**Archivos:** `src/lib/notifications/channels/`

Cada canal implementa la interfaz `NotificationChannelAdapter`:

```typescript
interface NotificationChannelAdapter {
  send(message: NotificationMessage): Promise<SendResult>
  getProviderName(): NotificationProviderType
  getChannel(): NotificationChannel
}
```

#### N8NWhatsAppChannel

| Propiedad | Valor |
|-----------|-------|
| Clase | `N8NWhatsAppChannel` |
| Provider name | `'n8n'` |
| Channel | `'whatsapp'` |
| Config requerida | `webhook_url` |
| Config opcional | `api_key` (Bearer token) |
| Timeout | 30 segundos |

**Payload enviado al webhook:**

```json
{
  "phone": "573001234567",
  "message": "Hola María, tu cita de Masaje Relajante es el 15 de mayo a las 2:00 PM.",
  "variables": {
    "clientName": "María García",
    "appointmentDate": "15 de mayo de 2026",
    "appointmentTime": "2:00 PM"
  },
  "appointment_id": "uuid-del-appointment",
  "message_type": "notification",
  "trace_id": "uuid-de-traza"
}
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer <api_key>  (si configurada)
```

**Respuesta esperada del webhook (status 200):**

```json
{
  "message_id": "uuid-del-proveedor",
  "status": "sent"
}
```

**Manejo de errores:**

| Código HTTP | Comportamiento |
|-------------|---------------|
| 200 OK | Éxito, se marca como `sent` |
| 4xx (excepto 429) | Error no retryable → `failed_permanently` |
| 5xx o 429 | Retryable → se programa reintento |
| Timeout (>30s) | Retryable → se programa reintento |

#### ResendEmailChannel

| Propiedad | Valor |
|-----------|-------|
| Clase | `ResendEmailChannel` |
| Config | `from_email` (default: `EMAIL_FROM` env) |
| Provider | `'resend'` |
| Validación | `toAddress` debe contener `@` |

#### InAppChannel

| Propiedad | Valor |
|-----------|-------|
| Clase | `InAppChannel` |
| Config requerida | `userId` |
| Destino | Tabla `notifications` (in-app) |
| Provider | `'internal'` |

### 3.5 Channel Factory

**Archivo:** `src/lib/notifications/channels/factory.ts`

```typescript
createChannel(channel: 'whatsapp', config): N8NWhatsAppChannel
createChannel(channel: 'email', config): ResendEmailChannel
createChannel(channel: 'in_app', config): InAppChannel
createChannel(channel: 'sms', config): null  // No implementado
```

### 3.6 Cron: Process Notifications

**Endpoint:** `POST /api/cron/process-notifications`

**Programación:** Cada 5 minutos via Pipedream (cron job externo)

**Configuración:**

| Variable | Valor |
|----------|-------|
| `CRON_SECRET` | `prugressy_cron_secret_2026` |
| Batch size | 50 items por ejecución |
| Processing timeout | 10 minutos |
| Rate limit window | 60 segundos |
| Max attempts | 3 |

**Flujo:**

```
POST /api/cron/process-notifications
Authorization: Bearer <CRON_SECRET>

   │
   ├── 1. Recuperar stuck jobs
   │     UPDATE notification_queue
   │     SET status = 'pending', claimed_at = NULL
   │     WHERE status = 'processing'
   │     AND processing_timeout_at < NOW()
   │
   ├── 2. Claim batch
   │     UPDATE notification_queue
   │     SET status = 'processing',
   │         claimed_at = NOW(),
   │         processing_timeout_at = NOW() + 10min
   │     WHERE id IN (
   │       SELECT id FROM notification_queue
   │       WHERE status IN ('pending')
   │       AND (next_retry_at IS NULL OR next_retry_at <= NOW())
   │       ORDER BY scheduled_at ASC
   │       LIMIT 50
   │       FOR UPDATE SKIP LOCKED
   │     )
   │     RETURNING *
   │
   ├── 3. Para cada item:
   │     ├── Rate limit check (org+channel, ventana 1min)
   │     ├── createChannel(channel, config)
   │     ├── adapter.send(message)
   │     ├── Si éxito → UPDATE status = 'sent'
   │     └── Si error → UPDATE status = 'failed', programar retry
   │
   └── 4. Retornar { processed, sent, failed, skipped }
```

**Exponential backoff:**

```typescript
// Próximo retry = 5 minutos * attempts²
next_retry_at = new Date(Date.now() + 5 * 60 * 1000 * Math.pow(attempts, 2))
// attempt 1 → 5 min
// attempt 2 → 20 min
// attempt 3 → 45 min (si falla, pasa a failed_permanently)
```

### 3.7 Webhook de Notificaciones

**Endpoint:** `POST /api/webhooks/notifications`

**Propósito:** Recibir actualizaciones de estado de entrega y respuestas del cliente desde N8N/Evolution.

**Runtime:** Edge (V8 isolate, no Node.js — no usar `crypto`/`fs`)

**Auth (opcional):**

```
Authorization: Bearer <WEBHOOK_SECRET>
```

**Payload de delivery status:**

```json
{
  "providerMessageId": "uuid-del-proveedor",
  "status": "delivered",
  "channel": "whatsapp",
  "timestamp": "2026-05-13T12:00:00Z",
  "rawPayload": {}
}
```

**Payload de respuesta del cliente:**

```json
{
  "channel": "whatsapp",
  "status": "reply",
  "rawPayload": {
    "from": "573001234567",
    "text": {
      "body": "confirmar"
    }
  }
}
```

**Palabras clave detectadas:**

| Acción | Palabras (case-insensitive) |
|--------|---------------------------|
| Confirmar | `confirmar`, `confirmo`, `sí`, `si`, `yes` |
| Cancelar | `cancelar`, `cancelo`, `no` |

**Flujo de respuesta del cliente (`processClientReply`):**

```
Webhook recibe reply del cliente ("confirmar")
  │
  ├── 1. Buscar último notification_queue item para ese teléfono
  │
  ├── 2. Obtener appointment_id asociado
  │
  ├── 3. UPDATE appointments
  │     SET confirmation_status = 'confirmed'
  │     WHERE id = :appointment_id
  │
  ├── 4. INSERT confirmation_logs
  │     { action: 'confirmed', performed_by_role: 'system' }
  │
  ├── 5. INSERT notifications (in-app) para staff
  │
  └── 6. Retornar 200 OK
```

**Mapeo de estados (`mapProviderStatusToInternal`):**

| Provider | Estado externo | Estado interno | Retryable |
|----------|---------------|----------------|-----------|
| n8n | `sent` | `sent` | No |
| n8n | `delivered` | `delivered` | No |
| n8n | `read` | `read` | No |
| n8n | `failed` | `failed` | Sí |
| n8n | `invalid_number` | `failed_permanently` | No |
| n8n | `blocked` | `failed_permanently` | No |

---

## 4. Integraciones Externas

### 4.1 N8N (implementado)

**Estado:** ✅ Implementado y operativo

**Rol:** Middleware entre el SaaS y WhatsApp. Recibe un webhook POST con el payload estandarizado y lo transforma para llamar a WhatsApp Cloud API (o Evolution API).

**Por qué N8N:**

- El SaaS no puede integrar directamente con WhatsApp Cloud API porque cada organización necesita su propio número de WhatsApp Business
- N8N permite que cada organización gestione su propia instancia de WhatsApp (o Evolution API)
- El SaaS solo necesita saber la URL del webhook de N8N de cada organización
- N8N provee UI visual para debugging y reintentos

**Configuración por organización:**

Cada organización guarda su configuración en `notification_providers`:

```json
{
  "config": {
    "webhook_url": "https://n8n-cliente.com/webhook/whatsapp",
    "api_key": "sk-abc123..."
  },
  "isEnabled": true,
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500
}
```

### 4.2 Evolution API (schema listo, implementación pendiente)

**Estado:** ⏳ Schema en DB, sin channel adapter

Evolution API es un proyecto open-source que permite ejecutar una instancia de WhatsApp API autogestionada via Docker. Conecta directamente con WhatsApp Web (no requiere API de Meta Business).

**Soporte actual:**

- `'evolution'` definido como `NotificationProviderType` en Typescript
- `'evolution'` definido como valor válido en `notification_providers.provider` (CHECK constraint)
- **No existe** `EvolutionWhatsAppChannel` class
- **No existe** UI en TabSettings para seleccionar Evolution como provider

**Para implementar en el futuro:**

```typescript
// src/lib/notifications/channels/whatsapp-evolution.channel.ts
export class EvolutionWhatsAppChannel implements NotificationChannelAdapter {
  // Config: instanceUrl (ej: http://evolution-server:8080)
  //         apiKey (Evolution API key)
  //         instanceName (nombre de la instancia)
  
  async send(message: NotificationMessage): Promise<SendResult> {
    // POST /message/sendText/{instanceName}
    // Body: { number, text, delay }
    // Headers: apikey: <apiKey>
  }
}
```

### 4.3 Pipedream

**Estado:** ✅ Usado para el cron job

Pipedream es la plataforma que ejecuta el trigger del cron cada 5 minutos:

```
Pipedream Scheduled Trigger (cada 5 min)
  │
  └── POST /api/cron/process-notifications
      Authorization: Bearer <CRON_SECRET>
```

**Por qué Pipedream en vez de cron interno de Vercel:**

- Vercel Serverless Cron tiene límite de 1 ejecución por minuto (Pro) o 1 por día (Hobby)
- Pipedream ofrece ejecuciones ilimitadas en plan gratuito
- Separa la responsabilidad de scheduling del código de negocio

---

## 5. Base de Datos

### 5.1 Tablas del Sistema v2

#### `notification_providers`

```sql
CREATE TABLE notification_providers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel             VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp','email','sms','in_app')),
  provider            VARCHAR(20) NOT NULL CHECK (provider IN ('n8n','evolution','meta','twilio','resend','internal')),
  is_enabled          BOOLEAN DEFAULT false,
  config              JSONB DEFAULT '{}',
  rate_limit_per_min  INTEGER DEFAULT 30,
  rate_limit_per_day  INTEGER DEFAULT 500,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, channel, provider)
);

CREATE INDEX idx_notification_providers_org_channel
  ON notification_providers(organization_id, channel)
  WHERE is_enabled = true;
```

#### `notification_queue`

```sql
CREATE TABLE notification_queue (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id        UUID REFERENCES appointments(id) ON DELETE SET NULL,
  channel               VARCHAR(20) NOT NULL,
  template_id           UUID REFERENCES message_templates(id),
  to_address            VARCHAR(255) NOT NULL,
  subject               VARCHAR(255),
  rendered_body         TEXT,
  variables             JSONB DEFAULT '{}',
  status                VARCHAR(30) NOT NULL DEFAULT 'pending',
  idempotency_key       VARCHAR(255) NOT NULL,
  attempts              INTEGER DEFAULT 0,
  max_attempts          INTEGER DEFAULT 3,
  last_error            TEXT,
  next_retry_at         TIMESTAMPTZ,
  provider_message_id   VARCHAR(255),
  provider_response     JSONB,
  trace_id              VARCHAR(36),
  claimed_at            TIMESTAMPTZ,
  processing_timeout_at TIMESTAMPTZ,
  scheduled_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at               TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  read_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, idempotency_key)
);

CREATE INDEX idx_notification_queue_status_scheduled
  ON notification_queue(status, scheduled_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX idx_notification_queue_org_status
  ON notification_queue(organization_id, status);

CREATE INDEX idx_notification_queue_appointment_id
  ON notification_queue(appointment_id);
```

#### `message_templates`

```sql
CREATE TABLE message_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  channel           VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp','email','sms','in_app')),
  type              VARCHAR(50) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  subject           VARCHAR(255),
  body              TEXT NOT NULL,
  variables         JSONB DEFAULT '[]',
  is_default        BOOLEAN DEFAULT false,
  is_active         BOOLEAN DEFAULT true,
  version           INTEGER DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_templates_org_channel_type
  ON message_templates(organization_id, channel, type);

CREATE INDEX idx_message_templates_is_default
  ON message_templates(is_default, is_active)
  WHERE is_default = true;
```

#### `automation_rules`

```sql
CREATE TABLE automation_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_event     VARCHAR(50) NOT NULL
    CHECK (trigger_event IN ('appointment_created','appointment_reminder','appointment_cancelled',
                             'appointment_completed','appointment_no_show','confirmation_requested')),
  channel           VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp','email','sms','in_app')),
  template_id       UUID REFERENCES message_templates(id),
  delay_minutes     INTEGER DEFAULT 0,
  is_enabled        BOOLEAN DEFAULT true,
  conditions        JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_org_trigger
  ON automation_rules(organization_id, trigger_event, is_enabled)
  WHERE is_enabled = true;
```

#### `confirmation_tokens`

```sql
CREATE TABLE confirmation_tokens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id      UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token               VARCHAR(36) NOT NULL UNIQUE,
  action              VARCHAR(20) NOT NULL CHECK (action IN ('confirm','cancel','reschedule')),
  expires_at          TIMESTAMPTZ NOT NULL,
  used_at             TIMESTAMPTZ,
  invalidated_at      TIMESTAMPTZ,
  invalidated_reason  VARCHAR(100),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_confirmation_tokens_token ON confirmation_tokens(token);
CREATE INDEX idx_confirmation_tokens_appointment_id ON confirmation_tokens(appointment_id);
CREATE INDEX idx_confirmation_tokens_expires
  ON confirmation_tokens(expires_at)
  WHERE used_at IS NULL AND invalidated_at IS NULL;
```

### 5.2 Tablas Legacy (convivencia)

| Tabla | Propósito | Plan |
|-------|-----------|------|
| `whatsapp_settings` | Config antigua de proveedor | Deprecada, migrar a `notification_providers` |
| `whatsapp_messages` | Cola de mensajes antigua | Deprecada, migrar a `notification_queue` |
| `whatsapp_logs` | Logs de envío antiguos | Deprecada, migrar a status en `notification_queue` |

---

## 6. Flujos de Eventos

### 6.1 Appointment Created

```
Trigger: appointment_created
Delay: 0 minutos (envío inmediato)

1. Cita creada desde dashboard o booking público
2. Orchestrator se activa
3. Busca automation_rules para appointment_created + whatsapp
4. Renderiza template de confirmación
5. Queuea mensaje con status=sent (delay=0)
6. Cliente recibe: "Hola María, tu cita ha sido confirmada..."
```

### 6.2 Appointment Reminder

```
Trigger: appointment_reminder
Delay: Configurable (default 24h antes)

1. Automation rule con delay_minutes = 1440 (24h)
2. Orchestrator queuea mensaje con scheduled_at = cita - 24h
3. Cron procesa cuando scheduled_at <= NOW()
4. Cliente recibe: "Recordatorio: tu cita es mañana a las 2:00 PM"
```

### 6.3 Appointment Cancelled

```
Trigger: appointment_cancelled
Delay: 0 minutos

1. Cita cancelada por cliente (link o reply) o por negocio
2. Orchestrator se activa
3. Renderiza template de cancelación
4. Envío inmediato
5. Cliente recibe: "Tu cita del 15 de mayo ha sido cancelada"
```

### 6.4 Confirmation Request

```
Trigger: confirmation_requested
Delay: 0 minutos

1. Se genera confirmation_token con action='confirm'
2. Orchestrator renderiza template con confirmationLink
3. Cliente recibe: "Confirma tu cita: [link]"
4. Cliente hace clic → token se valida y marca como 'used'
5. Appointment se actualiza a confirmation_status = 'confirmed'
```

### 6.5 Client Reply via WhatsApp

```
El cliente responde "confirmar" al mensaje de WhatsApp

1. N8N recibe la respuesta y la reenvía al webhook del SaaS
2. Webhook detecta keyword "confirmar"
3. Busca último mensaje enviado a ese número
4. Obtiene appointment_id
5. UPDATE appointment SET confirmation_status = 'confirmed'
6. INSERT confirmation_log
7. INSERT notification in-app para staff
```

---

## 7. API Endpoints

| Ruta | Método | Runtime | Propósito | Auth |
|------|--------|---------|-----------|------|
| `/api/cron/process-notifications` | POST | Edge | Procesar cola de mensajes | Bearer `CRON_SECRET` |
| `/api/webhooks/notifications` | POST | Edge | Delivery status + client replies | Bearer `WEBHOOK_SECRET` (opcional) |
| `/api/webhooks/notifications` | GET | Edge | Auto-documentación del webhook | No |

---

## 8. Variables de Entorno

### Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | URL base de la app para links en templates | `https://app.prugressy.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role para cron y webhook (bypass RLS) | `eyJ...` |
| `CRON_SECRET` | Token de autenticación para el endpoint cron | `prugressy_cron_secret_2026` |

### Opcionales

| Variable | Descripción | Defecto |
|----------|-------------|---------|
| `WEBHOOK_SECRET` | Token para autenticar webhook de notificaciones | Sin auth |
| `BYPASS_SUBSCRIPTION_CHECK` | Saltar verificación de suscripción en dev | `false` |
| `BYPASS_ADMIN_AUTH` | Saltar autenticación en dev | `false` |

### Variables de integraciones relacionadas

| Variable | Integración |
|----------|-------------|
| `RESEND_API_KEY` | Resend (emails) |
| `RESEND_FROM_EMAIL` | Resend (remitente por defecto) |

**Nota:** No existen variables de entorno para N8N o Evolution. Las URLs de webhook y API keys se almacenan por organización en `notification_providers.config`.

---

## 9. Estructura de Carpetas

```
src/
├── actions/
│   ├── notifications/
│   │   ├── providers.ts          CRUD notification_providers
│   │   ├── queue.ts              Estadísticas y gestión de cola
│   │   ├── templates.ts          CRUD message_templates
│   │   ├── automations.ts         CRUD automation_rules
│   │   └── confirmations/
│   │       └── tokens.ts         Generar/validar tokens de confirmación
│   │
│   └── whatsapp/                 (legacy, conviviendo)
│       ├── whatsApp.ts
│       ├── sendWhatsAppReminder.ts
│       ├── resendWhatsAppReminder.ts
│       ├── getWhatsAppLogs.ts
│       ├── getWhatsAppSettings.ts
│       ├── updateWhatsAppSettings.ts
│       ├── testWhatsAppWebhook.ts
│       └── runDailyReminderScheduler.ts
│
├── app/
│   └── api/
│       ├── cron/
│       │   └── process-notifications/
│       │       └── route.ts       Cron cada 5 min
│       └── webhooks/
│           └── notifications/
│               └── route.ts       Webhook de delivery + replies
│
├── components/
│   └── dashboard/
│       └── whatsapp/
│           ├── WhatsAppModuleClient.tsx   Contenedor con tabs
│           ├── TabOverview.tsx            Stats y actividad reciente
│           ├── TabQueue.tsx               Cola paginada con filtros
│           ├── TabSettings.tsx            Configuración N8N
│           ├── TabTemplates.tsx            Lista de templates
│           ├── TabAutomations.tsx          Reglas de automatización
│           ├── TemplateEditorModal.tsx    Editor de templates
│           ├── AutomationEditModal.tsx    Editor de reglas
│           ├── AlertBanner.tsx            Componente de alerta
│           ├── StatusBadge.tsx            Badge de estado
│           ├── StatCard.tsx               Tarjeta de estadística
│           ├── WhatsAppSettingsClient.tsx (legacy)
│           └── WhatsAppLogs.tsx           (legacy)
│
├── lib/
│   └── notifications/
│       ├── orchestrator.ts        Orquestador principal
│       ├── template-engine.ts     Motor de templates con caché
│       └── channels/
│           ├── index.ts           Barrel exports
│           ├── types.ts           Interfaces de channel adapters
│           ├── factory.ts         Fábrica de adapters
│           ├── whatsapp-n8n.channel.ts   N8N WhatsApp adapter
│           ├── email-resend.channel.ts   Resend email adapter
│           └── in-app.channel.ts         In-app notification adapter
│
└── types/
    └── notifications.ts           Tipos, interfaces y constantes
```

---

## 10. Casos de Uso Principales

### 10.1 Recordatorio Automático de Cita

**Trigger:** `appointment_reminder` con delay de 24h antes

```
1. Staff crea cita para el 15 de mayo a las 2:00 PM
2. Orchestrator queuea recordatorio para el 14 de mayo a las 2:00 PM
3. Cron procesa el recordatorio a la hora programada
4. N8N recibe el payload y envía el mensaje
5. Cliente recibe: "Recordatorio: tu cita es mañana a las 2:00 PM"
```

### 10.2 Confirmación Post-Booking

**Trigger:** `confirmation_requested` con delay=0

```
1. Cliente reserva desde /reservar/[slug]
2. Orchestrator genera confirmation_token
3. Envía mensaje inmediato con link de confirmación
4. Cliente hace clic en "Confirmar" → token se usa → cita confirmada
```

### 10.3 Auto-Confirmación por Reply de WhatsApp

**Trigger:** Webhook recibe "confirmar"

```
1. Cliente recibe mensaje de WhatsApp
2. Cliente responde "confirmar"
3. N8N reenvía la respuesta al webhook del SaaS
4. Sistema detecta keyword y actualiza la cita
5. Staff recibe notificación in-app
```

### 10.4 Cancelación con Link

**Trigger:** `appointment_cancelled` con delay=0

```
1. Cliente hace clic en "Cancelar" del mensaje
2. Se invalida el token y se cancela la cita
3. Orchestrator notifica al negocio
4. Se envía confirmación de cancelación al cliente
```

### 10.5 Reprogramación Fallida + Timeout

```
1. Cron toma un item de la cola
2. N8N no responde (timeout 30s)
3. Se marca como 'failed', attempt = 1
4. next_retry_at = NOW() + 5min
5. Segundo intento → falla → attempt = 2, retry en 20min
6. Tercer intento → falla → failed_permanently
7. Alerta para revisión manual
```

---

## 11. Ejemplos de Requests/Responses

### 11.1 Cron procesando cola

**Request (Pipedream → SaaS):**

```http
POST /api/cron/process-notifications
Authorization: Bearer prugressy_cron_secret_2026
```

**Response:**

```json
{
  "processed": 12,
  "sent": 10,
  "failed": 2,
  "skipped": 0,
  "errors": [
    "Error enviando a org=abc: N8N timeout",
    "Error enviando a org=def: número inválido"
  ]
}
```

### 11.2 Channel adapter enviando a N8N

**Request (SaaS → N8N):**

```http
POST https://n8n-cliente.com/webhook/whatsapp
Content-Type: application/json
Authorization: Bearer sk-abc123

{
  "phone": "573001234567",
  "message": "Hola María García, recordatorio: tu cita de Masaje Relajante con Carlos López es mañana 14 de mayo a las 2:00 PM en Spa Relax, Calle 123 #45-67.",
  "variables": {
    "clientName": "María García",
    "appointmentDate": "14 de mayo de 2026",
    "appointmentTime": "2:00 PM",
    "businessName": "Spa Relax",
    "serviceName": "Masaje Relajante",
    "employeeName": "Carlos López",
    "businessAddress": "Calle 123 #45-67, Bogotá"
  },
  "appointment_id": "a1b2c3d4-...",
  "message_type": "reminder",
  "trace_id": "e5f6g7h8-..."
}
```

**Response (N8N → SaaS):**

```json
{
  "message_id": "whatsapp_msg_123456",
  "status": "sent"
}
```

### 11.3 Webhook de delivery status

**Request (N8N → SaaS):**

```http
POST /api/webhooks/notifications
Content-Type: application/json
Authorization: Bearer webhook_secret_abc

{
  "providerMessageId": "whatsapp_msg_123456",
  "status": "delivered",
  "channel": "whatsapp",
  "timestamp": "2026-05-14T14:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "action": "status_updated",
  "status": "delivered"
}
```

### 11.4 Webhook de reply del cliente

**Request (N8N → SaaS):**

```http
POST /api/webhooks/notifications
Content-Type: application/json

{
  "channel": "whatsapp",
  "status": "reply",
  "rawPayload": {
    "from": "573001234567",
    "text": {
      "body": "confirmar"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "action": "appointment_confirmed",
  "appointmentId": "a1b2c3d4-..."
}
```

---

## 12. Posibles Errores y Troubleshooting

### 12.1 Mensajes stuck en "processing"

**Síntoma:** Items en cola con estado `processing` por más de 10 minutos

**Causa:** El cron falló antes de actualizar el status (timeout, crash)

**Solución automática:** El cron recupera estos items en cada ejecución:
```sql
UPDATE notification_queue
SET status = 'pending', claimed_at = NULL
WHERE status = 'processing'
AND processing_timeout_at < NOW();
```

### 12.2 N8N no responde (timeout)

**Síntoma:** Error `Timeout enviando a N8N (30s)` en los logs

**Causa:** Servidor N8N del cliente caído o inaccesible

**Solución automática:** Reintento exponencial (5min, 20min, 45min)
**Solución manual:** Verificar que el webhook URL de N8N esté activo desde TabSettings → "Probar conexión"

### 12.3 Rate limit excedido

**Síntoma:** Mensajes quedan en `pending` sin procesar

**Causa:** Se excedió el límite de 30 mensajes/minuto para la organización

**Solución:** Aumentar `rate_limit_per_min` en `notification_providers` o revisar la configuración de N8N

### 12.4 Template no encontrado

**Síntoma:** Error `No default template found for type X`

**Causa:** No existe system default para ese tipo de template + canal

**Solución:** Verificar que exista un registro en `message_templates` con `organization_id IS NULL`, `channel = 'whatsapp'`, `type = 'appointment_reminder'`, `is_default = true`

### 12.5 Idempotency conflict

**Síntoma:** Error `duplicate key value violates unique constraint`

**Causa:** El mismo evento ya fue procesado (idempotency_key duplicado)

**Solución:** No requiere acción — es comportamiento esperado para evitar duplicados

### 12.6 Webhook rechaza payload

**Síntoma:** N8N responde con 4xx

**Causa:** Payload malformado o estructura incorrecta

**Solución:** Verificar el formato del payload contra la documentación de N8N del cliente. Usar "Probar conexión" en TabSettings para validar.

---

## 13. Buenas Prácticas

### Idempotencia

Toda notificación tiene un `idempotency_key` único:

```typescript
generateIdempotencyKey(organizationId, appointmentId, channel, type, scheduledFor)
// Ejemplo: "org-abc_app-123_whatsapp_reminder_2026-05-14"
```

Esto evita duplicados si el cron se ejecuta múltiples veces para el mismo item.

### Rate Limiting

- **Por minuto:** Default 30, configurable por organización
- **Por día:** Default 500, configurable por organización
- **Ventana de rate limit:** 60 segundos (rolling window)

### Concurrencia

El cron usa `SELECT ... FOR UPDATE SKIP LOCKED` para:
- Evitar race conditions entre múltiples instancias
- No bloquear items que otras instancias están procesando
- Permitir escalado horizontal del cron worker

### Retry Strategy

- **Max attempts:** 3
- **Backoff:** Exponential (5min × attempts²)
  - Attempt 1: 5 minutos
  - Attempt 2: 20 minutos
  - Attempt 3: 45 minutos (último)
- **Non-retryable errors:** Invalid number, blocked → `failed_permanently`

### Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` solo en endpoints internos (cron, webhook)
- Webhook auth opcional via Bearer `WEBHOOK_SECRET`
- API keys de N8N almacenadas en `notification_providers.config` (columna JSONB)
- Confirmation tokens expiran a las 72h
- Tokens se invalidan al usarse (one-time use)

---

## 14. Consideraciones de Escalabilidad y Mantenimiento

### Escalabilidad

| Componente | Cuello de botella | Solución |
|-----------|-------------------|----------|
| Cron queue | Supabase query (SKIP LOCKED) | Batch de 50 items, índices optimizados |
| N8N webhook | Latencia de red por organización | Timeout 30s, retry automático |
| Template cache | Memoria del servidor | LRU cache con TTL 5min, tamaño fijo |
| Webhook replies | Edge runtime limits | Diseñado para Vercel Edge Functions |

### Futuras mejoras

1. **Evolution API channel adapter**
   - Implementar `EvolutionWhatsAppChannel` para envío directo sin N8N
   - Agregar UI en TabSettings para seleccionar proveedor (N8N vs Evolution)
   - Soportar instancias autogestionadas de Evolution API

2. **Dashboard de monitoreo en tiempo real**
   - Métricas de throughput, latencia, tasa de error
   - Alertas cuando la cola se acumula
   - Histórico de delivery por organización

3. **SMS channel**
   - Implementar channel adapter para SMS (provider: twilio)
   - Agregar SMS a `automation_rules` como canal disponible

4. **Webhook mejorado**
   - Soportar más proveedores en `mapProviderStatusToInternal`
   - Webhook de re-engage para números inválidos

### Mantenimiento

- **Monitorear cola:** Revisar periodicamente items en `failed_permanently`
- **Limpiar tokens expirados:** Los `confirmation_tokens` expirados deben limpiarse periódicamente
- **Actualizar templates default:** Los system defaults deben mantenerse actualizados con la marca
- **Migración legacy:** Las tablas `whatsapp_settings`, `whatsapp_messages`, `whatsapp_logs` deben migrarse completamente a v2 y luego eliminarse

---

## 15. Migración Legacy → v2

| Tabla legacy | Tabla v2 | Estado de migración |
|-------------|----------|-------------------|
| `whatsapp_settings` | `notification_providers` | ✅ Migrada (datos copiados) |
| `whatsapp_messages` | `notification_queue` | Pendiente |
| `whatsapp_logs` | Status en `notification_queue` | Pendiente |
| Templates hardcodeadas | `message_templates` | ✅ Creadas como system defaults |

**La migración consiste en:**

1. Leer de la tabla legacy si existe, o de v2 si no
2. Escribir siempre en v2 (nuevos registros)
3. Una vez que no haya más registros legacy activos, eliminar las tablas legacy

---

## 16. Referencias

| Recurso | Ubicación |
|---------|-----------|
| Tipos e interfaces | `src/types/notifications.ts` |
| Server Actions | `src/actions/notifications/` |
| Componentes UI | `src/components/dashboard/whatsapp/` |
| Channel adapters | `src/lib/notifications/channels/` |
| Orquestador | `src/lib/notifications/orchestrator.ts` |
| Template engine | `src/lib/notifications/template-engine.ts` |
| Cron endpoint | `src/app/api/cron/process-notifications/route.ts` |
| Webhook endpoint | `src/app/api/webhooks/notifications/route.ts` |
