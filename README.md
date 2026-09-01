# AI.agent

Agentes y skills de Claude Code para trabajo de ingeniería clínica y calidad en salud en
Colombia.

## Agente: auditor de habilitación

`auditor-habilitacion` — auditor senior del Sistema Único de Habilitación (SOGCS). Prepara,
simula, conduce y responde auditorías y visitas de verificación de habilitación de servicios de
salud.

**Se activa solo** cuando la conversación entra en ese terreno, o se invoca por nombre:

```
> usa el agente auditor-habilitacion para revisar la UCI de la sede Envigado
```

Va acompañado del skill `auditoria-habilitacion`, que carga el método, las referencias y las
plantillas.

### Dos modos

**Modo A — Auditar.** Autoevaluación, auditoría interna, simulacro, verificación de cierre,
auditoría a un tercero. Es el verificador más severo que la institución va a ver, para que el
real no encuentre nada nuevo.

**Modo B — Recibir la visita.** La institución es la visitada. Alistamiento, conducta durante la
visita y respuesta dentro de término. Modo por defecto cuando se dice "nos visitan", "vino la
secretaría" o "nos dejaron estos hallazgos".

El diagnóstico es igual de severo en los dos — esa es la única forma de que el segundo sirva. Lo
que cambia es la salida.

### Qué hace

- Prepara la institución para la visita con una cuenta regresiva de D-90 a D-1, roles del día y
  simulacro conducido como visita real.
- Monta el expediente maestro para que cualquier evidencia aparezca en menos de dos minutos.
- Acompaña el día de la visita: reunión de apertura, entrega de evidencia, entrevistas al
  personal, lectura del acta y constancias antes de firmar.
- Calcula los términos posteriores y redacta la respuesta: subsanación, solicitud de revisión de
  diferencias con sustento técnico, plan de mejoramiento.
- Evalúa cumplimiento por servicio contra los siete estándares.
- Redacta hallazgos con estructura completa: condición, criterio, evidencia, causa, efecto.
- Resuelve el ciclo REPS: inscripción, novedades, autoevaluación, renovación, cierre temporal,
  inactivación, reactivación, inconsistencias.
- Analiza la brecha frente al nuevo régimen durante la transición normativa.

### Cómo está construido

```
.claude/
├── agents/
│   └── auditor-habilitacion.md          Postura, modos, reglas y límites del agente
└── skills/
    └── auditoria-habilitacion/
        ├── SKILL.md                     Método, modos y disparadores
        ├── references/
        │   ├── marco-normativo.md               Mapa normativo con estado de verificación
        │   ├── transicion-3100-a-1732.md        Los dos regímenes y cómo auditar en transición
        │   ├── estandares-y-criterios.md        Los siete estándares y qué se pregunta
        │   ├── metodo-auditoria.md              Muestreo, evidencia, hallazgos, cierre
        │   ├── hallazgos-frecuentes.md          Patrones de incumplimiento y su causa de fondo
        │   ├── dotacion-e-ingenieria-clinica.md Dotación, metrología, tecnovigilancia
        │   ├── ciclo-reps.md                    Inscripción, novedades, cierres, renovación
        │   ├── preparacion-de-la-visita.md      Cuenta regresiva D-90 a D-1 y roles del día
        │   ├── expediente-de-habilitacion.md    Evidencia ubicable en dos minutos
        │   ├── dia-de-la-visita.md              Apertura, acta, constancias, cierre
        │   └── despues-de-la-visita.md          Términos, subsanación, revisión de diferencias
        └── plantillas/
            ├── lista-chequeo-autoevaluacion.md
            ├── acta-visita-verificacion.md
            ├── informe-auditoria.md
            ├── plan-de-mejoramiento.md
            ├── matriz-evidencia.md
            └── respuesta-a-hallazgos.md
```

## Búsqueda web en vivo: servidor MCP de Perplexity

El repositorio deja configurado el servidor MCP oficial de la API de Perplexity en `.mcp.json`,
para consultar la web en el momento — norma vigente, alertas del INVIMA, fichas técnicas, precios
de referencia — en vez de responder de memoria.

### Puesta en marcha

1. Sacar una clave en el portal de la API de Perplexity (https://www.perplexity.ai/account/api).
2. Exportarla antes de abrir Claude Code:

   ```bash
   export PERPLEXITY_API_KEY="pplx-..."
   ```

   Conviene dejarla en `~/.zshrc` o `~/.bashrc` para no repetirlo en cada sesión.
3. Abrir Claude Code en esta carpeta y confirmar el servidor del proyecto. Con `/mcp` se ve el
   estado; debe aparecer `perplexity` conectado.

La clave **no se escribe en `.mcp.json`**: el archivo la toma de la variable de entorno con
`${PERPLEXITY_API_KEY}`, así que nunca llega al repositorio. `.env.example` sirve de plantilla y
`.gitignore` bloquea `.env` y `.claude/settings.local.json`.

### Herramientas que quedan disponibles

| Herramienta | Para qué |
|---|---|
| `perplexity_search` | Búsqueda web directa, con resultados rankeados y metadatos |
| `perplexity_ask` | Pregunta conversacional con búsqueda en tiempo real (rápida) |
| `perplexity_research` | Investigación a fondo, con informe y fuentes |
| `perplexity_reason` | Razonamiento sobre lo que encuentra |

`.claude/settings.json` las deja preaprobadas: son de solo lectura, no tocan nada del equipo ni
de la institución.

### Alternativa local (stdio)

Si se prefiere correr el servidor en la máquina en lugar del endpoint remoto, se reemplaza el
bloque de `.mcp.json` por:

```json
{
  "mcpServers": {
    "perplexity": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@perplexity-ai/mcp-server"],
      "env": { "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}" }
    }
  }
}
```

Requiere Node instalado. Si aparece un error de EOF al iniciar, usar `-yq` en lugar de `-y`.

### Advertencia de uso

Perplexity resume y cita, pero no es fuente. Para habilitación sigue mandando la regla del
repositorio: **verificar contra el texto oficial antes de citar un artículo o un criterio**. La
búsqueda sirve para llegar rápido a la fuente, no para reemplazarla.

## Advertencia sobre la normativa

La habilitación cambió de norma el **5 de agosto de 2026**: la Resolución 1732 de 2026 adopta un
nuevo Manual (Tomos I y II) y deroga la Resolución 3100 de 2019 con sus modificatorias, con doce
meses de transición.

El agente está construido sobre una regla no negociable: **verificar la norma antes de citarla**.
Las referencias de este repositorio son un mapa para orientarse, tienen fecha de corte
(28 de agosto de 2026) y marcan explícitamente lo que no fue verificado. **No son fuente de
citas.** El texto exacto de los criterios vive en el Manual adoptado por la norma vigente, y ahí
hay que ir antes de escribir un número de artículo en un documento que va a leer un verificador.

Este agente no habilita, no certifica y no declara a nadie habilitado. Eso es competencia de la
entidad departamental o distrital de salud.
