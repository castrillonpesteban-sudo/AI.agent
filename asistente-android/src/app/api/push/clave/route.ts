import { NextResponse } from 'next/server';
import { clavePublica, pushDisponible } from '@/lib/servidor/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ clavePublica: clavePublica(), disponible: pushDisponible() });
}
