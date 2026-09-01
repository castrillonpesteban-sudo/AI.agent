# Asistente Personal — PWA

App web instalable (PWA) construida con Next.js 14 (App Router) + TypeScript + Tailwind CSS.
Es la interfaz de chat del asistente personal, pensada para instalarse como app en Android
(y en cualquier navegador compatible) desde el mismo navegador, sin pasar por una tienda de apps.

## Requisitos

- Node.js 18.18 o superior
- npm

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Para que el asistente responda con Claude en vez del eco de prueba, copia `.env.example` a
`.env.local` y define `ANTHROPIC_API_KEY`.

## Build de producción

```bash
npm run build
npm run start
```

## Instalar como app (PWA)

1. Sirve el proyecto en producción (`npm run build && npm run start`) o despliégalo en HTTPS —
   el service worker solo se registra en `localhost` o en un origen seguro.
2. Abre la URL en Chrome/Edge en Android y usa "Agregar a la pantalla de inicio" /
   "Instalar app". En iOS Safari, usa "Compartir → Agregar a pantalla de inicio".
3. La app queda instalada con su propio ícono, arranca en modo standalone (sin barra de
   navegador) y muestra una pantalla de "sin conexión" si se abre sin internet.

## Estructura

```
src/
├── app/
│   ├── layout.tsx        Metadata, viewport, ícono, registro del service worker
│   ├── page.tsx           Página principal (chat)
│   ├── manifest.ts        Manifest de la PWA (generado por Next.js)
│   ├── globals.css        Tailwind
│   └── api/assistant/     Endpoint que habla con la API de Anthropic
├── components/
│   ├── ChatWindow.tsx      Layout del chat (mensajes + input)
│   ├── MessageBubble.tsx   Burbuja de mensaje usuario/asistente
│   └── RegisterServiceWorker.tsx
└── lib/
    ├── types.ts
    └── useChat.ts          Estado del chat y llamada al endpoint
public/
├── sw.js                  Service worker: cachea el app shell y sirve offline.html sin red
├── offline.html
└── icons/                 Íconos de la PWA (192, 512, maskable, apple-touch-icon)
```

## Íconos

Los íconos en `public/icons/` son un placeholder generado por script (círculo de acento sobre
fondo oscuro). Reemplázalos por el arte final antes de publicar la app; deben mantenerse los
mismos tamaños (192×192, 512×512, 512×512 maskable, 180×180 apple-touch-icon) y nombres de
archivo, o si cambian, actualizar las referencias en `src/app/manifest.ts` y
`src/app/layout.tsx`.
