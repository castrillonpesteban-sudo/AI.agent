# Cómo usar el asistente desde tu Telegram

Guía de principio a fin. Al terminar vas a tener un contacto en Telegram al que le escribes
«recuérdame llamar al proveedor mañana a las 9» y te responde, te lo anota y te avisa a la hora.

---

## Lo primero, para que no te sorprenda

**El bot no vive dentro de Telegram.** Telegram solo es la ventana. Detrás hay un programa —el
que está en esta carpeta— que tiene que estar **corriendo en algún computador prendido**. Si ese
computador se apaga, el bot deja de responder hasta que vuelva a encenderse. No se pierde nada:
las tareas quedan guardadas y los recordatorios vencidos te llegan cuando vuelva.

Tienes tres formas de tenerlo corriendo. Empieza por la primera para probar, y pásate a la
segunda cuando ya lo quieras de verdad.

| | Dónde corre | Cuándo responde | Cuesta |
|---|---|---|---|
| **A. Tu computador** | Tu PC o portátil | Solo mientras esté prendido y sin suspender | Nada |
| **B. Un servidor en la nube** | Railway, Render, Fly.io, un VPS | Siempre, 24/7 | Desde gratis / unos pocos USD al mes |
| **C. Serverless** | Vercel | Siempre, pero necesita dominio y cron | Gratis con límites |

---

## Paso 1 — Crear el bot (esto se hace en el celular, 2 minutos)

1. Abre Telegram y busca **@BotFather** (el que tiene el chulo azul de verificado).
2. Mándale `/newbot`.
3. Te pide un **nombre**: el que quieras, por ejemplo `Asistente de Esteban`.
4. Te pide un **usuario**: tiene que terminar en `bot`, por ejemplo `esteban_asistente_bot`.
   Si está ocupado, prueba otro.
5. Te responde con un **token**, algo así:

   ```
   8123456789:AAHk3f_LxQpR2vNm4tYw...
   ```

**Ese token es la llave de tu bot.** Quien lo tenga puede leer y escribir tus tareas. No lo
pegues en un chat, ni en una captura, ni lo subas a GitHub.

---

## Paso 2 — Poner el programa a correr

### Opción A — En tu computador (para probar hoy mismo)

