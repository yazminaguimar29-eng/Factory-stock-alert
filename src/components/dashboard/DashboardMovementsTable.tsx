'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  History,
  ArrowRight,
  Calendar,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  X,
  Search,
} from 'lucide-react';
import { MovimientoConDetalle } from '@/types';

interface DashboardMovementsTableProps {
  movimientos: MovimientoConDetalle[];
}

export function DashboardMovementsTable({ movimientos }: DashboardMovementsTableProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Por defecto: más recientes hasta las anteriores

  // Convertir fecha ISO a YYYY-MM-DD local para comparación exacta con el selector de fecha
  const getLocalDateString = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate.slice(0, 10);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...movimientos];

    // 1. Filtro por fecha seleccionada
    if (selectedDate) {
      list = list.filter((m) => {
        const localStr = getLocalDateString(m.fecha);
        const utcStr = (m.fecha || '').slice(0, 10);
        return localStr === selectedDate || utcStr === selectedDate;
      });
    }

    // 2. Filtro rápido por texto (SKU, material, folio, responsable)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.producto_sku || '').toLowerCase().includes(q) ||
          (m.producto_nombre || '').toLowerCase().includes(q) ||
          (m.no_factura_o_vale || '').toLowerCase().includes(q) ||
          (m.responsable_recibe || '').toLowerCase().includes(q) ||
          (m.area_solicitante || '').toLowerCase().includes(q)
      );
    }

    // 3. Ordenar de las más recientes hasta las anteriores (desc) o viceversa (asc)
    list.sort((a, b) => {
      const timeA = new Date(a.fecha).getTime() || 0;
      const timeB = new Date(b.fecha).getTime() || 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [movimientos, selectedDate, searchQuery, sortOrder]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-tl-3xl rounded-br-3xl overflow-hidden shadow-xl">
      {/* Cabecera y Filtros de Fecha / Secuencia */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Últimos Movimientos de Almacén
            </h3>
            <p className="text-[11px] text-violet-200 font-semibold">
              Ordenados de los más recientes hasta los anteriores ({filteredAndSorted.length} registros)
            </p>
          </div>
        </div>

        {/* Barra de Buscador de Fecha y Control de Orden */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Buscador por fecha tipo filtro */}
          <div className="relative flex items-center bg-slate-900 border border-violet-400/50 rounded-tl-xl rounded-br-xl px-3 py-1.5 shadow-inner">
            <Calendar className="w-4 h-4 text-amber-300 mr-2 shrink-0" />
            <span className="text-[11px] font-extrabold text-violet-200 uppercase mr-2">
              Fecha:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
              title="Filtrar movimientos por fecha"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                title="Quitar filtro de fecha"
                className="ml-2 p-0.5 rounded bg-rose-600/80 hover:bg-rose-500 text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Buscador rápido adicional */}
          <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-tl-xl rounded-br-xl px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar SKU, folio..."
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-32 sm:w-40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón para invertir secuencia (Más recientes <-> Anteriores) */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-tl-xl rounded-br-xl bg-indigo-950 hover:bg-indigo-900 border border-violet-400/50 text-xs font-extrabold text-white transition shadow-sm"
            title="Cambiar secuencia de orden por fecha"
          >
            {sortOrder === 'desc' ? (
              <>
                <ArrowDownWideNarrow className="w-4 h-4 text-amber-300" />
                <span>Más Recientes ↓</span>
              </>
            ) : (
              <>
                <ArrowUpNarrowWide className="w-4 h-4 text-fuchsia-300" />
                <span>Más Antiguos ↑</span>
              </>
            )}
          </button>

          <Link
            href="/movimientos"
            className="text-xs font-black text-amber-300 hover:text-amber-200 flex items-center gap-1 px-2 py-1"
          >
            <span>Ver Historial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider font-extrabold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Fecha / Hora</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">SKU / Material</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Área Solicitante / Destino</th>
              <th className="px-4 py-3">Responsable Recibe</th>
              <th className="px-4 py-3">Folio / Factura</th>
              <th className="px-4 py-3 text-right">Almacenista</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-300">
                  No se encontraron movimientos{selectedDate ? ` en la fecha ${selectedDate}` : ''}.
                </td>
              </tr>
            ) : (
              filteredAndSorted.slice(0, 15).map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                    {new Date(m.fecha).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        m.tipo === 'ENTRADA_COMPRA'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : m.tipo === 'SALIDA_VALE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : m.tipo === 'DEVOLUCION'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-white">{m.producto_sku}</p>
                    <p className="text-[11px] text-slate-300 truncate max-w-xs">{m.producto_nombre}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-white text-sm">
                    {m.cantidad} <span className="text-xs text-slate-300 font-normal">{m.producto_unidad}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{m.area_solicitante}</td>
                  <td className="px-4 py-3 text-slate-200">{m.responsable_recibe}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{m.no_factura_o_vale}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{m.usuario_almacenista}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
