'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, RotateCcw } from 'lucide-react';
import { RolUsuario } from '@/types';

interface OperacionesNavTabsProps {
  userRole: RolUsuario;
}

export function OperacionesNavTabs({ userRole }: OperacionesNavTabsProps) {
  const pathname = usePathname();

  return (
    <div className="bg-indigo-950/90 backdrop-blur-md border border-violet-400/50 p-2 rounded-tl-2xl rounded-br-2xl shadow-xl flex flex-wrap items-center gap-2">
      {userRole !== 'JEFE_AREA' && (
        <Link
          href="/entradas"
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-tl-xl rounded-br-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
            pathname === '/entradas'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 border border-white/30'
              : 'text-violet-200 hover:text-white hover:bg-violet-900/50'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4 text-amber-300" />
          <span>Entradas (Compras)</span>
        </Link>
      )}

      <Link
        href="/salidas"
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-tl-xl rounded-br-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
          pathname === '/salidas'
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 border border-white/30'
            : 'text-violet-200 hover:text-white hover:bg-violet-900/50'
        }`}
      >
        <ArrowUpFromLine className="w-4 h-4 text-amber-200" />
        <span>Salidas / Vales</span>
      </Link>

      <Link
        href="/devoluciones"
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-tl-xl rounded-br-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
          pathname === '/devoluciones'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-white/30'
            : 'text-violet-200 hover:text-white hover:bg-violet-900/50'
        }`}
      >
        <RotateCcw className="w-4 h-4 text-amber-300" />
        <span>Devoluciones</span>
      </Link>
    </div>
  );
}
