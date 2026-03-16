# N8N Workflow para WhatsApp Reminders

Este documento describe cómo configurar N8N para recibir webhooks de Prügressy y enviar recordatorios de citas por WhatsApp.

## Estructura del Webhook

Prügressy envía un JSON con la siguiente estructura:

```json
{
  "phone": "+34612345678",
  "message": "¡Hola Juan! Te recordamos que tienes una cita mañana (lunes, 15 de enero) a las 10:00 en Mi Barbershop.",
  "variables": {
    "name": "Juan",
    "phone": "+34612345678",
    "date": "lunes, 15 de enero",
    "time": "10:00",
    "business": "Mi Barbershop",
    "service": "Corte de pelo",
    "employee": "Pedro"
  },
  "appointment_id": "uuid-de-la-cita",
  "message_type": "reminder"
}
```

## Configuración en N8N

### 1. Trigger: Webhook

Configura un Webhook node en N8N:
- **HTTP Method**: POST
- **Path**: `whatsapp-reminder` (o el que prefieras)
- **Response Mode**: "Response Node"

### 2. Procesar los datos

Conecta el Webhook a un nodo que procese los datos:

```
Webhook → IF (test=true?) → ...
```

### 3. Enviar WhatsApp

Usa uno de estos nodos según tu proveedor de WhatsApp:

#### Opción A: WhatsApp Business API (Meta)
- Nodo: "WhatsApp Business Account"
- Configura tu Meta App credentials

#### Opción B: Twilio
- Nodo: "Twilio SMS" o "Twilio WhatsApp"
- phone: `{{ $json.variables.phone }}`
- message: `{{ $json.message }}`

#### Opción C: Chat API (Meta)
- Nodo: "HTTP Request"
- Method: POST
- URL: `https://api.chat-api.com/instance{{ID}}/message`
- Body: JSON con phone y body

### 4. Responder a Prügressy

Al final, conecta a un "Respond to Webhook" node:
- Status: 200
- Body: `{ "success": true }`

## Ejemplo de Flow

```
[Webhook] → [IF: test = true] ─┬─→ [Respond to Webhook (test ok)]
                             └─→ [WhatsApp] → [Respond to Webhook (success)]
```

## Notas

1. **Autenticación**: Si configuras una API Key en Prügressy, se enviará en el header `Authorization: Bearer TU_API_KEY`

2. **Manejo de errores**: Si el envío falla, registra el error y responde con status diferente a 200

3. **Testing**: Usa el botón "Probar conexión" en Prügressy para verificar que N8N responde correctamente

## Variables disponibles

| Variable | Descripción |
|----------|-------------|
| `phone` | Número de teléfono del cliente (con prefijo) |
| `message` | Mensaje pre-formateado |
| `variables.name` | Nombre del cliente |
| `variables.phone` | Teléfono del cliente |
| `variables.date` | Fecha formateada en español |
| `variables.time` | Hora de la cita |
| `variables.business` | Nombre del negocio |
| `variables.service` | Nombre del servicio |
| `variables.employee` | Nombre del empleado |
| `appointment_id` | ID de la cita en Prügressy |
| `message_type` | Tipo de mensaje (reminder) |

## Ejemplo de Template de Mensaje Personalizado

Si quieres enviar un mensaje diferente, puedes usar las variables:

```
Hola {{ $json.variables.name }} 👋

Tu cita de {{ $json.variables.service }} con {{ $json.variables.employee }} es el {{ $json.variables.date }} a las {{ $json.variables.time }}.

¡Te esperamos en {{ $json.variables.business }}!
```

## Solución de problemas

1. **Webhook no responde**: Verifica que el endpoint esté activo y público
2. **Error 401**: Verifica que la API Key sea correcta
3. **WhatsApp no llega**: Revisa los logs de tu proveedor de WhatsApp

---

## Workflow de Scheduler (Envío automático)

Este workflow ejecuta el scheduler de recordatorios diariamente para enviar mensajes automáticamente.

### Estructura del Endpoint

- **URL**: `https://tu-dominio.com/api/whatsapp/scheduler`
- **Método**: POST
- **Autenticación**: Header `Authorization: Bearer CRON_SECRET`

### Configuración en N8N

#### 1. Trigger: Schedule

Configura un nodo Schedule:
- **Trigger**: "Every Day"
- **Hour**: 9 (o la hora que prefieras)
- **Minute**: 0

#### 2. HTTP Request

Nodo HTTP Request para llamar al scheduler:
- **Method**: POST
- **URL**: `https://tu-dominio.com/api/whatsapp/scheduler`
- **Headers**:
  - Key: `Authorization`
  - Value: `Bearer TU_CRON_SECRET`
- **Send Body**: No (empty body)

#### 3. Ejemplo de Flow

```
[Schedule (Daily at 9:00)] → [HTTP Request (POST to /api/whatsapp/scheduler)] → [Log Output]
```

### Variables de Entorno

En tu `.env.local`:
```
CRON_SECRET=tu-secret-seguro-para-el-cron
```

### Notas

1. **Frecuencia**: Configura el schedule según tus necesidades (diario, cada hora, etc.)
2. **Logging**: Los resultados del scheduler se guardan en la tabla `whatsapp_logs`
3. **Monitoreo**: Revisa los logs en Prügressy (`/dashboard/whatsapp` → pestaña Historial)
4. **Error handling**: Si el scheduler falla, revisa los logs de N8N y los registros en Prügressy
