'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';
import { agrupar } from '@/lib/tareas';

export function NavegacionInferior() {
  const ruta = usePathname();
  const { tareas, mensajes } = useAsistente();

  const grupos = agrupar(tareas);
  const porHacer = grupos.vencidas.length + grupos.hoy.length;
  const dudasAbiertas = mensajes.filter(
    (mensaje) => mensaje.esDuda && !mensaje.dudaResueltaEn,
  ).length;

  const enlaces = [
    { href: '/', etiqueta: 'Chat', icono: '💬', contador: 0 },
    { href: '/tareas', etiqueta: 'Tareas', icono: '✓', contador: porHacer },
    { href: '/dudas', etiqueta: 'Dudas', icono: '?', contador: dudasAbiertas },
  ];

  return (
    <nav className="flex shrink-0 border-t border-slate-800 bg-background pb-[env(safe-area-inset-bottom)]">
      {enlaces.map((enlace) => {
        const activo = ruta === enlace.href;
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              activo ? 'text-accent' : 'text-slate-500'
            }`}
          >
            <span className="text-base leading-none">{enlace.icono}</span>
            {enlace.etiqueta}
            {enlace.contador > 0 ? (
              <span className="absolute right-[22%] top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">
                {enlace.contador}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
