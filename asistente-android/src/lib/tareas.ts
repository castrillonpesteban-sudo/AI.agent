import { formatearCuando, partesLocales, ZONA_HORARIA } from './fechas';
import type { GrupoTareas, Tarea } from './types';

const ORDEN_PRIORIDAD: Record<Tarea['prioridad'], number> = { alta: 0, media: 1, baja: 2 };

function mismoDiaLocal(a: Date, b: Date, zona: string): boolean {
  const pa = partesLocales(a, zona);
  const pb = partesLocales(b, zona);
  return pa.anio === pb.anio && pa.mes === pb.mes && pa.dia === pb.dia;
}

export function grupoDe(tarea: Tarea, ahora: Date = new Date(), zona: string = ZONA_HORARIA): GrupoTareas {
  if (tarea.estado === 'hecha') return 'hechas';

  const referencia = tarea.vence ?? tarea.recordarEn;
  if (!referencia) return 'sinFecha';

  const cuando = new Date(referencia);
  if (cuando.getTime() < ahora.getTime() && !mismoDiaLocal(cuando, ahora, zona)) {
    return 'vencidas';
  }
  if (mismoDiaLocal(cuando, ahora, zona)) {
    return cuando.getTime() < ahora.getTime() ? 'vencidas' : 'hoy';
  }
  return 'proximas';
}

export function ordenar(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    const fa = a.vence ?? a.recordarEn;
    const fb = b.vence ?? b.recordarEn;
    if (fa && fb && fa !== fb) return fa < fb ? -1 : 1;
    if (fa && !fb) return -1;
    if (!fa && fb) return 1;
    const prioridad = ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad];
    if (prioridad !== 0) return prioridad;
    return a.creadaEn < b.creadaEn ? -1 : 1;
  });
}

export function agrupar(
  tareas: Tarea[],
  ahora: Date = new Date(),
  zona: string = ZONA_HORARIA,
): Record<GrupoTareas, Tarea[]> {
  const grupos: Record<GrupoTareas, Tarea[]> = {
    vencidas: [],
    hoy: [],
    proximas: [],
    sinFecha: [],
    hechas: [],
  };

  for (const tarea of ordenar(tareas)) {
    grupos[grupoDe(tarea, ahora, zona)].push(tarea);
  }

  // Las hechas, de la más reciente a la más vieja.
  grupos.hechas.reverse();
  return grupos;
}

export const ETIQUETA_GRUPO: Record<GrupoTareas, string> = {
  vencidas: 'Vencidas',
  hoy: 'Hoy',
  proximas: 'Próximas',
  sinFecha: 'Sin fecha',
  hechas: 'Hechas',
};

/** Resumen en una línea para el hilo de mensajes. */
export function describir(tarea: Tarea, ahora: Date = new Date()): string {
  const partes = [tarea.titulo];
  const cuando = tarea.recordarEn ?? tarea.vence;
  if (cuando) partes.push(`— ${formatearCuando(cuando, ahora)}`);
  if (tarea.repetir) {
    const etiquetas = { diaria: 'cada día', semanal: 'cada semana', mensual: 'cada mes' };
    partes.push(`(${etiquetas[tarea.repetir]})`);
  }
  return partes.join(' ');
}

/** Tareas que ya deberían haber sonado y todavía no se avisaron. */
export function recordatoriosPendientes(tareas: Tarea[], ahora: Date = new Date()): Tarea[] {
  return tareas.filter((tarea) => {
    if (tarea.estado !== 'pendiente' || !tarea.recordarEn) return false;
    if (new Date(tarea.recordarEn).getTime() > ahora.getTime()) return false;
    // Ya se avisó de este mismo vencimiento.
    return !tarea.avisadaEn || tarea.avisadaEn < tarea.recordarEn;
  });
}
