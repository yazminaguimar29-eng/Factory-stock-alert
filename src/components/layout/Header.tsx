'use client';
 
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, UserCircle2, ShieldCheck, Warehouse, HardHat, FileSpreadsheet } from 'lucide-react';
import { UsuarioAutenticado } from '@/types';
import { GoogleSheetsModal } from '@/components/sheets/GoogleSheetsModal';

interface HeaderProps {
  user: UsuarioAutenticado;
  onOpenSidebar: () => void;
}

export function Header({ user, onOpenSidebar }: HeaderProps) {
  const router = useRouter();
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

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
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'ALMACENISTA':
        return <Warehouse className="w-3.5 h-3.5 text-amber-400" />;
      case 'JEFE_AREA':
        return <HardHat className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getRoleBadgeColor = () => {
    switch (user.rol) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'ALMACENISTA':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'JEFE_AREA':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <header className="h-16 bg-indigo-950/85 backdrop-blur-xl border-b border-violet-500/40 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 print:hidden shadow-lg">
      {/* Botón menú móvil y título de la sección */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-white hover:text-amber-300 rounded-tl-xl rounded-br-xl hover:bg-violet-900/60 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs sm:text-sm font-black text-white uppercase tracking-widest drop-shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rotate-45 bg-fuchsia-400 inline-block"></span>
            <span>Almacén General &bull; <span className="text-amber-300">{user.area || 'Planta de Manufactura'}</span></span>
          </span>
        </div>
      </div>

      {/* Indicadores centrales */}
      <div className="hidden md:flex items-center gap-2.5">
        <button
          onClick={() => setIsSheetsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-tl-xl rounded-br-xl bg-teal-950/90 hover:bg-teal-900 border border-teal-400/60 text-xs text-teal-200 shadow-md transition cursor-pointer"
          title="Verificar y sincronizar conexión con Google Sheets y Google Cloud"
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-300" />
          <span className="font-extrabold font-mono text-[11px] uppercase tracking-wider text-white">Google Sheets</span>
        </button>
      </div>

      {/* Usuario actual & Acciones */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-950/85 border border-violet-400/50 rounded-tl-xl rounded-br-xl shadow-md">
          <UserCircle2 className="w-5 h-5 text-fuchsia-300" />
          <div className="text-left">
            <p className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-sm">
              {user.nombre}
            </p>
            <p className="text-[11px] font-bold text-violet-200 leading-tight">
              {user.email}
            </p>
          </div>
          <span
            className={`hidden md:inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-tl-lg rounded-br-lg text-[11px] font-mono font-black border ${getRoleBadgeColor()}`}
          >
            {getRoleIcon()}
            {user.rol}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white hover:text-amber-200 bg-rose-600/80 hover:bg-rose-600 border border-rose-400/60 rounded-tl-xl rounded-br-xl transition-colors shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>

      {/* Modal de Conexión Google Sheets */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </header>
  );
}
