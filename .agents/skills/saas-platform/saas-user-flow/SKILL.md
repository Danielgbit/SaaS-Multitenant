---
name: saas-user-flow
description: Documents the complete user flow and journey across the four primary roles of the SaaS platform (Owner, Admin, Staff, Employee, Client). Use this skill whenever you are designing screens, implementing routing, defining user permissions, or building features to ensure they align with the standard product architecture and booking lifecycle.
---

# User Flow del SaaS

## Actores del Sistema

| Rol | Descripción |
|-----|-------------|
| **Owner** | Dueño del negocio (máximo privilegio) |
| **Admin** | Administrador delegado (todo excepto eliminar org) |
| **Staff** | Recepcionista (agenda, clientes, confirmaciones) |
| **Employee** | Empleado que presta servicios (solo su agenda) |
| **Cliente** | Público sin cuenta (reserva vía booking público) |

---

## Mapa de Flujos por Rol

### Owner

```
Registro → Onboarding → Dashboard
                           ├── Configurar empleados, servicios, horarios
                           ├── Operación diaria: calendario, clientes, payroll
                           ├── Facturación: planes, Stripe
                           └── Invitar empleados al sistema
```

### Admin

```
Login → Dashboard
          ├── Calendario (crear/editar/reagendar citas)
          ├── Clientes (CRUD, cuentas de crédito)
          ├── Empleados (CRUD, disponibilidad, invitaciones)
          ├── Servicios (CRUD, comisiones)
          ├── Confirmaciones (panel de recepción)
          ├── Payroll (períodos, liquidaciones, préstamos)
          ├── Caja (abrir/cerrar sesión, operaciones)
          ├── Inventario (stock, ajustes, consumos)
          ├── Configuración (org, booking, data retention)
          └── Notificaciones (automation rules, templates, providers)
```

### Staff

```
Login → Dashboard
          ├── Calendario (crear/editar citas)
          ├── Clientes (CRUD, vista historial)
          ├── Confirmaciones (panel de recepción, cobro)
          ├── Caja (operaciones del día)
          └── Servicios (solo lectura)
```

### Employee

```
Invitación → Registro → Login → Mi espacio
                                   ├── Agenda personal del día
                                   ├── Marcar "Listo" en citas completadas
                                   ├── Mi nómina (/payroll/mi)
                                   └── Mi disponibilidad
```

### Cliente (sin cuenta)

```
/reservar/[slug] → Seleccionar servicio → Seleccionar empleado
                → Elegir horario → Ingresar datos → Confirmar
```

---

## Flujos de Sistema (Automáticos)

| Flujo | Descripción |
|-------|-------------|
| **Registro** | Trigger `handle_new_user` crea org + owner + booking_settings + integrations + payroll_settings |
| **Recordatorios** | Cron 3min evalúa próximas citas, notifica vía notification_queue según automation rules |
| **Procesar cola** | Cron 5min procesa notification_queue con SKIP LOCKED, resuelve channel provider, envía |
| **Purga** | Cron diario elimina citas terminales >= auto_retention_days |
| **Shadow mode** | Cron 5min valida equivalencia V1 vs V2 sin impacto producción |

---

## Pantallas Derivadas

Ver skill `saas-screen-map` para el mapa completo de rutas y componentes.

Pantallas principales:
- Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Onboarding: `/onboarding`
- Dashboard: `/calendar`, `/clients`, `/employees`, `/services`, `/confirmations`, `/payroll`, `/caja`, `/inventory`, `/settings`, `/billing`, `/notificaciones`, `/mi`
- Público: `/reservar/[slug]`, `/invite/[token]`, `/confirmar/[token]`
- Admin global: `/admin/organizations`, `/admin/users`, `/admin/metrics`
