'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, SlidersHorizontal } from 'lucide-react';
import { RolUsuario } from '@/types';

interface InventarioNavTabsProps {
  userRole: RolUsuario;
}

export function InventarioNavTabs({ userRole }: InventarioNavTabsProps) {
  const pathname = usePathname();

  return (
    <div className="bg-indigo-950/90 backdrop-blur-md border border-violet-400/50 p-2 rounded-tl-2xl rounded-br-2xl shadow-xl flex flex-wrap items-center gap-2">
      <Link
        href="/inventario"
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-tl-xl rounded-br-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
          pathname === '/inventario'
            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30 border border-white/30'
            : 'text-violet-200 hover:text-white hover:bg-violet-900/50'
        }`}
      >
        <Boxes className="w-4 h-4 text-amber-300" />
        <span>Catálogo de Inventario</span>
      </Link>

      {userRole !== 'JEFE_AREA' && (
        <Link
          href="/ajustes"
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-tl-xl rounded-br-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
            pathname === '/ajustes'
              ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30 border border-white/30'
              : 'text-violet-200 hover:text-white hover:bg-violet-900/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-300" />
          <span>Ajustes de Inventario</span>
        </Link>
      )}
    </div>
  );
}
