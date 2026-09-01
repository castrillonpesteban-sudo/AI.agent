# Asistente Personal — bot de Telegram + PWA

Asistente personal al que le escribes **desde Telegram, en el celular**: lo que suene a
pendiente queda convertido en **tarea con recordatorio**, lo que preguntes y quede sin resolver
queda guardado como **duda**, y a la hora te llega el aviso al chat con botones para marcarla
hecha o aplazarla.

El mismo asistente tiene además una **PWA instalable** con tres vistas (Chat, Tareas, Dudas).
Las dos bocas comparten el mismo hilo, las mismas tareas y la misma memoria: lo que anotas por
Telegram aparece en la app, y al revés.

Next.js 14 (App Router) + TypeScript + Tailwind.

> **¿Nunca lo has puesto a andar?** Empieza por la
> [**guía paso a paso para usarlo desde Telegram**](GUIA-TELEGRAM.md): crear el bot, dejarlo
> corriendo y hablarle desde el celular.

## Arquitectura

```
   Telegram  ─┐                    ┌─ Claude (tool calling)
              ├─►  núcleo del      ├─ intérprete de fechas en español
   PWA       ─┘    asistente       └─ almacén (hilo, tareas, dudas)
                        │
                        └─► planificador de recordatorios ──► Telegram + Web Push
```

El núcleo no sabe por qué canal entró el mensaje. Añadir WhatsApp es escribir otro adaptador en
`src/lib/servidor/canales/`, sin tocar el resto.

## Qué hace

**Telegram.** Le escribes al bot desde el celular, como a cualquier contacto:

- «Recuérdame llamar a Técnica Electromédica mañana a las 9» → anota la tarea y te avisa.
- «Cada lunes revisar el backlog de órdenes» → tarea semanal.
- «¿Qué tengo pendiente?» → te lista lo real.

Cada tarea llega con botones: **✅ Hecha**, **⏰ +1 h**, **📅 Mañana**. Comandos: `/hoy`,
`/tareas`, `/dudas`, `/ayuda`, `/chatid`.

**Chat en la app.** La misma conversación, en la PWA. Escribes en lenguaje normal:

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

**Recordatorios.** Cuando llega la hora, el aviso te llega **por Telegram con botones**, aparece
en el hilo de la app y sale como notificación del navegador. Las tareas recurrentes se
reprograman solas al ciclo siguiente. Un recordatorio se avisa una sola vez por vencimiento.

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

### Conectar el bot de Telegram

1. En Telegram, háblale a **@BotFather**, manda `/newbot` y sigue los pasos. Te da un token.
2. Pon el token en `.env.local`:

   ```
   TELEGRAM_BOT_TOKEN=123456:AA...
   ```

3. Averigua el id de tu chat y autorízalo. **Esto no es opcional**: un bot de Telegram es
   público, y sin lista de autorizados no atiende a nadie (a propósito).

   ```bash
   npm run telegram -- escuchar     # escríbele algo al bot; imprime tu chat id
   ```

   ```
   TELEGRAM_CHATS_PERMITIDOS=123456789
   ```

4. Registra el menú de comandos y arranca:

   ```bash
   npm run telegram -- comandos
   npm run build && npm run start
   ```

El bot queda escuchando por **sondeo largo** desde el propio servidor: no necesita dominio,
HTTPS ni puertos abiertos. Sirve igual en un VPS, en Railway/Render/Fly o en tu máquina.

Otros comandos útiles:

```bash
npm run telegram -- info             # datos del bot y estado del webhook
npm run telegram -- webhook:borrar   # quita el webhook para poder sondear
```

#### Modo webhook

En un despliegue serverless no hay proceso que sondee, así que hay que usar webhook:

```
TELEGRAM_MODO=webhook
TELEGRAM_WEBHOOK_SECRET=algo-largo-y-aleatorio
```

```bash
npm run telegram -- webhook https://tu-dominio/api/telegram/webhook
```

Sondeo y webhook son excluyentes: si registras un webhook, Telegram rechaza el sondeo con un
409 (el servidor lo detecta y lo dice en los logs).

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
(`INTERVALO_RECORDATORIOS_MS`) y sondea Telegram. Es el modo pensado para un servidor que queda
prendido: VPS, Railway, Render o Fly.

El bot y el planificador arrancan solos al encender el servidor (`src/instrumentation.ts`), sin
esperar a que nadie abra la app.

### Docker

Hay un `Dockerfile` de tres etapas listo para Fly.io, Render o un VPS:

```bash
docker build -t asistente .
docker run -d --env-file .env.local -p 3000:3000 -v asistente-datos:/data asistente
```

El volumen en `/data` no es opcional: sin él se pierden las tareas en cada redespliegue. En
Railway o Fly, monta el volumen en esa ruta y define `DATA_DIR=/data`.

En un despliegue **serverless** (Vercel y similares) no hay proceso persistente, así que hay que
usar `TELEGRAM_MODO=webhook` y llamar al barrido desde un cron:

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
mensajes, las tareas, las suscripciones push y el estado del canal de Telegram. Está en `.gitignore`. Para respaldar, copia esa
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
│       ├── telegram/webhook/       Updates de Telegram (modo webhook)
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
        ├── push.ts                 Envío Web Push (VAPID)
        └── canales/
            ├── telegram.ts         Cliente de la API de bots
            ├── conversacion.ts     Comandos, botones y turno de conversación
            └── sondeo.ts           Sondeo largo dentro del proceso
scripts/
└── telegram.mjs                    Configuración del bot (token, webhook, chat id)
public/
├── sw.js                           Caché del app shell, push y clic en la notificación
├── offline.html
└── icons/
```

## Pruebas

```bash
npm test
```

Cubren el intérprete de fechas en español (días relativos, días de la semana, horas en 12 y 24
horas, fechas largas y numéricas, recurrencias, y los casos en los que **no** debe interpretar
una fecha, como «cotizar 3 monitores») y el cliente de Telegram (partido de mensajes largos y
control de acceso por chat).

## Íconos

Los de `public/icons/` son un placeholder generado por script. Reemplázalos por el arte final
manteniendo tamaños y nombres (192, 512, 512 maskable, 180 apple-touch-icon), o actualiza las
referencias en `src/app/manifest.ts` y `src/app/layout.tsx`.
