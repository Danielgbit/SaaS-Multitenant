# FIX-INV-001: Error de sintaxis en PurgeModal.tsx

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🔴 Crítica |
| **Sprint** | 1 |
| **Estimación** | 5 min • 0.5 SP |
| **Riesgo** | ⚪ Mínimo |
| **Archivos** | `src/components/calendar/PurgeModal.tsx` |
| **Test file** | Ninguno (error de sintaxis) |
| **Dependencias** | Ninguna |
| **Paralelo con** | FIX-002, FIX-003, FIX-004 |

## Descripción

Línea 198 contiene `<div<div` (tag JSX duplicado). Causa error de compilación:

```
× Expression expected
  ╭─[PurgeModal.tsx:198:1]
  │ <div<div
  ·     ─
```

Este error **bloquea toda la aplicación** porque el módulo es importado por `CalendarView.tsx` que a su vez es importado por el dashboard.

## Pasos de implementación

1. Abrir `src/components/calendar/PurgeModal.tsx`
2. Localizar línea 198
3. Reemplazar `<div<div` → `<div`
4. Ejecutar `npm run build` para verificar
5. Commit

## Criterios de aceptación

- [ ] `npm run build` pasa sin errores de sintaxis
- [ ] La app carga en el navegador
- [ ] `PurgeModal` renderiza correctamente

## Orden de commits

```
1. fix: correct duplicate div tag in PurgeModal.tsx
```
