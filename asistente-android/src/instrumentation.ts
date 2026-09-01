/**
 * Se ejecuta una vez al arrancar el servidor. Despierta al asistente para que
 * el bot de Telegram y el barrido de recordatorios queden andando solos: sin
 * esto quedarían mudos tras cada reinicio hasta que alguien abriera la app.
 *
 * No importa nada a propósito. Next compila este archivo también para el
 * runtime edge, que no tiene los módulos de Node que usan el almacén y el
 * envío de notificaciones, así que el arranque se hace con una petición a la
 * propia app en vez de llamando al código directamente.
 */
export function register(): void {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const puerto = process.env.PORT ?? '3000';
  const url = `http://127.0.0.1:${puerto}/api/estado`;

  const despertar = (intentosRestantes: number): void => {
    setTimeout(() => {
      fetch(url)
        .then((respuesta) => {
          if (respuesta.ok) {
            console.log('Asistente despierto: bot de Telegram y recordatorios activos.');
          } else if (intentosRestantes > 0) {
            despertar(intentosRestantes - 1);
          }
        })
        .catch(() => {
          if (intentosRestantes > 0) despertar(intentosRestantes - 1);
        });
    }, 1500);
  };

  despertar(5);
}
