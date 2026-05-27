## Descripción

<!-- Resumen del cambio: qué, por qué, cómo -->

---

## Tipo de cambio

- [ ] Bug fix
- [ ] Nueva feature
- [ ] Refactor
- [ ] Documentación
- [ ] Infraestructura/CI

---

## Documentation checklist

- [ ] Actualicé docs afectadas (ver `docs/INDEX.md`)
- [ ] Nuevas variables de entorno documentadas en `docs/architecture/CURRENT/ENVIRONMENT.md`
- [ ] Nuevos cron jobs documentados en `docs/architecture/CURRENT/CRON-JOBS.md`
- [ ] Nuevas tablas/modificaciones reflejadas en `docs/architecture/CURRENT/DATABASE.md`
- [ ] Cambios arquitectónicos reflejados en `docs/architecture/CURRENT/`
- [ ] Propuestas colocadas únicamente en `docs/architecture/FUTURE/`

---

## Governance

- [ ] No introduje documentación aspiracional en `CURRENT/`
- [ ] Actualicé ADRs en `docs/decisions/` si hubo decisiones arquitectónicas relevantes

---

## Testing

- [ ] Tests unitarios pasan (`npm test`)
- [ ] Architecture guard (`npm run guard`)
- [ ] Documentación generada (`pnpm docs:gen`)
- [ ] `pnpm docs:check` sin errores
