import { NextRequest, NextResponse } from 'next/server';
import { mutar } from '@/lib/servidor/almacen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Cuerpo {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

export async function POST(peticion: NextRequest) {
  const cuerpo = (await peticion.json()) as Cuerpo;

  if (!cuerpo.endpoint || !cuerpo.keys?.p256dh || !cuerpo.keys.auth) {
    return NextResponse.json({ error: 'Suscripción incompleta.' }, { status: 400 });
  }

  await mutar((datos) => {
    const existente = datos.suscripciones.find(
      (suscripcion) => suscripcion.endpoint === cuerpo.endpoint,
    );
    if (existente) {
      existente.keys = { p256dh: cuerpo.keys!.p256dh!, auth: cuerpo.keys!.auth! };
      return;
    }
    datos.suscripciones.push({
      endpoint: cuerpo.endpoint!,
      keys: { p256dh: cuerpo.keys!.p256dh!, auth: cuerpo.keys!.auth! },
      creadaEn: new Date().toISOString(),
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(peticion: NextRequest) {
  const cuerpo = (await peticion.json()) as Cuerpo;
  if (!cuerpo.endpoint) {
    return NextResponse.json({ error: 'Falta el endpoint.' }, { status: 400 });
  }

  await mutar((datos) => {
    datos.suscripciones = datos.suscripciones.filter(
      (suscripcion) => suscripcion.endpoint !== cuerpo.endpoint,
    );
  });

  return NextResponse.json({ ok: true });
}
