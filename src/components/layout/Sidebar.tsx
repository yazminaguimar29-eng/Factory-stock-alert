'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
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
  ShieldCheck,
  PanelLeftClose,
  ChevronLeft,
} from 'lucide-react';
import { RolUsuario } from '@/types';

interface SidebarProps {
  rol: RolUsuario;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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

export function Sidebar({ rol, isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const NAV_ITEMS: NavItem[] = [
    {
      name: 'Home',
      href: '/home',
      matchPaths: ['/home'],
      icon: Home,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      matchPaths: ['/dashboard'],
      icon: LayoutDashboard,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
    },
    {
      name: 'Inventario',
      href: '/inventario',
      matchPaths: ['/inventario'],
      icon: Boxes,
      roles: ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'],
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
    {
      name: 'Bitácora Auditoría',
      href: '/auditoria',
      matchPaths: ['/auditoria'],
      icon: ShieldCheck,
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950/95 backdrop-blur-2xl border-r-2 border-violet-500/50 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'} print:hidden shadow-2xl`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b-2 border-violet-500/40 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rotate-3 bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 text-slate-950 rounded-tl-xl rounded-br-xl shadow-lg shadow-cyan-500/40 font-black">
              <Factory className="w-5 h-5 -rotate-3 text-slate-950" />
            </div>
            <div>
              <div className="text-lg font-black tracking-wider text-white flex items-center gap-1">
                <span className="text-white drop-shadow">FACTORY</span>
                <span className="text-amber-400 drop-shadow">STOCK</span>
              </div>
              <p className="text-[10px] text-cyan-300 font-mono font-black tracking-widest uppercase">
                Almacén Industrial
              </p>
            </div>
          </div>

          {/* Botón de repliegue en escritorio */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-violet-900/60 transition-colors"
              title="Ocultar menú lateral"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Rol Badge con Colores Llamativos */}
        <div className="px-5 py-3 border-b border-violet-500/30 bg-violet-950/40">
          <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest block mb-1">
            Modo Operativo:
          </span>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-tl-xl rounded-br-xl bg-slate-900 border border-amber-400 text-xs font-mono font-black text-amber-300 shadow-md">
            <span className="w-2.5 h-2.5 rotate-45 bg-amber-400 animate-pulse shadow-sm shadow-amber-400"></span>
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-tl-xl rounded-br-xl text-sm font-black tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-400 text-slate-950 shadow-lg shadow-cyan-500/30 border-2 border-white scale-[1.02]'
                      : 'text-slate-100 hover:text-cyan-300 hover:bg-violet-900/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span className="drop-shadow-sm truncate">{item.name}</span>
                </Link>

                {/* Sub-opciones integradas dentro del mismo menú unificado */}
                {visibleSubItems && visibleSubItems.length > 0 && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-cyan-400/50 ml-4">
                    {visibleSubItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-tl-lg rounded-br-lg text-xs font-black transition-all ${
                            isSubActive
                              ? 'bg-amber-400 text-slate-950 shadow-md border border-amber-300'
                              : 'text-violet-200 hover:text-white hover:bg-violet-900/40'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-slate-950' : 'text-amber-400'}`} />
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

        {/* Botón inferior para colapsar en escritorio */}
        {onToggleCollapse && (
          <div className="p-3 border-t border-violet-500/30 hidden lg:block">
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-tl-xl rounded-br-xl bg-violet-950/70 hover:bg-violet-900 border border-violet-400/60 text-xs font-black text-amber-300 transition-all shadow"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span>Ocultar Barra Lateral</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 border-t border-violet-500/30 bg-slate-950 text-xs text-violet-200 text-center">
          <p className="font-black text-white tracking-wide">FactoryStock v2.0</p>
          <p className="text-[10px] text-cyan-300 font-bold">Planta Manufactura &bull; ISO-9001</p>
        </div>
      </aside>
    </>
  );
}
