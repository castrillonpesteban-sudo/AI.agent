'use client';

import { useEffect, useState } from 'react';
import { suscribirPush } from '@/lib/cliente/api';
import { useAsistente } from '@/lib/cliente/AsistenteProvider';

/** Convierte la clave VAPID en base64url al Uint8Array que espera el navegador. */
function claveAUint8(base64url: string): Uint8Array {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

type Situacion = 'oculto' | 'ofrecer' | 'activando' | 'listo' | 'bloqueado' | 'sinClave';

/**
 * Pide permiso de notificaciones y registra la suscripción push, para que los
 * recordatorios lleguen aunque la app esté cerrada.
 */
export function AvisoNotificaciones() {
  const { clavePush, cargando } = useAsistente();
  const [situacion, setSituacion] = useState<Situacion>('oculto');

  useEffect(() => {
    if (cargando) return;

    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setSituacion('oculto');
      return;
    }

    if (!clavePush) {
      setSituacion(Notification.permission === 'granted' ? 'oculto' : 'sinClave');
      return;
    }

    if (Notification.permission === 'granted') {
      void navigator.serviceWorker.ready.then(async (registro) => {
        const existente = await registro.pushManager.getSubscription();
        setSituacion(existente ? 'listo' : 'ofrecer');
      });
      return;
    }

    setSituacion(Notification.permission === 'denied' ? 'bloqueado' : 'ofrecer');
  }, [clavePush, cargando]);

  const activar = async () => {
    if (!clavePush) return;
    setSituacion('activando');

    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        setSituacion('bloqueado');
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const suscripcion =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: claveAUint8(clavePush) as BufferSource,
        }));

      await suscribirPush(suscripcion.toJSON());
      setSituacion('listo');
    } catch {
      setSituacion('ofrecer');
    }
  };

  if (situacion === 'oculto' || situacion === 'listo') return null;

  const textos: Record<Exclude<Situacion, 'oculto' | 'listo'>, string> = {
    ofrecer: 'Activa las notificaciones para que los recordatorios te lleguen con la app cerrada.',
    activando: 'Pidiendo permiso…',
    bloqueado:
      'Las notificaciones están bloqueadas en este navegador. Habilítalas en los ajustes del sitio para recibir recordatorios.',
    sinClave:
      'Faltan las claves VAPID en el servidor (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). Mientras tanto, los recordatorios solo aparecen en el hilo con la app abierta.',
  };

  return (
    <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      <p className="flex-1">{textos[situacion]}</p>
      {situacion === 'ofrecer' ? (
        <button
          type="button"
          onClick={() => void activar()}
          className="shrink-0 rounded-full bg-amber-400 px-3 py-1 font-medium text-slate-900"
        >
          Activar
        </button>
      ) : null}
    </div>
  );
}
