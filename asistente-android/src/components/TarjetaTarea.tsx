'use client';

import { formatearCuando } from '@/lib/fechas';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';
import type { Tarea } from '@/lib/types';

const COLOR_PRIORIDAD: Record<Tarea['prioridad'], string> = {
  alta: 'bg-red-500/15 text-red-300 border-red-500/30',
  media: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
  baja: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
};

const ETIQUETA_REPETICION: Record<'diaria' | 'semanal' | 'mensual', string> = {
  diaria: 'cada día',
  semanal: 'cada semana',
  mensual: 'cada mes',
};

interface Props {
  tarea: Tarea;
  /** Versión compacta para colgarla debajo de un mensaje del hilo. */
  compacta?: boolean;
}

export function TarjetaTarea({ tarea, compacta = false }: Props) {
  const { alternarTarea, borrarTarea, editarTarea } = useAsistente();
  const hecha = tarea.estado === 'hecha';
  const cuando = tarea.recordarEn ?? tarea.vence;
  const vencida = Boolean(cuando && !hecha && new Date(cuando).getTime() < Date.now());

  const aplazar = (horas: number) => {
    const base = cuando && new Date(cuando).getTime() > Date.now() ? new Date(cuando) : new Date();
    void editarTarea(tarea.id, {
      recordarEn: new Date(base.getTime() + horas * 3600_000).toISOString(),
    });
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        vencida ? 'border-red-500/40 bg-red-500/5' : 'border-slate-800 bg-surface'
      } ${compacta ? 'text-xs' : 'text-sm'}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => void alternarTarea(tarea)}
          aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
            hecha
              ? 'border-accent bg-accent text-slate-900'
              : 'border-slate-600 text-transparent hover:border-accent'
          }`}
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p className={`leading-snug ${hecha ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
            {tarea.titulo}
          </p>

          {tarea.notas ? <p className="mt-1 text-xs text-slate-400">{tarea.notas}</p> : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            {cuando ? (
              <span className={vencida ? 'text-red-300' : 'text-slate-400'}>
                {vencida ? '⚠ ' : '⏰ '}
                {formatearCuando(cuando)}
              </span>
            ) : (
              <span className="text-slate-500">sin fecha</span>
            )}

            {tarea.repetir ? (
              <span className="text-slate-500">· {ETIQUETA_REPETICION[tarea.repetir]}</span>
            ) : null}

            {tarea.prioridad !== 'media' ? (
              <span className={`rounded border px-1.5 py-px ${COLOR_PRIORIDAD[tarea.prioridad]}`}>
                {tarea.prioridad}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!compacta && !hecha ? (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 text-[11px]">
          <button type="button" onClick={() => aplazar(1)} className="rounded-full border border-slate-700 px-2 py-1 text-slate-300 hover:border-accent">
            +1 h
          </button>
          <button type="button" onClick={() => aplazar(24)} className="rounded-full border border-slate-700 px-2 py-1 text-slate-300 hover:border-accent">
            Mañana
          </button>
          <button type="button" onClick={() => aplazar(24 * 7)} className="rounded-full border border-slate-700 px-2 py-1 text-slate-300 hover:border-accent">
            +1 semana
          </button>
          <button
            type="button"
            onClick={() => void borrarTarea(tarea.id)}
            className="ml-auto rounded-full border border-slate-800 px-2 py-1 text-slate-500 hover:border-red-500/50 hover:text-red-300"
          >
            Borrar
          </button>
        </div>
      ) : null}
    </div>
  );
}
