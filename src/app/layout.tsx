import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FactoryStock — Control de Inventario de Almacén Industrial',
  description: 'Sistema de Control de Inventario de Almacén Industrial con Alertas Automáticas para Plantas de Manufactura',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
