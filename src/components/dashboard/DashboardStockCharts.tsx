'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  TrendingUp,
} from 'lucide-react';
import { Producto, CategoriaProducto } from '@/types';

interface DashboardStockChartsProps {
  productos: Producto[];
}

export function DashboardStockCharts({ productos }: DashboardStockChartsProps) {
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<'TODOS' | 'SALUDABLE' | 'CRITICO' | 'SOBRESTOCK'>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'stock_desc' | 'stock_asc' | 'nombre'>('stock_desc');
  const [viewChartType, setViewChartType] = useState<'barras' | 'distribucion'>('barras');

  // Solo considerar productos activos
  const activeProducts = useMemo(() => {
    return productos.filter((p) => p.activo === 'SI');
  }, [productos]);

  // Materiales en stock (stock_actual > 0)
  const inStockProducts = useMemo(() => {
    return activeProducts.filter((p) => p.stock_actual > 0);
  }, [activeProducts]);

  // Categorías presentes
  const categorias = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set);
  }, [activeProducts]);

  // Totales por categoría para el gráfico de distribución
  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { count: number; totalUnits: number; color: string }> = {};

    const colorPalette = [
      '#a855f7', // violet
      '#ec4899', // pink/fuchsia
      '#06b6d4', // cyan/teal
      '#f59e0b', // amber
      '#10b981', // emerald
      '#6366f1', // indigo
      '#84cc16', // lime
    ];

    categorias.forEach((cat, idx) => {
      statsMap[cat] = {
        count: 0,
        totalUnits: 0,
        color: colorPalette[idx % colorPalette.length],
      };
    });

    activeProducts.forEach((p) => {
      if (statsMap[p.categoria]) {
        statsMap[p.categoria].count += 1;
        statsMap[p.categoria].totalUnits += p.stock_actual;
      }
    });

    const totalAllUnits = Object.values(statsMap).reduce((acc, curr) => acc + curr.totalUnits, 0);

    return Object.entries(statsMap).map(([cat, val]) => ({
      categoria: cat,
      count: val.count,
      totalUnits: val.totalUnits,
      color: val.color,
      percentage: totalAllUnits > 0 ? (val.totalUnits / totalAllUnits) * 100 : 0,
    })).sort((a, b) => b.totalUnits - a.totalUnits);
  }, [activeProducts, categorias]);

  // Filtrado de materiales para la gráfica
  const filteredProducts = useMemo(() => {
    let list = [...activeProducts];

    // Filtro por categoría
    if (selectedCategoria !== 'TODAS') {
      list = list.filter((p) => p.categoria === selectedCategoria);
    }

    // Filtro por estado
    if (selectedEstadoFilter === 'SALUDABLE') {
      list = list.filter((p) => p.stock_actual > p.stock_min && (p.stock_max === 0 || p.stock_actual < p.stock_max));
    } else if (selectedEstadoFilter === 'CRITICO') {
      list = list.filter((p) => p.stock_actual <= p.stock_min);
    } else if (selectedEstadoFilter === 'SOBRESTOCK') {
      list = list.filter((p) => p.stock_max > 0 && p.stock_actual >= p.stock_max);
    }

    // Búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo_sku.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      );
    }

    // Ordenamiento
    list.sort((a, b) => {
      if (sortBy === 'stock_desc') return b.stock_actual - a.stock_actual;
      if (sortBy === 'stock_asc') return a.stock_actual - b.stock_actual;
      return a.nombre.localeCompare(b.nombre);
    });

    return list;
  }, [activeProducts, selectedCategoria, selectedEstadoFilter, searchQuery, sortBy]);

  // Máximo valor de stock para escalar las barras proporcionalmente
  const maxStockReference = useMemo(() => {
    let max = 1;
    filteredProducts.forEach((p) => {
      const ceiling = Math.max(p.stock_actual, p.stock_max || 0, p.stock_min * 2);
      if (ceiling > max) max = ceiling;
    });
    return max;
  }, [filteredProducts]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-violet-500/40 border-t-4 border-t-violet-400 p-5 sm:p-6 rounded-tl-3xl rounded-br-3xl shadow-2xl space-y-6">
      
      {/* Encabezado de la Sección de Gráficas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-violet-500/30 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-tl-xl rounded-br-xl text-white shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>Gráficas de Materiales en Stock</span>
              </h2>
              <p className="text-xs font-bold text-violet-200 mt-0.5">
                Visualización de existencias, capacidad operativa de anaquel y distribución por categoría
              </p>
            </div>
          </div>
        </div>

        {/* Selector de tipo de gráfica */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-950/80 p-1 rounded-tl-2xl rounded-br-2xl border border-violet-500/40 flex items-center gap-1">
            <button
              onClick={() => setViewChartType('barras')}
              className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                viewChartType === 'barras'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white shadow-md shadow-fuchsia-500/30'
                  : 'text-violet-200 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Nivel de Stock (Barras)</span>
            </button>
            <button
              onClick={() => setViewChartType('distribucion')}
              className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                viewChartType === 'distribucion'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white shadow-md shadow-fuchsia-500/30'
                  : 'text-violet-200 hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Distribución Global</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-tl-2xl rounded-br-2xl border border-violet-500/25 text-xs">
        {/* 1. Categoría */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-violet-200 mb-1">
            Filtrar por Categoría:
          </label>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-violet-500/40 rounded-tl-xl rounded-br-xl text-white font-bold focus:outline-none focus:border-fuchsia-400"
          >
            <option value="TODAS">Todas las Categorías ({activeProducts.length} SKUs)</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({activeProducts.filter((p) => p.categoria === cat).length})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Estado de Stock */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-violet-200 mb-1">
            Estado de Existencias:
          </label>
          <select
            value={selectedEstadoFilter}
            onChange={(e) => setSelectedEstadoFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-900 border border-violet-500/40 rounded-tl-xl rounded-br-xl text-white font-bold focus:outline-none focus:border-fuchsia-400"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="SALUDABLE">🟢 Stock Saludable</option>
            <option value="CRITICO">🔴 Stock Crítico (≤ Mínimo)</option>
            <option value="SOBRESTOCK">🟡 Sobrestock (≥ Máximo)</option>
          </select>
        </div>

        {/* 3. Búsqueda instantánea de material */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-violet-200 mb-1">
            Buscar Material / SKU:
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej. Slip sheet, Rosca..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-violet-500/40 rounded-tl-xl rounded-br-xl text-white placeholder-slate-400 font-bold focus:outline-none focus:border-fuchsia-400"
            />
          </div>
        </div>

        {/* 4. Orden */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-violet-200 mb-1">
            Ordenar por:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-900 border border-violet-500/40 rounded-tl-xl rounded-br-xl text-white font-bold focus:outline-none focus:border-fuchsia-400"
          >
            <option value="stock_desc">Mayor Stock Físico ↓</option>
            <option value="stock_asc">Menor Stock Físico ↑</option>
            <option value="nombre">Nombre Alfabético</option>
          </select>
        </div>
      </div>

      {/* VISTA 1: GRÁFICAS DE BARRAS DE CAPACIDAD Y EXISTENCIA */}
      {viewChartType === 'barras' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs text-violet-200 font-bold">
            <span>
              Mostrando <strong>{filteredProducts.length}</strong> materiales con seguimiento de existencias
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Stock Saludable
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Sobrestock
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Stock Crítico
              </span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-300 bg-slate-950/40 rounded-tl-2xl rounded-br-2xl border border-violet-500/20">
              No se encontraron materiales que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProducts.map((p) => {
                const esCritico = p.stock_actual <= p.stock_min;
                const esSobrestock = p.stock_max > 0 && p.stock_actual >= p.stock_max;
                const esSaludable = !esCritico && !esSobrestock;

                // Porcentaje para barra relativa al máximo global o local
                const percentOfMax = Math.min(100, Math.max(4, Math.round((p.stock_actual / maxStockReference) * 100)));

                // Porcentaje de cobertura de capacidad del material
                const capacityRatio = p.stock_max > 0 ? Math.round((p.stock_actual / p.stock_max) * 100) : 100;

                return (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-950/70 border border-violet-500/30 rounded-tl-2xl rounded-br-2xl hover:border-violet-400 transition-all shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-amber-300 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40">
                            {p.codigo_sku}
                          </span>
                          <span className="text-[11px] text-violet-200 font-bold truncate">
                            {p.categoria}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1 truncate group-hover:text-amber-200 transition-colors">
                          {p.nombre}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-black font-mono text-white flex items-baseline justify-end gap-1">
                          <span className={esCritico ? 'text-rose-400' : esSobrestock ? 'text-amber-300' : 'text-emerald-400'}>
                            {p.stock_actual.toLocaleString('es-MX')}
                          </span>
                          <span className="text-xs text-violet-200 font-bold font-sans">
                            {p.unidad_medida}
                          </span>
                        </div>
                        <span
                          className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-tl-lg rounded-br-lg ${
                            esCritico
                              ? 'bg-rose-950 text-rose-300 border border-rose-600'
                              : esSobrestock
                              ? 'bg-amber-950 text-amber-300 border border-amber-600'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          }`}
                        >
                          {esCritico ? 'Crítico' : esSobrestock ? 'Sobrestock' : 'Óptimo'}
                        </span>
                      </div>
                    </div>

                    {/* Gráfica de Barra Visual de Stock */}
                    <div className="space-y-1.5 mt-3">
                      <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center">
                        <div
                          style={{ width: `${percentOfMax}%` }}
                          className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5 shadow-sm ${
                            esCritico
                              ? 'bg-gradient-to-r from-rose-700 to-rose-500'
                              : esSobrestock
                              ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                              : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400'
                          }`}
                        >
                          {percentOfMax > 15 && (
                            <span className="text-[9px] font-black font-mono text-slate-950">
                              {p.stock_actual}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Referencias Mínimo / Máximo / Anaquel */}
                      <div className="flex items-center justify-between text-[11px] text-violet-200 font-mono">
                        <span>
                          Mínimo: <strong className="text-white">{p.stock_min}</strong>
                        </span>
                        <span>
                          Ubicación: <strong className="text-white">{p.ubicacion_anaquel}</strong>
                        </span>
                        <span>
                          Capacidad Máx: <strong className="text-white">{p.stock_max > 0 ? p.stock_max : 'N/A'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: DISTRIBUCIÓN GLOBAL DE INVENTARIO (GRÁFICA Y TARJETAS DE PROPORCIÓN) */}
      {viewChartType === 'distribucion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Anillo / Donut Chart SVG Interactivo */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-tl-3xl rounded-br-3xl border border-violet-500/30">
            <h3 className="text-xs font-black uppercase tracking-wider text-violet-200 mb-4">
              Proporción Total de Unidades en Stock
            </h3>

            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {(() => {
                  let accumulatedPercent = 0;
                  return categoryStats.map((cat, i) => {
                    const strokeDasharray = `${cat.percentage} ${100 - cat.percentage}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += cat.percentage;

                    return (
                      <circle
                        key={cat.categoria}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="15"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-80"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white font-mono">
                  {inStockProducts.reduce((acc, p) => acc + p.stock_actual, 0).toLocaleString('es-MX')}
                </span>
                <span className="text-[11px] font-extrabold text-violet-200 uppercase tracking-widest">
                  Unidades Totales
                </span>
              </div>
            </div>
          </div>

          {/* Desglose por Categoría con Barras de Porcentaje */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-violet-200 mb-2">
              Volumen y Distribución de Existencias por Categoría
            </h3>

            {categoryStats.map((cat) => (
              <div
                key={cat.categoria}
                onClick={() => {
                  setSelectedCategoria(cat.categoria);
                  setViewChartType('barras');
                }}
                className="p-3.5 bg-slate-950/70 border border-violet-500/30 rounded-tl-xl rounded-br-xl hover:border-violet-400 cursor-pointer transition-all shadow-sm group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: cat.color }}
                      className="w-3 h-3 rounded-tl-md rounded-br-md shrink-0 shadow-sm"
                    ></span>
                    <span className="font-black text-white group-hover:text-amber-300 transition-colors">
                      {cat.categoria}
                    </span>
                    <span className="text-[11px] text-violet-300 font-bold">
                      ({cat.count} SKUs)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-white text-sm">
                      {cat.totalUnits.toLocaleString('es-MX')}
                    </span>
                    <span className="text-[11px] text-violet-300 font-bold ml-1.5">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Barra de progreso de categoría */}
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${Math.max(2, cat.percentage)}%`, backgroundColor: cat.color }}
                    className="h-full rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
