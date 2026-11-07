'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UsuarioAutenticado } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  user: UsuarioAutenticado;
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 flex flex-col font-sans relative">
      {/* Fondo industrial muy claro, nítido y luminoso */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/warehouse-bg.jpg?v=4"
          alt="Almacén Industrial"
          className="w-full h-full object-cover object-center opacity-100 brightness-125 contrast-105 saturate-110"
        />
        {/* Velo claro luminoso para resaltar el fondo claro sin perder legibilidad */}
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/20 via-slate-900/15 to-indigo-950/30" />
      </div>

      <Sidebar
        rol={user.rol}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col flex-1 relative z-10">
        <Header
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
