'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  SlidersHorizontal,
  CheckCircle,
  AlertCircle,
  RotateCw,
  Scale,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { Producto, UsuarioAutenticado } from '@/types';
import { ProductDrillDownSelector } from '@/components/inventory/ProductDrillDownSelector';
import { InventarioNavTabs } from '@/components/inventory/InventarioNavTabs';

export default function AjustesPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  // Form states
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [nuevoStockReal, setNuevoStockReal] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [folioAuditoria, setFolioAuditoria] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    producto: Producto;
    stockAnterior: number;
    nuevoStock: number;
    diferencia: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
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
      if (!selectedProductoId || !selectedProd) {
        throw new Error('Seleccione el material que desea ajustar.');
      }
      if (nuevoStockReal === '' || Number(nuevoStockReal) < 0) {
        throw new Error('El conteo físico real no puede ser negativo.');
      }
      if (!motivoAjuste.trim()) {
        throw new Error('Debe justificar documentalmente el motivo del ajuste de inventario.');
      }

      const nuevoStock = Number(nuevoStockReal);
      const stockAnterior = selectedProd.stock_actual;
      const diferencia = nuevoStock - stockAnterior;

      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'AJUSTE',
          producto_id: selectedProductoId,
          cantidad: nuevoStock, // nuevo stock absoluto
          no_factura_o_vale: folioAuditoria.trim().toUpperCase() || 'AJUSTE-AUDITORIA',
          area_solicitante: 'Auditoría / Control de Calidad',
          responsable_recibe: user?.nombre || 'Almacenista',
          motivo_orden_trabajo: `Ajuste: ${motivoAjuste.trim()} (Diferencia: ${diferencia >= 0 ? '+' : ''}${diferencia} ${selectedProd.unidad_medida})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el ajuste de inventario.');
      }

      setSuccessResult({
        producto: selectedProd,
        stockAnterior,
        nuevoStock,
        diferencia,
      });

      setNuevoStockReal('');
      setMotivoAjuste('');
      setFolioAuditoria('');
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
        <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Menú Unificado: Inventario y Ajustes */}
        <InventarioNavTabs userRole={user.rol} />

        {/* Cabecera */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <SlidersHorizontal className="w-7 h-7 text-purple-400" />
            <span>Ajuste Justificado de Inventario</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Corrección de discrepancias físicas por conteo cíclico, auditoría o merma autorizada con trazabilidad inmutable
          </p>
        </div>

        {/* Notificación de Éxito */}
        {successResult && (
          <div className="p-5 bg-purple-950/80 border border-purple-700 rounded-xl shadow-lg flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                ¡Ajuste de Inventario Aplicado y Registrado en Historial!
              </h3>
              <p className="text-xs text-purple-200">
                Se regularizó el material <strong>{successResult.producto.nombre}</strong> (SKU: {successResult.producto.codigo_sku}).
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono pt-1 text-purple-300">
                <span>Stock Anterior: <strong>{successResult.stockAnterior}</strong></span>
                <span>Nuevo Stock Físico: <strong className="text-white text-sm">{successResult.nuevoStock}</strong></span>
                <span>
                  Variación: <strong className={successResult.diferencia >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {successResult.diferencia >= 0 ? `+${successResult.diferencia}` : successResult.diferencia} {successResult.producto.unidad_medida}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl flex items-center gap-3 text-red-300 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Selector de Producto en Drill-Down */}
            <ProductDrillDownSelector
              productos={productos}
              selectedProductoId={selectedProductoId}
              onSelectProducto={(id) => {
                setSelectedProductoId(id);
                const p = productos.find((item) => item.id === id);
                if (p) setNuevoStockReal(String(p.stock_actual));
              }}
              onProductCreated={(newProd) => {
                setProductos((prev) => [...prev, newProd]);
                setSelectedProductoId(newProd.id);
                setNuevoStockReal(String(newProd.stock_actual));
              }}
              disabled={loadingProds}
              required
              userRole={user?.rol || 'ALMACENISTA'}
              label="Material a Regularizar / Auditar"
            />

            {selectedProd && (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Stock en Sistema:</span>
                  <strong className="text-white font-mono text-base font-bold">
                    {selectedProd.stock_actual} {selectedProd.unidad_medida}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Ubicación Física:</span>
                  <strong className="text-white font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {selectedProd.ubicacion_anaquel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Límites:</span>
                  <span className="text-slate-300 font-semibold font-mono">
                    Min: {selectedProd.stock_min} / Max: {selectedProd.stock_max}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Categoría:</span>
                  <span className="text-slate-300 font-semibold">{selectedProd.categoria}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 2. Nuevo Conteo Físico */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Existencia Física Real Verificada <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={nuevoStockReal}
                    onChange={(e) => setNuevoStockReal(e.target.value)}
                    placeholder="Ej. 42"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-base font-bold text-white focus:outline-none focus:border-purple-400"
                  />
                  {selectedProd && (
                    <span className="absolute right-4 top-3.5 text-xs font-semibold text-slate-400">
                      {selectedProd.unidad_medida}
                    </span>
                  )}
                </div>
                {selectedProd && nuevoStockReal !== '' && (
                  <p className="text-[11px] font-mono mt-1.5">
                    Diferencia calculada:{' '}
                    <strong className={
                      Number(nuevoStockReal) - selectedProd.stock_actual >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }>
                      {Number(nuevoStockReal) - selectedProd.stock_actual >= 0 ? '+' : ''}
                      {Number(nuevoStockReal) - selectedProd.stock_actual} {selectedProd.unidad_medida}
                    </strong>
                  </p>
                )}
              </div>

              {/* 3. Folio / Acta de Auditoría */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Folio de Auditoría / Inventario Físico
                </label>
                <div className="relative">
                  <ClipboardList className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={folioAuditoria}
                    onChange={(e) => setFolioAuditoria(e.target.value.toUpperCase())}
                    placeholder="Ej. AUD-2026-T1, CONTEO-CICLICO-B2"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono uppercase text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* 4. Justificación / Motivo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Motivo y Justificación Técnica del Ajuste <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={motivoAjuste}
                onChange={(e) => setMotivoAjuste(e.target.value)}
                placeholder="Describa el motivo: ej. Conteo cíclico trimestral de anaquel, merma identificada por daño en empaque durante estibado, error de captura previo..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-400"
              />
              <span className="text-[10px] text-slate-500">
                La auditoría requiere justificación obligatoria. Quedará registrada permanentemente en el historial.
              </span>
            </div>

            {/* Usuario auditor */}
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center justify-between">
              <span>Usuario responsable del ajuste:</span>
              <strong className="text-white font-semibold">{user.nombre} ({user.rol})</strong>
            </div>

            {/* Botón */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{submitting ? 'Aplicando Ajuste...' : 'Aplicar Ajuste de Auditoría'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </AppShell>
  );
}
