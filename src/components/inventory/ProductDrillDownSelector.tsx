'use client';

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Layers,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  MapPin,
  PackagePlus,
  PackageCheck,
  AlertCircle,
  CheckCircle,
  X,
  Sparkles,
  Warehouse,
  ShieldAlert,
  Wrench,
  HardHat,
  Cog,
  Package,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Producto, CategoriaProducto } from '@/types';

interface ProductDrillDownSelectorProps {
  productos: Producto[];
  selectedProductoId: string;
  onSelectProducto: (productoId: string) => void;
  onProductCreated?: (newProduct: Producto) => void;
  disabled?: boolean;
  required?: boolean;
  filterStockAvailable?: boolean; // En salidas: avisa si no hay stock
  userRole?: string;
  label?: string;
}

const CATEGORIAS_CONFIG: {
  id: CategoriaProducto;
  label: string;
  descripcion: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconBg: string;
  badgeBg: string;
  accentBorder: string;
  skuPrefix: string;
}[] = [
  {
    id: 'Panadería Congelada (CA)',
    label: 'Panadería Congelada (CA)',
    descripcion: 'Roscas, panquecitos, donas y panqués congelados RTF/RTS (Cajas)',
    icon: Boxes,
    color: 'from-indigo-900/85 via-violet-900/60 to-slate-900/90 border-violet-400/50 text-violet-200 hover:border-violet-300 hover:shadow-violet-500/30',
    iconBg: 'bg-violet-500/25 border-violet-300/50 text-violet-300',
    badgeBg: 'bg-violet-950/90 text-violet-200 border-violet-500/60',
    accentBorder: 'border-t-violet-400',
    skuPrefix: 'CA-',
  },
  {
    id: 'Mixes y Harinas (BG)',
    label: 'Mixes y Harinas (BG)',
    descripcion: 'Mezclas en polvo, mixes de pastel, pulque y bisquetes en bultos de 20 kg',
    icon: Package,
    color: 'from-orange-900/85 via-amber-900/60 to-slate-900/90 border-orange-400/50 text-orange-200 hover:border-orange-300 hover:shadow-orange-500/30',
    iconBg: 'bg-orange-500/25 border-orange-300/50 text-orange-300',
    badgeBg: 'bg-orange-950/90 text-orange-200 border-orange-500/60',
    accentBorder: 'border-t-orange-400',
    skuPrefix: 'BG-',
  },
  {
    id: 'Icings y Coberturas (PA)',
    label: 'Icings y Coberturas (PA)',
    descripcion: 'Glaseados planos, untables de canela, maple y queso crema en cubetas',
    icon: Cog,
    color: 'from-fuchsia-900/85 via-pink-900/60 to-slate-900/90 border-fuchsia-400/50 text-fuchsia-200 hover:border-fuchsia-300 hover:shadow-fuchsia-500/30',
    iconBg: 'bg-fuchsia-500/25 border-fuchsia-300/50 text-fuchsia-300',
    badgeBg: 'bg-fuchsia-950/90 text-fuchsia-200 border-fuchsia-500/60',
    accentBorder: 'border-t-fuchsia-400',
    skuPrefix: 'PA-',
  },
  {
    id: 'Materia Prima',
    label: 'Materia Prima General',
    descripcion: 'Ingredientes, materias primas e insumos auxiliares de producción',
    icon: Warehouse,
    color: 'from-teal-900/85 via-emerald-900/60 to-slate-900/90 border-teal-400/50 text-teal-200 hover:border-teal-300 hover:shadow-teal-500/30',
    iconBg: 'bg-teal-500/25 border-teal-300/50 text-teal-300',
    badgeBg: 'bg-teal-950/90 text-teal-200 border-teal-500/60',
    accentBorder: 'border-t-teal-400',
    skuPrefix: 'MP-',
  },
  {
    id: 'Consumibles',
    label: 'Consumibles e Insumos de Empaque',
    descripcion: 'Tarimas, esquineros, slip sheets, emplayers, cajas, bolsas de sellos y conos',
    icon: HardHat,
    color: 'from-lime-900/85 via-emerald-950/60 to-slate-900/90 border-lime-400/50 text-lime-200 hover:border-lime-300 hover:shadow-lime-500/30',
    iconBg: 'bg-lime-500/25 border-lime-300/50 text-lime-300',
    badgeBg: 'bg-lime-950/90 text-lime-200 border-lime-500/60',
    accentBorder: 'border-t-lime-400',
    skuPrefix: 'EMP-',
  },
];

