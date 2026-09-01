import { formatearCuando, interpretarFecha, normalizar, ZONA_HORARIA } from '@/lib/fechas';
import { agrupar, describir, ordenar } from '@/lib/tareas';
import type { Mensaje, Prioridad, Repeticion, Tarea } from '@/lib/types';
import { leer, mutar, tareaNueva } from './almacen';

const MODELO = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5';
const MAX_VUELTAS = 5;
const MENSAJES_DE_CONTEXTO = 24;

export interface ResultadoTurno {
  respuesta: string;
  /** Tareas creadas o modificadas durante el turno. */
  tareasTocadas: string[];
  /** true si el asistente marcó el mensaje del usuario como duda pendiente. */
  esDuda: boolean;
}

const HERRAMIENTAS = [
  {
    name: 'crear_tarea',
    description:
      'Crea una tarea para el usuario. Úsala cuando el usuario pida recordar algo, mencione ' +
      'un pendiente, o diga que hay que hacer algo. Si el usuario da una fecha u hora, ' +
      'conviértela a ISO 8601 con offset, usando la fecha actual que aparece en el sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        titulo: { type: 'string', description: 'Qué hay que hacer, en imperativo y sin fecha.' },
        notas: { type: 'string', description: 'Detalle adicional. Opcional.' },
        recordar_en: {
          type: 'string',
          description: 'Momento del aviso en ISO 8601 (por ejemplo 2026-09-02T15:00:00-05:00). Opcional.',
        },
        repetir: {
          type: 'string',
          enum: ['diaria', 'semanal', 'mensual'],
          description: 'Solo si el usuario pide que se repita.',
        },
        prioridad: { type: 'string', enum: ['baja', 'media', 'alta'] },
      },
      required: ['titulo'],
    },
  },
  {
    name: 'listar_tareas',
    description:
      'Devuelve las tareas del usuario. Úsala antes de responder cualquier pregunta sobre ' +
      'pendientes, agenda, qué hay hoy, qué está vencido o qué falta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        filtro: {
          type: 'string',
          enum: ['pendientes', 'hoy', 'vencidas', 'proximas', 'hechas', 'todas'],
          description: 'Por defecto, pendientes.',
        },
      },
    },
  },
  {
    name: 'completar_tarea',
    description: 'Marca una tarea como hecha. Necesita el id exacto, que sale de listar_tareas.',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'aplazar_tarea',
    description: 'Cambia la fecha de aviso de una tarea existente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' },
        recordar_en: { type: 'string', description: 'Nuevo momento del aviso en ISO 8601.' },
      },
      required: ['id', 'recordar_en'],
    },
  },
  {
    name: 'marcar_duda',
    description:
      'Marca el último mensaje del usuario como duda pendiente cuando hace una pregunta que ' +
      'queda sin resolver del todo, o cuando pide dejarla anotada para volver después.',
    input_schema: {
      type: 'object' as const,
      properties: {
        motivo: { type: 'string', description: 'Por qué queda abierta.' },
      },
    },
  },
];

function instruccionSistema(ahora: Date): string {
  const fecha = new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA_HORARIA,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(ahora);

  return [
    'Eres el asistente personal de Esteban, ingeniero biomédico en Colombia. Vives dentro de',
    'una app de mensajes: respondes corto, en español, con el tono de un colega que escribe por',
    'chat. Nada de listas largas ni encabezados salvo que te los pidan.',
    '',
    `Fecha y hora actuales: ${fecha} (zona ${ZONA_HORARIA}).`,
    '',
    'Reglas:',
    '- Si el usuario menciona algo que hay que hacer, crea la tarea sin preguntar y confírmalo en',
    '  una línea. Es preferible una tarea de más que un pendiente perdido.',
    '- Nunca inventes el estado de las tareas: llama a listar_tareas antes de responder sobre ellas.',
    '- Si el usuario da una hora sin día, entiende que es hoy, o mañana si esa hora ya pasó.',
    '- Si no hay hora, usa las 8:00 de la mañana.',
    '- Cuando el usuario pregunte algo que no puedas resolver con lo que tienes, marca la duda',
    '  con marcar_duda y dile qué necesitas para cerrarla.',
  ].join('\n');
}

interface BloqueTexto {
  type: 'text';
  text: string;
}

interface BloqueHerramienta {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type BloqueRespuesta = BloqueTexto | BloqueHerramienta;

interface MensajeApi {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

function historialParaApi(mensajes: Mensaje[]): MensajeApi[] {
  return mensajes
    .filter((mensaje) => !mensaje.esRecordatorio)
    .slice(-MENSAJES_DE_CONTEXTO)
    .map((mensaje) => ({ role: mensaje.rol, content: mensaje.texto }));
}

async function llamarApi(
  apiKey: string,
  mensajes: MensajeApi[],
  sistema: string,
): Promise<{ content: BloqueRespuesta[]; stop_reason: string }> {
  const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 1024,
      system: sistema,
      tools: HERRAMIENTAS,
      messages: mensajes,
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`La API de Anthropic respondió ${respuesta.status}: ${await respuesta.text()}`);
  }

