import type { Repeticion } from './types';

/** Zona horaria por defecto del usuario. Configurable con TZ_USUARIO. */
export const ZONA_HORARIA = process.env.TZ_USUARIO ?? 'America/Bogota';

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const MESES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

/** Quita tildes y pasa a minúsculas, para comparar sin sorpresas. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compensación de la zona horaria del usuario, en minutos, para un instante dado.
 * Sirve para construir fechas locales sin depender del TZ del servidor.
 */
function offsetZona(instante: Date, zona: string): number {
  const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const partes: Record<string, string> = {};
  for (const parte of formateador.formatToParts(instante)) {
    if (parte.type !== 'literal') {
      partes[parte.type] = parte.value;
    }
  }
  const comoUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    Number(partes.hour) === 24 ? 0 : Number(partes.hour),
    Number(partes.minute),
    Number(partes.second),
  );
  return (comoUtc - instante.getTime()) / 60000;
}

/** Descompone un instante en sus componentes de calendario locales del usuario. */
export function partesLocales(instante: Date, zona: string = ZONA_HORARIA) {
  const desplazado = new Date(instante.getTime() + offsetZona(instante, zona) * 60000);
  return {
    anio: desplazado.getUTCFullYear(),
    mes: desplazado.getUTCMonth(),
    dia: desplazado.getUTCDate(),
    hora: desplazado.getUTCHours(),
    minuto: desplazado.getUTCMinutes(),
    diaSemana: desplazado.getUTCDay(),
  };
}

/** Construye un instante UTC a partir de una fecha y hora locales del usuario. */
export function desdeLocal(
  anio: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
  zona: string = ZONA_HORARIA,
): Date {
  const tentativo = Date.UTC(anio, mes, dia, hora, minuto, 0);
  // Dos pasadas: la primera estima el offset, la segunda lo corrige en los
  // bordes de cambio de hora.
  let instante = new Date(tentativo - offsetZona(new Date(tentativo), zona) * 60000);
  instante = new Date(tentativo - offsetZona(instante, zona) * 60000);
  return instante;
}

export interface FechaInterpretada {
  /** Instante del recordatorio en ISO 8601. */
  cuando: string;
  /** true si el texto solo traía día, sin hora explícita. */
  horaAsumida: boolean;
  repetir: Repeticion;
  /** El texto de entrada sin la parte de fecha, para usarlo como título. */
  resto: string;
}

/** Hora por defecto cuando el usuario dice un día pero no una hora. */
const HORA_POR_DEFECTO = 8;

interface Hora {
  hora: number;
  minuto: number;
  fragmento: string;
}

function extraerHora(texto: string): Hora | null {
  // "a las 15:30", "a las 3 pm", "3:05pm", "15h", "a las 9 de la noche"
  const patron =
    /(?:\ba\s+las?\s+)?\b([01]?\d|2[0-3])(?::([0-5]\d))?\s*(a\.?\s?m\.?|p\.?\s?m\.?|h(?:oras)?|de\s+la\s+(?:manana|tarde|noche|madrugada))?\b/g;
  let mejor: Hora | null = null;
  let coincidencia: RegExpExecArray | null;

  while ((coincidencia = patron.exec(texto)) !== null) {
    const sufijo = coincidencia[3] ? normalizar(coincidencia[3]).replace(/[\s.]/g, '') : '';
    const traeContextoHorario =
      Boolean(sufijo) || /\ba\s+las?\s+$/.test(texto.slice(0, coincidencia.index + 1));
    const empiezaConALas = /^\s*a\s+las?\s+/i.test(coincidencia[0]);
    if (!sufijo && !empiezaConALas && !coincidencia[2]) {
      // Un número suelto ("3 informes") no es una hora.
      continue;
    }
    if (!traeContextoHorario && !empiezaConALas && !coincidencia[2]) {
      continue;
    }

    let hora = Number(coincidencia[1]);
    const minuto = coincidencia[2] ? Number(coincidencia[2]) : 0;

    if (sufijo.startsWith('pm') || sufijo === 'delatarde' || sufijo === 'delanoche') {
      if (hora < 12) hora += 12;
    } else if (sufijo.startsWith('am') || sufijo === 'delamanana' || sufijo === 'delamadrugada') {
      if (hora === 12) hora = 0;
    }

    if (hora > 23) continue;
    mejor = { hora, minuto, fragmento: coincidencia[0] };
  }

  return mejor;
}

function detectarRepeticion(texto: string): { repetir: Repeticion; fragmento: string } {
  const patrones: Array<[RegExp, Repeticion]> = [
    [/\b(todos los dias|cada dia|a diario|diariamente)\b/, 'diaria'],
    [/\b(todas las semanas|cada semana|semanalmente)\b/, 'semanal'],
    [/\b(todos los meses|cada mes|mensualmente)\b/, 'mensual'],
    [/\bcada\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/, 'semanal'],
    [/\btodos los\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/, 'semanal'],
  ];

  for (const [patron, repetir] of patrones) {
    const encontrado = patron.exec(texto);
    if (encontrado) {
      return { repetir, fragmento: encontrado[0] };
    }
  }
  return { repetir: null, fragmento: '' };
}

