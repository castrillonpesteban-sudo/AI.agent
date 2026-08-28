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

### Qué hace

- Prepara la institución para una visita de verificación (simulacro real, no lectura de carpetas).
- Evalúa cumplimiento por servicio contra los siete estándares.
- Redacta hallazgos con estructura completa: condición, criterio, evidencia, causa, efecto.
- Arma autoevaluaciones, actas, informes de auditoría y planes de mejoramiento.
- Resuelve el ciclo REPS: inscripción, novedades, autoevaluación, renovación, cierre temporal,
  reactivación, inconsistencias.
- Analiza la brecha frente al nuevo régimen durante la transición normativa.

### Cómo está construido

```
.claude/
├── agents/
│   └── auditor-habilitacion.md          Postura, reglas y límites del agente
└── skills/
    └── auditoria-habilitacion/
        ├── SKILL.md                     Método y disparadores
        ├── references/
        │   ├── marco-normativo.md               Mapa normativo con estado de verificación
        │   ├── transicion-3100-a-1732.md        Los dos regímenes y cómo auditar en transición
        │   ├── estandares-y-criterios.md        Los siete estándares y qué se pregunta
        │   ├── metodo-auditoria.md              Muestreo, evidencia, hallazgos, cierre
        │   ├── hallazgos-frecuentes.md          Patrones de incumplimiento y cómo se cierran
        │   └── dotacion-e-ingenieria-clinica.md Dotación, metrología, tecnovigilancia
        └── plantillas/
            ├── lista-chequeo-autoevaluacion.md
            ├── acta-visita-verificacion.md
            ├── informe-auditoria.md
            └── plan-de-mejoramiento.md
```

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
