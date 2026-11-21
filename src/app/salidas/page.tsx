'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TicketModal } from '@/components/movements/TicketModal';
import { ProductDrillDownSelector } from '@/components/inventory/ProductDrillDownSelector';
import { OperacionesNavTabs } from '@/components/movements/OperacionesNavTabs';
import {
  ArrowUpFromLine,
  AlertCircle,
  MapPin,
  RotateCw,
  Building2,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { Producto, UsuarioAutenticado, TicketSalida } from '@/types';
import { useToast } from '@/components/ui/ToastContext';
import { notifyStockUpdated } from '@/lib/events';

const AREAS_PLANTA = [
  'Producción Línea 1',
  'Producción Línea 2',
  'Mantenimiento',
  'Calidad',
  'Embarques',
];

export default function SalidasPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  const { showSuccess, showError } = useToast();

  // Form states
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [areaSolicitante, setAreaSolicitante] = useState('Producción Línea 1');
  const [responsableRecibe, setResponsableRecibe] = useState('');
  const [motivoOT, setMotivoOT] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<TicketSalida | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          if (data.user.rol === 'JEFE_AREA') {
            setAreaSolicitante(data.user.area || 'Producción Línea 1');
            setResponsableRecibe(data.user.nombre || '');
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
    setSubmitting(true);

    try {
      if (!selectedProductoId) {
        throw new Error('Seleccione un material del almacén.');
      }
      if (!cantidad || Number(cantidad) <= 0) {
        throw new Error('Ingrese una cantidad válida a retirar.');
      }
      if (!responsableRecibe.trim()) {
        throw new Error('Indique el nombre del responsable que recibe el material.');
      }
      if (!motivoOT.trim()) {
        throw new Error('Indique la Orden de Trabajo (OT) o motivo del consumo.');
      }

      if (selectedProd && Number(cantidad) > selectedProd.stock_actual) {
        throw new Error('No es posible realizar la salida. La cantidad solicitada supera el inventario disponible.');
      }

      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'SALIDA_VALE',
          producto_id: selectedProductoId,
          cantidad: Number(cantidad),
          area_solicitante: areaSolicitante,
          responsable_recibe: responsableRecibe.trim(),
          motivo_orden_trabajo: motivoOT.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la salida por vale.');
      }

      // Notificar a toda la aplicación en tiempo real (Dashboard, Home, Inventario)
      notifyStockUpdated();

      // Si se generó el ticket, mostrar modal de impresión inmediatamente
      if (data.ticket) {
        setGeneratedTicket(data.ticket);
        showSuccess(
          `Vale ${data.ticket.folio_vale} generado (-${cantidad} ${selectedProd?.unidad_medida || 'piezas'})`,
          'Salida por Vale Exitosa'
        );
      }

      // Reset
      setCantidad('');
      setMotivoOT('');
      loadProductos();

    } catch (err: any) {
      setError(err.message);
      showError(err.message, 'Error en Salida');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Menú Unificado: Entradas, Salidas y Devoluciones */}
        <OperacionesNavTabs userRole={user.rol} />

        {/* Cabecera */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-500/50 border-t-4 border-t-cyan-400 p-5 rounded-3xl shadow-xl shadow-cyan-950/30">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <ArrowUpFromLine className="w-7 h-7 text-cyan-400" />
            <span>Despacho de Material por Vale (Salidas)</span>
          </h1>
          <p className="text-xs text-cyan-200 mt-1 font-medium">
            Surtido a líneas de producción y mantenimiento por Orden de Trabajo (OT) con generación de comprobante y sincronización en tiempo real
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-950/90 border-2 border-red-500 rounded-2xl flex items-center gap-3 text-red-200 text-xs font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Salida */}
        <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-2xl">
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
              filterStockAvailable
              userRole={user.rol}
              label="Material / Insumo Solicitado para Despacho"
            />

            {/* Ficha técnica y existencias exactas en piezas vs capacidad máxima */}
            {selectedProd && (
              <div className={`p-4 rounded-2xl border-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs ${
                selectedProd.stock_actual <= selectedProd.stock_min
                  ? 'bg-red-950/50 border-red-500/60'
                  : 'bg-slate-950/80 border-cyan-500/30'
              }`}>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Piezas Disponibles:</span>
                  <strong className={`font-mono text-base font-black ${
                    selectedProd.stock_actual <= selectedProd.stock_min ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
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
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ubicación de Retiro:</span>
                  <strong className="text-white font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
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
                  Cantidad a Despachar (Piezas / Unidades) <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={selectedProd ? selectedProd.stock_actual : undefined}
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ej. 10"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-base font-black text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  {selectedProd && (
                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                      {selectedProd.unidad_medida}
                    </span>
                  )}
                </div>
                {selectedProd && cantidad && Number(cantidad) > 0 && (
                  <p className="text-[11px] font-mono font-bold mt-1.5 text-amber-400">
                    &rarr; El stock disminuirá a{' '}
                    <strong>{selectedProd.stock_actual - Number(cantidad)} {selectedProd.unidad_medida}</strong>
                  </p>
                )}
              </div>

              {/* 3. Área Solicitante */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Área Solicitante de Planta <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                  <select
                    value={areaSolicitante}
                    onChange={(e) => setAreaSolicitante(e.target.value)}
                    disabled={user.rol === 'JEFE_AREA'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 font-bold disabled:opacity-75"
                  >
                    {AREAS_PLANTA.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 4. Responsable que Recibe */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Responsable que Recibe en Planta <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={responsableRecibe}
                    onChange={(e) => setResponsableRecibe(e.target.value)}
                    placeholder="Ej. Juan Pérez (Supervisor)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>
              </div>

              {/* 5. Motivo / Orden de Trabajo (OT) */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                  Motivo / Orden de Trabajo (OT) <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Wrench className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={motivoOT}
                    onChange={(e) => setMotivoOT(e.target.value.toUpperCase())}
                    placeholder="Ej. OT-1025, Mantenimiento Preventivo"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-400 uppercase font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Clave requerida para trazabilidad de consumos.</span>
              </div>
            </div>

            {/* Operador responsable */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
              <span>Almacenista que entrega el material:</span>
              <strong className="text-white font-bold">{user.nombre} ({user.rol})</strong>
            </div>

            {/* Botón de emisión */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-black rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                <span>{submitting ? 'Procesando Vale...' : 'Emitir Vale y Generar Ticket'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Modal de Ticket Imprimible */}
        <TicketModal
          ticket={generatedTicket}
          onClose={() => setGeneratedTicket(null)}
        />

      </div>
    </AppShell>
  );
}
