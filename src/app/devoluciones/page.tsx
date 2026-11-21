'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  RotateCcw,
  CheckCircle,
  AlertCircle,
  RotateCw,
  Building2,
  FileText,
  MapPin,
} from 'lucide-react';
import { Producto, UsuarioAutenticado } from '@/types';
import { ProductDrillDownSelector } from '@/components/inventory/ProductDrillDownSelector';
import { OperacionesNavTabs } from '@/components/movements/OperacionesNavTabs';
import { notifyStockUpdated } from '@/lib/events';

const AREAS_PLANTA = [
  'Producción Línea 1',
  'Producción Línea 2',
  'Mantenimiento',
  'Calidad',
  'Embarques',
];

export default function DevolucionesPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  // Form states
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [areaDevuelve, setAreaDevuelve] = useState('Producción Línea 1');
  const [responsableEntrega, setResponsableEntrega] = useState('');
  const [folioValeOriginal, setFolioValeOriginal] = useState('');
  const [motivoDevolucion, setMotivoDevolucion] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    producto: Producto;
    cantidad: number;
    nuevoStock: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          if (data.user.rol === 'JEFE_AREA') {
            setAreaDevuelve(data.user.area || 'Producción Línea 1');
            setResponsableEntrega(data.user.nombre || '');
          }
        }
      });

    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      const res = await fetch('/api/productos?activos=true');
      const data = await res.json();
      if (data.productos) {
        setProductos(data.productos);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoadingProds(false);
    }
  };

  const selectedProd = productos.find((p) => p.id === selectedProductoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);
    setSubmitting(true);

    try {
      if (!selectedProductoId) {
        throw new Error('Seleccione un material a reingresar.');
      }
      if (!cantidad || Number(cantidad) <= 0) {
        throw new Error('Ingrese una cantidad válida mayor a 0.');
      }
      if (!responsableEntrega.trim()) {
        throw new Error('Indique el nombre de la persona que entrega el material devuelto.');
      }

      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'DEVOLUCION',
          producto_id: selectedProductoId,
          cantidad: Number(cantidad),
          no_factura_o_vale: folioValeOriginal.trim().toUpperCase() || 'DEV-DIRECTA',
          area_solicitante: areaDevuelve,
          responsable_recibe: responsableEntrega.trim(),
          motivo_orden_trabajo: motivoDevolucion.trim() || 'Devolución de sobrante / material no utilizado',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la devolución.');
      }

      if (selectedProd) {
        setSuccessResult({
          producto: selectedProd,
          cantidad: Number(cantidad),
          nuevoStock: data.nuevoStock,
        });
      }

      // Notificar a toda la aplicación en tiempo real (Dashboard, Home, Inventario)
      notifyStockUpdated();

      setCantidad('');
      setFolioValeOriginal('');
      setMotivoDevolucion('');
      loadProductos();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Menú Unificado: Entradas, Salidas y Devoluciones */}
        <OperacionesNavTabs userRole={user.rol} />

        {/* Cabecera */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border-2 border-teal-500/50 border-t-4 border-t-teal-400 p-5 rounded-3xl shadow-xl shadow-teal-950/30">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-teal-400" />
            <span>Devolución de Material a Almacén</span>
          </h1>
          <p className="text-xs text-teal-200 mt-1 font-medium">
            Reincorporación de material no utilizado o sobrante al inventario disponible con actualización automática en tiempo real
          </p>
        </div>

        {/* Notificación de Éxito */}
        {successResult && (
          <div className="p-5 bg-teal-950/90 border-2 border-teal-500 rounded-2xl shadow-xl shadow-teal-950/40 flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">
                ¡Devolución Procesada y Reintegrada al Inventario!
              </h3>
              <p className="text-xs text-teal-200">
                Se reingresaron <strong>{successResult.cantidad} {successResult.producto.unidad_medida}</strong> de{' '}
                <strong>{successResult.producto.nombre}</strong> (SKU: {successResult.producto.codigo_sku}).
              </p>
              <p className="text-xs font-mono text-teal-300">
                Nuevo Stock Disponible: <strong className="text-white text-sm">{successResult.nuevoStock} piezas</strong> (Anaquel: {successResult.producto.ubicacion_anaquel})
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-950/90 border-2 border-red-500 rounded-2xl flex items-center gap-3 text-red-200 text-xs font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-slate-900 border-2 border-teal-500/40 rounded-3xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Selector de Producto en Drill-Down */}
            <ProductDrillDownSelector
              productos={productos}
              selectedProductoId={selectedProductoId}
              onSelectProducto={setSelectedProductoId}
              onProductCreated={(newProd) => {
                setProductos((prev) => [...prev, newProd]);
                setSelectedProductoId(newProd.id);
              }}
              disabled={loadingProds}
              required
              userRole={user?.rol || 'ALMACENISTA'}
              label="Material / Insumo Devuelto"
            />

            {/* Ficha técnica con existencias exactas en piezas y máxima capacidad */}
            {selectedProd && (
              <div className="p-4 bg-slate-950/80 border-2 border-teal-500/30 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Piezas en Stock:</span>
                  <strong className="text-teal-300 font-mono text-base font-black">
                    {selectedProd.stock_actual} {selectedProd.unidad_medida}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacidad Máxima:</span>
                  <strong className="text-amber-300 font-mono text-sm font-black">
                    {selectedProd.stock_max} {selectedProd.unidad_medida}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reubicar en Anaquel:</span>
                  <strong className="text-white font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    {selectedProd.ubicacion_anaquel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Categoría:</span>
                  <span className="text-slate-200 font-bold">{selectedProd.categoria}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 2. Cantidad */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Cantidad Devuelta (Piezas / Unidades) <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ej. 5"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-base font-black text-white focus:outline-none focus:border-teal-400 font-mono"
                  />
                  {selectedProd && (
                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                      {selectedProd.unidad_medida}
                    </span>
                  )}
                </div>
                {selectedProd && cantidad && Number(cantidad) > 0 && (
                  <p className="text-[11px] text-teal-300 font-mono font-bold mt-1.5">
                    &rarr; El stock aumentará de {selectedProd.stock_actual} a{' '}
                    <strong>{selectedProd.stock_actual + Number(cantidad)} {selectedProd.unidad_medida}</strong>
                  </p>
                )}
              </div>

              {/* 3. Folio de Vale Original */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Folio del Vale Original (Opcional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-teal-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={folioValeOriginal}
                    onChange={(e) => setFolioValeOriginal(e.target.value.toUpperCase())}
                    placeholder="Ej. VALE-1001"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono uppercase text-white focus:outline-none focus:border-teal-400 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 4. Área que devuelve */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Área de la Planta que Devuelve <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-teal-400 absolute left-3.5 top-3.5" />
                  <select
                    value={areaDevuelve}
                    onChange={(e) => setAreaDevuelve(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400 font-bold"
                  >
                    {AREAS_PLANTA.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Persona que entrega */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Responsable que Devuelve <span className="text-teal-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={responsableEntrega}
                  onChange={(e) => setResponsableEntrega(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400 font-bold"
                />
              </div>
            </div>

            {/* 6. Motivo */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                Motivo de la Devolución
              </label>
              <textarea
                rows={2}
                value={motivoDevolucion}
                onChange={(e) => setMotivoDevolucion(e.target.value)}
                placeholder="Ej. Sobrante de montaje OT-1025, pieza reemplazada sin uso"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400 font-semibold"
              />
            </div>

            {/* Almacenista */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
              <span>Almacenista que recepciona la devolución:</span>
              <strong className="text-white font-bold">{user.nombre}</strong>
            </div>

            {/* Botón */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-sm font-black rounded-xl shadow-lg shadow-teal-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{submitting ? 'Procesando Reingreso...' : 'Confirmar Devolución al Almacén'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </AppShell>
  );
}
