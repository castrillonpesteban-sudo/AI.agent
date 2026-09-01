'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';
import { AvisoNotificaciones } from './AvisoNotificaciones';
import { Burbuja } from './Burbuja';
import { CompositorTarea } from './CompositorTarea';

const SUGERENCIAS = [
  'Recuérdame llamar a Técnica Electromédica mañana a las 9',
  '¿Qué tengo pendiente hoy?',
  'Cada lunes revisar el backlog de órdenes',
];

export function VistaChat() {
  const { mensajes, tareas, enviar, enviando, error, cargando, modeloConfigurado } = useAsistente();
  const [borrador, setBorrador] = useState('');
  const [compositorAbierto, setCompositorAbierto] = useState(false);
  const finDelHilo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finDelHilo.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length]);

  const alEnviar = (evento: FormEvent) => {
    evento.preventDefault();
    const texto = borrador;
    setBorrador('');
    void enviar(texto);
  };

  return (
    <>
      <header className="shrink-0 border-b border-slate-800 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <h1 className="text-base font-semibold">Asistente</h1>
        <p className="text-xs text-slate-400">
          Escríbele como a un chat: lo que sea una tarea, queda con recordatorio.
        </p>
      </header>

      <AvisoNotificaciones />

      {!modeloConfigurado && !cargando ? (
        <p className="mx-3 mt-2 rounded-xl border border-slate-800 bg-surface px-3 py-2 text-[11px] text-slate-400">
          Sin <code>ANTHROPIC_API_KEY</code>: el asistente sigue creando tareas y listando
          pendientes con el intérprete local, pero no conversa.
        </p>
      ) : null}

      <main className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {cargando ? (
          <p className="mt-8 text-center text-sm text-slate-500">Cargando el hilo…</p>
        ) : mensajes.length === 0 ? (
          <div className="mt-8 space-y-3 px-2">
            <p className="text-center text-sm text-slate-500">
              Aquí vive tu asistente. Empieza por algo así:
            </p>
            <div className="space-y-2">
              {SUGERENCIAS.map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  onClick={() => void enviar(sugerencia)}
                  className="w-full rounded-xl border border-slate-800 bg-surface px-3 py-2 text-left text-xs text-slate-300 hover:border-accent"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensajes.map((mensaje) => (
            <Burbuja key={mensaje.id} mensaje={mensaje} tareas={tareas} />
          ))
        )}

        {enviando ? <p className="text-center text-xs text-slate-500">escribiendo…</p> : null}
        {error ? <p className="text-center text-xs text-red-400">{error}</p> : null}
        <div ref={finDelHilo} />
      </main>

      <form onSubmit={alEnviar} className="shrink-0 border-t border-slate-800 p-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCompositorAbierto(true)}
            aria-label="Adjuntar tarea"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 text-lg text-slate-300 hover:border-accent"
          >
            +
          </button>
          <input
            value={borrador}
            onChange={(evento) => setBorrador(evento.target.value)}
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-full border border-slate-700 bg-surface px-4 py-2 text-sm text-slate-100 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={enviando || !borrador.trim()}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
          >
            {enviando ? '…' : 'Enviar'}
          </button>
        </div>
      </form>

      {compositorAbierto ? <CompositorTarea alCerrar={() => setCompositorAbierto(false)} /> : null}
    </>
  );
}
