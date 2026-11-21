'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TicketModal } from '@/components/movements/TicketModal';
import {
  History,
  Search,
  Filter,
  RotateCw,
  Printer,
  Calendar,
  Building2,
  FileText,
  UserCheck,
  Radio,
} from 'lucide-react';
import { MovimientoConDetalle, UsuarioAutenticado, TicketSalida } from '@/types';
import { STOCK_SYNC_EVENT } from '@/lib/events';

export default function MovimientosPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('TODOS');
  const [selectedArea, setSelectedArea] = useState('TODAS');
  
  // Modal ticket
  const [ticketToPrint, setTicketToPrint] = useState<TicketSalida | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      });
  }, []);

  const loadMovimientos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await fetch('/api/movimientos');
      const data = await res.json();
      if (data.movimientos) {
        setMovimientos(data.movimientos);
        const now = new Date();
        setLastSync(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Error cargando movimientos:', err);
    } finally {
      if (!silent) setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadMovimientos(false);

    const handleSync = () => {
      loadMovimientos(true);
    };

    window.addEventListener(STOCK_SYNC_EVENT, handleSync);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      loadMovimientos(true);
    }, 6000);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('factory_stock_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'STOCK_UPDATED') {
            loadMovimientos(true);
          }
        };
      }
    } catch {
      // fallback
    }

    return () => {
      window.removeEventListener(STOCK_SYNC_EVENT, handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [loadMovimientos]);

  const handlePrintTicket = (m: MovimientoConDetalle) => {
    const d = new Date(m.fecha);
    const ticket: TicketSalida = {
      folio_vale: m.no_factura_o_vale || 'VALE-DESPACHO',
      fecha: d.toLocaleDateString('es-MX'),
      hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      producto_nombre: m.producto_nombre || 'Material de Almacén',
      producto_sku: m.producto_sku || 'N/A',
      cantidad: m.cantidad,
      unidad_medida: m.producto_unidad || 'pza',
      area_solicitante: m.area_solicitante,
      responsable_recibe: m.responsable_recibe,
      motivo_orden_trabajo: m.motivo_orden_trabajo,
      usuario_almacenista: m.usuario_almacenista,
      ubicacion_anaquel: m.ubicacion_anaquel || 'N/A',
    };
    setTicketToPrint(ticket);
  };

  // Filtrado
  const filteredMovimientos = movimientos.filter((m) => {
    const sku = m.producto_sku || '';
    const nombre = m.producto_nombre || '';
    const folio = m.no_factura_o_vale || '';
    const resp = m.responsable_recibe || '';
    const mot = m.motivo_orden_trabajo || '';
    const q = search.toLowerCase();

    const matchesSearch =
      sku.toLowerCase().includes(q) ||
      nombre.toLowerCase().includes(q) ||
      folio.toLowerCase().includes(q) ||
      resp.toLowerCase().includes(q) ||
      mot.toLowerCase().includes(q);

    const matchesTipo = selectedTipo === 'TODOS' || m.tipo === selectedTipo;
    const matchesArea = selectedArea === 'TODAS' || m.area_solicitante === selectedArea;

    return matchesSearch && matchesTipo && matchesArea;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : 'animate-pulse'}`} />
                <span>Auto-sincronizado {lastSync && `• ${lastSync}`}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <History className="w-7 h-7 text-cyan-400" />
              <span>Historial de Movimientos de Almacén</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Registro cronológico inmutable de entradas, salidas por vales y devoluciones con sincronización en tiempo real
            </p>
          </div>

          <button
            onClick={() => loadMovimientos(false)}
            title="Refrescar historial"
            className="p-2.5 bg-indigo-950/90 hover:bg-violet-900 text-violet-200 hover:text-cyan-300 rounded-xl border border-violet-500/50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <RotateCw className={`w-4 h-4 ${loading || isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-indigo-950/90 backdrop-blur-md border-2 border-cyan-500/40 border-t-4 border-t-cyan-400 p-4 rounded-3xl shadow-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por SKU, material, folio, OT..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-violet-500/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-semibold"
              />
            </div>

            {/* Tipo de Movimiento */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/90 border border-violet-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
              >
                <option value="TODOS">Todos los Tipos de Movimiento</option>
                <option value="ENTRADA_COMPRA">Entradas por Compra (+)</option>
                <option value="SALIDA_VALE">Salidas por Vales (-)</option>
                <option value="DEVOLUCION">Devoluciones (+)</option>
                <option value="AJUSTE_INVENTARIO">Ajustes de Auditoría</option>
              </select>
            </div>

            {/* Área Solicitante */}
            <div>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/90 border border-violet-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
              >
                <option value="TODAS">Todas las Áreas</option>
                <option value="Producción Línea 1">Producción Línea 1</option>
                <option value="Producción Línea 2">Producción Línea 2</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Calidad">Calidad</option>
                <option value="Embarques">Embarques</option>
                <option value="Almacén Central">Almacén Central</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA DE MOVIMIENTOS */}
        <div className="bg-slate-900 border-2 border-violet-500/40 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider font-black border-b border-violet-500/40">
                <tr>
                  <th className="px-4 py-3.5">Tipo</th>
                  <th className="px-4 py-3.5">Material / SKU</th>
                  <th className="px-4 py-3.5">Cantidad</th>
                  <th className="px-4 py-3.5">Folio / Factura</th>
                  <th className="px-4 py-3.5">Área y Responsable</th>
                  <th className="px-4 py-3.5">Motivo / OT</th>
                  <th className="px-4 py-3.5">Almacenista</th>
                  <th className="px-4 py-3.5">Fecha y Hora</th>
                  <th className="px-4 py-3.5 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 text-xs font-semibold">
                      No se encontraron registros de movimiento con los criterios especificados.
                    </td>
                  </tr>
                ) : (
                  filteredMovimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/80 transition-colors">
                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono font-black ${
                            m.tipo === 'ENTRADA_COMPRA'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                              : m.tipo === 'SALIDA_VALE'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                              : m.tipo === 'DEVOLUCION'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60'
                              : 'bg-purple-950 text-purple-300 border border-purple-500/60'
                          }`}
                        >
                          {m.tipo}
                        </span>
                      </td>

                      {/* Material / SKU */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-black text-amber-300 block text-xs">
                          {m.producto_sku}
                        </span>
                        <span className="text-white font-bold block">{m.producto_nombre}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Rack: {m.ubicacion_anaquel}</span>
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3 font-mono font-black text-white text-sm">
                        {m.cantidad}{' '}
                        <span className="text-xs font-sans text-slate-300 font-bold">
                          {m.producto_unidad}
                        </span>
                      </td>

                      {/* Folio / Factura */}
                      <td className="px-4 py-3 font-mono text-cyan-300 font-bold">
                        {m.no_factura_o_vale}
                      </td>

                      {/* Área y Responsable */}
                      <td className="px-4 py-3">
                        <span className="text-slate-200 font-bold block">{m.area_solicitante}</span>
                        <span className="text-slate-400 text-[11px] block">{m.responsable_recibe}</span>
                      </td>

                      {/* Motivo / OT */}
                      <td className="px-4 py-3 text-slate-300 max-w-xs">
                        <span className="font-mono text-amber-300 block font-bold text-[11px]">
                          {m.motivo_orden_trabajo}
                        </span>
                      </td>

                      {/* Almacenista */}
                      <td className="px-4 py-3 text-slate-400 text-xs font-medium">
                        {m.usuario_almacenista}
                      </td>

                      {/* Fecha y Hora */}
                      <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                        {new Date(m.fecha).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Botón Comprobante */}
                      <td className="px-4 py-3 text-right">
                        {m.tipo === 'SALIDA_VALE' && (
                          <button
                            onClick={() => handlePrintTicket(m)}
                            title="Reimprimir Comprobante Oficial"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-colors shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ticket</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Ticket Imprimible */}
        <TicketModal
          ticket={ticketToPrint}
          onClose={() => setTicketToPrint(null)}
        />

      </div>
    </AppShell>
  );
}
