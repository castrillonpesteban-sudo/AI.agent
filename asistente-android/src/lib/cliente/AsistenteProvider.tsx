'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Estado, Mensaje, Tarea } from '@/lib/types';
import * as api from './api';

/** Cada cuánto se refresca el estado mientras la app está a la vista. */
const INTERVALO_SONDEO_MS = 15_000;

interface ValorContexto {
  mensajes: Mensaje[];
  tareas: Tarea[];
  cargando: boolean;
  enviando: boolean;
  error: string | null;
  clavePush: string | null;
  modeloConfigurado: boolean;
  enviar: (texto: string) => Promise<void>;
  crearTarea: (entrada: api.TareaNuevaEntrada) => Promise<void>;
  alternarTarea: (tarea: Tarea) => Promise<void>;
  editarTarea: (id: string, cambios: Parameters<typeof api.editarTarea>[1]) => Promise<void>;
  borrarTarea: (id: string) => Promise<void>;
  marcarDuda: (id: string, esDuda: boolean) => Promise<void>;
  resolverDuda: (id: string, resuelta: boolean) => Promise<void>;
  refrescar: () => Promise<void>;
  limpiarError: () => void;
}

const Contexto = createContext<ValorContexto | null>(null);

export function AsistenteProvider({ children }: { children: ReactNode }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clavePush, setClavePush] = useState<string | null>(null);
  const [modeloConfigurado, setModeloConfigurado] = useState(true);
  const enVuelo = useRef(false);

  const aplicar = useCallback((estado: Estado) => {
    setMensajes(estado.mensajes);
    setTareas(estado.tareas);
  }, []);

  const refrescar = useCallback(async () => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    try {
      const estado = await api.obtenerEstado();
      aplicar(estado);
      setClavePush(estado.push.clavePublica);
      setModeloConfigurado(estado.modeloConfigurado);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error desconocido.');
    } finally {
      enVuelo.current = false;
      setCargando(false);
    }
  }, [aplicar]);

  useEffect(() => {
    void refrescar();

    const temporizador = setInterval(() => {
      if (document.visibilityState === 'visible') void refrescar();
    }, INTERVALO_SONDEO_MS);

    const alVolver = () => {
      if (document.visibilityState === 'visible') void refrescar();
    };
    document.addEventListener('visibilitychange', alVolver);

    // El service worker avisa cuando llega un push, para refrescar el hilo.
    const alRecibirPush = (evento: MessageEvent) => {
      if ((evento.data as { tipo?: string } | null)?.tipo === 'recordatorio') {
        void refrescar();
      }
    };
    navigator.serviceWorker?.addEventListener('message', alRecibirPush);

    return () => {
      clearInterval(temporizador);
      document.removeEventListener('visibilitychange', alVolver);
      navigator.serviceWorker?.removeEventListener('message', alRecibirPush);
    };
  }, [refrescar]);

  const conError = useCallback(
    async (accion: () => Promise<Estado>) => {
      try {
        aplicar(await accion());
        setError(null);
      } catch (fallo) {
        setError(fallo instanceof Error ? fallo.message : 'Error desconocido.');
      }
    },
    [aplicar],
  );

  const enviar = useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      if (!limpio || enviando) return;

      // Eco optimista: el mensaje aparece antes de que responda el servidor.
      const provisional: Mensaje = {
        id: `pendiente-${Date.now()}`,
        rol: 'user',
        texto: limpio,
        creadoEn: new Date().toISOString(),
        esDuda: false,
        dudaResueltaEn: null,
        tareasAdjuntas: [],
        esRecordatorio: false,
        canal: 'app',
      };
      setMensajes((previos) => [...previos, provisional]);
      setEnviando(true);

      try {
        aplicar(await api.enviarMensaje(limpio));
        setError(null);
      } catch (fallo) {
        setMensajes((previos) => previos.filter((mensaje) => mensaje.id !== provisional.id));
        setError(fallo instanceof Error ? fallo.message : 'Error desconocido.');
      } finally {
        setEnviando(false);
      }
    },
    [aplicar, enviando],
  );

  const valor = useMemo<ValorContexto>(
    () => ({
      mensajes,
      tareas,
      cargando,
      enviando,
      error,
      clavePush,
      modeloConfigurado,
      enviar,
      refrescar,
      limpiarError: () => setError(null),
      crearTarea: (entrada) => conError(() => api.crearTarea(entrada)),
      alternarTarea: (tarea) =>
        conError(() =>
          api.editarTarea(tarea.id, { estado: tarea.estado === 'hecha' ? 'pendiente' : 'hecha' }),
        ),
      editarTarea: (id, cambios) => conError(() => api.editarTarea(id, cambios)),
      borrarTarea: (id) => conError(() => api.borrarTarea(id)),
      marcarDuda: (id, esDuda) => conError(() => api.editarMensaje(id, { esDuda })),
      resolverDuda: (id, resuelta) => conError(() => api.editarMensaje(id, { resuelta })),
    }),
    [mensajes, tareas, cargando, enviando, error, clavePush, modeloConfigurado, enviar, refrescar, conError],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAsistente(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useAsistente debe usarse dentro de <AsistenteProvider>.');
  }
  return valor;
}
