'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Building2,
  Boxes,
  RotateCw,
  Search,
} from 'lucide-react';
import { MovimientoConDetalle, UsuarioAutenticado } from '@/types';

export default function ReportesPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('TODOS');
  const [selectedArea, setSelectedArea] = useState('TODAS');

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
      console.error('Error cargando reporte:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (selectedTipo !== 'TODOS') params.set('tipo', selectedTipo);
    if (selectedArea !== 'TODAS') params.set('area', selectedArea);
    if (fechaInicio) params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params.set('fecha_fin', fechaFin);

    window.open(`/api/reportes/export?${params.toString()}`, '_blank');
  };

  const filtered = movimientos.filter((m) => {
    const matchesTipo = selectedTipo === 'TODOS' || m.tipo === selectedTipo;
    const matchesArea = selectedArea === 'TODAS' || m.area_solicitante === selectedArea;
    const matchesFechaInicio = !fechaInicio || new Date(m.fecha) >= new Date(fechaInicio);
    const matchesFechaFin = !fechaFin || new Date(m.fecha) <= new Date(`${fechaFin}T23:59:59`);

    return matchesTipo && matchesArea && matchesFechaInicio && matchesFechaFin;
  });

  const totalEntradas = filtered.filter((m) => m.tipo === 'ENTRADA_COMPRA').length;
  const totalSalidas = filtered.filter((m) => m.tipo === 'SALIDA_VALE').length;
  const totalDevoluciones = filtered.filter((m) => m.tipo === 'DEVOLUCION').length;
  const totalAjustes = filtered.filter((m) => m.tipo === 'AJUSTE').length;

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
              <FileSpreadsheet className="w-7 h-7 text-amber-400" />
              <span>Reportes de Movimientos & Auditoría</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Generación de informes consolidados de almacén con exportación oficial a archivo CSV para Excel
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV Oficial</span>
          </button>
        </div>

        {/* Resumen de Métricas del Reporte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Entradas Compra</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{totalEntradas}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Salidas con Vale</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{totalSalidas}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Devoluciones</span>
            <p className="text-2xl font-black text-blue-400 mt-1">{totalDevoluciones}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ajustes Auditoría</span>
            <p className="text-2xl font-black text-purple-400 mt-1">{totalAjustes}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Fecha inicio */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fecha Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fecha Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tipo de Movimiento:</label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value="TODOS">Todos los tipos</option>
                <option value="ENTRADA_COMPRA">ENTRADA_COMPRA</option>
                <option value="SALIDA_VALE">SALIDA_VALE</option>
                <option value="DEVOLUCION">DEVOLUCION</option>
                <option value="AJUSTE">AJUSTE</option>
              </select>
            </div>

            {/* Área */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Área Solicitante:</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value="TODAS">Todas las áreas</option>
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

        {/* Tabla preliminar de resultados */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Vista Preliminar ({filtered.length} registros seleccionados)</span>
            <span>Mostrando datos que se incluirán en el CSV exportado</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Folio / Factura</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Recibe</th>
                  <th className="px-4 py-3">Motivo / OT</th>
                  <th className="px-4 py-3">Almacenista</th>
                  <th className="px-4 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                      No hay registros que coincidan con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-850 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-[11px] text-slate-300">{m.tipo}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-amber-400">{m.producto_sku}</td>
                      <td className="px-4 py-2.5 text-white font-medium">{m.producto_nombre}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-white">
                        {m.cantidad} {m.producto_unidad}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{m.no_factura_o_vale}</td>
                      <td className="px-4 py-2.5 text-slate-300">{m.area_solicitante}</td>
                      <td className="px-4 py-2.5 text-slate-300">{m.responsable_recibe}</td>
                      <td className="px-4 py-2.5 text-amber-300 font-mono text-[11px]">{m.motivo_orden_trabajo}</td>
                      <td className="px-4 py-2.5 text-slate-400">{m.usuario_almacenista}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400 text-[11px]">
                        {new Date(m.fecha).toLocaleDateString('es-MX')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