  return respuesta.json();
}

function filtrarTareas(tareas: Tarea[], filtro: string, ahora: Date): Tarea[] {
  const grupos = agrupar(tareas, ahora);
  switch (filtro) {
    case 'hoy':
      return grupos.hoy;
    case 'vencidas':
      return grupos.vencidas;
    case 'proximas':
      return grupos.proximas;
    case 'hechas':
      return grupos.hechas;
    case 'todas':
      return ordenar(tareas);
    default:
      return ordenar(tareas.filter((tarea) => tarea.estado === 'pendiente'));
  }
}

function comoResumen(tarea: Tarea, ahora: Date) {
  return {
    id: tarea.id,
    titulo: tarea.titulo,
    estado: tarea.estado,
    prioridad: tarea.prioridad,
    recordar_en: tarea.recordarEn,
    cuando: tarea.recordarEn ? formatearCuando(tarea.recordarEn, ahora) : null,
    repetir: tarea.repetir,
    notas: tarea.notas,
  };
}

/**
 * Resuelve un turno de conversación. Persiste las tareas que el modelo cree o
 * modifique y devuelve el texto de respuesta.
 */
export async function responder(
  historial: Mensaje[],
  mensajeOrigenId: string,
  ahora: Date = new Date(),
): Promise<ResultadoTurno> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ultimo = historial[historial.length - 1];

  if (!apiKey) {
    return respaldoLocal(ultimo?.texto ?? '', mensajeOrigenId, ahora);
  }

  const conversacion: MensajeApi[] = historialParaApi(historial);
  const tareasTocadas: string[] = [];
  let esDuda = false;

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta += 1) {
    const respuesta = await llamarApi(apiKey, conversacion, instruccionSistema(ahora));
    const bloques = respuesta.content ?? [];
    const usos = bloques.filter((bloque): bloque is BloqueHerramienta => bloque.type === 'tool_use');

    if (usos.length === 0) {
      const texto = bloques
        .filter((bloque): bloque is BloqueTexto => bloque.type === 'text')
        .map((bloque) => bloque.text)
        .join('\n')
        .trim();
      return { respuesta: texto || 'Listo.', tareasTocadas, esDuda };
    }

    conversacion.push({ role: 'assistant', content: bloques });
    const resultados: unknown[] = [];

    for (const uso of usos) {
      const salida = await ejecutarHerramienta(uso, mensajeOrigenId, ahora);
      if (salida.tareaId) tareasTocadas.push(salida.tareaId);
      if (salida.esDuda) esDuda = true;
      resultados.push({
        type: 'tool_result',
        tool_use_id: uso.id,
        content: JSON.stringify(salida.contenido),
      });
    }

    conversacion.push({ role: 'user', content: resultados });
  }

  return {
    respuesta: 'Me enredé resolviendo eso. ¿Me lo dices de otra forma?',
    tareasTocadas,
    esDuda,
  };
}

interface SalidaHerramienta {
  contenido: unknown;
  tareaId?: string;
  esDuda?: boolean;
}

async function ejecutarHerramienta(
  uso: BloqueHerramienta,
  mensajeOrigenId: string,
  ahora: Date,
): Promise<SalidaHerramienta> {
  const entrada = uso.input ?? {};

  switch (uso.name) {
    case 'crear_tarea': {
      const tarea = await mutar((datos) => {
        const nueva = tareaNueva({
          titulo: String(entrada.titulo ?? '').trim() || 'Pendiente sin título',
          notas: entrada.notas ? String(entrada.notas) : null,
          recordarEn: normalizarIso(entrada.recordar_en),
          vence: normalizarIso(entrada.recordar_en),
          repetir: (entrada.repetir as Repeticion) ?? null,
          prioridad: (entrada.prioridad as Prioridad) ?? 'media',
          mensajeOrigenId,
        });
        datos.tareas.push(nueva);
        return nueva;
      });
      return { contenido: comoResumen(tarea, ahora), tareaId: tarea.id };
    }

    case 'listar_tareas': {
      const filtro = String(entrada.filtro ?? 'pendientes');
      const { tareas: todas } = await leer();
      const tareas = filtrarTareas(todas, filtro, ahora);
      return { contenido: { filtro, tareas: tareas.map((tarea) => comoResumen(tarea, ahora)) } };
    }

    case 'completar_tarea': {
      const id = String(entrada.id ?? '');
      const tarea = await mutar((datos) => {
        const encontrada = datos.tareas.find((candidata) => candidata.id === id);
        if (!encontrada) return null;
        encontrada.estado = 'hecha';
        encontrada.completadaEn = ahora.toISOString();
        return encontrada;
      });
      if (!tarea) return { contenido: { error: 'No existe una tarea con ese id.' } };
      return { contenido: comoResumen(tarea, ahora), tareaId: tarea.id };
    }

    case 'aplazar_tarea': {
      const id = String(entrada.id ?? '');
      const cuando = normalizarIso(entrada.recordar_en);
      const tarea = await mutar((datos) => {
        const encontrada = datos.tareas.find((candidata) => candidata.id === id);
        if (!encontrada) return null;
        encontrada.recordarEn = cuando;
        encontrada.vence = cuando;
        encontrada.avisadaEn = null;
        return encontrada;
      });
      if (!tarea) return { contenido: { error: 'No existe una tarea con ese id.' } };
      return { contenido: comoResumen(tarea, ahora), tareaId: tarea.id };
    }

    case 'marcar_duda':
      return { contenido: { ok: true }, esDuda: true };

    default:
      return { contenido: { error: `Herramienta desconocida: ${uso.name}` } };
  }
}

