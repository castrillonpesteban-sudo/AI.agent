'use client';

import Link from 'next/link';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';
import type { Mensaje } from '@/lib/types';

function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function VistaDudas() {
  const { mensajes, cargando, resolverDuda, marcarDuda } = useAsistente();

  const dudas = mensajes.filter((mensaje) => mensaje.esDuda);
  const abiertas = dudas.filter((duda) => !duda.dudaResueltaEn);
  const cerradas = dudas.filter((duda) => duda.dudaResueltaEn);

  /** La respuesta del asistente que siguió a la duda, si la hubo. */
  const respuestaDe = (duda: Mensaje): Mensaje | undefined => {
    const indice = mensajes.findIndex((mensaje) => mensaje.id === duda.id);
    return mensajes
      .slice(indice + 1)
      .find((mensaje) => mensaje.rol === 'assistant' && !mensaje.esRecordatorio);
  };

  const tarjeta = (duda: Mensaje) => {
    const respuesta = respuestaDe(duda);
    const resuelta = Boolean(duda.dudaResueltaEn);

    return (
      <article
        key={duda.id}
        className={`space-y-2 rounded-xl border px-3 py-2.5 ${
          resuelta ? 'border-slate-800 bg-surface/50 opacity-70' : 'border-slate-800 bg-surface'
        }`}
      >
        <p className="text-xs text-slate-500">{fechaCorta(duda.creadoEn)}</p>
        <p className="text-sm text-slate-100">{duda.texto}</p>

        {respuesta ? (
          <p className="border-l-2 border-slate-700 pl-2 text-xs text-slate-400 line-clamp-4">
            {respuesta.texto}
          </p>
        ) : (
          <p className="text-xs text-slate-500 italic">Sin respuesta todavía.</p>
        )}

        <div className="flex gap-2 pt-1 text-[11px]">
          <button
            type="button"
            onClick={() => void resolverDuda(duda.id, !resuelta)}
            className="rounded-full border border-slate-700 px-2 py-1 text-slate-300 hover:border-accent"
          >
            {resuelta ? 'Reabrir' : 'Marcar resuelta'}
          </button>
          <button
            type="button"
            onClick={() => void marcarDuda(duda.id, false)}
            className="rounded-full border border-slate-800 px-2 py-1 text-slate-500 hover:border-slate-700"
          >
            Quitar de dudas
          </button>
        </div>
      </article>
    );
  };

  return (
    <>
      <header className="shrink-0 border-b border-slate-800 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <h1 className="text-base font-semibold">Dudas</h1>
        <p className="text-xs text-slate-400">
          Lo que preguntaste y quedó abierto, sin perderse en el hilo.
        </p>
      </header>

      <main className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {cargando ? (
          <p className="mt-8 text-center text-sm text-slate-500">Cargando…</p>
        ) : dudas.length === 0 ? (
          <div className="mt-8 space-y-2 text-center">
            <p className="text-sm text-slate-500">No tienes dudas guardadas.</p>
            <p className="text-xs text-slate-600">
              En el chat, toca <span className="text-slate-400">···</span> bajo un mensaje y elige
              “Guardar como duda”.
            </p>
            <Link href="/" className="inline-block pt-2 text-xs text-accent">
              Ir al chat
            </Link>
          </div>
        ) : (
          <>
            {abiertas.length > 0 ? (
              <section className="space-y-2">
                <h2 className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Abiertas · {abiertas.length}
                </h2>
                {abiertas.map(tarjeta)}
              </section>
            ) : null}

            {cerradas.length > 0 ? (
              <section className="space-y-2">
                <h2 className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                  Resueltas · {cerradas.length}
                </h2>
                {cerradas.map(tarjeta)}
              </section>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
