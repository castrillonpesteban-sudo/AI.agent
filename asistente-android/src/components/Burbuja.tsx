'use client';

import { useState } from 'react';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';
import type { Mensaje, Tarea } from '@/lib/types';
import { TarjetaTarea } from './TarjetaTarea';

function hora(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

interface Props {
  mensaje: Mensaje;
  tareas: Tarea[];
}

export function Burbuja({ mensaje, tareas }: Props) {
  const { marcarDuda, crearTarea } = useAsistente();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esUsuario = mensaje.rol === 'user';
  const adjuntas = tareas.filter((tarea) => mensaje.tareasAdjuntas.includes(tarea.id));
  const provisional = mensaje.id.startsWith('pendiente-');

  const adjuntarTarea = () => {
    setMenuAbierto(false);
    void crearTarea({ titulo: mensaje.texto.slice(0, 140), mensajeOrigenId: mensaje.id });
  };

  return (
    <div className={`flex flex-col ${esUsuario ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          mensaje.esRecordatorio
            ? 'border border-amber-500/40 bg-amber-500/10 text-amber-100'
            : esUsuario
              ? 'bg-accent text-slate-900'
              : 'border border-slate-800 bg-surface text-slate-100'
        } ${provisional ? 'opacity-60' : ''}`}
      >
        <p className="whitespace-pre-wrap">{mensaje.texto}</p>

        <div
          className={`mt-1 flex items-center gap-2 text-[10px] ${
            esUsuario && !mensaje.esRecordatorio ? 'text-slate-700' : 'text-slate-500'
          }`}
        >
          <span>{hora(mensaje.creadoEn)}</span>
          {mensaje.esDuda ? (
            <span className={mensaje.dudaResueltaEn ? 'opacity-60' : ''}>
              {mensaje.dudaResueltaEn ? '· duda resuelta' : '· duda abierta'}
            </span>
          ) : null}
        </div>
      </div>

      {adjuntas.length > 0 ? (
        <div className={`mt-1.5 w-[85%] space-y-1.5 ${esUsuario ? 'self-end' : ''}`}>
          {adjuntas.map((tarea) => (
            <TarjetaTarea key={tarea.id} tarea={tarea} compacta />
          ))}
        </div>
      ) : null}

      {!provisional && !mensaje.esRecordatorio ? (
        <div className="mt-1">
          {menuAbierto ? (
            <div className="flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={adjuntarTarea}
                className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-300 hover:border-accent"
              >
                Adjuntar tarea
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  void marcarDuda(mensaje.id, !mensaje.esDuda);
                }}
                className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-300 hover:border-accent"
              >
                {mensaje.esDuda ? 'Quitar de dudas' : 'Guardar como duda'}
              </button>
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                className="px-1 text-slate-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              className="px-1 text-[11px] text-slate-600 hover:text-slate-400"
            >
              ···
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
