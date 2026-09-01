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

## App: asistente personal (bot de Telegram + PWA)

`asistente-android/` — asistente personal al que se le escribe desde Telegram, en el celular.
Lo que suene a pendiente queda como tarea con recordatorio, las preguntas que quedan abiertas se
guardan como dudas, y a la hora llega el aviso al chat con botones para marcarla hecha o
aplazarla. Trae además una PWA instalable (Chat, Tareas, Dudas) que comparte el mismo hilo y las
mismas tareas que el bot.

El núcleo está desacoplado del canal, así que sumar WhatsApp es escribir otro adaptador en
`src/lib/servidor/canales/`.

Para ponerlo a andar desde cero, la
[**guía paso a paso**](asistente-android/GUIA-TELEGRAM.md). Detalle técnico, despliegue y
configuración en [`asistente-android/README.md`](asistente-android/README.md).

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

## Versión de archivo único

`dist/SKILL.md` es el skill completo condensado en un solo archivo, para plataformas donde solo
se puede subir un `SKILL.md` y no una carpeta. Conserva el método, los dos modos, los siete
estándares, los plazos y los esqueletos de documento; lo que pierde frente a la versión de
carpeta son las plantillas extensas y el desarrollo largo de cada referencia.

Al cambiar algo en `.claude/skills/auditoria-habilitacion/`, actualiza también `dist/SKILL.md`.
