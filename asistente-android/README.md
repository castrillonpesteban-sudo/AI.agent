# Asistente Personal — PWA de mensajes

App instalable (PWA) con forma de aplicación de mensajes: le escribes como a un chat, lo que
suene a pendiente queda convertido en **tarea con recordatorio**, lo que preguntes y quede sin
resolver queda guardado en **Dudas**, y los avisos llegan al celular como notificación aunque la
app esté cerrada.

Next.js 14 (App Router) + TypeScript + Tailwind. Se instala desde el navegador, sin tienda de
apps.

## Qué hace

**Chat.** Es la pantalla principal. Escribes en lenguaje normal:

- «Recuérdame llamar a Técnica Electromédica mañana a las 9» → crea la tarea y programa el aviso.
- «Cada lunes revisar el backlog de órdenes» → tarea semanal recurrente.
- «¿Qué tengo pendiente?» → lista lo que hay, sin inventar.

Debajo de cada mensaje aparece la tarea que salió de él. Con el botón `···` de un mensaje puedes
**adjuntarle una tarea** a mano o **guardarlo como duda**. El botón `+` abre el formulario
completo (título, cuándo, notas, prioridad, recurrencia).

**Tareas.** Todo agrupado en Vencidas / Hoy / Próximas / Sin fecha / Hechas, con aplazado rápido
(+1 h, mañana, +1 semana) y completar de un toque.

**Dudas.** Las preguntas que quedaron abiertas, con la respuesta que dio el asistente, para
volver a ellas y marcarlas resueltas. Es la parte que evita que una pregunta se pierda tres
días atrás en el hilo.

**Recordatorios.** Cuando llega la hora, el aviso aparece en el hilo *y* sale como notificación
del sistema. Las tareas recurrentes se reprograman solas al ciclo siguiente. Un recordatorio se
avisa una sola vez por vencimiento.

## Requisitos

- Node.js 18.18 o superior (las pruebas necesitan Node 22+)
- npm

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

Sin `ANTHROPIC_API_KEY` la app funciona igual para crear tareas y listar pendientes: usa el
intérprete de fechas en español que vive en `src/lib/fechas.ts`. Lo que no hace es conversar.

### Notificaciones con la app cerrada

Los recordatorios se entregan por Web Push, que necesita un par de claves VAPID:

```bash
node pruebas/generar-vapid.mjs
```

Copia las tres líneas a `.env.local` y reinicia. La primera vez que abras la app te ofrecerá
activar las notificaciones. Push exige origen seguro: funciona en `localhost` y en HTTPS.

Sin claves VAPID no se pierde nada: los recordatorios siguen apareciendo en el hilo, pero solo
mientras la app está abierta.

## Producción

```bash
npm run build
npm run start
```

Con `npm run start` el propio proceso barre los recordatorios cada 30 segundos
(`INTERVALO_RECORDATORIOS_MS`).

En un despliegue **serverless** (Vercel y similares) no hay proceso persistente, así que hay que
llamar al barrido desde un cron:

```
POST /api/recordatorios/tick
```

Con `CRON_SECRET` definido, exige `Authorization: Bearer <secreto>`. Ejemplo de
`vercel.json`:

```json
{ "crons": [{ "path": "/api/recordatorios/tick", "schedule": "* * * * *" }] }
```

## Instalar como app en el celular

1. Sirve la app en HTTPS (o en `localhost` para probar) — el service worker solo se registra en
   un origen seguro.
2. En Chrome/Edge en Android: menú → «Instalar app» / «Agregar a la pantalla de inicio».
   En iOS Safari: Compartir → «Agregar a pantalla de inicio».
3. Queda con su ícono, arranca en modo standalone y muestra la pantalla de «sin conexión» si se
   abre sin internet.

> En iOS, las notificaciones push solo funcionan si la app está **instalada** en la pantalla de
> inicio (iOS 16.4 o superior). En el navegador de iOS no llegan.

## Dónde se guardan los datos

En un archivo JSON del servidor: `data/db.json` (configurable con `DATA_DIR`). Guarda el hilo de
mensajes, las tareas y las suscripciones push. Está en `.gitignore`. Para respaldar, copia esa
carpeta; para empezar de cero, bórrala.

## Estructura

```
src/
├── app/
│   ├── layout.tsx                  Estado compartido, navegación inferior, PWA
│   ├── page.tsx                    Chat
│   ├── tareas/page.tsx             Tareas agrupadas
│   ├── dudas/page.tsx              Dudas abiertas y resueltas
│   ├── manifest.ts                 Manifest de la PWA
│   └── api/
│       ├── estado/                 Estado completo + barrido de recordatorios
│       ├── asistente/              Un turno de conversación
│       ├── tareas/                 Alta, edición, borrado
│       ├── mensajes/[id]/          Marcar o resolver dudas
│       ├── push/                   Clave VAPID y suscripciones
│       └── recordatorios/tick/     Barrido para cron externo
├── components/
│   ├── VistaChat / VistaTareas / VistaDudas
│   ├── Burbuja.tsx                 Mensaje + tareas adjuntas + menú
│   ├── TarjetaTarea.tsx            Tarea con completar y aplazar
│   ├── CompositorTarea.tsx         Formulario de tarea
│   ├── AvisoNotificaciones.tsx     Permiso y suscripción push
│   └── NavegacionInferior.tsx
└── lib/
    ├── fechas.ts                   Intérprete de fechas en español + zona horaria
    ├── tareas.ts                   Agrupación, orden y recordatorios vencidos
    ├── types.ts
    ├── cliente/                    Capa de API y estado compartido en React
    └── servidor/
        ├── almacen.ts              db.json con cola de escrituras
        ├── asistente.ts            Claude con herramientas + respaldo sin API
        ├── recordatorios.ts        Barrido, reprogramación y avisos
        └── push.ts                 Envío Web Push (VAPID)
public/
├── sw.js                           Caché del app shell, push y clic en la notificación
├── offline.html
└── icons/
```

## Pruebas

```bash
npm test
```

Cubren el intérprete de fechas en español: días relativos, días de la semana, horas en 12 y 24
horas, fechas largas y numéricas, recurrencias, y los casos en los que **no** debe interpretar
una fecha («cotizar 3 monitores»).

## Íconos

Los de `public/icons/` son un placeholder generado por script. Reemplázalos por el arte final
manteniendo tamaños y nombres (192, 512, 512 maskable, 180 apple-touch-icon), o actualiza las
referencias en `src/app/manifest.ts` y `src/app/layout.tsx`.
