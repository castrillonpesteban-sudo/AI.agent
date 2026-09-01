import { leer, mutar } from '../almacen';
import { procesarUpdate } from './conversacion';
import { obtenerUpdates, telegramConfigurado } from './telegram';

/**
 * Sondeo largo (long polling) contra la API de Telegram, dentro del proceso del
 * servidor. Es el modo que no necesita URL pública ni HTTPS: sirve para un VPS,
 * Railway, Fly o la máquina de casa. En serverless hay que usar el webhook.
 */

const ESPERA_SEGUNDOS = Number(process.env.TELEGRAM_SONDEO_SEGUNDOS ?? 25);
const ESPERA_TRAS_ERROR_MS = 5_000;
/**
 * Piso de duración por vuelta. El sondeo largo debería bloquearse en el
 * servidor de Telegram, pero si por lo que sea responde al instante, esto
 * evita que el bucle consuma un núcleo entero.
 */
const MINIMO_POR_VUELTA_MS = 1_000;

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

declare global {
  // eslint-disable-next-line no-var
  var __sondeoTelegram: { activo: boolean } | undefined;
}

function modo(): 'sondeo' | 'webhook' | 'apagado' {
  if (!telegramConfigurado()) return 'apagado';
  const configurado = process.env.TELEGRAM_MODO?.trim().toLowerCase();
  if (configurado === 'webhook') return 'webhook';
  if (configurado === 'sondeo') return 'sondeo';
  // Por defecto se sondea, que es lo que funciona sin infraestructura extra.
  return 'sondeo';
}

async function unaVuelta(): Promise<void> {
  const { telegram } = await leer();
  const offset = telegram.ultimoUpdateId === null ? null : telegram.ultimoUpdateId + 1;
  const updates = await obtenerUpdates(offset, ESPERA_SEGUNDOS);

  for (const update of updates) {
    try {
      await procesarUpdate(update);
    } catch (error) {
      console.error('Fallo procesando el update', update.update_id, error);
      // Se avanza el offset igual, para no quedarse atascado en el mismo update.
      await mutar((datos) => {
        if (update.update_id > (datos.telegram.ultimoUpdateId ?? -1)) {
          datos.telegram.ultimoUpdateId = update.update_id;
        }
      });
    }
  }
}

async function bucle(): Promise<void> {
  while (globalThis.__sondeoTelegram?.activo) {
    const inicio = Date.now();
    try {
      await unaVuelta();
      const transcurrido = Date.now() - inicio;
      if (transcurrido < MINIMO_POR_VUELTA_MS) {
        await esperar(MINIMO_POR_VUELTA_MS - transcurrido);
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      // 409: hay un webhook registrado; sondear y webhook son excluyentes.
      if (mensaje.includes('409')) {
        console.error(
          'Telegram rechazó el sondeo porque hay un webhook activo. ' +
            'Usa TELEGRAM_MODO=webhook, o quítalo con: npm run telegram -- webhook:borrar',
        );
        if (globalThis.__sondeoTelegram) globalThis.__sondeoTelegram.activo = false;
        return;
      }
      console.error('Error en el sondeo de Telegram:', mensaje);
      await esperar(ESPERA_TRAS_ERROR_MS);
    }
  }
}

/**
 * Arranca el sondeo una sola vez por proceso. Se llama desde las rutas de API,
 * igual que el planificador de recordatorios.
 */
export function asegurarSondeoTelegram(): void {
  if (globalThis.__sondeoTelegram || modo() !== 'sondeo') return;

  globalThis.__sondeoTelegram = { activo: true };
  console.log('Sondeo de Telegram iniciado.');
  void bucle();
}

export function detenerSondeoTelegram(): void {
  if (globalThis.__sondeoTelegram) {
    globalThis.__sondeoTelegram.activo = false;
    globalThis.__sondeoTelegram = undefined;
  }
}

export { modo as modoTelegram };
