# Mantenimiento Camas y Camillas — Clínica Victoriana

Sitio para controlar el mantenimiento preventivo mensual de camas hospitalarias y camillas.
Un solo link, un solo inventario compartido. Sin cuentas: cualquiera con el link ve y edita
lo mismo, desde el celular o el computador.

## Por qué está en Netlify y no en Vercel

La primera versión corrió en Vercel (`mantenimiento-camas-camillas.vercel.app`) con Upstash
Redis como base de datos. Nunca quedó operativa: faltaba conectar la base, y `/api/state`
respondía `503 {"error":"no_db"}`.

Se migró a Netlify por dos razones:

1. El plan gratis de Vercel (Hobby) está definido para uso personal y no comercial. Una
   herramienta interna de una clínica cae en uso comercial. El plan gratis de Netlify no
   tiene esa restricción.
2. Netlify Blobs viene incluido en el mismo servicio. Se eliminó la dependencia de Upstash,
   del marketplace y de variables de entorno. Un proveedor en vez de dos, y cero
   configuración manual: Blobs se aprovisiona solo.

## Arquitectura

Sitio estático más una función serverless. Sin build step, sin framework.

```
mantenimiento-camas-camillas/
├── public/
│   └── index.html                  # página completa (HTML + CSS + JS inline)
├── netlify/
│   └── functions/
│       └── state.mjs               # GET / POST / DELETE contra Netlify Blobs
├── netlify.toml                    # publish = public
└── package.json                    # única dependencia: @netlify/blobs
```

### Backend (`netlify/functions/state.mjs`)

Guarda todo el estado en un único registro JSON dentro de Netlify Blobs, en el store
`mantenimiento-camas`, bajo la clave `estado`.

La función se expone en `/api/state` mediante `export const config = { path: "/api/state" }`,
así que el frontend no cambió ni una línea respecto a la versión de Vercel.

Usa `consistency: "strong"` para que un cambio hecho por un ingeniero sea visible de
inmediato para los demás, sin esperar propagación.

El estado de producción vive en el store global (`getStore`). Los deploy previews usan un
store propio (`getDeployStore`), para no mezclar datos de prueba con los reales.

Endpoints sobre `/api/state`:

- `GET` → devuelve todo el objeto de estado, o `{}` si todavía no hay nada guardado.
- `POST` con body `{placa, patch}` → hace merge de `patch` sobre el registro de esa placa y
  reescribe `upd` con el timestamp del servidor.
- `DELETE` con body `{placa}` → borra el registro de esa placa.

Concurrencia: el registro completo se lee, se modifica y se reescribe. Netlify Blobs no trae
control de concurrencia, gana la última escritura. Dos ingenieros marcando la misma placa en
la misma fracción de segundo podrían pisarse. El frontend refresca cada 6 segundos, así que
un cambio perdido se ve y se vuelve a marcar. Con 7 ingenieros y 176 equipos al mes, el
riesgo es bajo.

### Frontend (`public/index.html`)

Partió como copia exacta de la versión verificada en producción en Vercel, sin tocar nada en
la migración, para no introducir errores de transcripción. Después se aplicaron cambios
puntuales pedidos por el usuario (ver más abajo).

- Sin localStorage para el estado compartido. Únicamente recuerda qué ingeniero quedó
  seleccionado en el dropdown (`camas-mp-tecnico`), comodidad local, no dato compartido.
- Polling a `GET /api/state` cada 6 segundos (`POLL_MS`) más una carga al iniciar.
- El polling no pisa lo que el ingeniero está escribiendo. `fetchState()` conserva los
  registros con escritura pendiente (los que tienen timer vivo en `timers`) y el registro
  abierto mientras haya un campo con foco. La función `editing()` detecta ese foco, y en ese
  caso solo refresca pestañas y resumen, sin redibujar la lista. Sin esto, el refresco cada
  6 segundos borraba una fecha o un MPI a medio digitar.
- La búsqueda cubre placa, ubicación, marca/modelo y número de serie.
- Los cambios se mandan con `POST /api/state`, con debounce de 500 ms para campos de texto y
  de forma inmediata para los botones de etapa.
- Indicador de conexión (`#connstat`): "Conectando…", "Guardado compartido activo" o
  "Sin conexión con el servidor".
- Exportación a CSV con BOM UTF-8 y saltos de línea CRLF.

