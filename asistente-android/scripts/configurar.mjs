#!/usr/bin/env node
/**
 * Configuración guiada del asistente. Deja listo .env.local: valida el token
 * del bot, captura el id de tu chat esperando tu mensaje, genera las claves de
 * notificaciones y registra el menú de comandos en Telegram.
 *
 *   npm run configurar
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const ARCHIVO_ENV = path.join(process.cwd(), '.env.local');
const BASE = process.env.TELEGRAM_API_BASE ?? 'https://api.telegram.org';

const COMANDOS = [
  { command: 'hoy', description: 'Qué hay para hoy y qué está vencido' },
  { command: 'tareas', description: 'Todos los pendientes' },
  { command: 'dudas', description: 'Preguntas que quedaron abiertas' },
  { command: 'ayuda', description: 'Cómo hablarle al asistente' },
  { command: 'chatid', description: 'Muestra el id de este chat' },
];

// --- utilidades ------------------------------------------------------------

const c = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  aviso: (t) => `\x1b[33m${t}\x1b[0m`,
  error: (t) => `\x1b[31m${t}\x1b[0m`,
  suave: (t) => `\x1b[2m${t}\x1b[0m`,
  fuerte: (t) => `\x1b[1m${t}\x1b[0m`,
};

function leerEnv() {
  const valores = {};
  if (!existsSync(ARCHIVO_ENV)) return valores;

  for (const linea of readFileSync(ARCHIVO_ENV, 'utf8').split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const corte = limpia.indexOf('=');
    if (corte === -1) continue;
    valores[limpia.slice(0, corte).trim()] = limpia
      .slice(corte + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return valores;
}

function escribirEnv(valores) {
  const bloques = [
    ['Telegram', ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHATS_PERMITIDOS', 'TELEGRAM_MODO']],
    ['Asistente', ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'TZ_USUARIO']],
    ['Notificaciones del navegador', ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']],
    ['Almacenamiento', ['DATA_DIR']],
  ];

  const escritas = new Set();
  const lineas = ['# Generado por: npm run configurar', ''];

  for (const [titulo, claves] of bloques) {
    const presentes = claves.filter((clave) => valores[clave] !== undefined);
    if (presentes.length === 0) continue;
    lineas.push(`# --- ${titulo} ---`);
    for (const clave of presentes) {
      lineas.push(`${clave}=${valores[clave]}`);
      escritas.add(clave);
    }
    lineas.push('');
  }

  // Cualquier otra variable que ya existiera se conserva.
  const sobrantes = Object.keys(valores).filter((clave) => !escritas.has(clave));
  if (sobrantes.length > 0) {
    lineas.push('# --- Otras ---');
    for (const clave of sobrantes) lineas.push(`${clave}=${valores[clave]}`);
    lineas.push('');
  }

  writeFileSync(ARCHIVO_ENV, lineas.join('\n'), 'utf8');
}

async function api(token, metodo, cuerpo = {}) {
  const respuesta = await fetch(`${BASE}/bot${token}/${metodo}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json();
  if (!datos.ok) {
    const error = new Error(datos.description ?? `${metodo} falló`);
    error.codigo = datos.error_code;
    throw error;
  }
  return datos.result;
}

// --- pasos -----------------------------------------------------------------

async function pedirToken(pregunta, env) {
  if (env.TELEGRAM_BOT_TOKEN) {
    try {
      const bot = await api(env.TELEGRAM_BOT_TOKEN, 'getMe');
      console.log(`${c.ok('✓')} Token ya configurado: @${bot.username}`);
      const cambiar = await pregunta('  ¿Usar otro token? [s/N]: ');
      if (!/^s/i.test(cambiar.trim())) return { token: env.TELEGRAM_BOT_TOKEN, bot };
    } catch {
      console.log(`${c.aviso('!')} El token guardado ya no sirve. Vamos a poner uno nuevo.`);
    }
  }

  console.log('');
  console.log('  Si aún no tienes el token: abre Telegram, busca ' + c.fuerte('@BotFather') + ',');
  console.log('  mándale ' + c.fuerte('/newbot') + ' y sigue los pasos. Te devuelve algo como');
  console.log(c.suave('  8123456789:AAHk3f_LxQpR2vNm4tYw...'));
  console.log('');

  for (;;) {
    const token = (await pregunta('  Pega aquí el token del bot: ')).trim();
    if (!token) continue;

    try {
      const bot = await api(token, 'getMe');
      console.log(`${c.ok('✓')} Conectado con @${bot.username} (${bot.first_name}).`);
      return { token, bot };
    } catch (error) {
      console.log(`${c.error('✗')} Telegram rechazó ese token: ${error.message}`);
      console.log('  Revisa que lo hayas copiado completo, sin espacios.');
    }
  }
}

async function capturarChatId(token, bot, pregunta, env) {
  if (env.TELEGRAM_CHATS_PERMITIDOS) {
    console.log(`${c.ok('✓')} Chat autorizado ya configurado: ${env.TELEGRAM_CHATS_PERMITIDOS}`);
    const cambiar = await pregunta('  ¿Volver a detectarlo? [s/N]: ');
    if (!/^s/i.test(cambiar.trim())) return env.TELEGRAM_CHATS_PERMITIDOS;
  }

  // El sondeo no funciona si hay un webhook registrado.
  try {
    const webhook = await api(token, 'getWebhookInfo');
    if (webhook.url) {
      console.log(`${c.aviso('!')} Hay un webhook registrado (${webhook.url}); lo quito para poder escuchar.`);
      await api(token, 'deleteWebhook', { drop_pending_updates: false });
    }
  } catch {
    // Si falla, el sondeo de abajo dará un mensaje más claro.
  }

  console.log('');
  console.log('  Ahora abre Telegram, busca ' + c.fuerte(`@${bot.username}`) + ' y mándale');
  console.log('  cualquier mensaje (con un "hola" basta). Aquí espero.');
  console.log('');

  let offset;
  const limite = Date.now() + 5 * 60_000;

  while (Date.now() < limite) {
    let updates;
    try {
      updates = await api(token, 'getUpdates', { offset, timeout: 20 });
    } catch (error) {
      if (error.codigo === 409) {
        console.log(`${c.error('✗')} Otro proceso está usando el bot. Ciérralo y vuelve a correr esto.`);
        process.exit(1);
      }
      throw error;
    }

    for (const update of updates) {
      offset = update.update_id + 1;
      const mensaje = update.message ?? update.edited_message;
      if (!mensaje) continue;

      const quien = mensaje.from?.username ? `@${mensaje.from.username}` : mensaje.from?.first_name;
      console.log(`${c.ok('✓')} Te encontré: ${quien}, chat ${mensaje.chat.id}`);
      return String(mensaje.chat.id);
    }
  }

  console.log(`${c.error('✗')} Pasaron cinco minutos sin recibir nada. Vuelve a intentarlo.`);
  process.exit(1);
}

async function generarVapid(env) {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    console.log(`${c.ok('✓')} Claves de notificación ya generadas.`);
    return env;
  }

  const { default: webpush } = await import('web-push');
  const claves = webpush.generateVAPIDKeys();
  console.log(`${c.ok('✓')} Claves de notificación generadas.`);

  return {
    ...env,
    VAPID_PUBLIC_KEY: claves.publicKey,
    VAPID_PRIVATE_KEY: claves.privateKey,
    VAPID_SUBJECT: env.VAPID_SUBJECT ?? 'mailto:asistente@example.com',
  };
}

// --- flujo -----------------------------------------------------------------

const consola = readline.createInterface({ input: stdin, output: stdout });
const pregunta = (texto) => consola.question(texto);

try {
  console.log('');
  console.log(c.fuerte('  Configuración del asistente personal'));
  console.log(c.suave('  Esto deja listo .env.local. Puedes volver a correrlo cuando quieras.'));
  console.log('');

  let env = leerEnv();

  console.log(c.fuerte('1. El bot de Telegram'));
  const { token, bot } = await pedirToken(pregunta, env);
  env.TELEGRAM_BOT_TOKEN = token;
  escribirEnv(env);

  console.log('');
  console.log(c.fuerte('2. Autorizar tu chat'));
  console.log(c.suave('   Sin esto el bot no atiende a nadie: un bot de Telegram es público.'));
  env.TELEGRAM_CHATS_PERMITIDOS = await capturarChatId(token, bot, pregunta, env);
  escribirEnv(env);

  console.log('');
  console.log(c.fuerte('3. Zona horaria'));
  const zonaActual = env.TZ_USUARIO ?? 'America/Bogota';
  const zona = (await pregunta(`   Zona horaria [${zonaActual}]: `)).trim();
  env.TZ_USUARIO = zona || zonaActual;

  console.log('');
  console.log(c.fuerte('4. Clave de Anthropic') + c.suave('  (opcional)'));
  console.log(c.suave('   Sin ella el bot igual anota tareas y te lista pendientes,'));
  console.log(c.suave('   pero no conversa ni responde preguntas.'));
  const clave = (await pregunta('   Clave (Enter para saltar): ')).trim();
  if (clave) env.ANTHROPIC_API_KEY = clave;
  else if (env.ANTHROPIC_API_KEY === undefined) env.ANTHROPIC_API_KEY = '';

  console.log('');
  console.log(c.fuerte('5. Últimos detalles'));
  env = await generarVapid(env);

  try {
    await api(token, 'setMyCommands', { commands: COMANDOS });
    console.log(`${c.ok('✓')} Menú de comandos registrado en Telegram.`);
  } catch (error) {
    console.log(`${c.aviso('!')} No pude registrar el menú de comandos: ${error.message}`);
  }

  escribirEnv(env);

  console.log('');
  console.log(c.ok('  Listo. Ya quedó todo en .env.local.'));
  console.log('');
  console.log('  Para arrancar el asistente:');
  console.log(c.fuerte('    npm run build && npm run start'));
  console.log('');
  console.log(`  Después escríbele a ${c.fuerte('@' + bot.username)} desde Telegram:`);
  console.log(c.suave('    "Recuérdame llamar al proveedor mañana a las 9"'));
  console.log('');
  if (!env.ANTHROPIC_API_KEY) {
    console.log(c.suave('  Nota: sin ANTHROPIC_API_KEY el bot anota y lista, pero no conversa.'));
    console.log('');
  }
} catch (error) {
  console.error(`\n${c.error('✗')} ${error.message}`);
  process.exitCode = 1;
} finally {
  consola.close();
}
