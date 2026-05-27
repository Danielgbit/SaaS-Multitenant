# UX/UI Pattern - SaaS Prügressy

Este documento define el patrón de diseño utilizado para las mejoras de UX/UI del dashboard. Sigue este patrón para las secciones pendientes.

---

## Design Tokens

### Colores

```typescript
// Light Mode
{
  primary: '#0F4C5C',
  primaryLight: '#1A6B7C',
  primaryGradient: 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  surfaceGlass: 'rgba(255, 255, 255, 0.8)',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: '#16A34A',
  successLight: '#D1FAE5',
  error: '#DC2626',
  errorLight: '#FEE2E2',
}

// Dark Mode
{
  primary: '#38BDF8',
  primaryLight: '#0EA5E9',
  primaryGradient: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)',
  surface: '#0F172A',
  surfaceSubtle: '#1E293B',
  surfaceGlass: 'rgba(15, 23, 42, 0.8)',
  border: '#334155',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#16A34A',
  successLight: '#064E3B',
  error: '#DC2626',
  errorLight: '#450A0A',
}
```

### Tipografía

```typescript
{
  heading: "'Cormorant Garamond', serif",
  body: "'Plus Jakarta Sans', sans-serif",
}

// h1, h2, h3 → Cormorant Garamond
// p, span, labels, buttons → Plus Jakarta Sans
```

### Border Radius

```typescript
{
  lg: '16px',  // Cards, modals
  md: '10px',  // Inputs, buttons
  sm: '8px',   // Small elements
}
```

### Shadows

```typescript
{
  sm: '0 1px 3px rgba(0,0,0,0.05)',
  md: '0 4px 12px rgba(15,76,92,0.15)',
  lg: '0 8px 32px rgba(15,76,92,0.15)',
  xl: '0 25px 50px -12px rgba(0,0,0,0.25)',
}
```

---

## Componentes

### 1. Page Header

```tsx
// Estructura básica
<div 
  className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8"
  style={{ background: COLORS.primaryGradient }}
>
  {/* Decoraciones */}
  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
  
  {/* Contenido */}
  <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Label</p>
        <h1 className="text-3xl font-bold tracking-tight text-white">Título</h1>
        <p className="text-sm mt-1 text-white/80">Subtítulo</p>
      </div>
    </div>
    
    <button className="...">Acción</button>
  </div>
</div>
```

### 2. Glassmorphism Container

```tsx
<div 
  className="p-4 rounded-2xl"
  style={{ 
    backgroundColor: COLORS.surfaceGlass,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${COLORS.border}`
  }}
>
  {/* Contenido */}
</div>
```

### 3. Card con Hover

```tsx
<div
  className="group p-5 rounded-2xl border transition-all duration-300 cursor-default"
  style={{
    backgroundColor: COLORS.surfaceGlass,
    borderColor: COLORS.border,
    boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
    backdropFilter: 'blur(12px)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.15)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = '0 4px 24px rgba(15, 76, 92, 0.08)'
  }}
>
  {/* Contenido */}
</div>
```

### 4. Avatar con Gradiente

```tsx
<div
  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm text-white transition-transform duration-200 group-hover:scale-110"
  style={{
    background: COLORS.primaryGradient,
    boxShadow: '0 4px 12px rgba(15, 76, 92, 0.25)'
  }}
>
  {initials}
</div>
```

### 5. Input con Focus

```tsx
<input
  type="text"
  placeholder="Buscar..."
  className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
  style={{
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: '10px',
    borderColor: COLORS.border,
    padding: '12px 16px',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  }}
/>
```

### 6. Badge de Estado

```tsx
<span
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
  style={{
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  }}
>
  <Sparkles className="w-3 h-3" />
  Activo
</span>
```

### 7. Empty State

```tsx
<div 
  className="text-center py-16 rounded-2xl"
  style={{ 
    backgroundColor: COLORS.surfaceGlass,
    border: `1px solid ${COLORS.border}`,
    backdropFilter: 'blur(12px)'
  }}
>
  <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
    <Icon className="w-10 h-10" style={{ color: COLORS.primary }} />
  </div>
  <p className="font-semibold text-lg mb-2" style={{ color: COLORS.textPrimary }}>
    Título
  </p>
  <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
    Descripción
  </p>
  <button className="...">Acción</button>
</div>
```

### 8. Modal con Header Gradiente

```tsx
<div
  style={{
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  }}
  className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden border"
>
  {/* Header con gradiente */}
  <div 
    className="relative p-5 border-b overflow-hidden"
    style={{ 
      borderColor: COLORS.border,
      background: COLORS.primaryGradient,
    }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
    
    <div className="relative flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Título
          </h2>
          <p className="text-xs text-white/80">Subtítulo</p>
        </div>
      </div>
      <button className="p-2 rounded-lg hover:bg-white/20">
        <X className="w-5 h-5 text-white" />
      </button>
    </div>
  </div>

  {/* Contenido */}
  <div className="p-5">
    {/* Form */}
  </div>
</div>
```

---

## Hook useColors

Cada componente debe usar el hook `useColors` para obtener los tokens de color según el tema:

```tsx
function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}
```

---

## Animaciones

### Entrada (Staggered)

```tsx
<div 
  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
  style={{ animationDelay: `${index * 50}ms` }}
>
  {/* Contenido */}
</div>
```

### Hover en Cards

```tsx
// onMouseEnter
e.currentTarget.style.transform = 'translateY(-2px)'
e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.15)'

// onMouseLeave
e.currentTarget.style.transform = 'translateY(0)'
e.currentTarget.style.boxShadow = '0 4px 24px rgba(15, 76, 92, 0.08)'
```

### Duraciones

- Micro-interacciones: `150ms`
- Transiciones normales: `200ms`
- Animaciones de entrada: `300ms`

---

## Skeleton Loading

```tsx
<div className="animate-pulse">
  <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
</div>
```

---

## Orden de Implementación (Para Secciones Pendientes)

1. **Header** → Gradiente + decoraciones + dark mode
2. **Search/Filters** → Glassmorphism + focus states
3. **Cards/List Items** → Avatar gradiente + hover effects
4. **Empty States** → Iconos decorativos + CTA
5. **Modals** → Header gradiente + form improvements

---

## Recursos

- **Icons**: Lucide React
- **Fonts**: next/font/google (Cormorant Garamond, Plus Jakarta Sans)
- **Framework**: Next.js + Tailwind CSS
- **Theme**: next-themes para dark mode
