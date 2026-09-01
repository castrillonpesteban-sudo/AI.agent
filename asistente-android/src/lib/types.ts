export type RolMensaje = 'user' | 'assistant';

export type EstadoTarea = 'pendiente' | 'hecha';

export type Prioridad = 'baja' | 'media' | 'alta';

export type Repeticion = 'diaria' | 'semanal' | 'mensual' | null;

export interface Tarea {
  id: string;
  titulo: string;
  notas: string | null;
  /** Fecha límite en ISO 8601. */
  vence: string | null;
  /** Momento exacto del aviso, en ISO 8601. */
  recordarEn: string | null;
  repetir: Repeticion;
  prioridad: Prioridad;
  estado: EstadoTarea;
  creadaEn: string;
  completadaEn: string | null;
  /** Mensaje del hilo del que salió la tarea. */
  mensajeOrigenId: string | null;
  /** Última vez que el asistente avisó por esta tarea. */
  avisadaEn: string | null;
}

export interface Mensaje {
  id: string;
  rol: RolMensaje;
  texto: string;
  creadoEn: string;
  /** Marcado por el usuario (o por el asistente) como duda pendiente. */
  esDuda: boolean;
  dudaResueltaEn: string | null;
  /** Tareas creadas o tocadas a partir de este mensaje. */
  tareasAdjuntas: string[];
  /** Un aviso automático de recordatorio, no una respuesta del asistente. */
  esRecordatorio: boolean;
}

export interface Estado {
  mensajes: Mensaje[];
  tareas: Tarea[];
}

export type GrupoTareas =
  | 'vencidas'
  | 'hoy'
  | 'proximas'
  | 'sinFecha'
  | 'hechas';
