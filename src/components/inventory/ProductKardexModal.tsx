'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  FileSpreadsheet,
  Printer,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  SlidersHorizontal,
  Box,
  MapPin,
  Building2,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';
import { Producto, MovimientoConDetalle } from '@/types';

interface ProductKardexModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
}

export function ProductKardexModal({ isOpen, onClose, producto }: ProductKardexModalProps) {
  const [movimientos, setMovimientos] = useState<MovimientoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen || !producto) return;

    setLoading(true);
    fetch(`/api/movimientos?productoId=${producto.id}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.movimientos || [];
        setMovimientos(list);
      })
      .catch((err) => {
        console.error('Error al cargar movimientos para Kardex:', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, producto]);

  // Cálculo cronológico de saldos de Kardex
  // Ordenar del más antiguo al más reciente para construir el saldo acumulado
  const kardexLedger = useMemo(() => {
    if (!producto) return [];

    // Clonar y ordenar cronológicamente ascendente (antiguos a recientes)
    const sorted = [...movimientos].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    let runningBalance = 0;
    const ledger = sorted.map((m) => {
      let delta = 0;
      if (m.tipo === 'ENTRADA_COMPRA' || m.tipo === 'DEVOLUCION') {
        delta = m.cantidad;
        runningBalance += delta;
      } else if (m.tipo === 'SALIDA_VALE') {
        delta = -m.cantidad;
        runningBalance += delta;
      } else if (m.tipo === 'AJUSTE') {
        // En ajuste, m.cantidad suele ser la diferencia o el nuevo valor
        delta = m.cantidad;
        runningBalance += delta;
      }

      return {
        ...m,
        delta,
        saldoResultante: Math.max(0, runningBalance),
      };
    });

    // Invertir para mostrar los más recientes arriba
    return ledger.reverse();
  }, [movimientos, producto]);

  // Filtrado para visualización
  const filteredLedger = useMemo(() => {
    return kardexLedger.filter((item) => {
      if (filterTipo !== 'TODOS' && item.tipo !== filterTipo) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const doc = (item.no_factura_o_vale || '').toLowerCase();
        const resp = (item.responsable_recibe || '').toLowerCase();
        const area = (item.area_solicitante || '').toLowerCase();
        const mot = (item.motivo_orden_trabajo || '').toLowerCase();
        return doc.includes(q) || resp.includes(q) || area.includes(q) || mot.includes(q);
      }
      return true;
    });
  }, [kardexLedger, filterTipo, searchQuery]);

  // Métricas totales
  const totalEntradas = useMemo(() => {
    return movimientos
      .filter((m) => m.tipo === 'ENTRADA_COMPRA')
      .reduce((sum, m) => sum + m.cantidad, 0);
  }, [movimientos]);

  const totalSalidas = useMemo(() => {
    return movimientos
      .filter((m) => m.tipo === 'SALIDA_VALE')
      .reduce((sum, m) => sum + m.cantidad, 0);
  }, [movimientos]);

  if (!isOpen || !producto) return null;

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA_COMPRA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-600/60">
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>Entrada Compra</span>
          </span>
        );
      case 'SALIDA_VALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/90 text-rose-300 border border-rose-600/60">
            <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-400" />
            <span>Salida Vale</span>
          </span>
        );
      case 'DEVOLUCION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-600/60">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Devolución</span>
          </span>
        );
      case 'AJUSTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950/90 text-amber-300 border border-amber-600/60">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajuste Auditoría</span>
          </span>
        );
      default:
        return <span>{tipo}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="bg-slate-900 border-2 border-indigo-500/50 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white print:border-0 print:max-h-none print:shadow-none">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-indigo-500/30 flex items-center justify-between bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl text-white shadow-lg shadow-indigo-500/25">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-indigo-950 text-cyan-300 border border-indigo-600">
                  {producto.codigo_sku}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">
                  {producto.categoria}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 uppercase line-clamp-1">
                Kardex &bull; {producto.nombre}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas KPI de Resumen Rápido del Material */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Stock Actual</p>
            <h4 className="text-2xl font-black text-emerald-400 mt-0.5">
              {producto.stock_actual}{' '}
              <span className="text-xs text-slate-300 font-normal font-mono">{producto.unidad_medida}</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">
              Mín: {producto.stock_min} | Máx: {producto.stock_max}
            </p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Entradas Totales</p>
            <h4 className="text-2xl font-black text-cyan-400 mt-0.5">
              +{totalEntradas}{' '}
              <span className="text-xs text-slate-300 font-normal font-mono">{producto.unidad_medida}</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Recepciones de compra</p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Salidas Totales</p>
            <h4 className="text-2xl font-black text-rose-400 mt-0.5">
              -{totalSalidas}{' '}
              <span className="text-xs text-slate-300 font-normal font-mono">{producto.unidad_medida}</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Vales surtidos a planta</p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Ubicación Anaquel</p>
            <h4 className="text-xl font-black font-mono text-amber-300 mt-0.5 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              {producto.ubicacion_anaquel || 'S/U'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Prov: {producto.proveedor_principal}</p>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por vale, factura, solicitante..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-indigo-400 rounded-xl text-xs text-white outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="ENTRADA_COMPRA">Solo Entradas</option>
              <option value="SALIDA_VALE">Solo Salidas</option>
              <option value="DEVOLUCION">Solo Devoluciones</option>
              <option value="AJUSTE">Solo Ajustes</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Imprimir Kardex</span>
          </button>
        </div>

        {/* Tabla Cronológica de Kardex */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Cargando movimientos cronológicos...</p>
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-bold text-slate-400">Sin movimientos registrados</p>
              <p className="text-xs text-slate-500 mt-1">
                No hay historial de entradas o salidas para este material aún.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4">Documento / Folio</th>
                    <th className="py-3 px-4">Área / Destino</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4 text-right">Cantidad</th>
                    <th className="py-3 px-4 text-right bg-indigo-950/40">Saldo Almacén</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredLedger.map((mov) => {
                    const isPositive = mov.delta > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {new Date(mov.fecha).toLocaleString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">{getTipoBadge(mov.tipo)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {mov.no_factura_o_vale || 'S/F'}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {mov.area_solicitante || 'Planta'}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {mov.responsable_recibe || mov.usuario_almacenista || 'Operador'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              isPositive
                                ? 'text-emerald-400 bg-emerald-950/80'
                                : 'text-rose-400 bg-rose-950/80'
                            }`}
                          >
                            {isPositive ? `+${mov.cantidad}` : `-${mov.cantidad}`}{' '}
                            <span className="text-[10px] font-normal">{producto.unidad_medida}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-300 bg-indigo-950/20">
                          {mov.saldoResultante}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            {producto.unidad_medida}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-400">
            Total de movimientos auditados: <strong>{filteredLedger.length}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Cerrar Kardex
          </button>
        </div>

      </div>
    </div>
  );
}
