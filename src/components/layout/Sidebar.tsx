'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  SlidersHorizontal,
  History,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Factory,
  ArrowLeftRight,
} from 'lucide-react';
import { RolUsuario } from '@/types';

interface SidebarProps {
  rol: RolUsuario;
  isOpen: boolean;
  onClose: () => void;
}

interface SubNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: RolUsuario[];
}

interface NavItem {
  name: string;
  href: string;
  matchPaths: string[];
  icon: React.ElementType;
  roles: RolUsuario[];
  subItems?: SubNavItem[];
}

export function Sidebar({ rol, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const NAV_ITEMS: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      matchPaths: ['/dashboard'],
      icon: LayoutDashboard,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
    },
    {
      name: 'Inventario y Ajustes',
      href: '/inventario',
      matchPaths: ['/inventario', '/ajustes'],
      icon: Boxes,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
      subItems: [
        {
          name: 'Catálogo Inventario',
          href: '/inventario',
          icon: Boxes,
          roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
        },
        {
          name: 'Ajustes Auditoría',
          href: '/ajustes',
          icon: SlidersHorizontal,
          roles: ['ADMIN', 'ALMACENISTA'],
        },
      ],
    },
    {
      name: 'Entradas, Salidas y Dev.',
      href: rol === 'JEFE_AREA' ? '/salidas' : '/entradas',
      matchPaths: ['/entradas', '/salidas', '/devoluciones'],
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
      subItems: [
        {
          name: 'Entradas',
          href: '/entradas',
          icon: ArrowDownToLine,
          roles: ['ADMIN', 'ALMACENISTA'],
        },
        {
          name: 'Salidas / Vales',
          href: '/salidas',
          icon: ArrowUpFromLine,
          roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
        },
        {
          name: 'Devoluciones',
          href: '/devoluciones',
          icon: RotateCcw,
          roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
        },
      ],
    },
    {
      name: 'Movimientos',
      href: '/movimientos',
      matchPaths: ['/movimientos'],
      icon: History,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
    },
    {
      name: 'Alertas',
      href: '/alertas',
      matchPaths: ['/alertas'],
      icon: AlertTriangle,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
    },
    {
      name: 'Reportes CSV',
      href: '/reportes',
      matchPaths: ['/reportes'],
      icon: FileSpreadsheet,
      roles: ['ADMIN'],
    },
    {
      name: 'Usuarios',
      href: '/usuarios',
      matchPaths: ['/usuarios'],
      icon: Users,
      roles: ['ADMIN'],
    },
  ];

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(rol));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-indigo-950/90 backdrop-blur-xl border-r border-violet-500/40 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } print:hidden shadow-2xl`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-violet-500/30 bg-slate-950/60">
          <div className="p-2 rotate-3 bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white rounded-tl-xl rounded-br-xl shadow-lg shadow-fuchsia-500/30 font-bold">
            <Factory className="w-5 h-5 -rotate-3" />
          </div>
          <div>
            <div className="text-lg font-black tracking-wide text-white flex items-center gap-1.5">
              <span className="text-white">FACTORY</span>
              <span className="text-amber-300">STOCK</span>
            </div>
            <p className="text-[11px] text-fuchsia-200 font-mono font-extrabold tracking-widest uppercase">
              Almacén Industrial
            </p>
          </div>
        </div>

        {/* Rol Badge */}
        <div className="px-5 py-3.5 border-b border-violet-500/30 bg-indigo-900/40">
          <span className="text-[11px] font-extrabold text-violet-200 uppercase tracking-widest block mb-1.5">
            Modo Operativo:
          </span>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-tl-xl rounded-br-xl bg-fuchsia-950/90 border border-fuchsia-400/60 text-xs font-mono font-black text-amber-300 shadow-sm">
            <span className="w-2.5 h-2.5 rotate-45 bg-amber-400 animate-pulse"></span>
            ROL: {rol}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = item.matchPaths.includes(pathname);
            const Icon = item.icon;
            const visibleSubItems = item.subItems?.filter((sub) => sub.roles.includes(rol));

            return (
              <div key={item.name} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-tl-xl rounded-br-xl text-sm font-extrabold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-lg shadow-fuchsia-500/30 border border-white/25 scale-[1.02]'
                      : 'text-white hover:text-amber-200 hover:bg-violet-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-fuchsia-300'}`} />
                  <span className="drop-shadow-sm truncate">{item.name}</span>
                </Link>

                {/* Sub-opciones integradas dentro del mismo menú unificado */}
                {visibleSubItems && visibleSubItems.length > 0 && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-violet-500/40 ml-4">
                    {visibleSubItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-tl-lg rounded-br-lg text-xs font-bold transition-all ${
                            isSubActive
                              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                              : 'text-violet-200 hover:text-white hover:bg-violet-900/40'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-slate-950' : 'text-amber-300'}`} />
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-violet-500/30 bg-slate-950/80 text-xs text-violet-200 text-center">
          <p className="font-extrabold text-white tracking-wide">FactoryStock v2.0</p>
          <p className="text-[11px] text-fuchsia-200 font-semibold">Planta Manufactura &bull; ISO-9001</p>
        </div>
      </aside>
    </>
  );
}
