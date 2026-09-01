'use client';

import { useState, type FormEvent } from 'react';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';
import type { Prioridad, Repeticion } from '@/lib/types';

interface Props {
  alCerrar: () => void;
}

/**
 * Formulario para adjuntar una tarea a mano. El campo de fecha acepta tanto un
 * selector como texto en español ("mañana a las 3"), que interpreta el servidor.
 */
export function CompositorTarea({ alCerrar }: Props) {
  const { crearTarea } = useAsistente();
  const [titulo, setTitulo] = useState('');
  const [cuando, setCuando] = useState('');
  const [notas, setNotas] = useState('');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [repetir, setRepetir] = useState<Repeticion>(null);
  const [guardando, setGuardando] = useState(false);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!titulo.trim() || guardando) return;

    setGuardando(true);
    await crearTarea({
      titulo: titulo.trim(),
      notas: notas.trim() || null,
      recordarEn: cuando.trim() || null,
      prioridad,
      repetir,
    });
    setGuardando(false);
    alCerrar();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/60" onClick={alCerrar}>
      <form
        onSubmit={enviar}
        onClick={(evento) => evento.stopPropagation()}
        className="max-h-[85dvh] w-full space-y-3 overflow-y-auto rounded-t-2xl border-t border-slate-800 bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Nueva tarea</h2>
          <button type="button" onClick={alCerrar} className="text-slate-500">
            ✕
          </button>
        </div>

        <input
          autoFocus
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder="Qué hay que hacer"
          className="w-full rounded-xl border border-slate-700 bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <div>
          <input
            value={cuando}
            onChange={(evento) => setCuando(evento.target.value)}
            placeholder="Cuándo — p. ej. mañana a las 3 pm"
            className="w-full rounded-xl border border-slate-700 bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1 px-1 text-[11px] text-slate-500">
            Acepta lenguaje natural: “hoy 5pm”, “el viernes”, “en 2 horas”, “12 de octubre”.
          </p>
        </div>

        <textarea
          value={notas}
          onChange={(evento) => setNotas(evento.target.value)}
          placeholder="Notas (opcional)"
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-700 bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <div className="flex gap-2">
          <select
            value={prioridad}
            onChange={(evento) => setPrioridad(evento.target.value as Prioridad)}
            className="flex-1 rounded-xl border border-slate-700 bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="baja">Prioridad baja</option>
            <option value="media">Prioridad media</option>
            <option value="alta">Prioridad alta</option>
          </select>

          <select
            value={repetir ?? ''}
            onChange={(evento) => setRepetir((evento.target.value || null) as Repeticion)}
            className="flex-1 rounded-xl border border-slate-700 bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">No se repite</option>
            <option value="diaria">Cada día</option>
            <option value="semanal">Cada semana</option>
            <option value="mensual">Cada mes</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!titulo.trim() || guardando}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-slate-900 disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Adjuntar tarea'}
        </button>
      </form>
    </div>
  );
}