Necesitas [Node.js 18.18 o superior](https://nodejs.org). Luego, en una terminal:

```bash
git clone https://github.com/castrillonpesteban-sudo/AI.agent.git
cd AI.agent/asistente-android
npm install
cp .env.example .env.local
```

Abre `.env.local` con cualquier editor y pon el token:

```
TELEGRAM_BOT_TOKEN=8123456789:AAHk3f_LxQpR2vNm4tYw...
```

Ahora averigua **el id de tu chat**, que es como el bot sabe que eres tú:

```bash
npm run telegram -- escuchar
```

Deja eso corriendo, abre Telegram, busca tu bot por el usuario que escogiste y mándale
cualquier cosa (`hola` sirve). En la terminal aparecerá:

```
chat id: 123456789  ·  @tuusuario  ·  "hola"
  → agrega esto a .env.local:  TELEGRAM_CHATS_PERMITIDOS=123456789
```

Corta con `Ctrl+C`, agrega esa línea a `.env.local`, y arranca:

```bash
npm run telegram -- comandos     # registra el menú de comandos (una sola vez)
npm run build
npm run start
```

Cuando veas `Asistente despierto: bot de Telegram y recordatorios activos.`, ya está.
Ve a Telegram y escríbele.

> Mientras esa terminal esté abierta y el computador prendido, el bot responde. Si cierras la
> terminal, el bot se calla. Para que no se suspenda el equipo, revisa las opciones de energía.

### Opción B — En la nube, para que funcione siempre

Lo mismo de la opción A, pero el programa corre en un servidor que nunca se apaga. Recomiendo
**Railway** por lo simple:

1. Entra a [railway.app](https://railway.app) y conecta tu cuenta de GitHub.
2. **New Project → Deploy from GitHub repo →** elige `AI.agent`.
3. En **Settings → Root Directory** pon `asistente-android`.
4. En **Variables**, agrega:

   | Variable | Valor |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | el token de BotFather |
   | `TELEGRAM_CHATS_PERMITIDOS` | tu chat id |
   | `ANTHROPIC_API_KEY` | tu clave de Anthropic (opcional, ver más abajo) |
   | `DATA_DIR` | `/data` |
   | `TZ_USUARIO` | `America/Bogota` |

5. **Importante:** en **Settings → Volumes**, crea un volumen montado en `/data`.
   Sin esto **pierdes todas las tareas cada vez que se redespliegue la app.**

Si aún no tienes el chat id (porque nunca corriste la opción A): despliega primero solo con el
token, escríbele cualquier cosa al bot desde Telegram y te contestará que el chat no está
autorizado **incluyendo tu número**. Agrégalo a las variables y redespliega.

También hay un `Dockerfile` listo, por si prefieres Fly.io, Render o un VPS propio:

```bash
docker build -t asistente .
docker run -d --env-file .env.local -p 3000:3000 -v asistente-datos:/data asistente
```

### Opción C — Vercel (serverless)

Vercel no deja procesos corriendo, así que hay que cambiar dos cosas: el bot pasa a modo
*webhook* y los recordatorios los dispara un cron. Está explicado en el
[README](README.md#modo-webhook). Ten en cuenta que el sistema de archivos de Vercel es de solo
lectura, así que ahí sí toca cambiar el almacenamiento por una base de datos externa. **Es la
opción más incómoda de las tres**; si puedes, quédate en la B.

---

## Paso 3 — Usarlo

Abre el chat del bot en Telegram y escríbele como a cualquier persona.

**Para anotar cosas:**

```
Recuérdame llamar a Técnica Electromédica mañana a las 9
Cotizar el repuesto del ventilador el viernes
Cada lunes revisar el backlog de órdenes
En 2 horas sacar el autoclave de central
El 12 de octubre calibrar los termohigrómetros
```

Te responde confirmando y con tres botones debajo:

**✅ Hecha** · **⏰ +1 h** · **📅 Mañana**

**Para consultar:**

```
¿Qué tengo pendiente?
¿Qué hay para hoy?
```

**Comandos** (salen en el menú del chat, al lado del clip):

| Comando | Qué hace |
|---|---|
| `/hoy` | Lo de hoy y lo que está vencido |
| `/tareas` | Todos los pendientes |
| `/dudas` | Las preguntas que quedaron abiertas |
| `/ayuda` | Recordatorio de cómo hablarle |
| `/chatid` | El id de este chat |

**Los recordatorios** te llegan solos al chat, a la hora que dijiste, con los mismos botones.
Si una tarea se venció y sigue pendiente, te lo dice: *«Estaba para hoy 9:00 a. m. y sigue
pendiente.»*

---

## Paso 4 — La app en el celular (opcional)

El mismo asistente tiene una versión web instalable. Abre la dirección del servidor en Chrome
en Android (o Safari en iPhone) y usa **«Agregar a la pantalla de inicio»**. Queda como una app
más, con tres pestañas: Chat, Tareas y Dudas.

**Comparte todo con el bot**: lo que anotas por Telegram lo ves ahí, y al revés. La vista de
**Tareas** es más cómoda para revisar todo junto, y la de **Dudas** es donde quedan las
preguntas que no se resolvieron.

---

## Sobre la clave de Anthropic

Sin `ANTHROPIC_API_KEY`, el bot **igual funciona** para lo esencial: entiende las fechas en
español, crea las tareas y te lista los pendientes. Lo que no hace es conversar ni responder
preguntas.

Con la clave puesta, ya razona: le puedes preguntar cosas, pedirle que reorganice, que te
resuma. Se saca en [console.anthropic.com](https://console.anthropic.com) y se paga por uso.

---

## Si algo no funciona

**El bot no responde nada.**
Revisa que el programa esté corriendo. En los logs debe aparecer `Sondeo de Telegram iniciado.`
Si no aparece, falta `TELEGRAM_BOT_TOKEN`.

**Responde «Este chat no está autorizado».**
Es lo correcto: falta agregar tu chat id. El mensaje trae el número; ponlo en
`TELEGRAM_CHATS_PERMITIDOS` y reinicia. Esto existe a propósito — un bot de Telegram es público
y cualquiera que dé con su nombre podría escribirle.

**En los logs sale un error 409.**
Hay un webhook registrado y por eso no puede sondear. Quítalo:

```bash
npm run telegram -- webhook:borrar
```

**Las tareas desaparecieron después de un despliegue.**
Falta el volumen en `/data` (paso 2, opción B). Sin él, cada redespliegue empieza de cero.

**Me anotó como tarea algo que era una pregunta.**
Pasa cuando no hay `ANTHROPIC_API_KEY`: sin el modelo, el bot decide por reglas. Bórrala con el
botón y vuelve a escribirla más directa, o conecta la clave.

**Para ver el estado del bot:**

```bash
npm run telegram -- info
```
