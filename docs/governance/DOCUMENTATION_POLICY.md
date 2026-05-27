# Documentation Policy

> STATUS: CURRENT IMPLEMENTATION
> Last updated: 2026-05-27

---

## 1. Principios

1. **Los docs describen implementación real.** Propuestas futuras pertenecen exclusivamente a `docs/architecture/FUTURE/`.
2. **Cada documento tiene un dueño implícito.** El `Source of truth` block define qué código es autoritativo.
3. **La documentación es un asset del runtime.** Se mantiene como el código, no como un artifact separado.
4. **Sin documento = no existe.** Toda feature pública debe tener doc de módulo.

---

## 1.5 Non-goals

El sistema documental NO incluye intencionalmente:

- Referencias exhaustivas de columnas de base de datos
- API Reference auto-generada (Swagger, Typedoc)
- Detalles de implementación interna de UI (props, estados locales)
- Procedimientos temporales de debugging
- Notas de migraciones one-off
- Experimental spikes sin impacto arquitectónico
- Guías de contribución open-source (CONTRIBUTING.md)

Esto protege la calidad y mantenibilidad del sistema. Si algo fuera de esta
lista aparece en un PR, evaluar si merece documentación permanente o es
información transitoria.

---

## 2. Reglas Obligatorias

### Al agregar una variable de entorno

- Agregar entrada en `docs/architecture/CURRENT/ENVIRONMENT.md`
- Incluir: variable, required (dev/prod), descripción, dónde se usa

### Al agregar un cron endpoint

- Agregar entrada en `docs/architecture/CURRENT/CRON-JOBS.md`
- Incluir: endpoint, método, intervalo, idempotencia, auth, side effects

### Al agregar una migración

- Verificar si altera entidades core o agrega nuevas tablas
- Si es así, actualizar `docs/architecture/CURRENT/DATABASE.md`
- No requiere doc para migraciones triviales (ej: agregar columna nullable)

### Al crear una feature pública

- Crear documento en `docs/modules/` siguiendo `docs/templates/MODULE_TEMPLATE.md`
- O actualizar documento existente si es extensión de un módulo

### Formato obligatorio de cada documento

```markdown
> STATUS: CURRENT IMPLEMENTATION | PROPOSAL / NOT IMPLEMENTED | LEGACY / ARCHIVED
> Source of truth: <ruta(s) al código fuente>
> Last updated: YYYY-MM-DD
```

### Documentos futuros

- Toda propuesta de arquitectura no implementada va en `docs/architecture/FUTURE/`
- Debe incluir banner `STATUS: PROPOSAL / NOT IMPLEMENTED`
- No referenciar documentos FUTURE desde documentos CURRENT

---

## 3. Jerarquía de Source of Truth

| Si documentación y código divergen... | ...el código manda. |
|----------------------------------------|---------------------|
| El `Source of truth` block indica qué archivos de código son la referencia. | Actualizar el doc para reflejar el código. |

---

## 4. Ciclo de Vida de Documentos

### Creación

1. Elegir ubicación según `docs/INDEX.md` categorías
2. Usar template correspondiente
3. Agregar entrada en `docs/INDEX.md`
4. Incluir status banner y source of truth

### Actualización

- Al modificar el código referenciado en `Source of truth`
- Al cambiar comportamiento público de un módulo
- Al agregar/remover variables de entorno, crons, migraciones

### Archivado

- Cuando un documento describe un sistema que ya no existe
- Mover a `docs/archive/` con banner `STATUS: LEGACY / ARCHIVED`
- Mantener referencia histórica (no eliminar)

### Eliminación

- Solo cuando el archive ya no tiene valor histórico
- Preferir archivar sobre eliminar

---

## 5. Revisión y Auditoría

- `pnpm docs:check` — validación automatizada (links, banners, source-of-truth)
- Revisión trimestral de docs/INDEX.md contra el código real
- Nueva feature requiere doc impact assessment en PR template

---

## 6. ADRs (Architecture Decision Records)

Decisiones arquitectónicas significativas se documentan en `docs/decisions/`.

Formato: `NNN-title.md` con template en `docs/templates/ADR_TEMPLATE.md`.

Decisiones que requieren ADR:
- Cambios de stack (ej: migrar BD, cambiar framework)
- Decisiones de arquitectura (ej: adoptar event-driven, cambiar patrón de auth)
- Trade-offs significativos (ej: por qué no usamos X)

---

## 7. Auto-Generated Docs

Los archivos en `docs/auto-generated/` se generan con `pnpm docs:gen`.

```markdown
> AUTO-GENERATED — DO NOT EDIT MANUALLY
> Regenerar con: `pnpm docs:gen`
```

Incluyen:
- `routes.md` — árbol de rutas del App Router
- `cron-index.md` — endpoints cron detectados
- `migrations-index.md` — lista de migraciones con fechas

---

## 8. Proposal Lifecycle (FUTURE/)

Todo documento en `docs/architecture/FUTURE/` debe incluir metadatos de ciclo de vida.

### Metadatos obligatorios

```markdown
> Owner: <team, area, or responsible maintainer>
> Created: YYYY-MM-DD
> Last reviewed: YYYY-MM-DD
> Review deadline: YYYY-MM-DD (máx 6 meses desde created o última review)
```

### Reglas

- **Review deadline** obligatorio. Máximo 6 meses desde creación o última revisión.
- Si la proposal no ha avanzado al pasar el deadline → mover a `docs/archive/` con nota `STALE — archived due to inactivity since [date]`.
- Si la proposal se vuelve obsoleta → archivar con nota `SUPERSEDED — replaced by [doc/path]`.
- Si la proposal se implementa → mover contenido relevante a `CURRENT/` y archivar el original.

### Excepciones

- Documentos de contexto fundacional (domain-overview, event-classification) pueden tener review deadline anual en vez de semestral.
- Documentos que describen sistemas externos estables mantenidos por el proveedor.
