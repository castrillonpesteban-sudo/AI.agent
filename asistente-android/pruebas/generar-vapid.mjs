/**
 * Genera un par de claves VAPID para las notificaciones push.
 * Uso: node pruebas/generar-vapid.mjs
 * Copia la salida a .env.local.
 */
import webpush from 'web-push';

const claves = webpush.generateVAPIDKeys();

console.log(`VAPID_PUBLIC_KEY=${claves.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${claves.privateKey}`);
console.log('VAPID_SUBJECT=mailto:tu-correo@ejemplo.com');
