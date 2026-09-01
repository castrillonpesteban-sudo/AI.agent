import { formatearCuando, siguienteOcurrencia } from '@/lib/fechas';
import { recordatoriosPendientes } from '@/lib/tareas';
import type { Mensaje } from '@/lib/types';
import { mensajeNuevo, mutar } from './almacen';
import { enviarAviso } from './push';

export interface ResultadoTick {
  avisadas: number;
  mensajes: Mensaje[];
  enviadosPush: number;
}

/**
 * Revisa qué recordatorios vencieron, escribe el aviso en el hilo de mensajes y
 * lo manda como notificación push. Es idempotente: una tarea solo se avisa una
 * vez por vencimiento, y las recurrentes quedan reprogramadas al ciclo siguiente.
 */
export async function ejecutarTick(ahora: Date = new Date()): Promise<ResultadoTick> {
  const { mensajes, avisos, suscripciones } = await mutar((datos) => {
    const vencidas = recordatoriosPendientes(datos.tareas, ahora);
    const nuevos: Mensaje[] = [];
    const textos: Array<{ titulo: string; cuerpo: string; etiqueta: string }> = [];

    for (const tarea of vencidas) {
      const cuando = tarea.recordarEn as string;
      const atrasada = ahora.getTime() - new Date(cuando).getTime() > 90_000;
      const cuerpo = atrasada
        ? `Estaba para ${formatearCuando(cuando, ahora)} y sigue pendiente.`
        : 'Es la hora.';

      const mensaje = mensajeNuevo({
        rol: 'assistant',
        texto: `⏰ ${tarea.titulo}\n${cuerpo}`,
        esRecordatorio: true,
        tareasAdjuntas: [tarea.id],
      });
      datos.mensajes.push(mensaje);
      nuevos.push(mensaje);
      textos.push({ titulo: tarea.titulo, cuerpo, etiqueta: tarea.id });

      tarea.avisadaEn = ahora.toISOString();

      if (tarea.repetir) {
        const proxima = siguienteOcurrencia(cuando, tarea.repetir, ahora);
        tarea.recordarEn = proxima;
        tarea.vence = proxima;
        tarea.avisadaEn = null;
      }
    }

    return { mensajes: nuevos, avisos: textos, suscripciones: [...datos.suscripciones] };
  });

  if (avisos.length === 0) {
    return { avisadas: 0, mensajes: [], enviadosPush: 0 };
  }

  let enviadosPush = 0;
  const caducados: string[] = [];

  for (const aviso of avisos) {
    const resultado = await enviarAviso(suscripciones, {
      titulo: `⏰ ${aviso.titulo}`,
      cuerpo: aviso.cuerpo,
      url: '/tareas',
      etiqueta: aviso.etiqueta,
    });
    enviadosPush += resultado.enviados;
    caducados.push(...resultado.caducados);
  }

  if (caducados.length > 0) {
    await mutar((datos) => {
      datos.suscripciones = datos.suscripciones.filter(
        (suscripcion) => !caducados.includes(suscripcion.endpoint),
      );
    });
  }

  return { avisadas: avisos.length, mensajes, enviadosPush };
}

const INTERVALO_MS = Number(process.env.INTERVALO_RECORDATORIOS_MS ?? 30_000);

declare global {
  // eslint-disable-next-line no-var
  var __planificadorRecordatorios: NodeJS.Timeout | undefined;
}

/**
 * Arranca el barrido periódico dentro del proceso del servidor. Se llama desde
 * las rutas de API, así que queda activo en cuanto alguien abre la app.
 * En despliegues sin proceso persistente (serverless), usa en su lugar un cron
 * externo contra POST /api/recordatorios/tick.
 */
export function asegurarPlanificador(): void {
  if (globalThis.__planificadorRecordatorios || INTERVALO_MS <= 0) return;

  const temporizador = setInterval(() => {
    void ejecutarTick().catch(() => undefined);
  }, INTERVALO_MS);

  // No mantiene vivo el proceso por sí solo.
  temporizador.unref?.();
  globalThis.__planificadorRecordatorios = temporizador;
}
