'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  LogOut,
  UserCircle2,
  ShieldCheck,
  Warehouse,
  HardHat,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
} from 'lucide-react';
import { UsuarioAutenticado } from '@/types';

interface HeaderProps {
  user: UsuarioAutenticado;
  onOpenSidebar: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export function Header({
  user,
  onOpenSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  const getRoleIcon = () => {
    switch (user.rol) {
      case 'ADMIN':
        return <ShieldCheck className="w-4 h-4 text-cyan-300" />;
      case 'ALMACENISTA':
        return <Warehouse className="w-4 h-4 text-amber-300" />;
      case 'JEFE_AREA':
        return <HardHat className="w-4 h-4 text-emerald-300" />;
    }
  };

  const getRoleBadgeColor = () => {
    switch (user.rol) {
      case 'ADMIN':
        return 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-cyan-950/50';
      case 'ALMACENISTA':
        return 'bg-amber-950 text-amber-300 border-amber-400 shadow-amber-950/50';
      case 'JEFE_AREA':
        return 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-emerald-950/50';
    }
  };

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-2xl border-b-2 border-violet-500/50 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 print:hidden shadow-2xl">
      {/* Botón menú móvil y toggle de ocultar para escritorio */}
      <div className="flex items-center gap-3">
        {/* Toggle Móvil */}
        <button
          onClick={onOpenSidebar}
          className="p-2 text-white hover:text-amber-300 rounded-tl-xl rounded-br-xl bg-violet-900/60 hover:bg-violet-800 lg:hidden shadow"
          title="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Toggle Escritorio: Desplazamiento de Ocultar Menú */}
        <button
          onClick={onToggleSidebarCollapse}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-tl-xl rounded-br-xl bg-gradient-to-r from-violet-900/90 to-indigo-900/90 hover:from-violet-800 hover:to-indigo-800 border-2 border-cyan-400/70 text-xs font-black text-white hover:text-cyan-200 transition-all duration-200 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
          title={isSidebarCollapsed ? "Expandir menú lateral" : "Ocultar menú lateral"}
        >
          {isSidebarCollapsed ? (
            <>
              <PanelLeftOpen className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">Mostrar Menú</span>
            </>
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 text-amber-300" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-300">Ocultar Menú</span>
            </>
          )}
        </button>

        {/* Identificador de Planta */}
        <div className="hidden sm:flex items-center gap-2 pl-2">
          <span className="w-2.5 h-2.5 rotate-45 bg-fuchsia-500 inline-block shadow-sm shadow-fuchsia-400"></span>
          <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider drop-shadow">
            Almacén General &bull; <span className="text-amber-300">{user.area || 'Planta de Manufactura'}</span>
          </span>
        </div>
      </div>

      {/* Indicador Central: Conexión Activa en Tiempo Real */}
      <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-tl-xl rounded-br-xl bg-slate-900/90 border border-emerald-400/50 shadow-md">
        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="text-[11px] font-mono font-black text-emerald-300 uppercase tracking-widest">
          Sincronización en Tiempo Real
        </span>
      </div>

      {/* Usuario actual & Acciones */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900/95 border-2 border-violet-500/60 rounded-tl-2xl rounded-br-2xl shadow-xl">
          <UserCircle2 className="w-6 h-6 text-cyan-300" />
          <div className="text-left">
            <p className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-sm">
              {user.nombre}
            </p>
            <p className="text-[11px] font-bold text-violet-300 leading-tight">
              {user.email}
            </p>
          </div>
          <span
            className={`hidden md:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-tl-lg rounded-br-lg text-[11px] font-mono font-black border-2 ${getRoleBadgeColor()}`}
          >
            {getRoleIcon()}
            {user.rol}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white hover:text-amber-200 bg-rose-600 hover:bg-rose-500 border-2 border-rose-400 rounded-tl-xl rounded-br-xl transition-all shadow-lg shadow-rose-900/50 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