/**
 * Interpreta expresiones de fecha en español coloquial dentro de un texto libre.
 * Devuelve null cuando no encuentra ninguna referencia temporal.
 */
export function interpretarFecha(
  entrada: string,
  ahora: Date = new Date(),
  zona: string = ZONA_HORARIA,
): FechaInterpretada | null {
  const texto = normalizar(entrada);
  const hoy = partesLocales(ahora, zona);
  const { repetir, fragmento: fragmentoRepeticion } = detectarRepeticion(texto);
  const hora = extraerHora(texto);
  const fragmentos: string[] = [];
  if (fragmentoRepeticion) fragmentos.push(fragmentoRepeticion);
  if (hora) fragmentos.push(hora.fragmento);

  const construir = (anio: number, mes: number, dia: number): FechaInterpretada => {
    const h = hora?.hora ?? HORA_POR_DEFECTO;
    const m = hora?.minuto ?? 0;
    return {
      cuando: desdeLocal(anio, mes, dia, h, m, zona).toISOString(),
      horaAsumida: !hora,
      repetir,
      resto: limpiar(entrada, fragmentos),
    };
  };

  // "en 20 minutos", "en 2 horas", "en 3 dias", "en una semana"
  const relativo = /\ben\s+(un|una|\d{1,3})\s+(minutos?|horas?|dias?|semanas?|meses?)\b/.exec(texto);
  if (relativo) {
    const cantidad = /^\d+$/.test(relativo[1]) ? Number(relativo[1]) : 1;
    const unidad = relativo[2];
    fragmentos.push(relativo[0]);
    let destino = new Date(ahora.getTime());

    if (unidad.startsWith('minuto')) {
      destino = new Date(destino.getTime() + cantidad * 60000);
    } else if (unidad.startsWith('hora')) {
      destino = new Date(destino.getTime() + cantidad * 3600000);
    } else {
      const dias = unidad.startsWith('dia')
        ? cantidad
        : unidad.startsWith('semana')
          ? cantidad * 7
          : 0;
      const meses = unidad.startsWith('mes') ? cantidad : 0;
      const p = partesLocales(destino, zona);
      const h = hora?.hora ?? HORA_POR_DEFECTO;
      const m = hora?.minuto ?? 0;
      destino = desdeLocal(p.anio, p.mes + meses, p.dia + dias, h, m, zona);
    }

    return {
      cuando: destino.toISOString(),
      horaAsumida: !hora && (unidad.startsWith('dia') || unidad.startsWith('semana') || unidad.startsWith('mes')),
      repetir,
      resto: limpiar(entrada, fragmentos),
    };
  }

  if (/\bpasado\s+manana\b/.test(texto)) {
    fragmentos.push('pasado manana');
    return construir(hoy.anio, hoy.mes, hoy.dia + 2);
  }

  if (/\bmanana\b/.test(texto) && !/\bde\s+la\s+manana\b/.test(texto)) {
    fragmentos.push('manana');
    return construir(hoy.anio, hoy.mes, hoy.dia + 1);
  }

  if (/\bhoy\b/.test(texto) || (hora && /\besta\s+(tarde|noche)\b/.test(texto))) {
    fragmentos.push('hoy');
    return construir(hoy.anio, hoy.mes, hoy.dia);
  }

  // "el viernes", "el proximo lunes"
  const diaNombrado =
    /\b(?:el\s+)?(?:proximo\s+|siguiente\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.exec(
      texto,
    );
  if (diaNombrado) {
    fragmentos.push(diaNombrado[0]);
    const objetivo = DIAS_SEMANA[diaNombrado[1]];
    let avance = (objetivo - hoy.diaSemana + 7) % 7;
    const esProximo = /\bproximo|siguiente\b/.test(diaNombrado[0]);
    if (avance === 0) avance = 7;
    if (esProximo && avance < 7) avance += 0;
    return construir(hoy.anio, hoy.mes, hoy.dia + avance);
  }

  // "el 12 de marzo", "12 de marzo de 2027"
  const fechaLarga = /\b(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?\b/.exec(texto);
  if (fechaLarga && MESES[fechaLarga[2]] !== undefined) {
    fragmentos.push(fechaLarga[0]);
    const dia = Number(fechaLarga[1]);
    const mes = MESES[fechaLarga[2]];
    const anio = fechaLarga[3]
      ? Number(fechaLarga[3])
      : mes < hoy.mes || (mes === hoy.mes && dia < hoy.dia)
        ? hoy.anio + 1
        : hoy.anio;
    return construir(anio, mes, dia);
  }

  // "12/03", "12-03-2027"
  const fechaNumerica = /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/.exec(texto);
  if (fechaNumerica) {
    fragmentos.push(fechaNumerica[0]);
    const dia = Number(fechaNumerica[1]);
    const mes = Number(fechaNumerica[2]) - 1;
    let anio = hoy.anio;
    if (fechaNumerica[3]) {
      anio = Number(fechaNumerica[3]);
      if (anio < 100) anio += 2000;
    } else if (mes < hoy.mes || (mes === hoy.mes && dia < hoy.dia)) {
      anio += 1;
    }
    if (mes >= 0 && mes <= 11 && dia >= 1 && dia <= 31) {
      return construir(anio, mes, dia);
    }
  }

  // Solo hora: se entiende como hoy, o mañana si ya pasó.
  if (hora) {
    const candidato = desdeLocal(hoy.anio, hoy.mes, hoy.dia, hora.hora, hora.minuto, zona);
    const destino =
      candidato.getTime() <= ahora.getTime()
        ? desdeLocal(hoy.anio, hoy.mes, hoy.dia + 1, hora.hora, hora.minuto, zona)
        : candidato;
    return {
      cuando: destino.toISOString(),
      horaAsumida: false,
      repetir,
      resto: limpiar(entrada, fragmentos),
    };
  }

  if (repetir) {
    return construir(hoy.anio, hoy.mes, hoy.dia + 1);
  }

  return null;
}

/** Quita del texto original los fragmentos ya consumidos como fecha. */
function limpiar(original: string, fragmentos: string[]): string {
  let resultado = original;
  for (const fragmento of fragmentos) {
    if (!fragmento) continue;
    const patron = new RegExp(escaparFlexible(fragmento), 'i');
    resultado = resultado.replace(patron, ' ');
  }
  return resultado
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, '')
    .trim();
}

/**
 * Escapa un fragmento normalizado para volver a encontrarlo en el texto original,
 * que sí trae tildes.
 */
function escaparFlexible(fragmento: string): string {
  const equivalencias: Record<string, string> = {
    a: '[aá]',
    e: '[eé]',
    i: '[ií]',
    o: '[oó]',
    u: '[uúü]',
    n: '[nñ]',
  };
  return fragmento
    .split('')
    .map((caracter) => {
      if (equivalencias[caracter]) return equivalencias[caracter];
      if (caracter === ' ') return '\\s+';
      return caracter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
}

/** Formatea un instante para mostrarlo en el hilo: "hoy 3:00 p. m.", "vie 12 sep, 8:00 a. m.". */
export function formatearCuando(iso: string, ahora: Date = new Date(), zona: string = ZONA_HORARIA): string {
  const instante = new Date(iso);
  const hoy = partesLocales(ahora, zona);
  const objetivo = partesLocales(instante, zona);
  const horaTexto = new Intl.DateTimeFormat('es-CO', {
    timeZone: zona,
    hour: 'numeric',
    minute: '2-digit',
  }).format(instante);

  const mismoDia =
    hoy.anio === objetivo.anio && hoy.mes === objetivo.mes && hoy.dia === objetivo.dia;
  if (mismoDia) return `hoy ${horaTexto}`;

  const manana = partesLocales(new Date(ahora.getTime() + 86400000), zona);
  if (manana.anio === objetivo.anio && manana.mes === objetivo.mes && manana.dia === objetivo.dia) {
    return `mañana ${horaTexto}`;
  }

  const fechaTexto = new Intl.DateTimeFormat('es-CO', {
    timeZone: zona,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: objetivo.anio === hoy.anio ? undefined : 'numeric',
  }).format(instante);

  return `${fechaTexto}, ${horaTexto}`;
}

/** Avanza un recordatorio recurrente al siguiente ciclo posterior a "desde". */
export function siguienteOcurrencia(
  iso: string,
  repetir: Repeticion,
  desde: Date = new Date(),
  zona: string = ZONA_HORARIA,
): string | null {
  if (!repetir) return null;
  let instante = new Date(iso);
  let guarda = 0;

  while (instante.getTime() <= desde.getTime() && guarda < 500) {
    const p = partesLocales(instante, zona);
    if (repetir === 'diaria') {
      instante = desdeLocal(p.anio, p.mes, p.dia + 1, p.hora, p.minuto, zona);
    } else if (repetir === 'semanal') {
      instante = desdeLocal(p.anio, p.mes, p.dia + 7, p.hora, p.minuto, zona);
    } else {
      instante = desdeLocal(p.anio, p.mes + 1, p.dia, p.hora, p.minuto, zona);
    }
    guarda += 1;
  }

  return instante.toISOString();
}
