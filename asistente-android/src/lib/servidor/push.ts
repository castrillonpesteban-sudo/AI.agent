import webpush from 'web-push';
import type { SuscripcionPush } from './almacen';

let configurado: boolean | null = null;

export function clavePublica(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/** true si hay claves VAPID válidas y se puede enviar push del navegador. */
export function pushDisponible(): boolean {
  if (configurado !== null) return configurado;

  const publica = process.env.VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;

  if (!publica || !privada) {
    configurado = false;
    return configurado;
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:asistente@example.com',
      publica,
      privada,
    );
    configurado = true;
  } catch {
    configurado = false;
  }

  return configurado;
}

export interface AvisoPush {
  titulo: string;
  cuerpo: string;
  url: string;
  etiqueta: string;
}

export interface ResultadoEnvio {
  enviados: number;
  /** Endpoints que el navegador ya no reconoce y hay que borrar. */
  caducados: string[];
}

export async function enviarAviso(
  suscripciones: SuscripcionPush[],
  aviso: AvisoPush,
): Promise<ResultadoEnvio> {
  if (!pushDisponible() || suscripciones.length === 0) {
    return { enviados: 0, caducados: [] };
  }

  const carga = JSON.stringify(aviso);
  const caducados: string[] = [];
  let enviados = 0;

  await Promise.all(
    suscripciones.map(async (suscripcion) => {
      try {
        await webpush.sendNotification(
          { endpoint: suscripcion.endpoint, keys: suscripcion.keys },
          carga,
        );
        enviados += 1;
      } catch (error) {
        const codigo = (error as { statusCode?: number }).statusCode;
        // 404/410: el navegador dio de baja la suscripción.
        if (codigo === 404 || codigo === 410) {
          caducados.push(suscripcion.endpoint);
        }
      }
    }),
  );

  return { enviados, caducados };
}