const UNIDADES_MEDIDA = ['CA', 'BG', 'PA', 'pza', 'kg', 'lt', 'm'];

export function ProductDrillDownSelector({
  productos,
  selectedProductoId,
  onSelectProducto,
  onProductCreated,
  disabled = false,
  required = false,
  filterStockAvailable = false,
  userRole = 'ADMIN',
  label = 'Material / Insumo Solicitado',
}: ProductDrillDownSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'drill' | 'add'>('drill');

  // Drill-down navigation state
  const [selectedCat, setSelectedCat] = useState<CategoriaProducto | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null); // e.g. "Anaquel A1"
  const [drillSearch, setDrillSearch] = useState('');

  // Form state for creating a new product inside Drill-Down
  const [newSku, setNewSku] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newCat, setNewCat] = useState<CategoriaProducto>('Materia Prima');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newUnidad, setNewUnidad] = useState('pza');
  const [newProveedor, setNewProveedor] = useState('');
  const [newStockInicial, setNewStockInicial] = useState('10');
  const [newStockMin, setNewStockMin] = useState('5');
  const [newStockMax, setNewStockMax] = useState('50');
  const [newUbicacion, setNewUbicacion] = useState('A1-R1-N1');
  const [newCosto, setNewCosto] = useState('0');
  const [newImagenUrl, setNewImagenUrl] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Material actualmente seleccionado
  const currentProduct = useMemo(
    () => productos.find((p) => p.id === selectedProductoId) || null,
    [productos, selectedProductoId]
  );

  // Extraer Zonas/Anaqueles de una categoría (ej: "A1-R2-N3" -> "Anaquel A1")
  const extractZone = (ubicacion: string) => {
    if (!ubicacion) return 'Zona General';
    const match = ubicacion.match(/^([A-Z0-9]+)/i);
    return match ? `Anaquel ${match[1].toUpperCase()}` : 'Zona General';
  };

  // Filtrado de productos en el nivel actual
  const categoryProducts = useMemo(() => {
    if (!selectedCat) return [];
    return productos.filter((p) => p.categoria === selectedCat);
  }, [productos, selectedCat]);

  // Lista de zonas/anaqueles únicas dentro de la categoría seleccionada
  const availableZones = useMemo(() => {
    if (!selectedCat) return [];
    const zonesMap = new Map<string, { zone: string; count: number; totalStock: number }>();

    categoryProducts.forEach((p) => {
      const z = extractZone(p.ubicacion_anaquel);
      const existing = zonesMap.get(z) || { zone: z, count: 0, totalStock: 0 };
      existing.count += 1;
      existing.totalStock += p.stock_actual;
      zonesMap.set(z, existing);
    });

    return Array.from(zonesMap.values()).sort((a, b) => a.zone.localeCompare(b.zone));
  }, [selectedCat, categoryProducts]);

  // Productos finales mostrados en Nivel 3 (o búsqueda global dentro del modal)
  const filteredProducts = useMemo(() => {
    let prods = productos;

    if (drillSearch.trim()) {
      const q = drillSearch.toLowerCase().trim();
      return prods.filter(
        (p) =>
          p.codigo_sku.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          p.ubicacion_anaquel.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.proveedor_principal.toLowerCase().includes(q)
      );
    }

    if (selectedCat) {
      prods = prods.filter((p) => p.categoria === selectedCat);
    }

    if (selectedZone) {
      prods = prods.filter((p) => extractZone(p.ubicacion_anaquel) === selectedZone);
    }

    return prods;
  }, [productos, selectedCat, selectedZone, drillSearch]);

  // Autogenerar SKU sugerido según categoría
  const handleAutoSuggestSku = (cat: CategoriaProducto) => {
    const config = CATEGORIAS_CONFIG.find((c) => c.id === cat);
    const prefix = config ? config.skuPrefix : 'SKU-';
    const existingCount = productos.filter((p) => p.categoria === cat).length + 1;
    const pad = String(existingCount).padStart(3, '0');
    setNewSku(`${prefix}${pad}`);
  };

  const openDrillDownModal = (initAdd = false) => {
    if (disabled) return;
    setDrillSearch('');
    if (initAdd) {
      setViewMode('add');
      setNewImagenUrl(null);
      setNewCat(selectedCat || 'Materia Prima');
      handleAutoSuggestSku(selectedCat || 'Materia Prima');
      if (selectedZone) {
        const zoneCode = selectedZone.replace('Anaquel ', '').trim();
        setNewUbicacion(`${zoneCode}-R1-N1`);
      }
    } else {
      setViewMode('drill');
      if (currentProduct) {
        setSelectedCat(currentProduct.categoria);
        setSelectedZone(extractZone(currentProduct.ubicacion_anaquel));
      }
    }
    setIsModalOpen(true);
  };

  const handleSelectAndClose = (prod: Producto) => {
    onSelectProducto(prod.id);
    setIsModalOpen(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const payload = {
        codigo_sku: newSku.trim().toUpperCase(),
        nombre: newNombre.trim(),
        categoria: newCat,
        descripcion: newDescripcion.trim(),
        unidad_medida: newUnidad.trim(),
        proveedor_principal: newProveedor.trim(),
        stock_actual: Number(newStockInicial) || 0,
        stock_min: Number(newStockMin) || 0,
        stock_max: Number(newStockMax) || 0,
        ubicacion_anaquel: newUbicacion.trim().toUpperCase(),
        costo_unitario: Number(newCosto) || 0,
        imagen_url: newImagenUrl || undefined,
      };

      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar el nuevo producto.');
      }

      const created = data.producto as Producto;
      if (onProductCreated) {
        onProductCreated(created);
      }

      // Seleccionar automáticamente el nuevo producto
      onSelectProducto(created.id);
      setIsModalOpen(false);

      // Limpiar formulario
      setNewNombre('');
      setNewDescripcion('');
      setNewProveedor('');
      setNewImagenUrl(null);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Etiqueta y botones superiores con geometría biselada */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-violet-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rotate-45 bg-fuchsia-400 inline-block"></span>
          <span>{label}</span>
          {required && <span className="text-fuchsia-400">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openDrillDownModal(false)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-violet-100 hover:text-white bg-gradient-to-r from-violet-900/80 to-fuchsia-900/80 hover:from-violet-800 hover:to-fuchsia-800 border border-violet-400/50 rounded-tl-xl rounded-br-xl rounded-tr-xs rounded-bl-xs transition-all shadow-md shadow-violet-950/40"
          >
            <Layers className="w-3.5 h-3.5 text-fuchsia-300" />
            <span>Selector Geométrico 3D</span>
          </button>
          {(userRole === 'ADMIN' || userRole === 'ALMACENISTA') && (
            <button
              type="button"
              onClick={() => openDrillDownModal(true)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:text-slate-950 bg-amber-950/70 hover:bg-amber-400 border border-amber-400/50 rounded-tl-xl rounded-br-xl rounded-tr-xs rounded-bl-xs transition-all"
              title="Registrar un nuevo producto directamente al catálogo"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo SKU</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector Principal Visual con Forma Geométrica Asimétrica y Acento Superior */}
      {currentProduct ? (
        <div className="p-4 bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-violet-950/90 border border-teal-400/50 border-t-4 border-t-teal-400 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-indigo-950/40 backdrop-blur-md">
          <div className="flex items-start gap-3.5">
            {currentProduct.imagen_url ? (
              <img
                src={currentProduct.imagen_url}
                alt={currentProduct.nombre}
                className="w-12 h-12 rounded-tl-2xl rounded-br-2xl rounded-tr-xs rounded-bl-xs object-cover border-2 border-teal-400/60 flex-shrink-0 mt-0.5 shadow-md"
              />
            ) : (
              <div className="w-11 h-11 rotate-3 rounded-tl-2xl rounded-br-2xl bg-teal-500/25 text-teal-300 border border-teal-400/50 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                <PackageCheck className="w-5 h-5 -rotate-3" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 bg-fuchsia-950/90 border border-fuchsia-400/60 rounded-tl-lg rounded-br-lg text-xs font-mono font-bold text-fuchsia-200">
                  {currentProduct.codigo_sku}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-tr-lg rounded-bl-lg bg-violet-900/70 border border-violet-500/40 text-violet-100 font-semibold">
                  {currentProduct.categoria}
                </span>
                <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1 px-2.5 py-0.5 bg-amber-950/70 border border-amber-500/40 rounded-tl-lg rounded-br-lg">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {currentProduct.ubicacion_anaquel}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-1.5">{currentProduct.nombre}</h3>
              <p className="text-xs text-indigo-200/80 line-clamp-1">{currentProduct.descripcion || 'Sin descripción técnica'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => openDrillDownModal(false)}
              className="px-4 py-1.5 bg-violet-900/80 hover:bg-fuchsia-500 hover:text-slate-950 text-violet-100 text-xs font-bold rounded-tl-xl rounded-br-xl rounded-tr-xs rounded-bl-xs border border-violet-400/50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>Cambiar</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectProducto('')}
              className="p-1.5 text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 rounded-tl-lg rounded-br-lg border border-transparent hover:border-rose-500/40 transition-colors"
              title="Quitar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Estado sin selección: Tarjeta Geométrica Biselada con Gradiente Violeta/Fucsia */
        <div
          onClick={() => openDrillDownModal(false)}
          className="cursor-pointer group p-4 bg-gradient-to-r from-indigo-950/85 via-violet-950/75 to-fuchsia-950/80 hover:from-indigo-900/90 hover:to-fuchsia-900/85 border border-violet-400/50 hover:border-fuchsia-400 border-t-4 border-t-fuchsia-400 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md transition-all flex items-center justify-between shadow-lg hover:shadow-fuchsia-500/25 backdrop-blur-md"
        >
          <div className="flex items-center gap-4 text-violet-200 group-hover:text-white">
            <div className="w-11 h-11 rotate-6 group-hover:rotate-12 rounded-tl-2xl rounded-br-2xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 border border-fuchsia-400/50 text-fuchsia-300 flex items-center justify-center transition-all flex-shrink-0 shadow-md">
              <Search className="w-5 h-5 -rotate-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white group-hover:text-fuchsia-200 transition-colors tracking-wide">
                Haz clic para abrir la Matriz de Selección de Materiales
              </p>
              <p className="text-[11px] text-violet-200/80">
                Explora por <span className="text-fuchsia-300 font-semibold">Categoría &rarr; Estante &rarr; SKU</span> con fichas visuales
              </p>
            </div>
          </div>
          <span className="px-4 py-2 text-xs font-black bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 text-white rounded-tl-2xl rounded-br-2xl rounded-tr-xs rounded-bl-xs shadow-lg shadow-fuchsia-500/30 group-hover:from-fuchsia-400 group-hover:to-indigo-400 transition-all flex items-center gap-1.5 border border-white/20">
            <span>Abrir Selector</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL / DRAWER DRILL-DOWN Y MÓDULO DE DATOS               */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-gradient-to-b from-indigo-950/95 via-slate-900/95 to-slate-950/95 border-2 border-violet-400/50 w-full max-w-4xl rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-lg rounded-bl-lg shadow-2xl shadow-violet-950/60 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-violet-500/30 bg-gradient-to-r from-indigo-950 via-violet-950/90 to-fuchsia-950/80">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rotate-3 bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 text-fuchsia-300 border border-fuchsia-400/50 rounded-tl-2xl rounded-br-2xl shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2 tracking-wide">
                    Matriz Interactiva de Selección y Alta (3 Niveles)
                  </h2>
                  <p className="text-xs text-violet-200/80">
                    Selecciona por bloque industrial, anaquel físico o búsqueda instantánea
                  </p>
                </div>
              </div>

              {/* Botones de Vista con Forma Geométrica Biselada */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-950/80 p-1 rounded-tl-2xl rounded-br-2xl border border-violet-500/40 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('drill')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-tl-xl rounded-br-xl transition-all flex items-center gap-1.5 ${
                      viewMode === 'drill'
                        ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-md shadow-fuchsia-500/30'
                        : 'text-violet-300 hover:text-white'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Explorador</span>
                  </button>
                  {(userRole === 'ADMIN' || userRole === 'ALMACENISTA') && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('add');
                        handleAutoSuggestSku(selectedCat || 'Materia Prima');
                      }}
                      className={`px-4 py-1.5 text-xs font-bold rounded-tl-xl rounded-br-xl transition-all flex items-center gap-1.5 ${
                        viewMode === 'add'
                          ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-md shadow-fuchsia-500/30'
                          : 'text-violet-300 hover:text-white'
                      }`}
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>+ Agregar SKU</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-violet-300 hover:text-white rounded-tl-xl rounded-br-xl hover:bg-violet-800/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENIDO 1: MODO DRILL-DOWN */}
            {viewMode === 'drill' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Barra de Búsqueda Rápida + Breadcrumbs Geométricos */}
                <div className="space-y-3">
                  {/* Buscador global con forma biselada */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-fuchsia-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={drillSearch}
                      onChange={(e) => setDrillSearch(e.target.value)}
                      placeholder="Buscar por SKU, nombre, anaquel o proveedor en todo el catálogo..."
                      className="w-full pl-11 pr-4 py-2.5 bg-indigo-950/70 border border-violet-400/50 rounded-tl-2xl rounded-br-2xl rounded-tr-xs rounded-bl-xs text-sm text-white placeholder-violet-300/60 focus:outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 transition-all"
                    />
                    {drillSearch && (
                      <button
                        type="button"
                        onClick={() => setDrillSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-fuchsia-300 hover:text-white font-semibold"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* Breadcrumb de navegación estilo bloques geométricos */}
                  {!drillSearch && (
                    <div className="flex items-center gap-2 text-xs text-violet-200 bg-indigo-950/60 p-2 rounded-tl-2xl rounded-br-2xl border border-violet-500/30 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCat(null);
                          setSelectedZone(null);
                        }}
                        className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl font-bold flex items-center gap-1.5 transition-all ${
                          !selectedCat
                            ? 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-md shadow-fuchsia-500/30'
                            : 'hover:text-fuchsia-300 hover:bg-violet-900/50 text-violet-300'
                        }`}
                      >
                        <Warehouse className="w-3.5 h-3.5" />
                        <span>1. Bloques de Almacén</span>
                      </button>

                      {selectedCat && (
                        <>
                          <ChevronRight className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                          <button
                            type="button"
                            onClick={() => setSelectedZone(null)}
                            className={`px-3.5 py-1.5 rounded-tl-xl rounded-br-xl font-bold transition-all ${
                              !selectedZone
                                ? 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-md shadow-fuchsia-500/30'
                                : 'hover:text-fuchsia-300 hover:bg-violet-900/50 text-violet-200'
                            }`}
                          >
                            2. {selectedCat}
                          </button>
                        </>
                      )}

                      {selectedZone && (
                        <>
                          <ChevronRight className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                          <span className="px-3.5 py-1.5 rounded-tl-xl rounded-br-xl bg-fuchsia-950 border border-fuchsia-400/60 text-fuchsia-200 font-bold font-mono">
                            3. {selectedZone}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Si el usuario escribió en el buscador, mostrar resultados directos */}
                {drillSearch.trim() ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-violet-200">
                      <span>Resultados de búsqueda: <strong>{filteredProducts.length}</strong> encontrados</span>
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 bg-indigo-950/40 rounded-tl-3xl rounded-br-3xl border border-violet-500/30 text-violet-200 space-y-2">
                        <AlertCircle className="w-8 h-8 text-fuchsia-400 mx-auto" />
                        <p className="text-sm font-semibold">No se encontraron productos coincidentes.</p>
                        <p className="text-xs text-violet-300/70">Intenta con otro término o da de alta el nuevo SKU.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredProducts.map((p) => renderProductCard(p))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* NAVEGACIÓN JERÁRQUICA ESCALONADA (DRILL-DOWN) */
                  <>
                    {/* NIVEL 1: Categorías con Geometría de Hoja Biselada y Acento Superior */}
                    {!selectedCat && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-violet-200 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rotate-45 bg-fuchsia-400"></span>
                            Nivel 1: Seleccione un Bloque de Categoría
                          </span>
                          <span className="text-xs font-mono px-3 py-0.5 rounded-tl-lg rounded-br-lg bg-indigo-950 border border-violet-500/40 text-violet-200">
                            {productos.length} SKUs totales
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {CATEGORIAS_CONFIG.map((cat) => {
                            const Icon = cat.icon;
                            const count = productos.filter((p) => p.categoria === cat.id).length;
                            const totalStock = productos
                              .filter((p) => p.categoria === cat.id)
                              .reduce((acc, p) => acc + p.stock_actual, 0);

                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCat(cat.id);
                                  setSelectedZone(null);
                                }}
                                className={`text-left p-5 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md border border-t-4 ${cat.accentBorder} bg-gradient-to-br transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between ${cat.color}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className={`p-3 rotate-3 group-hover:rotate-6 transition-transform rounded-tl-2xl rounded-br-2xl border shadow-md ${cat.iconBg}`}>
                                    <Icon className="w-6 h-6 -rotate-3" />
                                  </div>
                                  <span className={`px-3 py-1 text-[11px] font-mono font-bold rounded-tl-xl rounded-br-xl border shadow-sm ${cat.badgeBg}`}>
                                    {count} SKUs
                                  </span>
                                </div>
                                <div className="mt-4">
                                  <h3 className="text-sm font-black text-white group-hover:text-fuchsia-200 transition-colors flex items-center justify-between">
                                    <span>{cat.label}</span>
                                    <span className="w-6 h-6 rounded-tl-lg rounded-br-lg bg-white/15 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                  </h3>
                                  <p className="text-[11px] text-slate-200/80 mt-1 line-clamp-2">{cat.descripcion}</p>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                                  <span className="text-slate-300">Existencias:</span>
                                  <strong className="text-white font-bold">{totalStock.toLocaleString()} uds</strong>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* NIVEL 2: Zonas / Anaqueles con Tarjetas Geométricas */}
                    {selectedCat && !selectedZone && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-violet-200 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rotate-45 bg-fuchsia-400"></span>
                              Nivel 2: Seleccione Zona o Estante en {selectedCat}
                            </span>
                            <p className="text-xs text-violet-300/80 mt-0.5">
                              {categoryProducts.length} materiales organizados por estantería física
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCat(null)}
                            className="px-3.5 py-1.5 rounded-tl-xl rounded-br-xl bg-violet-900/70 hover:bg-fuchsia-500 hover:text-white text-xs text-violet-200 font-bold transition-all flex items-center gap-1 border border-violet-400/50"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Volver a Bloques</span>
                          </button>
                        </div>

                        {/* Tarjeta de acceso a todos los materiales de la categoría */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          <button
                            type="button"
                            onClick={() => setSelectedZone('TODOS')}
                            className="p-4 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md border border-dashed border-fuchsia-400/60 border-t-4 border-t-fuchsia-400 bg-fuchsia-950/35 hover:bg-fuchsia-900/50 text-left transition-all group shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <div className="w-10 h-10 rotate-3 rounded-tl-xl rounded-br-xl bg-fuchsia-500/25 text-fuchsia-300 flex items-center justify-center border border-fuchsia-400/40">
                                <Boxes className="w-5 h-5 -rotate-3" />
                              </div>
                              <span className="px-3 py-0.5 rounded-tl-lg rounded-br-lg text-xs font-mono font-bold text-fuchsia-200 bg-fuchsia-950/90 border border-fuchsia-500/50">
                                {categoryProducts.length} SKUs
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white mt-3 group-hover:text-fuchsia-200 transition-colors">
                              Ver Todo {selectedCat}
                            </h4>
                            <p className="text-[11px] text-violet-200/80 mt-0.5">
                              Explora todos los estantes sin filtrar por zona física
                            </p>
                          </button>

                          {availableZones.map((z) => (
                            <button
                              key={z.zone}
                              type="button"
                              onClick={() => setSelectedZone(z.zone)}
                              className="p-4 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md border border-violet-500/40 border-t-4 border-t-violet-400 bg-indigo-950/60 hover:bg-violet-900/60 hover:border-fuchsia-400/60 text-left transition-all group shadow-md"
                            >
                              <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rotate-3 rounded-tl-xl rounded-br-xl bg-violet-500/20 text-violet-300 group-hover:bg-fuchsia-500/30 border border-violet-400/40 flex items-center justify-center transition-colors">
                                  <Warehouse className="w-5 h-5 -rotate-3" />
                                </div>
                                <span className="px-3 py-0.5 rounded-tl-lg rounded-br-lg text-xs font-mono font-bold bg-indigo-900/80 text-violet-200 border border-violet-500/40">
                                  {z.count} items
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-white mt-3 group-hover:text-fuchsia-200 transition-colors flex items-center justify-between">
                                <span>{z.zone}</span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-fuchsia-300" />
                              </h4>
                              <p className="text-[11px] text-violet-200/80 mt-0.5 font-mono">
                                Stock total: {z.totalStock} unidades
                              </p>
                            </button>
                          ))}
                        </div>

                        {/* Botón rápido para agregar producto en esta categoría */}
                        {(userRole === 'ADMIN' || userRole === 'ALMACENISTA') && (
                          <div className="p-3.5 bg-indigo-950/60 rounded-tl-2xl rounded-br-2xl border border-violet-500/30 flex items-center justify-between">
                            <span className="text-xs text-violet-200">
                              ¿El material requerido no se encuentra en {selectedCat}?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode('add');
                                setNewCat(selectedCat);
                                handleAutoSuggestSku(selectedCat);
                              }}
                              className="px-3.5 py-1.5 rounded-tl-xl rounded-br-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/35 text-fuchsia-200 border border-fuchsia-400/50 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar nuevo SKU a {selectedCat}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* NIVEL 3: Productos del Anaquel / Categoría seleccionada */}
                    {selectedCat && selectedZone && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-violet-200">
                              Nivel 3: Materiales en {selectedCat} &bull; {selectedZone === 'TODOS' ? 'Todos los Anaqueles' : selectedZone}
                            </span>
                            <p className="text-xs text-violet-300/80 mt-0.5">
                              Selecciona una tarjeta geométrica para cargar el material
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedZone(null)}
                            className="px-3 py-1 rounded-tl-xl rounded-br-xl bg-violet-900/70 hover:bg-fuchsia-500 text-xs text-fuchsia-200 hover:text-white flex items-center gap-1 font-bold border border-violet-400/40 transition-all"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Cambiar Anaquel</span>
                          </button>
                        </div>

                        {/* Listado de tarjetas de productos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {filteredProducts.map((p) => renderProductCard(p))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* CONTENIDO 2: MÓDULO DE DATOS (AGREGAR NUEVO SKU) */}
            {viewMode === 'add' && (
              <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Módulo de Alta Inmediata en Catálogo</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Crea un nuevo SKU y selecciónalo automáticamente sin salir del formulario
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('drill')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Volver a Explorar</span>
                  </button>
                </div>

                {createError && (
                  <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl flex items-center gap-2 text-red-300 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Categoría */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Categoría Industrial <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={newCat}
                      onChange={(e) => {
                        const val = e.target.value as CategoriaProducto;
                        setNewCat(val);
                        handleAutoSuggestSku(val);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      {CATEGORIAS_CONFIG.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SKU con generador */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Código SKU <span className="text-amber-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoSuggestSku(newCat)}
                        className="text-[11px] text-amber-400 hover:underline font-mono"
                      >
                        Sugerir SKU
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                      placeholder="Ej. MP-005, REF-201"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Nombre del Material / Refacción <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Ej. Tornillo Allen Grado 8 de 1/2 pulgada"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Descripción Técnica
                  </label>
                  <input
                    type="text"
                    value={newDescripcion}
                    onChange={(e) => setNewDescripcion(e.target.value)}
                    placeholder="Uso, aleación, especificaciones o especificación técnica"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Unidad */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Unidad de Medida <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={newUnidad}
                      onChange={(e) => setNewUnidad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      {UNIDADES_MEDIDA.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ubicación Anaquel */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Ubicación (A-R-N) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUbicacion}
                      onChange={(e) => setNewUbicacion(e.target.value.toUpperCase())}
                      placeholder="A1-R2-N3"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-500">Ej: A1-R2-N3 (Anaquel-Rack-Nivel)</span>
                  </div>

                  {/* Proveedor */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Proveedor Principal
                    </label>
                    <input
                      type="text"
                      value={newProveedor}
                      onChange={(e) => setNewProveedor(e.target.value)}
                      placeholder="Razón Social"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Parámetros de Stock */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                    Parámetros de Stock y Alertas
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Stock Inicial
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newStockInicial}
                        onChange={(e) => setNewStockInicial(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-bold font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-red-400 mb-1">
                        Mínimo (Alerta) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newStockMin}
                        onChange={(e) => setNewStockMin(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-red-900/50 rounded text-xs text-white font-bold font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                        Máximo (Sobrestock) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newStockMax}
                        onChange={(e) => setNewStockMax(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-900/50 rounded text-xs text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Costo Unitario ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newCosto}
                        onChange={(e) => setNewCosto(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de acción del formulario */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('drill')}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-amber-400/20 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{createLoading ? 'Guardando en Almacén...' : 'Guardar y Seleccionar Inmediatamente'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Footer Informativo */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Módulo Drill-Down &bull; Catálogo Industrial FactoryStock</span>
              <span>Total en almacén: {productos.length} SKUs activos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar tarjeta individual de producto en Nivel 3 o Búsqueda
  function renderProductCard(p: Producto) {
    const isSelected = p.id === selectedProductoId;
    const isOutOfStock = p.stock_actual <= 0;
    const isCritical = p.stock_actual <= p.stock_min;

    return (
      <div
        key={p.id}
        className={`p-4 rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md border transition-all flex flex-col justify-between shadow-md ${
          isSelected
            ? 'bg-teal-950/60 border-teal-400/80 border-t-4 border-t-teal-400 ring-2 ring-teal-400/30 shadow-teal-950/50'
            : isOutOfStock
            ? 'bg-slate-950/50 border-slate-800/80 border-t-4 border-t-slate-700 opacity-70'
            : isCritical
            ? 'bg-indigo-950/60 border-violet-500/40 hover:border-rose-400/70 border-t-4 border-t-rose-500 hover:bg-indigo-900/60'
            : 'bg-indigo-950/60 border-violet-500/40 hover:border-fuchsia-400/70 border-t-4 border-t-fuchsia-400 hover:bg-indigo-900/60'
        }`}
      >
        <div>
          <div className="flex items-start gap-3">
            {p.imagen_url && (
              <img
                src={p.imagen_url}
                alt={p.nombre}
                className="w-12 h-12 rounded-tl-2xl rounded-br-2xl object-cover border border-violet-400/50 flex-shrink-0 shadow-sm mt-0.5"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-black px-3 py-0.5 rounded-tl-lg rounded-br-lg bg-fuchsia-950/90 border border-fuchsia-400/60 text-fuchsia-200">
                  {p.codigo_sku}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-tr-lg rounded-bl-lg font-mono ${
                    isOutOfStock
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : isCritical
                      ? 'bg-rose-950/70 text-rose-200 border border-rose-500/50'
                      : 'bg-teal-950/70 text-teal-200 border border-teal-500/50'
                  }`}
                >
                  {isOutOfStock ? 'AGOTADO' : isCritical ? 'STOCK CRÍTICO' : 'DISPONIBLE'}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white leading-tight">{p.nombre}</h4>
              <p className="text-[11px] text-violet-200/80 mt-1 line-clamp-1">
                {p.descripcion || 'Sin descripción técnica'}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-violet-500/25 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-violet-300/70 block text-[10px]">Disponible:</span>
              <strong className={`font-mono text-xs font-bold ${isCritical ? 'text-rose-300' : 'text-teal-300'}`}>
                {p.stock_actual} {p.unidad_medida}
              </strong>
            </div>
            <div>
              <span className="text-violet-300/70 block text-[10px]">Anaquel / Ubicación:</span>
              <strong className="text-white font-mono text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-fuchsia-400" />
                {p.ubicacion_anaquel}
              </strong>
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-2">
          {isSelected ? (
            <div className="w-full py-2 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 text-xs font-black rounded-tl-xl rounded-br-xl text-center flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/25">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Material Seleccionado</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectAndClose(p)}
              disabled={filterStockAvailable && isOutOfStock}
              className={`w-full py-2 text-xs font-bold rounded-tl-xl rounded-br-xl transition-all flex items-center justify-center gap-1.5 ${
                filterStockAvailable && isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 text-white shadow-md shadow-fuchsia-500/25 hover:scale-[1.01]'
              }`}
            >
              <span>{filterStockAvailable && isOutOfStock ? 'Sin existencias' : 'Seleccionar este material'}</span>
              {!isOutOfStock && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }
}
