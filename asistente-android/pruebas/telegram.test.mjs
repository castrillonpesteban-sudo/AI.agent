/**
 * Pruebas del cliente de Telegram que no necesitan red: partido de mensajes
 * largos y control de acceso por chat.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { chatAutorizado, chatsPermitidos, partir } from '../src/lib/servidor/canales/telegram.ts';

test('un mensaje corto no se parte', () => {
  assert.deepEqual(partir('hola'), ['hola']);
});

test('un mensaje largo se parte por líneas sin cortar palabras', () => {
  const linea = 'x'.repeat(100);
  const entrada = Array.from({ length: 60 }, () => linea).join('\n');
  const partes = partir(entrada);

  assert.equal(partes.length > 1, true, 'debería partirse en varias');
  for (const parte of partes) {
    assert.equal(parte.length <= 3800, true, 'ninguna parte supera el límite');
  }
  // No se pierde ni se duplica contenido.
  assert.equal(partes.join('\n'), entrada);
});

test('una sola línea gigantesca se recorta al límite', () => {
  const partes = partir('y'.repeat(9000));
  assert.equal(partes.every((parte) => parte.length <= 3800), true);
});

test('sin lista de chats no se atiende a nadie', () => {
  delete process.env.TELEGRAM_CHATS_PERMITIDOS;
  assert.deepEqual(chatsPermitidos(), []);
  assert.equal(chatAutorizado(12345), false);
});

test('solo se atiende a los chats de la lista', () => {
  process.env.TELEGRAM_CHATS_PERMITIDOS = ' 12345 , -100999 ';
  assert.deepEqual(chatsPermitidos(), [12345, -100999]);
  assert.equal(chatAutorizado(12345), true);
  assert.equal(chatAutorizado(-100999), true);
  assert.equal(chatAutorizado(999), false);
});

test('entradas basura en la lista se descartan', () => {
  process.env.TELEGRAM_CHATS_PERMITIDOS = 'abc,,0, 42 ';
  assert.deepEqual(chatsPermitidos(), [42]);
  assert.equal(chatAutorizado(0), false);
});
