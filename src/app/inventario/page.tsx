'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StockBadge } from '@/components/inventory/StockBadge';
import { ProductModal } from '@/components/inventory/ProductModal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  PowerOff,
  Power,
  RotateCw,
  MapPin,
  Table as TableIcon,
  Layers,
  ChevronRight,
  ChevronLeft,
  Warehouse,
  Cog,
  Wrench,
  HardHat,
  Package as PackageIcon,
  History,
  Tag,
  Radio,
} from 'lucide-react';
import { Producto, UsuarioAutenticado, CategoriaProducto } from '@/types';
import { ProductLabelModal } from '@/components/inventory/ProductLabelModal';
import { ProductKardexModal } from '@/components/inventory/ProductKardexModal';
import { STOCK_SYNC_EVENT } from '@/lib/events';

const DRILL_CATEGORIAS: {
  id: CategoriaProducto;
  label: string;
  descripcion: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accentBorder: string;
  badgeBg: string;
  iconBg: string;
}[] = [
  {
    id: 'Panadería Congelada (CA)',
    label: 'Panadería Congelada (CA)',
    descripcion: 'Roscas, panquecitos, donas y panqués congelados RTF/RTS (Cajas)',
    icon: Boxes,
    color: 'from-indigo-900/90 via-violet-900/70 to-slate-900/90 border-violet-400/60 text-violet-200 hover:border-violet-300 hover:shadow-violet-500/30',
    accentBorder: 'border-t-violet-400',
    badgeBg: 'bg-violet-950/90 text-violet-200 border-violet-500/60',
    iconBg: 'bg-violet-500/25 border-violet-300/50 text-violet-300',
  },
  {
    id: 'Mixes y Harinas (BG)',
    label: 'Mixes y Harinas (BG)',
    descripcion: 'Mezclas en polvo, mixes de pastel, pulque y bisquetes en bultos de 20 kg',
    icon: PackageIcon,
    color: 'from-orange-900/90 via-amber-900/70 to-slate-900/90 border-orange-400/60 text-orange-200 hover:border-orange-300 hover:shadow-orange-500/30',
    accentBorder: 'border-t-orange-400',
    badgeBg: 'bg-orange-950/90 text-orange-200 border-orange-500/60',
    iconBg: 'bg-orange-500/25 border-orange-300/50 text-orange-300',
  },
  {
    id: 'Icings y Coberturas (PA)',
    label: 'Icings y Coberturas (PA)',
    descripcion: 'Glaseados planos, untables de canela, maple y queso crema en cubetas',
    icon: Cog,
    color: 'from-fuchsia-900/90 via-pink-900/70 to-slate-900/90 border-fuchsia-400/60 text-fuchsia-200 hover:border-fuchsia-300 hover:shadow-fuchsia-500/30',
    accentBorder: 'border-t-fuchsia-400',
    badgeBg: 'bg-fuchsia-950/90 text-fuchsia-200 border-fuchsia-500/60',
    iconBg: 'bg-fuchsia-500/25 border-fuchsia-300/50 text-fuchsia-300',
  },
  {
    id: 'Materia Prima',
    label: 'Materia Prima General',
    descripcion: 'Ingredientes, materias primas e insumos auxiliares de producción',
    icon: Wrench,
    color: 'from-teal-900/90 via-emerald-900/70 to-slate-900/90 border-teal-400/60 text-teal-200 hover:border-teal-300 hover:shadow-teal-500/30',
    accentBorder: 'border-t-teal-400',
    badgeBg: 'bg-teal-950/90 text-teal-200 border-teal-500/60',
    iconBg: 'bg-teal-500/25 border-teal-300/50 text-teal-300',
  },
  {
    id: 'Consumibles',
    label: 'Consumibles e Insumos de Empaque',
    descripcion: 'Tarimas, esquineros, slip sheets, emplayers, cajas, bolsas de sellos y conos',
    icon: HardHat,
    color: 'from-lime-900/90 via-emerald-950/70 to-slate-900/90 border-lime-400/60 text-lime-200 hover:border-lime-300 hover:shadow-lime-500/30',
    accentBorder: 'border-t-lime-400',
    badgeBg: 'bg-lime-950/90 text-lime-200 border-lime-500/60',
    iconBg: 'bg-lime-500/25 border-lime-300/50 text-lime-300',
  },
];

