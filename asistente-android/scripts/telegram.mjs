#!/usr/bin/env node
/**
 * Utilidades de configuración del bot de Telegram.
 *
 *   npm run telegram -- info               Datos del bot y del webhook
 *   npm run telegram -- comandos           Registra el menú de comandos
 *   npm run telegram -- webhook <url>      Registra el webhook
 *   npm run telegram -- webhook:borrar     Lo quita (necesario para sondear)
 *   npm run telegram -- escuchar           Imprime el chat id de quien escriba
 *
 * Lee TELEGRAM_BOT_TOKEN de .env.local o del entorno.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

function cargarEnv() {
  for (const archivo of ['.env.local', '.env']) {
    try {
      const contenido = readFileSync(path.join(process.cwd(), archivo), 'utf8');
      for (const linea of contenido.split('\n')) {
        const limpia = linea.trim();
        if (!limpia || limpia.startsWith('#')) continue;
        const separador = limpia.indexOf('=');
        if (separador === -1) continue;
        const clave = limpia.slice(0, separador).trim();
        const valor = limpia.slice(separador + 1).trim().replace(/^["']|["']$/g, '');
        if (!(clave in process.env)) process.env[clave] = valor;
      }
    } catch {
      // El archivo puede no existir; se sigue con el entorno.
    }
  }
}

cargarEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const BASE = process.env.TELEGRAM_API_BASE ?? 'https://api.telegram.org';

if (!TOKEN) {
  console.error(
    'Falta TELEGRAM_BOT_TOKEN.\n' +
      'Créalo hablándole a @BotFather en Telegram con /newbot y pega el token en .env.local.',
  );
  process.exit(1);
}

async function api(metodo, cuerpo = {}) {
  const respuesta = await fetch(`${BASE}/bot${TOKEN}/${metodo}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json();
  if (!datos.ok) {
    throw new Error(`${metodo} falló (${datos.error_code}): ${datos.description}`);
  }
  return datos.result;
}

const COMANDOS = [
  { command: 'hoy', description: 'Qué hay para hoy y qué está vencido' },
  { command: 'tareas', description: 'Todos los pendientes' },
  { command: 'dudas', description: 'Preguntas que quedaron abiertas' },
  { command: 'ayuda', description: 'Cómo hablarle al asistente' },
  { command: 'chatid', description: 'Muestra el id de este chat' },
];

const [accion, argumento] = process.argv.slice(2);

try {
  switch (accion) {
    case 'info': {
      const bot = await api('getMe');
      console.log(`Bot: @${bot.username} (${bot.first_name}), id ${bot.id}`);
      const webhook = await api('getWebhookInfo');
      console.log(
        webhook.url
          ? `Webhook: ${webhook.url}${webhook.last_error_message ? `\n  último error: ${webhook.last_error_message}` : ''}`
          : 'Webhook: no hay ninguno registrado (modo sondeo).',
      );
      console.log(`Updates pendientes: ${webhook.pending_update_count ?? 0}`);
      break;
    }

    case 'comandos':
      await api('setMyCommands', { commands: COMANDOS });
      console.log('Menú de comandos registrado.');
      break;

    case 'webhook': {
      if (!argumento) {
        console.error('Uso: npm run telegram -- webhook https://tu-dominio/api/telegram/webhook');
        process.exit(1);
      }
      const secreto = process.env.TELEGRAM_WEBHOOK_SECRET || undefined;
      await api('setWebhook', {
        url: argumento,
        secret_token: secreto,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      });
      console.log(`Webhook registrado en ${argumento}.`);
      if (!secreto) {
        console.log(
          'Aviso: sin TELEGRAM_WEBHOOK_SECRET la URL queda sin proteger. Define uno y vuelve a registrarlo.',
        );
      }
      break;
    }

    case 'webhook:borrar':
      await api('deleteWebhook', { drop_pending_updates: false });
      console.log('Webhook eliminado. Ya puedes usar el modo sondeo.');
      break;

    case 'escuchar': {
      console.log('Escribe algo al bot desde Telegram. Ctrl+C para salir.\n');
      let offset;
      for (;;) {
        const updates = await api('getUpdates', { offset, timeout: 25 });
        for (const update of updates) {
          offset = update.update_id + 1;
          const mensaje = update.message ?? update.edited_message;
          if (!mensaje) continue;
          const quien = mensaje.from?.username ? `@${mensaje.from.username}` : mensaje.from?.first_name;
          console.log(`chat id: ${mensaje.chat.id}  ·  ${quien}  ·  "${mensaje.text ?? ''}"`);
          console.log(`  → agrega esto a .env.local:  TELEGRAM_CHATS_PERMITIDOS=${mensaje.chat.id}\n`);
        }
      }
    }

    default:
      console.log(readFileSync(new URL(import.meta.url)).toString().split('*/')[0].split('/**')[1].trim());
      process.exit(accion ? 1 : 0);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
