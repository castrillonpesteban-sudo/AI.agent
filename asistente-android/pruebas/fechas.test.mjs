/**
 * Pruebas del intérprete de fechas en español.
 * Se ejecutan con: npm test
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { interpretarFecha, formatearCuando, siguienteOcurrencia } from '../src/lib/fechas.ts';

// Lunes 1 de septiembre de 2026, 10:00 en Bogotá (UTC-5).
const AHORA = new Date('2026-09-01T15:00:00Z');

/** Devuelve la fecha/hora local de Bogotá como "AAAA-MM-DD HH:MM". */
function local(iso) {
  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
  return partes.replace('T', ' ');
}

test('mañana con hora explícita', () => {
  const resultado = interpretarFecha('recuérdame llamar al proveedor mañana a las 3 pm', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-02 15:00');
  assert.equal(resultado.resto, 'recuérdame llamar al proveedor');
});

test('mañana sin hora usa las 8:00', () => {
  const resultado = interpretarFecha('mañana revisar el autoclave', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-02 08:00');
});

test('pasado mañana', () => {
  const resultado = interpretarFecha('pasado mañana entregar el informe', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-03 08:00');
});

test('hoy con hora en formato 24', () => {
  const resultado = interpretarFecha('hoy a las 17:30 reunión de comité', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-01 17:30');
});

test('día de la semana salta al siguiente', () => {
  // El 1 de septiembre de 2026 es martes; el viernes siguiente es el 4.
  const resultado = interpretarFecha('el viernes cerrar las órdenes', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-04 08:00');
});

test('el mismo día de la semana salta una semana completa', () => {
  const resultado = interpretarFecha('el martes revisar indicadores', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-08 08:00');
});

test('relativo en minutos', () => {
  const resultado = interpretarFecha('en 45 minutos sacar el equipo', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-01 10:45');
});

test('relativo en horas', () => {
  const resultado = interpretarFecha('en 2 horas llamar a biomédica', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-01 12:00');
});

test('relativo en días conserva la hora dada', () => {
  const resultado = interpretarFecha('en 3 días a las 7 am revisar filtros', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-04 07:00');
});

test('fecha larga con mes en palabras', () => {
  const resultado = interpretarFecha('el 12 de octubre calibrar termohigrómetros', AHORA);
  assert.equal(local(resultado.cuando), '2026-10-12 08:00');
});

test('fecha larga ya pasada salta al año siguiente', () => {
  const resultado = interpretarFecha('el 3 de marzo renovar el contrato', AHORA);
  assert.equal(local(resultado.cuando), '2027-03-03 08:00');
});

test('fecha numérica', () => {
  const resultado = interpretarFecha('15/09 entregar acta', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-15 08:00');
});

test('solo hora ya pasada se entiende como mañana', () => {
  const resultado = interpretarFecha('a las 8 am pasar por el taller', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-02 08:00');
});

test('solo hora futura se entiende como hoy', () => {
  const resultado = interpretarFecha('a las 4 pm firmar la orden', AHORA);
  assert.equal(local(resultado.cuando), '2026-09-01 16:00');
});

test('recurrencia semanal por día nombrado', () => {
  const resultado = interpretarFecha('cada lunes revisar el backlog', AHORA);
  assert.equal(resultado.repetir, 'semanal');
});

test('recurrencia diaria', () => {
  const resultado = interpretarFecha('todos los días a las 7 am revisar correo', AHORA);
  assert.equal(resultado.repetir, 'diaria');
  assert.equal(local(resultado.cuando), '2026-09-02 07:00');
});

test('un número suelto no es una hora', () => {
  assert.equal(interpretarFecha('cotizar 3 monitores', AHORA), null);
});

test('texto sin referencia temporal', () => {
  assert.equal(interpretarFecha('pedir repuesto del ventilador', AHORA), null);
});

test('formatearCuando usa etiquetas relativas', () => {
  assert.match(formatearCuando('2026-09-01T20:00:00Z', AHORA), /^hoy /);
  assert.match(formatearCuando('2026-09-02T20:00:00Z', AHORA), /^mañana /);
  assert.doesNotMatch(formatearCuando('2026-09-10T20:00:00Z', AHORA), /^(hoy|mañana) /);
});

test('siguienteOcurrencia avanza más allá del momento actual', () => {
  const semanal = siguienteOcurrencia('2026-08-24T13:00:00Z', 'semanal', AHORA);
  assert.equal(new Date(semanal).getTime() > AHORA.getTime(), true);
  assert.equal(local(semanal), local('2026-09-07T13:00:00Z'));

  const diaria = siguienteOcurrencia('2026-08-24T13:00:00Z', 'diaria', AHORA);
  assert.equal(local(diaria), '2026-09-02 08:00');

  assert.equal(siguienteOcurrencia('2026-08-24T13:00:00Z', null, AHORA), null);
});
