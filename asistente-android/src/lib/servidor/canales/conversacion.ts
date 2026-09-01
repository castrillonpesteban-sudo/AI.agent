import { formatearCuando } from '@/lib/fechas';
import { agrupar, describir, ordenar } from '@/lib/tareas';
import type { Tarea } from '@/lib/types';
import { leer, mensajeNuevo, mutar } from '../almacen';
import { responder } from '../asistente';
import {
  chatAutorizado,
  enviarAccion,
  enviarMensaje,
  responderCallback,
  type BotonTelegram,
  type UpdateTelegram,
} from './telegram';

/** Cuántos update_id recientes se recuerdan para descartar reenvíos. */
const MEMORIA_UPDATES = 200;

const AYUDA = [
  'Escríbeme como a cualquiera por chat. Lo que suene a pendiente lo anoto y te aviso a la hora.',
  '',
  'Por ejemplo:',
  '• Recuérdame llamar a Técnica Electromédica mañana a las 9',
  '• Cada lunes revisar el backlog de órdenes',
  '• Cotizar el repuesto del ventilador el viernes',
  '• ¿Qué tengo pendiente?',
  '',
  'Comandos:',
  '/hoy — lo de hoy y lo vencido',
  '/tareas — todos los pendientes',
  '/dudas — preguntas que quedaron abiertas',
  '/chatid — el id de este chat',
].join('\n');

/** Botones que acompañan a un recordatorio o a una tarea recién creada. */
export function botonesDeTarea(tarea: Tarea): BotonTelegram[][] {
  return [
    [
      { texto: '✅ Hecha', accion: `hecha:${tarea.id}` },
      { texto: '⏰ +1 h', accion: `mas:${tarea.id}:1` },
      { texto: '📅 Mañana', accion: `mas:${tarea.id}:24` },
    ],
  ];
}

function listar(tareas: Tarea[], vacio: string): string {
  if (tareas.length === 0) return vacio;
  return tareas.map((tarea) => `• ${describir(tarea)}`).join('\n');
}

async function textoDeComando(comando: string): Promise<string | null> {
  const { mensajes, tareas } = await leer();

  switch (comando) {
    case '/start':
      return `Listo, ya estoy aquí.\n\n${AYUDA}`;

    case '/ayuda':
    case '/help':
      return AYUDA;

    case '/hoy': {
      const grupos = agrupar(tareas);
      const bloques: string[] = [];
      if (grupos.vencidas.length > 0) {
        bloques.push(`⚠️ Vencidas (${grupos.vencidas.length})\n${listar(grupos.vencidas, '')}`);
      }
      bloques.push(`📌 Hoy\n${listar(grupos.hoy, 'Nada agendado para hoy.')}`);
      return bloques.join('\n\n');
    }

    case '/tareas': {
      const pendientes = ordenar(tareas.filter((tarea) => tarea.estado === 'pendiente'));
      return `Pendientes (${pendientes.length})\n${listar(pendientes, 'No tienes nada pendiente.')}`;
    }

    case '/dudas': {
      const abiertas = mensajes.filter((mensaje) => mensaje.esDuda && !mensaje.dudaResueltaEn);
      if (abiertas.length === 0) return 'No tienes dudas abiertas.';
      const lineas = abiertas.slice(-15).map((duda) => `• ${duda.texto}`);
      return `Dudas abiertas (${abiertas.length})\n${lineas.join('\n')}`;
    }

    default:
      return null;
  }
}

/**
 * Marca un update como visto. Devuelve false si ya se había procesado, para que
 * un reenvío del webhook no duplique la respuesta.
 */
async function reclamarUpdate(updateId: number): Promise<boolean> {
  return mutar((datos) => {
    if (datos.telegram.updatesVistos.includes(updateId)) return false;
    datos.telegram.updatesVistos.push(updateId);
    if (datos.telegram.updatesVistos.length > MEMORIA_UPDATES) {
      datos.telegram.updatesVistos = datos.telegram.updatesVistos.slice(-MEMORIA_UPDATES);
    }
    if (updateId > (datos.telegram.ultimoUpdateId ?? -1)) {
      datos.telegram.ultimoUpdateId = updateId;
    }
    return true;
  });
}

/** Deja registrado el chat para poder mandarle los recordatorios. */
async function recordarChat(chatId: number): Promise<void> {
  await mutar((datos) => {
    if (!datos.telegram.chats.includes(chatId)) {
      datos.telegram.chats.push(chatId);
    }
  });
}

