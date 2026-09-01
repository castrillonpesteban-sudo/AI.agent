import { NextRequest, NextResponse } from 'next/server';
import { leer, mutar } from '@/lib/servidor/almacen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Contexto {
  params: { id: string };
}

interface CuerpoEdicion {
  esDuda?: boolean;
  /** true marca la duda como resuelta; false la reabre. */
  resuelta?: boolean;
}

export async function PATCH(peticion: NextRequest, { params }: Contexto) {
  const cambios = (await peticion.json()) as CuerpoEdicion;

  const mensaje = await mutar((datos) => {
    const encontrado = datos.mensajes.find((candidato) => candidato.id === params.id);
    if (!encontrado) return null;

    if (cambios.esDuda !== undefined) {
      encontrado.esDuda = cambios.esDuda;
      if (!cambios.esDuda) encontrado.dudaResueltaEn = null;
    }

    if (cambios.resuelta !== undefined) {
      encontrado.dudaResueltaEn = cambios.resuelta ? new Date().toISOString() : null;
    }

    return encontrado;
  });

  if (!mensaje) {
    return NextResponse.json({ error: 'No existe ese mensaje.' }, { status: 404 });
  }

  const estado = await leer();
  return NextResponse.json({ mensaje, mensajes: estado.mensajes, tareas: estado.tareas });
}
