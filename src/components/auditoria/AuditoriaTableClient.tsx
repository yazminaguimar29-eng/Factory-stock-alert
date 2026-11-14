'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Printer,
  ShieldCheck,
  User,
  Laptop,
  CheckCircle2,
  Calendar,
  SlidersHorizontal,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  LogIn,
  PackagePlus,
  Edit3,
} from 'lucide-react';
import { BitacoraAuditoria, TipoAccionAuditoria } from '@/types';

interface AuditoriaTableClientProps {
  initialLogs: BitacoraAuditoria[];
}

export function AuditoriaTableClient({ initialLogs }: AuditoriaTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('TODAS');
  const [dateFilter, setDateFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      // Filtro por tipo de acción
      if (actionFilter !== 'TODAS' && log.tipo_accion !== actionFilter) {
        return false;
      }

      // Filtro por fecha (YYYY-MM-DD)
      if (dateFilter && !log.fecha.startsWith(dateFilter)) {
        return false;
      }

      // Búsqueda general
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const usr = (log.usuario_nombre || '').toLowerCase();
        const email = (log.usuario_email || '').toLowerCase();
        const det = (log.detalles || '').toLowerCase();
        const dev = (log.dispositivo || '').toLowerCase();
        const ip = (log.ip || '').toLowerCase();
        return (
          usr.includes(q) ||
          email.includes(q) ||
          det.includes(q) ||
          dev.includes(q) ||
          ip.includes(q)
        );
      }

      return true;
    });
  }, [initialLogs, actionFilter, dateFilter, searchQuery]);

  const getActionBadge = (action: TipoAccionAuditoria) => {
    switch (action) {
      case 'INICIO_SESION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-600/60">
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Inicio Sesión</span>
          </span>
        );
      case 'ENTRADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-600/60">
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>Entrada Compra</span>
          </span>
        );
      case 'SALIDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-600/60">
            <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-400" />
            <span>Salida Vale</span>
          </span>
        );
      case 'DEVOLUCION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-600/60">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Devolución</span>
          </span>
        );
      case 'AJUSTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-600/60">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajuste Auditoría</span>
          </span>
        );
      case 'ALTA_PRODUCTO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-purple-950/90 text-purple-300 border border-purple-600/60">
            <PackagePlus className="w-3.5 h-3.5 text-purple-400" />
            <span>Alta SKU</span>
          </span>
        );
      case 'EDICION_PRODUCTO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-blue-950/90 text-blue-300 border border-blue-600/60">
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Edición SKU</span>
          </span>
        );
      default:
        return <span>{action}</span>;
    }
  };

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'text-purple-300 bg-purple-950 border-purple-800';
      case 'ALMACENISTA':
        return 'text-amber-300 bg-amber-950 border-amber-800';
      case 'JEFE_AREA':
        return 'text-emerald-300 bg-emerald-950 border-emerald-800';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
      {/* Controles y Filtros */}
      <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
          {/* Buscador */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuario, IP, detalle..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-400 rounded-xl text-xs text-white outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Filtro por Acción */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none"
          >
            <option value="TODAS">Todas las Acciones</option>
            <option value="INICIO_SESION">Inicios de Sesión</option>
            <option value="ENTRADA">Entradas de Compra</option>
            <option value="SALIDA">Salidas por Vales</option>
            <option value="DEVOLUCION">Devoluciones</option>
            <option value="AJUSTE">Ajustes de Inventario</option>
            <option value="ALTA_PRODUCTO">Altas de Material</option>
          </select>

          {/* Filtro por Fecha */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none"
            />
          </div>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Limpiar fecha
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white transition"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Imprimir Bitácora</span>
          </button>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <th className="py-3 px-4">Fecha y Hora</th>
              <th className="py-3 px-4">Usuario Responsable</th>
              <th className="py-3 px-4">Tipo Acción</th>
              <th className="py-3 px-4">Detalle de la Operación</th>
              <th className="py-3 px-4">Dispositivo / IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No se encontraron registros de auditoría con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                  {/* Fecha */}
                  <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {new Date(log.fecha).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>

                  {/* Usuario y Rol */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px]">
                        {log.usuario_nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-tight">{log.usuario_nombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono leading-none">
                            {log.usuario_email}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${getRoleBadge(
                              log.usuario_rol
                            )}`}
                          >
                            {log.usuario_rol}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tipo Acción */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{getActionBadge(log.tipo_accion)}</td>

                  {/* Detalle */}
                  <td className="py-3.5 px-4">
                    <p className="text-slate-200 font-medium leading-snug">{log.detalles}</p>
                  </td>

                  {/* Dispositivo e IP */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 text-slate-300 font-mono">
                        <span>IP:</span>
                        <code className="text-cyan-300">{log.ip || 'Localhost'}</code>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-xs truncate" title={log.dispositivo}>
                        {log.dispositivo || 'N/A'}
                      </p>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>
          Registros mostrados: <strong>{filteredLogs.length}</strong> de <strong>{initialLogs.length}</strong>
        </span>
        <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Cifrado y Auditoría de Seguridad Activa
        </span>
      </div>
    </div>
  );
}
