/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Arranca el bot y el planificador al encender el servidor (src/instrumentation.ts).
  experimental: { instrumentationHook: true },
  // Empaqueta el servidor con solo sus dependencias reales, para la imagen Docker.
  output: process.env.SALIDA_STANDALONE === '1' ? 'standalone' : undefined,
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],
};

module.exports = nextConfig;
