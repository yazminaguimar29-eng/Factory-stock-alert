'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StockBadge } from '@/components/inventory/StockBadge';
import { ProductModal } from '@/components/inventory/ProductModal';
import { InventarioNavTabs } from '@/components/inventory/InventarioNavTabs';
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
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Table as TableIcon,
  Layers,
  ChevronRight,
  ChevronLeft,
  Warehouse,
  Cog,
  Wrench,
  HardHat,
  Package as PackageIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { Producto, UsuarioAutenticado, CategoriaProducto } from '@/types';
import { ImageModal } from '@/components/ui/ImageModal';
import { ProductLabelModal } from '@/components/inventory/ProductLabelModal';
import { ProductKardexModal } from '@/components/inventory/ProductKardexModal';
import { BarcodeScannerModal } from '@/components/scanner/BarcodeScannerModal';
import { useToast } from '@/components/ui/ToastContext';
import { History, Tag, Scan } from 'lucide-react';

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
    color: 'from-indigo-900/85 via-violet-900/60 to-slate-900/90 border-violet-400/50 text-violet-200 hover:border-violet-300 hover:shadow-violet-500/30',
    accentBorder: 'border-t-violet-400',
    badgeBg: 'bg-violet-950/90 text-violet-200 border-violet-500/60',
    iconBg: 'bg-violet-500/25 border-violet-300/50 text-violet-300',
  },
  {
    id: 'Mixes y Harinas (BG)',
    label: 'Mixes y Harinas (BG)',
    descripcion: 'Mezclas en polvo, mixes de pastel, pulque y bisquetes en bultos de 20 kg',
    icon: PackageIcon,
    color: 'from-orange-900/85 via-amber-900/60 to-slate-900/90 border-orange-400/50 text-orange-200 hover:border-orange-300 hover:shadow-orange-500/30',
    accentBorder: 'border-t-orange-400',
    badgeBg: 'bg-orange-950/90 text-orange-200 border-orange-500/60',
    iconBg: 'bg-orange-500/25 border-orange-300/50 text-orange-300',
  },
  {
    id: 'Icings y Coberturas (PA)',
    label: 'Icings y Coberturas (PA)',
    descripcion: 'Glaseados planos, untables de canela, maple y queso crema en cubetas',
    icon: Cog,
    color: 'from-fuchsia-900/85 via-pink-900/60 to-slate-900/90 border-fuchsia-400/50 text-fuchsia-200 hover:border-fuchsia-300 hover:shadow-fuchsia-500/30',
    accentBorder: 'border-t-fuchsia-400',
    badgeBg: 'bg-fuchsia-950/90 text-fuchsia-200 border-fuchsia-500/60',
    iconBg: 'bg-fuchsia-500/25 border-fuchsia-300/50 text-fuchsia-300',
  },
  {
    id: 'Materia Prima',
    label: 'Materia Prima General',
    descripcion: 'Ingredientes, materias primas e insumos auxiliares de producción',
    icon: Wrench,
    color: 'from-teal-900/85 via-emerald-900/60 to-slate-900/90 border-teal-400/50 text-teal-200 hover:border-teal-300 hover:shadow-teal-500/30',
    accentBorder: 'border-t-teal-400',
    badgeBg: 'bg-teal-950/90 text-teal-200 border-teal-500/60',
    iconBg: 'bg-teal-500/25 border-teal-300/50 text-teal-300',
  },
  {
    id: 'Consumibles',
    label: 'Consumibles e Insumos de Empaque',
    descripcion: 'Tarimas, esquineros, slip sheets, emplayers, cajas, bolsas de sellos y conos',
    icon: HardHat,
    color: 'from-lime-900/85 via-emerald-950/60 to-slate-900/90 border-lime-400/50 text-lime-200 hover:border-lime-300 hover:shadow-lime-500/30',
    accentBorder: 'border-t-lime-400',
    badgeBg: 'bg-lime-950/90 text-lime-200 border-lime-500/60',
    iconBg: 'bg-lime-500/25 border-lime-300/50 text-lime-300',
  },
];

