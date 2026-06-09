# IMPLEMENTACIÓN OBLIGATORIA

Cuando exista evidencia suficiente para proponer una corrección, no limitarse a describir la solución.

Para cada hallazgo confirmado incluir obligatoriamente:

## Implementación Técnica

### Archivo afectado

Ruta completa del archivo.

### Tipo de modificación

* Crear
* Modificar
* Eliminar
* Refactorizar

### Código Actual

Mostrar únicamente el fragmento relevante.

### Código Propuesto

Mostrar el código completo que debe quedar implementado.

### Diff

Generar diff unificado:

```diff
- código eliminado
+ código agregado
```

### Explicación Técnica

Explicar por qué el cambio resuelve el problema.

### Dependencias Impactadas

Identificar componentes, hooks, servicios, controladores, endpoints, repositorios o módulos afectados.

### Riesgos de Regresión

Enumerar posibles efectos secundarios.

### Validación

Indicar cómo verificar que la corrección funciona.

# REGLAS DE IMPLEMENTACIÓN

* No utilizar pseudocódigo.
* No utilizar comentarios como:

  * "agregar lógica aquí"
  * "implementar validación"
  * "completar según necesidad"
* Generar código listo para producción.
* Mantener el estilo existente del proyecto.
* Respetar TypeScript, ESLint y convenciones actuales.
* Si falta contexto para generar código seguro, detener la implementación y solicitar únicamente los archivos necesarios.

# NIVEL DE CONFIANZA

Cada implementación debe indicar:

* Confianza Alta
* Confianza Media
* Confianza Baja

Si la confianza no es Alta, explicar qué información falta.
