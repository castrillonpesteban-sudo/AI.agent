'use client';

import { useState } from 'react';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';
import { agrupar, ETIQUETA_GRUPO } from '@/lib/tareas';
import type { GrupoTareas } from '@/lib/types';
import { CompositorTarea } from './CompositorTarea';
import { TarjetaTarea } from './TarjetaTarea';

const ORDEN: GrupoTareas[] = ['vencidas', 'hoy', 'proximas', 'sinFecha', 'hechas'];

export function VistaTareas() {
  const { tareas, cargando } = useAsistente();
  const [compositorAbierto, setCompositorAbierto] = useState(false);
  const [verHechas, setVerHechas] = useState(false);

  const grupos = agrupar(tareas);
  const pendientes = tareas.filter((tarea) => tarea.estado === 'pendiente').length;

  return (
    <>
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div>
          <h1 className="text-base font-semibold">Tareas</h1>
          <p className="text-xs text-slate-400">
            {pendientes} pendiente{pendientes === 1 ? '' : 's'}
            {grupos.vencidas.length > 0 ? ` · ${grupos.vencidas.length} vencida${grupos.vencidas.length === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCompositorAbierto(true)}
          className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-slate-900"
        >
          + Nueva
        </button>
      </header>

      <main className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {cargando ? (
          <p className="mt-8 text-center text-sm text-slate-500">Cargando…</p>
        ) : tareas.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">
            Todavía no hay tareas. Créalas desde el chat o con “+ Nueva”.
          </p>
        ) : (
          ORDEN.map((grupo) => {
            const lista = grupos[grupo];
            if (lista.length === 0) return null;
            if (grupo === 'hechas' && !verHechas) {
              return (
                <button
                  key={grupo}
                  type="button"
                  onClick={() => setVerHechas(true)}
                  className="w-full rounded-xl border border-slate-800 py-2 text-xs text-slate-500 hover:border-slate-700"
                >
                  Ver {lista.length} hecha{lista.length === 1 ? '' : 's'}
                </button>
              );
            }

            return (
              <section key={grupo} className="space-y-2">
                <h2
                  className={`px-1 text-[11px] font-medium uppercase tracking-wide ${
                    grupo === 'vencidas' ? 'text-red-400' : 'text-slate-500'
                  }`}
                >
                  {ETIQUETA_GRUPO[grupo]} · {lista.length}
                </h2>
                {lista.map((tarea) => (
                  <TarjetaTarea key={tarea.id} tarea={tarea} />
                ))}
              </section>
            );
          })
        )}
      </main>

      {compositorAbierto ? <CompositorTarea alCerrar={() => setCompositorAbierto(false)} /> : null}
    </>
  );
}
