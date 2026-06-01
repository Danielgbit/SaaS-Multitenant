---
name: skill-generator
description: Creates new skills for the Antigravity agent. Use this skill when the user asks to create, scaffold, or generate a new skill. It guides the creation of the required directory structure, the SKILL.md file with appropriate YAML frontmatter, and follows the progressive disclosure best practices.
---

# Generador de Skills para Antigravity

Esta skill proporciona las instrucciones estructuradas para que el agente pueda crear nuevas skills en el ecosistema de Antigravity de manera estandarizada.

## Cuándo usar esta Skill
Utiliza esta skill cuando el usuario solicite crear una nueva "skill", "habilidad", o automatizar un flujo de trabajo que deba ser reusado por el agente.

## Pasos para crear una nueva Skill

1. **Análisis del Propósito**:
   - Comprende exactamente qué problema va a resolver la nueva skill.
   - Asegúrate de que la skill tenga un enfoque único y específico.

2. **Creación de la Estructura de Directorios**:
   - Crea un nuevo directorio bajo la ruta `.agents/skills/<nombre-de-la-skill>`.
   - El `<nombre-de-la-skill>` debe estar escrito en **kebab-case** (minúsculas y separado por guiones, ej. `nueva-skill-ejemplo`).

3. **Creación del Archivo `SKILL.md`**:
   - Crea obligatoriamente el archivo `SKILL.md` en la raíz del nuevo directorio.
   - Añade el **frontmatter YAML** en la parte superior del archivo. Este paso es CRÍTICO para el descubrimiento de la skill:
     ```yaml
     ---
     name: <nombre-de-la-skill>
     description: <Descripción detallada en inglés y en tercera persona explicando cuándo el agente debe activar esta skill>
     ---
     ```

4. **Desarrollo de las Instrucciones (Cuerpo del Markdown)**:
   - Redacta las instrucciones detalladas de cómo el agente debe comportarse cuando la skill esté activa.
   - **REGLA CRÍTICA**: Toda la explicación, lógica y pasos deben estar en **Español**, cumpliendo con la regla global del proyecto. Solo utilizarás inglés para sintaxis de código o referencias a variables.
   - Estructura las instrucciones utilizando árboles de decisión o pasos ordenados numerados.

5. **Añadir Directorios Opcionales (Solo si es necesario)**:
   - `scripts/`: Para añadir lógica compleja en scripts aislados. Estos deben comportarse como cajas negras con entradas/salidas claras.
   - `examples/`: Para proporcionar archivos de referencia o ejemplos de uso.
   - `resources/`: Para archivos de soporte estáticos.

6. **Verificación**:
   - Revisa que el frontmatter YAML sea válido.
   - Confirma que el Markdown sigue las convenciones requeridas y notifica al usuario cuando la skill esté lista.