export default function InventarioPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<{ url: string; title: string } | null>(null);
  const [selectedProdForLabel, setSelectedProdForLabel] = useState<Producto | null>(null);
  const [selectedProdForKardex, setSelectedProdForKardex] = useState<Producto | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { showSuccess } = useToast();

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

  const loadProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/productos?activos=all');
      const data = await res.json();
      if (data.productos) {
        setProductos(data.productos);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductos();
  }, []);

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
        loadProductos();
      }
    } catch (err) {
      console.error('Error toggling activo:', err);
    }
  };

  // Filtrado
  const filteredProductos = productos.filter((p) => {
    // Si no es ADMIN, no mostrar inactivos
    if (user?.rol !== 'ADMIN' && p.activo === 'NO') return false;

    // Filtro por búsqueda
    const matchesSearch =
      p.codigo_sku.toLowerCase().includes(search.toLowerCase()) ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.ubicacion_anaquel.toLowerCase().includes(search.toLowerCase()) ||
      p.proveedor_principal.toLowerCase().includes(search.toLowerCase());

    // Filtro por categoría
    const matchesCategoria = selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;

    // Filtro por estado de stock
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
        {/* Menú Unificado: Inventario y Ajustes */}
        <InventarioNavTabs userRole={user.rol} />

        {/* Cabecera y botón Crear SKU */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <Boxes className="w-7 h-7 text-amber-400" />
              <span>Inventario General de Almacén</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Catálogo de materiales industriales, ubicaciones físicas y semaforización de existencias
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Selector de Modo de Vista (Tabla vs Drill-Down) en Bloque Geométrico Biselado */}
            <div className="bg-indigo-950/85 border border-violet-500/40 p-1 rounded-tl-2xl rounded-br-2xl flex items-center gap-1 shadow-md">
              <button
                type="button"
                onClick={() => setViewLayout('tabla')}
                className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewLayout === 'tabla'
                    ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-md shadow-fuchsia-500/30'
                    : 'text-violet-300 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('drilldown')}
                className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewLayout === 'drilldown'
                    ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-md shadow-fuchsia-500/30'
                    : 'text-violet-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drill-Down</span>
              </button>
            </div>

            <button
              onClick={loadProductos}
              title="Refrescar catálogo"
              className="p-2.5 bg-indigo-950/85 hover:bg-violet-900 text-violet-200 hover:text-fuchsia-300 rounded-tl-xl rounded-br-xl border border-violet-500/40 transition-colors shadow-sm"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-fuchsia-400' : ''}`} />
            </button>

            {user.rol === 'ADMIN' && (
              <button
                onClick={() => {
                  setProductoToEdit(null);
                  setDefaultCatForModal(undefined);
                  setDefaultUbicacionForModal(undefined);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 text-white text-xs font-black rounded-tl-2xl rounded-br-2xl rounded-tr-xs rounded-bl-xs shadow-lg shadow-fuchsia-500/30 transition-all hover:scale-[1.02] border border-white/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Registrar Nuevo SKU</span>
              </button>
            )}
          </div>
        </div>

        {viewLayout === 'tabla' ? (
          <>
            {/* BARRA DE FILTROS Y BÚSQUEDA CON FORMAS BISELADAS */}
        <div className="bg-indigo-950/80 backdrop-blur-md border border-violet-500/40 border-t-4 border-t-fuchsia-400 p-4 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md shadow-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Buscador y Botón Escáner Barcode */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-fuchsia-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por SKU, material, ubicación..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/85 border border-violet-500/40 rounded-tl-xl rounded-br-xl text-xs text-white placeholder-violet-300/60 focus:outline-none focus:border-fuchsia-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                title="Escanear Código de Barras o QR"
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-tl-xl rounded-br-xl font-black text-xs flex items-center gap-1.5 shadow transition"
              >
                <Scan className="w-4 h-4 text-slate-950" />
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>

            {/* Categoría */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/85 border border-violet-500/40 rounded-tl-xl rounded-br-xl text-xs text-white focus:outline-none focus:border-fuchsia-400"
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
                className="w-full px-3 py-2 bg-slate-950/85 border border-violet-500/40 rounded-tl-xl rounded-br-xl text-xs text-white focus:outline-none focus:border-fuchsia-400"
              >
                <option value="TODOS">Todos los Estados de Stock</option>
                <option value="NORMAL">Normal (Verde)</option>
                <option value="CRITICO">Stock Crítico &le; Mínimo (Rojo)</option>
                <option value="SOBRESTOCK">Sobrestock &ge; Máximo (Amarillo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL DE INVENTARIO */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-3 py-3 text-center">Foto</th>
                  <th className="px-4 py-3">Material / Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Stock Actual</th>
                  <th className="px-4 py-3">Mín / Máx</th>
                  <th className="px-4 py-3">Ubicación Física</th>
                  <th className="px-4 py-3">Proveedor Principal</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                      No se encontraron materiales que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((p) => {
                    const isInactive = p.activo === 'NO';
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-850 transition-colors ${
                          isInactive ? 'opacity-40 bg-slate-950/40' : ''
                        }`}
                      >
                        {/* SKU */}
                        <td className="px-4 py-3 font-mono font-bold text-amber-400 text-sm">
                          {p.codigo_sku}
                          {isInactive && (
                            <span className="block text-[9px] font-sans text-red-400 uppercase font-semibold">
                              (Inactivo)
                            </span>
                          )}
                        </td>

                        {/* Foto Thumbnail */}
                        <td className="px-3 py-2 text-center">
                          {p.imagen_url ? (
                            <button
                              type="button"
                              onClick={() => setSelectedImageForZoom({ url: p.imagen_url!, title: `${p.codigo_sku} — ${p.nombre}` })}
                              className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 hover:border-cyan-400 group inline-block shadow-sm transition"
                              title="Toca para ver foto completa"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto" title="Sin foto">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>

                        {/* Nombre & Descripción */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedProdForKardex(p)}
                            className="font-semibold text-white text-sm hover:text-cyan-300 transition text-left flex items-center gap-1.5 group"
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
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {p.categoria}
                          </span>
                        </td>

                        {/* Stock Actual */}
                        <td className="px-4 py-3 font-mono font-bold text-white text-base">
                          {p.stock_actual}{' '}
                          <span className="text-xs font-sans text-slate-400 font-normal">
                            {p.unidad_medida}
                          </span>
                        </td>

                        {/* Mín / Máx */}
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          Min: <span className="text-red-400 font-bold">{p.stock_min}</span> / Max:{' '}
                          <span className="text-amber-400 font-bold">{p.stock_max}</span>
                        </td>

                        {/* Ubicación Física */}
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {p.ubicacion_anaquel}
                          </div>
                        </td>

                        {/* Proveedor */}
                        <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
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
                              className="p-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white rounded-lg transition-colors shadow-sm"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Botón Imprimir Etiqueta */}
                            <button
                              onClick={() => setSelectedProdForLabel(p)}
                              title="Imprimir Etiqueta Código de Barras (Anaquel/Tarima)"
                              className="p-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-700/60 text-amber-300 hover:text-white rounded-lg transition-colors shadow-sm"
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
                                  isInactive
                                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400'
                                    : 'bg-red-950 hover:bg-red-900 text-red-400'
                                }`}
                              >
                                {isInactive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        )}
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
          {/* Breadcrumb del Drill-Down con Geometría Biselada */}
          <div className="flex items-center justify-between bg-indigo-950/85 backdrop-blur-md border border-violet-500/40 px-4 py-3 rounded-tl-2xl rounded-br-2xl shadow-lg">
            <div className="flex items-center gap-2 text-xs text-violet-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setDrillCat(null);
                  setDrillZone(null);
                }}
                className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl font-bold flex items-center gap-1.5 transition-all ${
                  !drillCat
                    ? 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-md shadow-fuchsia-500/30'
                    : 'hover:text-fuchsia-300 hover:bg-violet-900/50 text-violet-300'
                }`}
              >
                <Warehouse className="w-4 h-4" />
                <span>1. Catálogo de Planta</span>
              </button>

              {drillCat && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
                  <button
                    type="button"
                    onClick={() => setDrillZone(null)}
                    className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl font-bold transition-all ${
                      !drillZone
                        ? 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-md shadow-fuchsia-500/30'
                        : 'hover:text-fuchsia-300 hover:bg-violet-900/50 text-violet-200'
                    }`}
                  >
                    2. {drillCat}
                  </button>
                </>
              )}

              {drillZone && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
                  <span className="px-3.5 py-1.5 rounded-tl-xl rounded-br-xl bg-fuchsia-950 border border-fuchsia-400/60 text-fuchsia-200 font-bold font-mono">
                    3. {drillZone}
                  </span>
                </>
              )}
            </div>

            {/* Botón contextual de Agregar SKU en Bloque Biselado */}
            {user.rol === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setProductoToEdit(null);
                  setDefaultCatForModal(drillCat || undefined);
                  if (drillZone && drillZone !== 'TODOS') {
                    const zoneCode = drillZone.replace('Anaquel ', '').trim();
                    setDefaultUbicacionForModal(`${zoneCode}-R1-N1`);
                  } else {
                    setDefaultUbicacionForModal(undefined);
                  }
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 text-white text-xs font-black rounded-tl-xl rounded-br-xl shadow-md shadow-fuchsia-500/30 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {drillZone && drillZone !== 'TODOS'
                    ? `+ SKU en ${drillZone}`
                    : drillCat
                    ? `+ SKU en ${drillCat}`
                    : '+ Nuevo Producto'}
                </span>
              </button>
            )}
          </div>

          {/* NIVEL 1: Categorías con Formas Geométricas y Borde Superior */}
          {!drillCat && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-violet-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rotate-45 bg-fuchsia-400 inline-block"></span>
                    Nivel 1: Seleccione un Bloque Industrial
                  </h3>
                  <p className="text-xs text-violet-200/80 mt-0.5">
                    Explore el almacén desde la macro-estructura de materiales
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-0.5 rounded-tl-lg rounded-br-lg bg-indigo-950/80 border border-violet-500/40 text-violet-200">{productos.length} SKUs activos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DRILL_CATEGORIAS.map((cat) => {
                  const Icon = cat.icon;
                  const catProds = productos.filter(
                    (p) => p.categoria === cat.id && (user.rol === 'ADMIN' || p.activo === 'SI')
                  );
                  const totalUnits = catProds.reduce((acc, p) => acc + p.stock_actual, 0);
                  const criticalCount = catProds.filter((p) => p.stock_actual <= p.stock_min).length;

                  return (
                    <div
                      key={cat.id}
                      className={`p-5 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md border border-t-4 ${cat.accentBorder} bg-gradient-to-br transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between backdrop-blur-md ${cat.color}`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className={`p-3.5 rotate-3 rounded-tl-2xl rounded-br-2xl border shadow-md ${cat.iconBg}`}>
                            <Icon className="w-6 h-6 -rotate-3" />
                          </div>
                          <span className={`px-3 py-1 text-xs font-mono font-bold rounded-tl-xl rounded-br-xl border shadow-sm ${cat.badgeBg}`}>
                            {catProds.length} SKUs
                          </span>
                        </div>

                        <h4 className="text-base font-black text-white mt-4">{cat.label}</h4>
                        <p className="text-xs text-slate-200/85 mt-1 line-clamp-2">{cat.descripcion}</p>

                        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-slate-300 block text-[10px]">Unidades:</span>
                            <strong className="text-white font-bold">{totalUnits.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-slate-300 block text-[10px]">Stock Crítico:</span>
                            <strong className={criticalCount > 0 ? 'text-rose-300 font-bold' : 'text-slate-300'}>
                              {criticalCount} SKUs
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        {user.rol === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductoToEdit(null);
                              setDefaultCatForModal(cat.id);
                              setDefaultUbicacionForModal(undefined);
                              setIsModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-[11px] font-bold text-violet-200 hover:text-white bg-slate-950/70 hover:bg-slate-900 rounded-tl-xl rounded-br-xl border border-violet-400/40 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 text-fuchsia-400" />
                            <span>+ SKU</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setDrillCat(cat.id);
                            setDrillZone(null);
                          }}
                          className="px-4 py-1.5 text-xs font-black text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 rounded-tl-xl rounded-br-xl transition-all flex items-center gap-1.5 ml-auto shadow-md shadow-fuchsia-500/30"
                        >
                          <span>Explorar Anaqueles</span>
                          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NIVEL 2: Zonas / Anaqueles de la Categoría */}
          {drillCat && !drillZone && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Nivel 2: Anaqueles y Racks en {drillCat}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {drillCategoryProducts.length} productos distribuidos en estanterías físicas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrillCat(null)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver a Categorías</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tarjeta para ver todos los anaqueles juntos */}
                <button
                  type="button"
                  onClick={() => setDrillZone('TODOS')}
                  className="p-5 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                        <Boxes className="w-6 h-6" />
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-amber-400 rounded border border-amber-500/30">
                        {drillCategoryProducts.length} SKUs
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-4 group-hover:text-amber-400 transition-colors">
                      Ver Todos los Anaqueles
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Listar todos los materiales de {drillCat} sin filtro de estante
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-bold text-amber-400 flex items-center justify-between">
                    <span>Explorar Todos</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Tarjetas por cada Anaquel físico */}
                {drillAvailableZones.map((z) => (
                  <div
                    key={z.zone}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="p-3 bg-slate-950 text-slate-300 rounded-xl">
                          <Warehouse className="w-6 h-6 text-amber-400" />
                        </span>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg border border-slate-800">
                          {z.count} items
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-4">{z.zone}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Existencias: <strong className="text-white">{z.totalStock}</strong> unidades
                      </p>
                      {z.criticalCount > 0 && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-red-950/80 border border-red-800 text-red-300 rounded">
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
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>+ SKU aquí</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDrillZone(z.zone)}
                        className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1 ml-auto"
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Nivel 3: Materiales en {drillCat} &bull; {drillZone === 'TODOS' ? 'Todos los Anaqueles' : drillZone}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {drillFinalProducts.length} productos registrados en esta sección
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrillZone(null)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
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
                      className={`p-4 rounded-xl border bg-slate-900 flex flex-col justify-between transition-all ${
                        isInactive ? 'opacity-40 border-slate-800' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-amber-400">
                            {p.codigo_sku}
                          </span>
                          <StockBadge actual={p.stock_actual} min={p.stock_min} max={p.stock_max} unidad={p.unidad_medida} />
                        </div>

                        <div className="flex items-start gap-3 my-2.5">
                          {p.imagen_url ? (
                            <button
                              type="button"
                              onClick={() => setSelectedImageForZoom({ url: p.imagen_url!, title: `${p.codigo_sku} — ${p.nombre}` })}
                              className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 hover:border-cyan-400 shrink-0 shadow-md group transition"
                              title="Toca para ver foto en tamaño completo"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0" title="Sin foto">
                              <ImageIcon className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{p.nombre}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {p.descripcion || 'Sin descripción técnica registrada.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Stock Físico:</span>
                            <strong className="text-white font-mono text-sm">
                              {p.stock_actual} {p.unidad_medida}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Ubicación:</span>
                            <strong className="text-slate-300 font-mono flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              {p.ubicacion_anaquel}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Límites:</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              Min {p.stock_min} / Max {p.stock_max}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Costo:</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ${p.costo_unitario.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {user.rol === 'ADMIN' && (
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setProductoToEdit(p);
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Alta / Edición de Producto con Categoría y Ubicación preseleccionadas */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProductos}
        productoToEdit={productoToEdit}
        defaultCategoria={defaultCatForModal}
        defaultUbicacion={defaultUbicacionForModal}
      />

      {/* Modal para Visualizar Foto en Grande */}
      <ImageModal
        isOpen={Boolean(selectedImageForZoom)}
        onClose={() => setSelectedImageForZoom(null)}
        imageUrl={selectedImageForZoom?.url || null}
        title={selectedImageForZoom?.title}
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

      {/* Modal de Escáner de Código de Barras y QR */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        productos={productos}
        onProductScanned={(prod) => {
          setSearch(prod.codigo_sku);
          showSuccess(`Material localizado: ${prod.codigo_sku} — ${prod.nombre}`, 'Escaneo Exitoso');
        }}
        title="Escanear Material en Almacén"
      />

      </div>
    </AppShell>
  );
}
