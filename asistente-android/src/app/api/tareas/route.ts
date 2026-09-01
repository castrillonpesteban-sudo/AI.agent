import { NextRequest, NextResponse } from 'next/server';
import { interpretarFecha } from '@/lib/fechas';
import { leer, mutar, tareaNueva } from '@/lib/servidor/almacen';
import type { Prioridad, Repeticion } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { tareas } = await leer();
  return NextResponse.json({ tareas });
}

interface CuerpoNueva {
  titulo?: string;
  notas?: string | null;
  /** ISO 8601, o texto en español ("mañana a las 3") que se interpreta aquí. */
  recordarEn?: string | null;
  repetir?: Repeticion;
  prioridad?: Prioridad;
  mensajeOrigenId?: string | null;
}

export async function POST(peticion: NextRequest) {
  const cuerpo = (await peticion.json()) as CuerpoNueva;
  const titulo = cuerpo.titulo?.trim();

  if (!titulo) {
    return NextResponse.json({ error: 'La tarea necesita un título.' }, { status: 400 });
  }

  let recordarEn: string | null = null;
  // Si el usuario no eligió recurrencia, se respeta la que venga en el texto
  // ("cada lunes a las 7 am").
  let repetir: Repeticion = cuerpo.repetir ?? null;

  if (cuerpo.recordarEn) {
    const directo = new Date(cuerpo.recordarEn);
    if (Number.isNaN(directo.getTime())) {
      const interpretada = interpretarFecha(cuerpo.recordarEn);
      recordarEn = interpretada?.cuando ?? null;
      if (!cuerpo.repetir && interpretada?.repetir) {
        repetir = interpretada.repetir;
      }
    } else {
      recordarEn = directo.toISOString();
    }
  }

  const tarea = await mutar((datos) => {
    const nueva = tareaNueva({
      titulo,
      notas: cuerpo.notas ?? null,
      recordarEn,
      vence: recordarEn,
      repetir,
      prioridad: cuerpo.prioridad ?? 'media',
      mensajeOrigenId: cuerpo.mensajeOrigenId ?? null,
    });
    datos.tareas.push(nueva);

    if (cuerpo.mensajeOrigenId) {
      const origen = datos.mensajes.find((mensaje) => mensaje.id === cuerpo.mensajeOrigenId);
      if (origen && !origen.tareasAdjuntas.includes(nueva.id)) {
        origen.tareasAdjuntas.push(nueva.id);
      }
    }

    return nueva;
  });

  const estado = await leer();
  return NextResponse.json({ tarea, mensajes: estado.mensajes, tareas: estado.tareas }, { status: 201 });
}
