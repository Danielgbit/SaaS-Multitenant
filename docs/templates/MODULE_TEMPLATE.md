# Module: [Module Name]

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `src/actions/[module]/`, `src/app/(dashboard)/[module]/`
> Last updated: YYYY-MM-DD

---

## 1. Visión General

[Descripción del propósito del módulo. 2-3 oraciones.]

### Responsabilidades

- [Responsabilidad 1]
- [Responsabilidad 2]

---

## 2. Arquitectura

```
[Diagrama de flujo o bloques]
```

---

## 3. Base de Datos

| Tabla | Propósito | Status |
|-------|-----------|--------|
| `table_name` | [descripción] | active / legacy |

---

## 4. Server Actions

| Action | Input | Output | Permisos |
|--------|-------|--------|----------|
| `actionName()` | `{ ... }` | `{ success, error }` | owner, admin |

---

## 5. UI / Componentes

| Componente | Ruta | Propósito |
|------------|------|-----------|
| `ComponentName` | `src/components/dashboard/[module]/` | [descripción] |

---

## 6. Roles y Permisos

| Acción | Owner | Admin | Staff | Employee |
|--------|-------|-------|-------|----------|
| Acción | ✅ | ✅ | ❌ | ❌ |

---

## 7. Integraciones

| Servicio | Propósito | Estado |
|----------|-----------|--------|
| [Servicio] | [descripción] | ✅ / ⚠️ / ❌ |

---

## 8. Background Jobs

| Job | Trigger | Propósito |
|-----|---------|-----------|
| [nombre] | cron/event | [descripción] |

---

## 9. Variables de Entorno

| Variable | Required | Descripción |
|----------|----------|-------------|
| `VAR_NAME` | dev, prod | [descripción] |

---

## 10. Troubleshooting

[Errores comunes específicos de este módulo]