Pendiente menor: el mensaje de error del caso 503 todavía menciona Vercel. Ese caso ya no
ocurre con Blobs, pero conviene corregir el texto en el próximo cambio.

## Modelo de datos

Cada equipo (identificado por su placa) tiene un registro:

```js
{ mp:false, fecha:"", mpi:"", tec:"", rep:"", obs:"", keeper:false, firma:false, upd:"" }
```

- `mp`: mantenimiento ejecutado
- `fecha`: fecha del mantenimiento
- `mpi`: consecutivo de mantenimiento interno
- `tec`: ingeniero que lo hizo (dropdown, no texto libre)
- `rep`: repuesto usado
- `obs`: observaciones y novedades
- `keeper`: reporte cargado en el sistema Keeper
- `firma`: firmado por la jefe del servicio
- `upd`: timestamp del último cambio

La fase se deriva así (`fase()` en el JS): `firma` → Cerrada, si no `keeper` → Falta firma,
si no `mp` → Falta Keeper, si no → Pendiente. Activar una etapa posterior activa las
anteriores.

## Reglas de negocio fijas

- Ingenieros: Esteban, Roci, Silvana, Sharon, Julián, Alejandro, María Camila (ella sin piso
  asignado).
- Reparto por piso: piso 1 y piso 5 → Esteban, piso 2 → Roci, piso 3 → Silvana, piso 4 →
  Sharon y Julián, piso 6 → Alejandro. Las camillas las hace todo el equipo.
- El campo "quién lo hizo" es un dropdown, no texto libre.
- Flujo obligatorio: mantenimiento (con fecha, MPI y observaciones) → reporte en Keeper →
  firma de la jefe del servicio.
- Las camas cuna y cama domiciliaria no entran en el inventario de esta ruta.

Este sitio es un tablero de control, no el registro formal. El soporte que pide un auditor
sigue estando en Keeper, con el MPI.

## Inventario embebido (`GRUPOS`)

El inventario completo está embebido como constante `GRUPOS` en el `<script>` de
`index.html`, agrupado por piso con `{id, nombre, resp, items:[{p,s,m,u,t}]}` (placa, serie,
marca/modelo, ubicación, tipo de equipo).

Verificado: 176 equipos, 112 camas (pisos 1 a 6 más 2 en sótano) y 64 camillas, sin placas
repetidas.

Solo el avance (`mp/keeper/firma/...`) vive en Blobs. El inventario es estático.

Para un mantenimiento nuevo con inventario distinto, hay que regenerar el array `GRUPOS` a
partir del Excel y reemplazarlo. El resto del código no cambia.

## Diseño

CSS con variables de tema en `:root` y equivalentes bajo `@media (prefers-color-scheme:
dark)`. Tipografías Archivo, IBM Plex Sans e IBM Plex Mono vía Google Fonts. Bordes finos,
sin sombras pesadas, colores de estado sutiles (ámbar para MP, azul para Keeper, verde para
Firma). Diseño móvil a partir de 640 px: placa, ubicación y botones se reacomodan en filas.

## Desarrollo local

```bash
npm install
netlify dev
```

`netlify dev` levanta el sitio y emula Blobs en un store local aislado.

## Despliegue

El sitio Netlify es `mantenimiento-camas-camillas`
(id `3da2483c-2a21-4051-97f1-e6b643654adc`), equipo `castrillonpesteban`.

Conectado a este repositorio, con **base directory** `mantenimiento-camas-camillas`.
Cada push a la rama de producción despliega solo.

Blobs no necesita configuración: no hay variables de entorno que poner.

## Cómo continuar

1. Agregar o modificar equipos: editar el array `GRUPOS` dentro de `public/index.html`.
2. Cambiar el reparto por piso, la lista de ingenieros o el flujo de etapas: buscar
   `INGENIEROS` y las funciones `toggle()` / `fase()` en `public/index.html`.
3. Cambiar cómo se guarda o lee el estado: `netlify/functions/state.mjs`.
4. Nunca usar `localStorage` para el estado compartido (mp, keeper, firma, fecha, mpi). Eso
   rompe el objetivo de tener un solo inventario compartido.
5. Bajar `POLL_MS` a 30000 y pausar el polling cuando la pestaña está oculta si algún día el
   consumo de funciones se acerca al tope del plan gratis (125.000 ejecuciones al mes). Con
   uso real (los ingenieros abren, marcan y cierran) el consumo estimado ronda 46.000.
