'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TicketModal } from '@/components/movements/TicketModal';
import { ImageModal } from '@/components/ui/ImageModal';
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
  Camera,
} from 'lucide-react';
import { MovimientoConDetalle, UsuarioAutenticado, TicketSalida } from '@/types';

export default function MovimientosPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('TODOS');
  const [selectedArea, setSelectedArea] = useState('TODAS');
  
  // Modal ticket e imagen
  const [ticketToPrint, setTicketToPrint] = useState<TicketSalida | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      });

    loadMovimientos();
  }, []);

  const loadMovimientos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/movimientos');
      const data = await res.json();
      if (data.movimientos) {
        setMovimientos(data.movimientos);
      }
    } catch (err) {
      console.error('Error cargando movimientos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = (m: MovimientoConDetalle) => {
    const fechaObj = new Date(m.fecha);
    setTicketToPrint({
      folio_vale: m.no_factura_o_vale,
      fecha: fechaObj.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      hora: fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      producto_nombre: m.producto_nombre || 'Material Industrial',
      producto_sku: m.producto_sku || 'N/A',
      cantidad: m.cantidad,
      unidad_medida: m.producto_unidad || 'pza',
      area_solicitante: m.area_solicitante,
      responsable_recibe: m.responsable_recibe,
      motivo_orden_trabajo: m.motivo_orden_trabajo,
      usuario_almacenista: m.usuario_almacenista,
      ubicacion_anaquel: m.ubicacion_anaquel || 'N/A',
    });
  };

  const filteredMovimientos = movimientos.filter((m) => {
    const matchesSearch =
      (m.producto_sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.producto_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.no_factura_o_vale || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.responsable_recibe || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.motivo_orden_trabajo || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.usuario_almacenista || '').toLowerCase().includes(search.toLowerCase());

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
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <History className="w-7 h-7 text-amber-400" />
              <span>Historial Inmutable de Movimientos</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Trazabilidad integral de entradas, salidas por vale, devoluciones y ajustes de almacén
            </p>
          </div>

          <button
            onClick={loadMovimientos}
            title="Refrescar movimientos"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors self-start sm:self-auto"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por SKU, folio, OT, responsable..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tipo de Movimiento */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="TODOS">Todos los Tipos de Movimiento</option>
                <option value="ENTRADA_COMPRA">ENTRADA_COMPRA (Facturas)</option>
                <option value="SALIDA_VALE">SALIDA_VALE (Despachos)</option>
                <option value="DEVOLUCION">DEVOLUCION (Reingresos)</option>
                <option value="AJUSTE">AJUSTE (Auditorías)</option>
              </select>
            </div>

            {/* Área Solicitante */}
            <div>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Material / SKU</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Folio / Factura</th>
                  <th className="px-4 py-3 text-center">Evidencia</th>
                  <th className="px-4 py-3">Área y Responsable</th>
                  <th className="px-4 py-3">Motivo / Orden de Trabajo (OT)</th>
                  <th className="px-4 py-3">Almacenista</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                      No se encontraron registros de movimiento con los criterios especificados.
                    </td>
                  </tr>
                ) : (
                  filteredMovimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-850 transition-colors">
                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
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

                      {/* Material / SKU */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-amber-400 block text-xs">
                          {m.producto_sku}
                        </span>
                        <span className="text-white font-semibold block">{m.producto_nombre}</span>
                        <span className="text-[10px] text-slate-400">Rack: {m.ubicacion_anaquel}</span>
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3 font-mono font-bold text-white text-sm">
                        {m.cantidad}{' '}
                        <span className="text-xs font-sans text-slate-400 font-normal">
                          {m.producto_unidad}
                        </span>
                      </td>

                      {/* Folio / Factura */}
                      <td className="px-4 py-3 font-mono text-slate-300 font-semibold">
                        {m.no_factura_o_vale}
                      </td>

                      {/* Evidencia Fotográfica */}
                      <td className="px-4 py-3 text-center">
                        {m.evidencia_foto ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedImage({
                                url: m.evidencia_foto!,
                                title: `Evidencia ${m.tipo} - ${m.producto_sku} (${m.no_factura_o_vale})`,
                              })
                            }
                            className="inline-flex items-center justify-center p-1 rounded-lg border border-slate-700 bg-slate-950/80 hover:border-cyan-400 hover:scale-105 transition-all shadow-sm group"
                            title="Ver foto de comprobante / evidencia"
                          >
                            <img
                              src={m.evidencia_foto}
                              alt="Foto Evidencia"
                              className="w-9 h-9 object-cover rounded"
                            />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* Área y Responsable */}
                      <td className="px-4 py-3">
                        <span className="text-slate-200 font-semibold block">{m.area_solicitante}</span>
                        <span className="text-slate-400 text-[11px] block">{m.responsable_recibe}</span>
                      </td>

                      {/* Motivo / OT */}
                      <td className="px-4 py-3 text-slate-300 max-w-xs">
                        <span className="font-mono text-amber-300 block font-bold text-[11px]">
                          {m.motivo_orden_trabajo}
                        </span>
                      </td>

                      {/* Almacenista */}
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {m.usuario_almacenista}
                      </td>

                      {/* Fecha y Hora */}
                      <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
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

        {/* Modal de Previsualización de Evidencia */}
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage?.url || ''}
          title={selectedImage?.title || ''}
        />

      </div>
    </AppShell>
  );
}
