import type { Estado, Mensaje, Prioridad, Repeticion, Tarea } from '@/lib/types';

export interface EstadoRemoto extends Estado {
  push: { clavePublica: string | null };
  modeloConfigurado: boolean;
}

async function pedir<T>(url: string, opciones?: RequestInit): Promise<T> {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { 'content-type': 'application/json', ...(opciones?.headers ?? {}) },
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error((datos as { error?: string }).error ?? 'No se pudo contactar al asistente.');
  }

  return datos as T;
}

export function obtenerEstado(): Promise<EstadoRemoto> {
  return pedir<EstadoRemoto>('/api/estado', { cache: 'no-store' });
}

export function enviarMensaje(texto: string, esDuda = false): Promise<Estado> {
  return pedir<Estado>('/api/asistente', {
    method: 'POST',
    body: JSON.stringify({ texto, esDuda }),
  });
}

export interface TareaNuevaEntrada {
  titulo: string;
  notas?: string | null;
  recordarEn?: string | null;
  repetir?: Repeticion;
  prioridad?: Prioridad;
  mensajeOrigenId?: string | null;
}

export function crearTarea(entrada: TareaNuevaEntrada): Promise<Estado & { tarea: Tarea }> {
  return pedir('/api/tareas', { method: 'POST', body: JSON.stringify(entrada) });
}

export function editarTarea(
  id: string,
  cambios: Partial<Pick<Tarea, 'titulo' | 'notas' | 'estado' | 'prioridad' | 'repetir'>> & {
    recordarEn?: string | null;
  },
): Promise<Estado & { tarea: Tarea }> {
  return pedir(`/api/tareas/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) });
}

export function borrarTarea(id: string): Promise<Estado> {
  return pedir(`/api/tareas/${id}`, { method: 'DELETE' });
}

export function editarMensaje(
  id: string,
  cambios: { esDuda?: boolean; resuelta?: boolean },
): Promise<Estado & { mensaje: Mensaje }> {
  return pedir(`/api/mensajes/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) });
}

export function suscribirPush(suscripcion: PushSubscriptionJSON): Promise<{ ok: boolean }> {
  return pedir('/api/push/suscribir', { method: 'POST', body: JSON.stringify(suscripcion) });
}
