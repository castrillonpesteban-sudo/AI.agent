import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NavegacionInferior } from '@/components/NavegacionInferior';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import { AsistenteProvider } from '@/lib/cliente/AsistenteProvider';

export const metadata: Metadata = {
  title: 'Asistente Personal',
  description:
    'Asistente personal en formato de chat: escribe como en mensajes, adjunta tareas, guarda tus dudas y recibe recordatorios.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Asistente',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <RegisterServiceWorker />
        <AsistenteProvider>
          <div className="flex h-dvh flex-col bg-background">
            {children}
            <NavegacionInferior />
          </div>
        </AsistenteProvider>
      </body>
    </html>
  );
}