export default function InventarioPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  
  // Layout mode: Tabla tradicional vs Drill-Down jerárquico
  const [viewLayout, setViewLayout] = useState<'tabla' | 'drilldown'>('tabla');
  const [drillCat, setDrillCat] = useState<CategoriaProducto | null>(null);
  const [drillZone, setDrillZone] = useState<string | null>(null);
  const [defaultCatForModal, setDefaultCatForModal] = useState<CategoriaProducto | undefined>();
  const [defaultUbicacionForModal, setDefaultUbicacionForModal] = useState<string | undefined>();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoToEdit, setProductoToEdit] = useState<Producto | null>(null);
  const [selectedProdForLabel, setSelectedProdForLabel] = useState<Producto | null>(null);
  const [selectedProdForKardex, setSelectedProdForKardex] = useState<Producto | null>(null);

  // Cargar usuario
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      });
  }, []);

  const loadProductos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await fetch('/api/productos?activos=all');
      const data = await res.json();
      if (data.productos) {
        setProductos(data.productos);
        const now = new Date();
        setLastSync(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      if (!silent) setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadProductos(false);

    // Escuchar eventos globales de sincronización en tiempo real
    const handleSync = () => {
      loadProductos(true);
    };

    window.addEventListener(STOCK_SYNC_EVENT, handleSync);
    window.addEventListener('focus', handleSync);

    // Auto-actualización silenciosa cada 6 segundos sin congelar la pantalla ni requerir presionar botón refresh
    const interval = setInterval(() => {
      loadProductos(true);
    }, 6000);

    // BroadcastChannel para sincronizar entre pestañas abiertas
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('factory_stock_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'STOCK_UPDATED') {
            loadProductos(true);
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
  }, [loadProductos]);

  const handleToggleActivo = async (prod: Producto) => {
    const nuevoEstado = prod.activo === 'SI' ? 'NO' : 'SI';
    const confirmMsg =
      nuevoEstado === 'NO'
        ? `¿Desactivar el producto ${prod.codigo_sku} (${prod.nombre})? Las existencias no se borrarán pero no podrá seleccionarse para nuevas salidas.`
        : `¿Reactivar el producto ${prod.codigo_sku}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/productos/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado }),
      });
      if (res.ok) {
        loadProductos(true);
      }
    } catch (err) {
      console.error('Error toggling activo:', err);
    }
  };

  // Filtrado
  const filteredProductos = productos.filter((p) => {
    if (user?.rol !== 'ADMIN' && p.activo === 'NO') return false;

    const matchesSearch =
      p.codigo_sku.toLowerCase().includes(search.toLowerCase()) ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.ubicacion_anaquel.toLowerCase().includes(search.toLowerCase()) ||
      p.proveedor_principal.toLowerCase().includes(search.toLowerCase());

    const matchesCategoria = selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;

    let matchesEstado = true;
    if (selectedEstado === 'CRITICO') {
      matchesEstado = p.stock_actual <= p.stock_min;
    } else if (selectedEstado === 'SOBRESTOCK') {
      matchesEstado = p.stock_max > 0 && p.stock_actual >= p.stock_max;
    } else if (selectedEstado === 'NORMAL') {
      matchesEstado = p.stock_actual > p.stock_min && (p.stock_max === 0 || p.stock_actual < p.stock_max);
    }

    return matchesSearch && matchesCategoria && matchesEstado;
  });

  const extractZone = (ubicacion: string) => {
    if (!ubicacion) return 'Zona General';
    const match = ubicacion.match(/^([A-Z0-9]+)/i);
    return match ? `Anaquel ${match[1].toUpperCase()}` : 'Zona General';
  };

  const drillCategoryProducts = React.useMemo(() => {
    if (!drillCat) return [];
    return productos.filter((p) => p.categoria === drillCat && (user?.rol === 'ADMIN' || p.activo === 'SI'));
  }, [productos, drillCat, user]);

  const drillAvailableZones = React.useMemo(() => {
    if (!drillCat) return [];
    const zonesMap: Record<string, { zone: string; count: number; totalStock: number; criticalCount: number }> = {};

    drillCategoryProducts.forEach((p) => {
      const z = extractZone(p.ubicacion_anaquel);
      const existing = zonesMap[z] || { zone: z, count: 0, totalStock: 0, criticalCount: 0 };
      existing.count += 1;
      existing.totalStock += p.stock_actual;
      if (p.stock_actual <= p.stock_min) existing.criticalCount += 1;
      zonesMap[z] = existing;
    });

    return Object.values(zonesMap).sort((a, b) => a.zone.localeCompare(b.zone));
  }, [drillCat, drillCategoryProducts]);

  const drillFinalProducts = React.useMemo(() => {
    if (!drillCat) return [];
    if (!drillZone || drillZone === 'TODOS') return drillCategoryProducts;
    return drillCategoryProducts.filter((p) => extractZone(p.ubicacion_anaquel) === drillZone);
  }, [drillCat, drillZone, drillCategoryProducts]);

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
        {/* Cabecera y botón Crear SKU */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : 'animate-pulse'}`} />
                <span>Auto-sincronizado {lastSync && `• ${lastSync}`}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <Boxes className="w-7 h-7 text-cyan-400" />
              <span>Inventario General de Almacén</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Catálogo de materiales industriales, existencias exactas en piezas, capacidad máxima y semaforización
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Selector de Modo de Vista (Tabla vs Drill-Down) */}
            <div className="bg-indigo-950/90 border border-violet-500/50 p-1 rounded-2xl flex items-center gap-1 shadow-lg">
              <button
                type="button"
                onClick={() => setViewLayout('tabla')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewLayout === 'tabla'
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'text-violet-200 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('drilldown')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewLayout === 'drilldown'
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'text-violet-200 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drill-Down</span>
              </button>
            </div>

            <button
              onClick={() => loadProductos(false)}
              title="Refrescar catálogo"
              className="p-2.5 bg-indigo-950/90 hover:bg-violet-900 text-violet-200 hover:text-cyan-300 rounded-xl border border-violet-500/50 transition-colors shadow-sm"
            >
              <RotateCw className={`w-4 h-4 ${loading || isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {user.rol === 'ADMIN' && (
              <button
                onClick={() => {
                  setProductoToEdit(null);
                  setDefaultCatForModal(undefined);
                  setDefaultUbicacionForModal(undefined);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black rounded-2xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] border border-cyan-300/40"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Registrar Nuevo SKU</span>
              </button>
            )}
          </div>
        </div>

        {viewLayout === 'tabla' ? (
          <>
            {/* BARRA DE FILTROS Y BÚSQUEDA */}
            <div className="bg-indigo-950/90 backdrop-blur-md border-2 border-cyan-500/40 border-t-4 border-t-cyan-400 p-4 rounded-3xl shadow-xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Buscador */}
                <div className="relative">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por SKU, material, ubicación..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-violet-500/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-semibold"
                  />
                </div>

                {/* Categoría */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/90 border border-violet-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                  >
                    <option value="TODAS">Todas las Categorías</option>
                    <option value="Panadería Congelada (CA)">Panadería Congelada (CA - Cajas)</option>
                    <option value="Mixes y Harinas (BG)">Mixes y Harinas (BG - Bultos)</option>
                    <option value="Icings y Coberturas (PA)">Icings y Coberturas (PA - Cubetas)</option>
                    <option value="Materia Prima">Materia Prima General</option>
                    <option value="Consumibles">Consumibles y Empaque</option>
                  </select>
                </div>

                {/* Estado de Stock */}
                <div>
                  <select
                    value={selectedEstado}
                    onChange={(e) => setSelectedEstado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/90 border border-violet-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                  >
                    <option value="TODOS">Todos los Estados de Stock</option>
                    <option value="NORMAL">Normal / Óptimo (Verde)</option>
                    <option value="CRITICO">Stock Crítico &le; Mínimo (Rojo)</option>
                    <option value="SOBRESTOCK">Sobrestock &ge; Máximo (Amarillo)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABLA PRINCIPAL DE INVENTARIO */}
            <div className="bg-slate-900 border-2 border-violet-500/40 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider font-black border-b border-violet-500/40">
                    <tr>
                      <th className="px-4 py-3.5">SKU</th>
                      <th className="px-4 py-3.5">Material / Producto</th>
                      <th className="px-4 py-3.5">Categoría</th>
                      <th className="px-4 py-3.5">Cantidad en Piezas</th>
                      <th className="px-4 py-3.5">Capacidad Máxima</th>
                      <th className="px-4 py-3.5">Ubicación Física</th>
                      <th className="px-4 py-3.5">Proveedor</th>
                      <th className="px-4 py-3.5">Estado</th>
                      <th className="px-4 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredProductos.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 text-xs font-semibold">
                          No se encontraron materiales que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredProductos.map((p) => {
                        const isInactive = p.activo === 'NO';
                        const pctMax = p.stock_max > 0 ? Math.round((p.stock_actual / p.stock_max) * 100) : 100;
                        const esCritico = p.stock_actual <= p.stock_min;
                        const esSobrestock = p.stock_max > 0 && p.stock_actual >= p.stock_max;

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-800/80 transition-colors ${
                              isInactive ? 'opacity-40 bg-slate-950/40' : ''
                            }`}
                          >
                            {/* SKU */}
                            <td className="px-4 py-3 font-mono font-black text-amber-300 text-sm">
                              {p.codigo_sku}
                              {isInactive && (
                                <span className="block text-[9px] font-sans text-red-400 uppercase font-black">
                                  (Inactivo)
                                </span>
                              )}
                            </td>

                            {/* Nombre & Descripción */}
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setSelectedProdForKardex(p)}
                                className="font-bold text-white text-sm hover:text-cyan-300 transition text-left flex items-center gap-1.5 group"
                                title="Haz clic para ver el Kardex completo de este material"
                              >
                                <span>{p.nombre}</span>
                                <History className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 shrink-0" />
                              </button>
                              {p.descripcion && (
                                <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{p.descripcion}</p>
                              )}
                            </td>

                            {/* Categoría */}
                            <td className="px-4 py-3">
                              <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-violet-950 text-violet-200 border border-violet-700/60">
                                {p.categoria}
                              </span>
                            </td>

                            {/* Cantidad en Piezas (Stock Actual) */}
                            <td className="px-4 py-3 font-mono">
                              <div className="flex items-baseline gap-1.5">
                                <span className={`text-base font-black ${
                                  esCritico ? 'text-rose-400' : esSobrestock ? 'text-amber-300' : 'text-emerald-400'
                                }`}>
                                  {p.stock_actual.toLocaleString('es-MX')}
                                </span>
                                <span className="text-xs text-slate-300 font-sans font-semibold">
                                  {p.unidad_medida}
                                </span>
                              </div>
                              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                                <div
                                  style={{ width: `${Math.min(100, pctMax)}%` }}
                                  className={`h-full ${
                                    esCritico ? 'bg-rose-500' : esSobrestock ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}
                                />
                              </div>
                            </td>

                            {/* Capacidad Máxima y Mínimo */}
                            <td className="px-4 py-3 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-400">Máx: </span>
                                <strong className="text-amber-300 font-bold">{p.stock_max} {p.unidad_medida}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400">Mín: </span>
                                <strong className="text-rose-400 font-bold">{p.stock_min} {p.unidad_medida}</strong>
                              </div>
                            </td>

                            {/* Ubicación Física */}
                            <td className="px-4 py-3">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-slate-200">
                                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                {p.ubicacion_anaquel}
                              </div>
                            </td>

                            {/* Proveedor */}
                            <td className="px-4 py-3 text-slate-300 max-w-xs truncate font-medium">
                              {p.proveedor_principal || 'N/A'}
                            </td>

                            {/* Estado Visual */}
                            <td className="px-4 py-3">
                              <StockBadge
                                actual={p.stock_actual}
                                min={p.stock_min}
                                max={p.stock_max}
                                unidad={p.unidad_medida}
                              />
                            </td>

                            {/* Acciones */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botón Kardex */}
                                <button
                                  onClick={() => setSelectedProdForKardex(p)}
                                  title="Ver Kardex y Trazabilidad"
                                  className="p-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/60 text-cyan-300 hover:text-white rounded-lg transition-colors shadow-sm"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>

                                {/* Botón Imprimir Etiqueta */}
                                <button
                                  onClick={() => setSelectedProdForLabel(p)}
                                  title="Imprimir Etiqueta Código de Barras (Anaquel/Tarima)"
                                  className="p-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-300 hover:text-white rounded-lg transition-colors shadow-sm"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                </button>

                                {user.rol === 'ADMIN' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setProductoToEdit(p);
                                        setIsModalOpen(true);
                                      }}
                                      title="Editar SKU"
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleActivo(p)}
                                      title={isInactive ? 'Activar SKU' : 'Desactivar SKU'}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        isInactive
                                          ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400'
                                          : 'bg-red-950 hover:bg-red-900 text-red-400'
                                      }`}
                                    >
                                      {isInactive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* VISTA DRILL-DOWN DEL CATÁLOGO INDUSTRIAL                  */
          /* ========================================================= */
          <div className="space-y-6">
            {/* Breadcrumb del Drill-Down */}
            <div className="flex items-center justify-between bg-indigo-950/90 backdrop-blur-md border-2 border-violet-500/40 px-4 py-3 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 text-xs text-violet-200 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setDrillCat(null);
                    setDrillZone(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    !drillCat
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md'
                      : 'text-violet-300 hover:text-white'
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>1. Bloques de Almacén</span>
                </button>

                {drillCat && (
                  <>
                    <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <button
                      type="button"
                      onClick={() => setDrillZone(null)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                        !drillZone
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md'
                          : 'text-violet-300 hover:text-white'
                      }`}
                    >
                      <span>2. {drillCat}</span>
                    </button>
                  </>
                )}

                {drillZone && (
                  <>
                    <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="px-3.5 py-1.5 rounded-xl bg-violet-950 text-cyan-300 font-mono font-black border border-cyan-400/50">
                      3. {drillZone}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* NIVEL 1: Categorías */}
            {!drillCat && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DRILL_CATEGORIAS.map((cat) => {
                  const Icon = cat.icon;
                  const count = productos.filter(
                    (p) => p.categoria === cat.id && (user.rol === 'ADMIN' || p.activo === 'SI')
                  ).length;
                  const totalStock = productos
                    .filter((p) => p.categoria === cat.id && (user.rol === 'ADMIN' || p.activo === 'SI'))
                    .reduce((acc, curr) => acc + curr.stock_actual, 0);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setDrillCat(cat.id);
                        setDrillZone(null);
                      }}
                      className={`text-left p-5 rounded-3xl border-2 border-t-4 ${cat.accentBorder} bg-gradient-to-br transition-all hover:-translate-y-1 hover:shadow-2xl group flex flex-col justify-between ${cat.color}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-2xl border shadow-md ${cat.iconBg}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`px-3 py-1 text-xs font-mono font-black rounded-xl border shadow-sm ${cat.badgeBg}`}>
                          {count} SKUs
                        </span>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-base font-black text-white group-hover:text-cyan-200 transition-colors flex items-center justify-between">
                          <span>{cat.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300" />
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{cat.descripcion}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">Total Piezas:</span>
                        <strong className="text-white font-black text-sm">{totalStock.toLocaleString('es-MX')} uds</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* NIVEL 2: Zonas / Anaqueles */}
            {drillCat && !drillZone && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Nivel 2: Estantes y Anaqueles en {drillCat}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {drillCategoryProducts.length} materiales organizados por estantería física
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrillCat(null)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Volver a Categorías</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setDrillZone('TODOS')}
                    className="p-5 rounded-2xl border-2 border-dashed border-cyan-400/60 bg-cyan-950/30 hover:bg-cyan-900/40 text-left transition-all group shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold text-cyan-200 bg-cyan-950 border border-cyan-500/50">
                        {drillCategoryProducts.length} SKUs
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white mt-3 group-hover:text-cyan-200 transition-colors">
                      Ver Todo {drillCat}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Explora todos los anaqueles sin filtrar por zona física
                    </p>
                  </button>

                  {drillAvailableZones.map((z) => (
                    <div
                      key={z.zone}
                      className="p-5 rounded-2xl border-2 border-slate-800 hover:border-cyan-500/60 bg-slate-900 flex flex-col justify-between transition-all group shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-400/40 flex items-center justify-center">
                            <Warehouse className="w-5 h-5" />
                          </div>
                          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-950 text-slate-300 border border-slate-700">
                            {z.count} items
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-4">{z.zone}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Existencias: <strong className="text-white">{z.totalStock}</strong> piezas
                        </p>
                        {z.criticalCount > 0 && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-rose-950/80 border border-rose-800 text-rose-300 rounded">
                            {z.criticalCount} en stock crítico
                          </span>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        {user.rol === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductoToEdit(null);
                              setDefaultCatForModal(drillCat);
                              const zoneCode = z.zone.replace('Anaquel ', '').trim();
                              setDefaultUbicacionForModal(`${zoneCode}-R1-N1`);
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-950 rounded-lg border border-slate-800 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-cyan-400" />
                            <span>+ SKU aquí</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDrillZone(z.zone)}
                          className="px-3.5 py-1.5 text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <span>Ver Materiales</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NIVEL 3: Productos del Anaquel */}
            {drillCat && drillZone && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Nivel 3: Materiales en {drillCat} &bull; {drillZone === 'TODOS' ? 'Todos los Anaqueles' : drillZone}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {drillFinalProducts.length} productos registrados en esta sección
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrillZone(null)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Cambiar Anaquel</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drillFinalProducts.map((p) => {
                    const isInactive = p.activo === 'NO';
                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border-2 bg-slate-900 flex flex-col justify-between transition-all ${
                          isInactive ? 'opacity-40 border-slate-800' : 'border-slate-800 hover:border-cyan-500/60 shadow-lg'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-amber-300">
                              {p.codigo_sku}
                            </span>
                            <StockBadge actual={p.stock_actual} min={p.stock_min} max={p.stock_max} unidad={p.unidad_medida} />
                          </div>

                          <div className="my-2.5">
                            <h4 className="text-sm font-black text-white">{p.nombre}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {p.descripcion || 'Sin descripción técnica registrada.'}
                            </p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cantidad en Piezas:</span>
                              <strong className="text-emerald-400 font-mono text-sm font-black">
                                {p.stock_actual} {p.unidad_medida}
                              </strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacidad Máxima:</span>
                              <strong className="text-amber-300 font-mono text-sm font-black">
                                {p.stock_max} {p.unidad_medida}
                              </strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ubicación Física:</span>
                              <strong className="text-slate-200 font-mono flex items-center gap-1 text-xs">
                                <MapPin className="w-3 h-3 text-cyan-400" />
                                {p.ubicacion_anaquel}
                              </strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Stock Mínimo:</span>
                              <span className="text-rose-400 font-mono text-xs font-bold">
                                {p.stock_min} {p.unidad_medida}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProdForKardex(p)}
                            className="px-2.5 py-1 text-xs font-bold text-cyan-300 hover:text-white bg-indigo-950 border border-indigo-700/60 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Kardex</span>
                          </button>

                          {user.rol === 'ADMIN' && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setProductoToEdit(p);
                                  setIsModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleActivo(p)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isInactive
                                    ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                                    : 'bg-red-950 text-red-400 hover:bg-red-900'
                                }`}
                                title={isInactive ? 'Reactivar SKU' : 'Desactivar SKU'}
                              >
                                {isInactive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Alta / Edición de Producto */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => loadProductos(true)}
          productoToEdit={productoToEdit}
          defaultCategoria={defaultCatForModal}
          defaultUbicacion={defaultUbicacionForModal}
        />

        {/* Modal de Impresión de Etiqueta Industrial */}
        <ProductLabelModal
          isOpen={Boolean(selectedProdForLabel)}
          onClose={() => setSelectedProdForLabel(null)}
          producto={selectedProdForLabel}
        />

        {/* Modal de Kardex Clínico del Material */}
        <ProductKardexModal
          isOpen={Boolean(selectedProdForKardex)}
          onClose={() => setSelectedProdForKardex(null)}
          producto={selectedProdForKardex}
        />

      </div>
    </AppShell>
  );
}
