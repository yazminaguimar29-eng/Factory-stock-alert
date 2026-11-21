'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import {
  ArrowDownToLine,
  FileCheck,
  CheckCircle,
  AlertCircle,
  MapPin,
  RotateCw,
} from 'lucide-react';
import { Producto, UsuarioAutenticado } from '@/types';
import { ProductDrillDownSelector } from '@/components/inventory/ProductDrillDownSelector';
import { OperacionesNavTabs } from '@/components/movements/OperacionesNavTabs';
import { useToast } from '@/components/ui/ToastContext';
import { notifyStockUpdated } from '@/lib/events';

function EntradasContent() {
  const searchParams = useSearchParams();
  const preselectedSku = searchParams.get('sku') || '';

  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  const { showSuccess, showError } = useToast();

  // Form states
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [noFactura, setNoFactura] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    producto: Producto;
    cantidad: number;
    nuevoStock: number;
    factura: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      });

    fetch('/api/productos?activos=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.productos) {
          setProductos(data.productos);
          if (preselectedSku) {
            const found = data.productos.find(
              (p: Producto) => p.codigo_sku.toUpperCase() === preselectedSku.toUpperCase()
            );
            if (found) setSelectedProductoId(found.id);
          }
        }
      })
      .finally(() => setLoadingProds(false));
  }, [preselectedSku]);

  const selectedProd = productos.find((p) => p.id === selectedProductoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);
    setSubmitting(true);

    try {
      if (!selectedProductoId) {
        throw new Error('Seleccione un producto del catálogo.');
      }
      if (!cantidad || Number(cantidad) <= 0) {
        throw new Error('Ingrese una cantidad válida mayor a 0.');
      }
      if (!noFactura.trim()) {
        throw new Error('El número de factura del proveedor es obligatorio.');
      }

      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'ENTRADA_COMPRA',
          producto_id: selectedProductoId,
          cantidad: Number(cantidad),
          no_factura_o_vale: noFactura.trim().toUpperCase(),
          area_solicitante: 'Almacén Central',
          responsable_recibe: user?.nombre || 'Almacenista',
          motivo_orden_trabajo: 'Recepción de compra según factura',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la entrada.');
      }

      if (selectedProd) {
        const cantNum = Number(cantidad);
        setSuccessResult({
          producto: selectedProd,
          cantidad: cantNum,
          nuevoStock: data.nuevoStock,
          factura: noFactura.trim().toUpperCase(),
        });
        showSuccess(
          `+${cantNum} ${selectedProd.unidad_medida} recepcionadas exitosamente (Nuevo Stock: ${data.nuevoStock})`,
          'Entrada Registrada'
        );
      }

      // Notificar a toda la aplicación (Dashboard, Home, Inventario) en tiempo real sin recargar página
      notifyStockUpdated();

      // Limpiar formulario
      setCantidad('');
      setNoFactura('');

      // Refrescar lista de productos local
      const updatedProds = await fetch('/api/productos?activos=true').then((r) => r.json());
      if (updatedProds.productos) setProductos(updatedProds.productos);

    } catch (err: any) {
      setError(err.message);
      showError(err.message, 'Error en Entrada');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Menú Unificado: Entradas, Salidas y Devoluciones */}
        <OperacionesNavTabs userRole={user.rol} />

        {/* Cabecera */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/50 border-t-4 border-t-emerald-400 p-5 rounded-3xl shadow-xl shadow-emerald-950/30">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <ArrowDownToLine className="w-7 h-7 text-emerald-400" />
            <span>Recepción de Material por Compra</span>
          </h1>
          <p className="text-xs text-emerald-200 mt-1 font-medium">
            Registro oficial de entradas de insumos y refacciones con número de factura de proveedor y sincronización en tiempo real
          </p>
        </div>

        {/* Notificación de Éxito */}
        {successResult && (
          <div className="p-5 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl shadow-xl shadow-emerald-950/40 flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">
                ¡Entrada Registrada Exitosamente!
              </h3>
              <p className="text-xs text-emerald-300">
                Se agregaron <strong>{successResult.cantidad} {successResult.producto.unidad_medida}</strong> al material{' '}
                <strong>{successResult.producto.nombre}</strong> (SKU: {successResult.producto.codigo_sku}).
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono pt-1 text-emerald-200">
                <span>Nuevo Stock: <strong className="text-white text-sm">{successResult.nuevoStock} piezas</strong></span>
                <span>Factura: <strong>{successResult.factura}</strong></span>
                <span>Ubicación: <strong>{successResult.producto.ubicacion_anaquel}</strong></span>
              </div>
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
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Selector de Producto con Navegación Drill-Down */}
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
              label="Seleccionar Material / SKU a Recibir"
            />

            {/* Ficha técnica del producto con piezas actuales y máxima capacidad */}
            {selectedProd && (
              <div className="p-4 bg-slate-950/80 border-2 border-emerald-500/30 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Piezas en Stock:</span>
                  <strong className="text-emerald-400 font-mono text-base font-black">
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
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ubicación Física:</span>
                  <strong className="text-white font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {selectedProd.ubicacion_anaquel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Proveedor:</span>
                  <strong className="text-slate-200 truncate block">
                    {selectedProd.proveedor_principal || 'N/A'}
                  </strong>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 2. Cantidad */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Cantidad a Ingresar (Piezas / Unidades) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ej. 50"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-base font-black text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  {selectedProd && (
                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                      {selectedProd.unidad_medida}
                    </span>
                  )}
                </div>
                {selectedProd && cantidad && Number(cantidad) > 0 && (
                  <p className="text-[11px] text-emerald-400 font-mono font-bold mt-1.5">
                    &rarr; El stock aumentará de {selectedProd.stock_actual} a{' '}
                    <strong>{selectedProd.stock_actual + Number(cantidad)} {selectedProd.unidad_medida}</strong> (Máx ref: {selectedProd.stock_max})
                  </p>
                )}
              </div>

              {/* 3. Número de Factura */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Número de Factura / Remisión <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <FileCheck className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={noFactura}
                    onChange={(e) => setNoFactura(e.target.value.toUpperCase())}
                    placeholder="Ej. FAC-0001, REM-9921"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono uppercase text-white focus:outline-none focus:border-emerald-400 font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Documento fiscal de compra obligatorio.</span>
              </div>
            </div>

            {/* Operador de almacén automático */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
              <span>Almacenista responsable de recepción:</span>
              <strong className="text-white font-bold">{user.nombre} ({user.email})</strong>
            </div>

            {/* Botón de envío */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>{submitting ? 'Registrando Entrada...' : 'Confirmar Entrada de Material'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </AppShell>
  );
}

export default function EntradasPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <EntradasContent />
    </React.Suspense>
  );
}
