/**
 * Cliente mínimo de la API de bots de Telegram. Solo cubre lo que usa el
 * asistente: recibir mensajes, responder, y ofrecer botones bajo los avisos.
 */

const API_BASE = process.env.TELEGRAM_API_BASE ?? 'https://api.telegram.org';

export function tokenBot(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export function telegramConfigurado(): boolean {
  return tokenBot() !== null;
}

/**
 * Chats autorizados a hablar con el bot. Un bot de Telegram es público: sin
 * esta lista, cualquiera que dé con él leería tus tareas.
 */
export function chatsPermitidos(): number[] {
  return (process.env.TELEGRAM_CHATS_PERMITIDOS ?? '')
    .split(',')
    .map((parte) => Number(parte.trim()))
    .filter((numero) => Number.isFinite(numero) && numero !== 0);
}

export function chatAutorizado(chatId: number): boolean {
  const permitidos = chatsPermitidos();
  // Sin lista configurada no se atiende a nadie: es más seguro que abrirlo.
  return permitidos.includes(chatId);
}

export interface BotonTelegram {
  texto: string;
  /** Dato que vuelve en el callback_query al pulsarlo. Máximo 64 bytes. */
  accion: string;
}

export interface UsuarioTelegram {
  id: number;
  first_name?: string;
  username?: string;
}

export interface MensajeTelegram {
  message_id: number;
  from?: UsuarioTelegram;
  chat: { id: number; type: string };
  date: number;
  text?: string;
  caption?: string;
}

export interface CallbackTelegram {
  id: string;
  from: UsuarioTelegram;
  message?: MensajeTelegram;
  data?: string;
}

export interface UpdateTelegram {
  update_id: number;
  message?: MensajeTelegram;
  edited_message?: MensajeTelegram;
  callback_query?: CallbackTelegram;
}

interface RespuestaApi<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

async function llamar<T>(metodo: string, cuerpo: unknown, timeoutMs = 15_000): Promise<T> {
  const token = tokenBot();
  if (!token) {
    throw new Error('Falta TELEGRAM_BOT_TOKEN.');
  }

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), timeoutMs);

  try {
    const respuesta = await fetch(`${API_BASE}/bot${token}/${metodo}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: control.signal,
      // Next.js memoiza fetch dentro del contexto de una petición. El sondeo
      // repite la misma llamada una y otra vez, así que sin esto recibiría
      // siempre la primera respuesta cacheada, sin tocar la red.
      cache: 'no-store',
    });

    const datos = (await respuesta.json()) as RespuestaApi<T>;

    if (!datos.ok) {
      throw new Error(`Telegram ${metodo} falló (${datos.error_code}): ${datos.description}`);
    }

    return datos.result as T;
  } finally {
    clearTimeout(temporizador);
  }
}

/** Telegram corta los mensajes en 4096 caracteres; se parten por líneas. */
export function partir(texto: string, limite = 3800): string[] {
  if (texto.length <= limite) return [texto];

  const partes: string[] = [];
  let actual = '';

  for (const linea of texto.split('\n')) {
    if (actual.length + linea.length + 1 > limite) {
      if (actual) partes.push(actual);
      actual = linea.slice(0, limite);
    } else {
      actual = actual ? `${actual}\n${linea}` : linea;
    }
  }

  if (actual) partes.push(actual);
  return partes;
}

export async function enviarMensaje(
  chatId: number,
  texto: string,
  botones?: BotonTelegram[][],
): Promise<void> {
  const partes = partir(texto);

  for (const [indice, parte] of partes.entries()) {
    const esUltima = indice === partes.length - 1;
    await llamar('sendMessage', {
      chat_id: chatId,
      text: parte,
      // Sin parse_mode: el texto del asistente es libre y un asterisco suelto
      // haría fallar el envío entero.
      reply_markup:
        esUltima && botones?.length
          ? {
              inline_keyboard: botones.map((fila) =>
                fila.map((boton) => ({ text: boton.texto, callback_data: boton.accion })),
              ),
            }
          : undefined,
    });
  }
}

export async function responderCallback(callbackId: string, texto?: string): Promise<void> {
  await llamar('answerCallbackQuery', { callback_query_id: callbackId, text: texto });
}

export async function enviarAccion(chatId: number, accion = 'typing'): Promise<void> {
  await llamar('sendChatAction', { chat_id: chatId, action: accion }).catch(() => undefined);
}

export async function obtenerUpdates(offset: number | null, timeoutSegundos = 25): Promise<UpdateTelegram[]> {
  return llamar<UpdateTelegram[]>(
    'getUpdates',
    {
      offset: offset ?? undefined,
      timeout: timeoutSegundos,
      allowed_updates: ['message', 'callback_query'],
    },
    (timeoutSegundos + 10) * 1000,
  );
}

export async function registrarWebhook(url: string, secreto?: string): Promise<void> {
  await llamar('setWebhook', {
    url,
    secret_token: secreto || undefined,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
}

export async function borrarWebhook(): Promise<void> {
  await llamar('deleteWebhook', { drop_pending_updates: false });
}

export async function infoWebhook(): Promise<Record<string, unknown>> {
  return llamar<Record<string, unknown>>('getWebhookInfo', {});
}

export async function infoBot(): Promise<UsuarioTelegram & { username?: string }> {
  return llamar('getMe', {});
}

/** Registra los comandos que Telegram ofrece en el menú del chat. */
export async function registrarComandos(): Promise<void> {
  await llamar('setMyCommands', {
    commands: [
      { command: 'hoy', description: 'Qué hay para hoy y qué está vencido' },
      { command: 'tareas', description: 'Todos los pendientes' },
      { command: 'dudas', description: 'Preguntas que quedaron abiertas' },
      { command: 'ayuda', description: 'Cómo hablarle al asistente' },
      { command: 'chatid', description: 'Muestra el id de este chat' },
    ],
  });
}
