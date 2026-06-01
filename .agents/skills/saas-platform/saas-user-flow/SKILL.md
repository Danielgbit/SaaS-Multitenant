---
name: saas-user-flow
description: Documents the complete user flow and journey across the four primary roles of the SaaS platform (Owner, Staff, Employee, Client). Use this skill whenever you are designing screens, implementing routing, defining user permissions, or building features to ensure they align with the standard product architecture and booking lifecycle.
---

# Arquitectura de User Flow del SaaS

Esta skill contiene el mapa completo del flujo de usuarios dentro de la plataforma. **Consúltala siempre que debas crear nuevas pantallas, flujos de autenticación, o implementar lógica de negocio relacionada con reservas y roles.**

## 🧠 Actores del Sistema

La plataforma cuenta con **4 tipos de actores**:

1. **Owner** (Dueño del negocio)
2. **Staff / Recepcionista**
3. **Employee** (Empleado que presta el servicio)
4. **Cliente final** (No requiere cuenta)

---

## 🗺️ Mapa Completo del User Flow (Resumen)

```text
OWNER
│
├─ Register
├─ Onboarding
├─ Configure employees
├─ Configure services
├─ Invite employees
└─ Manage calendar

STAFF
│
├─ Login
├─ Calendar
├─ Create appointment
└─ Manage clients

EMPLOYEE
│
├─ Receive invite
├─ Login
├─ View personal agenda
└─ Complete appointments

CLIENT
│
├─ Open booking page
├─ Select service
├─ Select slot
└─ Confirm booking
```

---

## 🚀 Flujos Detallados por Rol

### 1️⃣ Owner (Dueño del Negocio)

**Registro:**
`Landing` → `Crear cuenta` → `Crear organización` → `Entrar al dashboard`

**Onboarding inicial (Primera vez):**
`Dashboard vacío` → `Crear empleados` → `Crear servicios` → `Configurar horarios` → `Sistema listo`

**Uso diario:**
`Login` → `Dashboard` → `Calendario` → `Crear / editar citas` → `Ver clientes` → `Ver métricas`

**Billing (Solo Owner):**
`Dashboard` → `Billing` → `Elegir plan` → `Checkout pago` → `Activar plan`

---

### 2️⃣ Staff / Recepcionista

Este rol gestiona la agenda general.

**Flujo general:**
`Login` → `Calendario` → `Buscar cliente` → `Crear cita` → `Confirmar horario`

**Crear cita:**
`Calendario` → `Click en horario` → `Seleccionar cliente` → `Seleccionar servicio` → `Seleccionar empleado` → `Confirmar cita`

**Editar cita:**
`Click cita` → `Editar` → `Reagendar / cancelar` → `Guardar cambios`

---

### 3️⃣ Employee (Empleado)

Tiene un **dashboard simplificado**. Está vinculado mediante `employees.user_id`.

**Invitación y Registro:**
`Owner crea empleado` → `Click "Invitar al sistema"` → `Enviar invitación` → `Empleado recibe link` → `Crear cuenta` → `Sistema vincula user con employee`

**Flujo diario:**
`Login` → `Agenda del día` → `Ver próxima cita` → `Ver datos cliente` → `Marcar completada`

---

### 4️⃣ Cliente Final

Este rol **no tiene cuenta** en el sistema.

**Reserva Pública:**
`Cliente entra a /reservar/[slug]` → `Ver servicios` → `Elegir servicio` → `Elegir empleado` → `Ver horarios disponibles` → `Seleccionar horario` → `Ingresar datos` → `Confirmar reserva`

---

## ⚙️ Flujos de Sistema y Automatizaciones

**Confirmación Automática:**
`Crear cita` → `Sistema envía WhatsApp` → `Cliente confirma` → `Cita confirmada`

**Cancelación o Reagendamiento:**
Puede originarse desde el `dashboard` (Owner/Staff), por el `cliente` o mediante `whatsapp`.
`Editar cita` → `Cambiar horario` → `Validar disponibilidad` → `Guardar cambios`

---

## 📱 Pantallas Derivadas del Flujo

De la arquitectura expuesta, las pantallas principales del SaaS que deben existir son:

- `Auth` (Login, Registro e Invitación)
- `Dashboard` (Vista principal para Owner y Staff)
- `Calendar` (Calendario general interactivo)
- `Create Appointment Modal`
- `Clients` (Gestión de la base de datos de clientes)
- `Services` (Configuración del catálogo de servicios)
- `Employees` (Gestión del personal y horarios)
- `Invite Employee` (Flujo de invitación al sistema)
- `Booking Page` (Página pública de reservas para el cliente)
- `Billing` (Pagos y suscripción del negocio)
