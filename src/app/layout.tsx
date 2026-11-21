import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastContext';

export const metadata: Metadata = {
  title: 'FactoryStock — Control de Inventario de Almacén Industrial',
  description: 'Sistema de Control de Inventario de Almacén Industrial con Alertas Automáticas para Plantas de Manufactura',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
