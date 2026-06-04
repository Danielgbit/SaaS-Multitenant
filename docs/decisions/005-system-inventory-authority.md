# ADR-005: Adoptar SYSTEM_INVENTORY.md como Referencia Canónica de Arquitectura Observada

> STATUS: ACCEPTED
> Date: 2026-06-04

---

## Contexto

Durante la auditoría de consistencia documental (Junio 2026) se detectó drift significativo entre la documentación y la implementación real. **La documentación evolucionó de forma independiente al código, generando múltiples fuentes de verdad inconsistentes.**

| Afirmación documentada | Real observado |
|------------------------|----------------|
| 44 migraciones | 73 |
| 21 módulos de Server Actions | 26 |
| Tipografía Cormorant Garamond + Plus Jakarta Sans | Poppins + Manrope |
| README.md con contenido del proyecto | Template GitLab sin personalizar |
| ROADMAP.md con versión v1.0 MVP | Sistema en V2 (payroll, notifications, confirmations V2) |
| Skills describiendo V1 (whatsapp_messages, payroll_receipts) | Sistema operando en V2 (notification_queue, payroll_periods) |

El problema raíz es la ausencia de una fuente de referencia única y verificable de la arquitectura real del sistema. Cada documento mantenía sus propios números, descripciones y supuestos, sin un mecanismo para validar consistencia.

## Decisión

Introducir `docs/architecture/CURRENT/SYSTEM_INVENTORY.md` como la **referencia canónica de arquitectura observada**.

SYSTEM_INVENTORY.md captura:
- Métricas cuantitativas del código (VERIFIED)
- Esquema de base de datos extraído de migraciones (DERIVED)
- Catálogo de acciones, rutas, componentes, roles (VERIFIED)
- Reference counts para decidir V1 vs V2 (DERIVED)
- Legacy inventory con evidencia de adopción (DERIVED)
- Drift documental detectado entre docs y código (DERIVED)

### Jerarquía de autoridad

```
1. Código fuente                  ← Autoridad última
2. Types generados (supabase)     ← Verdad del schema
3. Migraciones SQL                ← Estado de la BD
4. SYSTEM_INVENTORY.md            ← Referencia canónica observada
5. Documentación derivada         ← ARCHITECTURE.md, DATABASE.md, skills, etc.
```

En caso de conflicto entre niveles, prevalece el nivel superior.

## Consecuencias

### Positivas

- Drift reducido: todo documento derivado se construye desde la misma base numérica
- Auditorías futuras más rápidas: basta regenerar SYSTEM_INVENTORY y comparar
- Skills alineadas con implementación real (reescritas contra SYSTEM_INVENTORY)
- Onboarding con fuente única de métricas del sistema

### Negativas

- Requiere mantenimiento periódico (mitigación: scripts `docs:gen` y `docs:check`)
- No reemplaza la lectura del código para decisiones de diseño
- Riesgo de dependencia circular mitigado con "en caso de conflicto, prevalece el código"

## Alternativas Consideradas

| Alternativa | Decisión |
|-------------|----------|
| Mantener docs independientes sin fuente común | Rechazado (drift garantizado) |
| Auto-generar toda la documentación desde código | Rechazado (pérdida de narrativa) |
| **SYSTEM_INVENTORY como referencia canónica** | **Aceptado** |

## Referencias

- `docs/architecture/CURRENT/SYSTEM_INVENTORY.md`
- `docs/governance/DOCUMENTATION_POLICY.md`
- `docs/governance/ARCHITECTURE_GOVERNANCE.md`
- `docs/governance/OPERATIONAL_VISUAL_SYSTEMS.md`
