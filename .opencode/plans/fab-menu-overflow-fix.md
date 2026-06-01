# Plan: FAB Menu Overflow Fix

## Problema
El bottom sheet del FAB tiene 5 botones que exceden la altura de la pantalla en dispositivos pequeños. No hay scroll, el contenido se corta.

## Solución
Agregar `max-h-[70vh] overflow-y-auto scrollbar-hide` al panel del bottom sheet en `CashSessionFAB.tsx`.

## Cambios

### Archivo: `src/components/dashboard/cash-session/CashSessionFAB.tsx`

**Línea 67:** Agregar clases de scroll al contenedor interno del bottom sheet.

Antes:
```tsx
className="w-full max-w-md rounded-t-2xl p-4 pb-8"
```

Después:
```tsx
className="w-full max-w-md rounded-t-2xl p-4 pb-8 max-h-[70vh] overflow-y-auto scrollbar-hide"
```

## Verificación
- Verificar que los 5 botones sean accesibles via scroll en pantallas pequeñas
- Verificar que no haya barra de scroll visible (scrollbar-hide)
- Verificar que en pantallas grandes el comportamiento no cambie