function normalizarIso(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const instante = new Date(valor);
  return Number.isNaN(instante.getTime()) ? null : instante.toISOString();
}

const VERBOS_DE_TAREA =
  /\b(recuerdame|recordarme|recuerda|acuerdame|anota|apunta|agenda|agendar|programa|programar|hay que|tengo que|toca|no se me olvide|no se me puede olvidar)\b/;

const PREGUNTAS_DE_AGENDA =
  /\b(que tengo|que hay|que sigue|que me falta|pendientes?|vencid|para hoy|mi dia|mi semana|mi agenda)\b/;

const INICIOS_DE_PREGUNTA = /^(que|como|cuando|donde|por que|cual|cuales|quien|cuanto|cuanta)\b/;

/** true si el texto se lee como pregunta, con o sin signos de apertura. */
function parecePregunta(texto: string, plano: string): boolean {
  const sinAperturas = plano.replace(/^[¿¡\s]+/, '');
  return texto.trim().endsWith('?') || INICIOS_DE_PREGUNTA.test(sinAperturas);
}

/**
 * Respuesta sin modelo: interpreta la fecha con el parser local y crea la tarea.
 * Deja la app utilizable aunque no haya ANTHROPIC_API_KEY configurada.
 */
export async function respaldoLocal(
  texto: string,
  mensajeOrigenId: string,
  ahora: Date = new Date(),
): Promise<ResultadoTurno> {
  const plano = normalizar(texto);
  const esPregunta = parecePregunta(texto, plano);

  // Una pregunta sobre la agenda se responde; nunca se convierte en tarea.
  if (PREGUNTAS_DE_AGENDA.test(plano) && (esPregunta || !VERBOS_DE_TAREA.test(plano))) {
    const { tareas: todas } = await leer();
    const tareas = ordenar(todas.filter((tarea) => tarea.estado === 'pendiente'));
    if (tareas.length === 0) {
      return { respuesta: 'No tienes nada pendiente por ahora.', tareasTocadas: [], esDuda: false };
    }
    const lineas = tareas.slice(0, 10).map((tarea) => `• ${describir(tarea, ahora)}`);
    return {
      respuesta: `Tienes ${tareas.length} pendiente${tareas.length === 1 ? '' : 's'}:\n${lineas.join('\n')}`,
      tareasTocadas: [],
      esDuda: false,
    };
  }

  const fecha = interpretarFecha(texto, ahora);
  const pideTarea = VERBOS_DE_TAREA.test(plano) || (fecha !== null && !esPregunta);

  if (pideTarea) {
    const titulo = limpiarTitulo(fecha?.resto ?? texto);
    const tarea = await mutar((datos) => {
      const nueva = tareaNueva({
        titulo: titulo || texto.trim(),
        recordarEn: fecha?.cuando ?? null,
        vence: fecha?.cuando ?? null,
        repetir: fecha?.repetir ?? null,
        mensajeOrigenId,
      });
      datos.tareas.push(nueva);
      return nueva;
    });

    const confirmacion = tarea.recordarEn
      ? `Anotado: ${tarea.titulo}. Te aviso ${formatearCuando(tarea.recordarEn, ahora)}.`
      : `Anotado: ${tarea.titulo}. Sin fecha; dime cuándo y le pongo aviso.`;
    return { respuesta: confirmacion, tareasTocadas: [tarea.id], esDuda: false };
  }

  if (esPregunta) {
    return {
      respuesta:
        'Sin la clave de Anthropic configurada (ANTHROPIC_API_KEY) no puedo razonar la respuesta, ' +
        'así que dejo la pregunta guardada en Dudas para responderla cuando la conectes.',
      tareasTocadas: [],
      esDuda: true,
    };
  }

  return {
    respuesta:
      'Guardado en el hilo. Sin ANTHROPIC_API_KEY solo sé crear tareas y listarte pendientes; ' +
      'para conversar de verdad configura la clave.',
    tareasTocadas: [],
    esDuda: false,
  };
}

function limpiarTitulo(texto: string): string {
  const limpio = texto
    .replace(
      /^\s*(recu[eé]rdame|recordarme|recuerda|acu[eé]rdame|an[oó]tame|anota|ap[uú]ntame|apunta|agenda(?:r)?|programa(?:r)?)\s+(que\s+)?(de\s+)?/i,
      '',
    )
    .replace(/^\s*(hay que|tengo que|toca)\s+/i, '')
    .replace(/^[\s,;:.-]+/, '')
    .trim();
  if (!limpio) return '';
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
