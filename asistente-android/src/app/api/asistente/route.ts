import { NextRequest, NextResponse } from 'next/server';
import { leer, mensajeNuevo, mutar } from '@/lib/servidor/almacen';
import { responder } from '@/lib/servidor/asistente';
import { asegurarPlanificador } from '@/lib/servidor/recordatorios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Cuerpo {
  texto?: string;
  /** El usuario marcó el mensaje como duda al enviarlo. */
  esDuda?: boolean;
}

export async function POST(peticion: NextRequest) {
  asegurarPlanificador();

  const cuerpo = (await peticion.json()) as Cuerpo;
  const texto = cuerpo.texto?.trim();

  if (!texto) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío.' }, { status: 400 });
  }

  const mensajeUsuario = await mutar((datos) => {
    const nuevo = mensajeNuevo({ rol: 'user', texto, esDuda: cuerpo.esDuda ?? false });
    datos.mensajes.push(nuevo);
    return nuevo;
  });

  const { mensajes } = await leer();

  try {
    const resultado = await responder(mensajes, mensajeUsuario.id);

    await mutar((datos) => {
      datos.mensajes.push(
        mensajeNuevo({ rol: 'assistant', texto: resultado.respuesta }),
      );

      const origen = datos.mensajes.find((mensaje) => mensaje.id === mensajeUsuario.id);
      if (origen) {
        origen.tareasAdjuntas = [
          ...new Set([...origen.tareasAdjuntas, ...resultado.tareasTocadas]),
        ];
        if (resultado.esDuda) origen.esDuda = true;
      }
    });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'Error desconocido.';
    await mutar((datos) => {
      datos.mensajes.push(
        mensajeNuevo({
          rol: 'assistant',
          texto: `No pude responder: ${detalle}`,
        }),
      );
    });
    const estado = await leer();
    return NextResponse.json({ mensajes: estado.mensajes, tareas: estado.tareas }, { status: 502 });
  }

  const estado = await leer();
  return NextResponse.json({ mensajes: estado.mensajes, tareas: estado.tareas });
}
