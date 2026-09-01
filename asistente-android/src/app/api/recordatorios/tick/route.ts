import { NextRequest, NextResponse } from 'next/server';
import { ejecutarTick } from '@/lib/servidor/recordatorios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Barrido de recordatorios para despliegues sin proceso persistente.
 * Llámalo desde un cron (Vercel Cron, cron del sistema, etc.).
 * Si CRON_SECRET está definido, exige `Authorization: Bearer <secreto>`.
 */
export async function POST(peticion: NextRequest) {
  const secreto = process.env.CRON_SECRET;

  if (secreto) {
    const autorizacion = peticion.headers.get('authorization');
    if (autorizacion !== `Bearer ${secreto}`) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
  }

  const resultado = await ejecutarTick();
  return NextResponse.json(resultado);
}

export const GET = POST;
