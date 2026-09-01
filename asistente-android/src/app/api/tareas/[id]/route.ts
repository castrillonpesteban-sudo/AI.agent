import { NextRequest, NextResponse } from 'next/server';
import { interpretarFecha } from '@/lib/fechas';
import { leer, mutar } from '@/lib/servidor/almacen';
import type { EstadoTarea, Prioridad, Repeticion } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Contexto {
  params: { id: string };
}

interface CuerpoEdicion {
  titulo?: string;
  notas?: string | null;
  recordarEn?: string | null;
  repetir?: Repeticion;
  prioridad?: Prioridad;
  estado?: EstadoTarea;
}

export async function PATCH(peticion: NextRequest, { params }: Contexto) {
  const cambios = (await peticion.json()) as CuerpoEdicion;

  const tarea = await mutar((datos) => {
    const encontrada = datos.tareas.find((candidata) => candidata.id === params.id);
    if (!encontrada) return null;

    if (cambios.titulo !== undefined) encontrada.titulo = cambios.titulo.trim();
    if (cambios.notas !== undefined) encontrada.notas = cambios.notas;
    if (cambios.repetir !== undefined) encontrada.repetir = cambios.repetir;
    if (cambios.prioridad !== undefined) encontrada.prioridad = cambios.prioridad;

    if (cambios.recordarEn !== undefined) {
      let valor: string | null = null;
      if (cambios.recordarEn) {
        const directo = new Date(cambios.recordarEn);
        if (Number.isNaN(directo.getTime())) {
          const interpretada = interpretarFecha(cambios.recordarEn);
          valor = interpretada?.cuando ?? null;
          // El texto puede traer también la recurrencia, si no se pidió otra.
          if (cambios.repetir === undefined && interpretada?.repetir) {
            encontrada.repetir = interpretada.repetir;
          }
        } else {
          valor = directo.toISOString();
        }
      }
      encontrada.recordarEn = valor;
      encontrada.vence = valor;
      // Vuelve a sonar con la fecha nueva.
      encontrada.avisadaEn = null;
    }

    if (cambios.estado !== undefined) {
      encontrada.estado = cambios.estado;
      encontrada.completadaEn = cambios.estado === 'hecha' ? new Date().toISOString() : null;
    }

    return encontrada;
  });

  if (!tarea) {
    return NextResponse.json({ error: 'No existe esa tarea.' }, { status: 404 });
  }

  const estado = await leer();
  return NextResponse.json({ tarea, tareas: estado.tareas, mensajes: estado.mensajes });
}

export async function DELETE(_peticion: NextRequest, { params }: Contexto) {
  const borrada = await mutar((datos) => {
    const indice = datos.tareas.findIndex((candidata) => candidata.id === params.id);
    if (indice === -1) return false;
    datos.tareas.splice(indice, 1);
    for (const mensaje of datos.mensajes) {
      mensaje.tareasAdjuntas = mensaje.tareasAdjuntas.filter((id) => id !== params.id);
    }
    return true;
  });

  if (!borrada) {
    return NextResponse.json({ error: 'No existe esa tarea.' }, { status: 404 });
  }

  const estado = await leer();
  return NextResponse.json({ tareas: estado.tareas, mensajes: estado.mensajes });
}
