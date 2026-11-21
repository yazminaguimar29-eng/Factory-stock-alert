'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UsuarioAutenticado } from '@/types';
import { ToastProvider } from '@/components/ui/ToastContext';
import { PanelLeftOpen } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  user: UsuarioAutenticado;
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('factorystock_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    } catch {
      // localStorage fallback
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('factorystock_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500 selection:text-slate-950">
        {/* Fondo industrial de alta definición y luminosidad */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src="/warehouse-bg.jpg?v=4"
            alt="Almacén Industrial"
            className="w-full h-full object-cover object-center opacity-100 brightness-110 contrast-110 saturate-110"
          />
          {/* Velo claro luminoso con degradado tecnológico llamativo */}
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-cyan-950/30" />
        </div>

        <Sidebar
          rol={user.rol}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Botón flotante para reabrir menú cuando esté oculto en escritorio */}
        {isSidebarCollapsed && (
          <button
            onClick={handleToggleCollapse}
            className="hidden lg:flex fixed left-3 bottom-5 z-40 items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-tl-xl rounded-br-xl shadow-2xl shadow-cyan-500/40 border-2 border-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
            title="Mostrar barra lateral"
          >
            <PanelLeftOpen className="w-4 h-4 text-slate-950" />
            <span>Mostrar Menú</span>
          </button>
        )}

        {/* Contenedor principal con transición suave de ancho para ocultar/mostrar */}
        <div
          className={`flex flex-col flex-1 relative z-10 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
          }`}
        >
          <Header
            user={user}
            onOpenSidebar={() => setSidebarOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebarCollapse={handleToggleCollapse}
          />

          <main className="flex-1 p-3 sm:p-5 md:p-7 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
