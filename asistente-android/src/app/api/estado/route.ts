import { NextResponse } from 'next/server';
import { leer } from '@/lib/servidor/almacen';
import { clavePublica } from '@/lib/servidor/push';
import { asegurarPlanificador, ejecutarTick } from '@/lib/servidor/recordatorios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Estado completo del asistente. El cliente lo consulta al abrir y cada pocos
 * segundos mientras la app está visible, así los recordatorios aparecen en el
 * hilo aunque el navegador no tenga push concedido.
 */
export async function GET() {
  asegurarPlanificador();
  await ejecutarTick();

  const { mensajes, tareas } = await leer();

  return NextResponse.json({
    mensajes,
    tareas,
    push: { clavePublica: clavePublica() },
    modeloConfigurado: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
