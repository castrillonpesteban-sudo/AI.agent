import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Estado, Mensaje, Tarea } from '@/lib/types';

export interface SuscripcionPush {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  creadaEn: string;
}

export interface BaseDatos extends Estado {
  suscripciones: SuscripcionPush[];
}

const DIRECTORIO = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const ARCHIVO = path.join(DIRECTORIO, 'db.json');

const VACIA: BaseDatos = { mensajes: [], tareas: [], suscripciones: [] };

let cache: BaseDatos | null = null;
/** Cola de escrituras: evita que dos peticiones simultáneas se pisen el archivo. */
let cola: Promise<unknown> = Promise.resolve();

async function cargar(): Promise<BaseDatos> {
  if (cache) return cache;

  try {
    const contenido = await fs.readFile(ARCHIVO, 'utf8');
    const datos = JSON.parse(contenido) as Partial<BaseDatos>;
    cache = {
      mensajes: datos.mensajes ?? [],
      tareas: datos.tareas ?? [],
      suscripciones: datos.suscripciones ?? [],
    };
  } catch {
    cache = { ...VACIA };
  }

  return cache;
}

async function guardar(datos: BaseDatos): Promise<void> {
  await fs.mkdir(DIRECTORIO, { recursive: true });
  const temporal = `${ARCHIVO}.${process.pid}.tmp`;
  await fs.writeFile(temporal, JSON.stringify(datos, null, 2), 'utf8');
  await fs.rename(temporal, ARCHIVO);
}

/** Lee el estado completo sin bloquear escrituras. */
export async function leer(): Promise<BaseDatos> {
  const datos = await cargar();
  return {
    mensajes: [...datos.mensajes],
    tareas: [...datos.tareas],
    suscripciones: [...datos.suscripciones],
  };
}

/**
 * Aplica una mutación sobre la base y la persiste. Las mutaciones se ejecutan
 * en serie, así que dentro del callback el estado es consistente.
 */
export async function mutar<T>(cambio: (datos: BaseDatos) => T | Promise<T>): Promise<T> {
  const siguiente = cola.then(async () => {
    const datos = await cargar();
    const resultado = await cambio(datos);
    await guardar(datos);
    return resultado;
  });

  cola = siguiente.catch(() => undefined);
  return siguiente;
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function mensajeNuevo(campos: Partial<Mensaje> & Pick<Mensaje, 'rol' | 'texto'>): Mensaje {
  return {
    id: campos.id ?? nuevoId('msg'),
    rol: campos.rol,
    texto: campos.texto,
    creadoEn: campos.creadoEn ?? new Date().toISOString(),
    esDuda: campos.esDuda ?? false,
    dudaResueltaEn: campos.dudaResueltaEn ?? null,
    tareasAdjuntas: campos.tareasAdjuntas ?? [],
    esRecordatorio: campos.esRecordatorio ?? false,
  };
}

export function tareaNueva(campos: Partial<Tarea> & Pick<Tarea, 'titulo'>): Tarea {
  return {
    id: campos.id ?? nuevoId('tar'),
    titulo: campos.titulo,
    notas: campos.notas ?? null,
    vence: campos.vence ?? null,
    recordarEn: campos.recordarEn ?? campos.vence ?? null,
    repetir: campos.repetir ?? null,
    prioridad: campos.prioridad ?? 'media',
    estado: campos.estado ?? 'pendiente',
    creadaEn: campos.creadaEn ?? new Date().toISOString(),
    completadaEn: campos.completadaEn ?? null,
    mensajeOrigenId: campos.mensajeOrigenId ?? null,
    avisadaEn: campos.avisadaEn ?? null,
  };
}

/** Solo para pruebas: descarta la caché en memoria. */
export function _reiniciarCache(): void {
  cache = null;
}
