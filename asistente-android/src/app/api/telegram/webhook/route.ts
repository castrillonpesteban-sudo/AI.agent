import { NextRequest, NextResponse } from 'next/server';
import { procesarUpdate } from '@/lib/servidor/canales/conversacion';
import { telegramConfigurado, type UpdateTelegram } from '@/lib/servidor/canales/telegram';
import { asegurarPlanificador } from '@/lib/servidor/recordatorios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Recibe los updates de Telegram. Se protege con el secreto que se registró
 * junto al webhook: la URL es pública, así que sin esto cualquiera podría
 * inyectar mensajes falsos.
 */
export async function POST(peticion: NextRequest) {
  if (!telegramConfigurado()) {
    return NextResponse.json({ error: 'Telegram no está configurado.' }, { status: 503 });
  }

  const secreto = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secreto && peticion.headers.get('x-telegram-bot-api-secret-token') !== secreto) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  asegurarPlanificador();

  let update: UpdateTelegram;
  try {
    update = (await peticion.json()) as UpdateTelegram;
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  try {
    await procesarUpdate(update);
  } catch (error) {
    // Un 200 evita que Telegram reintente en bucle un update que siempre falla;
    // el error queda en los logs del servidor.
    console.error('Fallo procesando el update de Telegram', error);
  }

  return NextResponse.json({ ok: true });
}
