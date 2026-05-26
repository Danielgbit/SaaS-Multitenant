# type-safety-cleanup

## Objetivo
Eliminar todos los `(supabase as any)` dentro de `src/`
usando tipado real de Supabase.

## Alcance
~60 archivos
~200 instancias

## Estrategia

### 1. Base
- [ ] Verificar `Database` generado
- [ ] Tipar `createClient<Database>()`
- [ ] Revisar helpers compartidos

### 2. services/
- [ ] Reemplazar casts
- [ ] Ajustar joins/selects
- [ ] Validar retornos

### 3. actions/
- [ ] Reemplazar casts
- [ ] Ajustar payloads

### 4. Restantes
- [ ] hooks
- [ ] utils
- [ ] componentes indirectos

### 5. Validación
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `grep -r "supabase as any" src/`

## Reglas
- No mezclar con lógica funcional
- Commits pequeños por bloque
- Resolver TS inmediatamente

## Definition of Done
- `(supabase as any)` en `src/`: **0**
- build verde
- TS verde
- comportamiento intacto