async function atenderCallback(update: UpdateTelegram): Promise<void> {
  const callback = update.callback_query;
  if (!callback?.data) return;

  const chatId = callback.message?.chat.id;
  if (chatId === undefined || !chatAutorizado(chatId)) {
    await responderCallback(callback.id, 'Chat no autorizado.');
    return;
  }

  const [accion, tareaId, argumento] = callback.data.split(':');

  if (accion === 'hecha') {
    const tarea = await mutar((datos) => {
      const encontrada = datos.tareas.find((candidata) => candidata.id === tareaId);
      if (!encontrada) return null;
      encontrada.estado = 'hecha';
      encontrada.completadaEn = new Date().toISOString();
      return encontrada;
    });

    await responderCallback(callback.id, tarea ? '✅ Hecha' : 'Esa tarea ya no existe.');
    if (tarea) {
      await registrarSalida(chatId, `✅ Hecha: ${tarea.titulo}`);
    }
    return;
  }

  if (accion === 'mas') {
    const horas = Number(argumento);
    const tarea = await mutar((datos) => {
      const encontrada = datos.tareas.find((candidata) => candidata.id === tareaId);
      if (!encontrada || !Number.isFinite(horas)) return null;
      const nueva = new Date(Date.now() + horas * 3600_000).toISOString();
      encontrada.recordarEn = nueva;
      encontrada.vence = nueva;
      encontrada.avisadaEn = null;
      encontrada.estado = 'pendiente';
      return encontrada;
    });

    await responderCallback(callback.id, tarea ? 'Aplazada' : 'Esa tarea ya no existe.');
    if (tarea?.recordarEn) {
      await registrarSalida(
        chatId,
        `⏰ ${tarea.titulo} — te aviso ${formatearCuando(tarea.recordarEn)}`,
      );
    }
    return;
  }

  await responderCallback(callback.id);
}

/** Envía un mensaje del asistente y lo deja también en el hilo compartido. */
async function registrarSalida(
  chatId: number,
  texto: string,
  botones?: BotonTelegram[][],
): Promise<void> {
  await mutar((datos) => {
    datos.mensajes.push(mensajeNuevo({ rol: 'assistant', texto, canal: 'telegram' }));
  });
  await enviarMensaje(chatId, texto, botones);
}

/**
 * Procesa un update de Telegram de punta a punta. La usan tanto el webhook como
 * el proceso de sondeo largo, así que el comportamiento es idéntico en ambos.
 */
export async function procesarUpdate(update: UpdateTelegram): Promise<void> {
  if (!(await reclamarUpdate(update.update_id))) return;

  if (update.callback_query) {
    await atenderCallback(update);
    return;
  }

  const mensaje = update.message ?? update.edited_message;
  const chatId = mensaje?.chat.id;
  if (!mensaje || chatId === undefined) return;

  const texto = (mensaje.text ?? mensaje.caption ?? '').trim();
  if (!texto) return;

  if (!chatAutorizado(chatId)) {
    // Se responde el id para que el dueño pueda añadirlo a la lista, pero no se
    // atiende nada más.
    await enviarMensaje(
      chatId,
      `Este chat no está autorizado.\n\nSi el asistente es tuyo, agrega ${chatId} a TELEGRAM_CHATS_PERMITIDOS y reinicia el bot.`,
    );
    return;
  }

  await recordarChat(chatId);

  const comando = texto.split(/\s+/)[0].toLowerCase().replace(/@.*$/, '');

  if (comando === '/chatid') {
    await enviarMensaje(chatId, `El id de este chat es ${chatId}.`);
    return;
  }

  const respuestaComando = await textoDeComando(comando);
  if (respuestaComando !== null) {
    await enviarMensaje(chatId, respuestaComando);
    return;
  }

  const mensajeUsuario = await mutar((datos) => {
    const nuevo = mensajeNuevo({ rol: 'user', texto, canal: 'telegram' });
    datos.mensajes.push(nuevo);
    return nuevo;
  });

  await enviarAccion(chatId);

  try {
    const { mensajes } = await leer();
    const resultado = await responder(mensajes, mensajeUsuario.id);

    await mutar((datos) => {
      datos.mensajes.push(
        mensajeNuevo({ rol: 'assistant', texto: resultado.respuesta, canal: 'telegram' }),
      );
      const origen = datos.mensajes.find((candidato) => candidato.id === mensajeUsuario.id);
      if (origen) {
        origen.tareasAdjuntas = [
          ...new Set([...origen.tareasAdjuntas, ...resultado.tareasTocadas]),
        ];
        if (resultado.esDuda) origen.esDuda = true;
      }
    });

    // Si el turno tocó una sola tarea, se ofrecen sus botones directamente.
    const { tareas } = await leer();
    const tocadas = tareas.filter((tarea) => resultado.tareasTocadas.includes(tarea.id));
    const botones =
      tocadas.length === 1 && tocadas[0].estado === 'pendiente'
        ? botonesDeTarea(tocadas[0])
        : undefined;

    await enviarMensaje(chatId, resultado.respuesta, botones);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'Error desconocido.';
    await enviarMensaje(chatId, `Se me atravesó un error: ${detalle}`);
  }
}
