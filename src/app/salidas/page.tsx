'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TicketModal } from '@/components/movements/TicketModal';
import { ProductDrillDownSelector } from '@/components/inventory/ProductDrillDownSelector';
import { OperacionesNavTabs } from '@/components/movements/OperacionesNavTabs';
import {
  ArrowUpFromLine,
  FileText,
  AlertCircle,
  Printer,
  MapPin,
  RotateCw,
  Building2,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { Producto, UsuarioAutenticado, TicketSalida } from '@/types';
import { BarcodeScannerModal } from '@/components/scanner/BarcodeScannerModal';
import { useToast } from '@/components/ui/ToastContext';
import { Scan } from 'lucide-react';

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
          // Si es Jefe de Área, preseleccionar su área y nombre
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

      // Validación preventiva en cliente contra stock negativo
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

      // Si se generó el ticket, mostrar modal de impresión inmediatamente
      if (data.ticket) {
        setGeneratedTicket(data.ticket);
        showSuccess(
          `Vale ${data.ticket.folio_vale} generado (-${cantidad} ${selectedProd?.unidad_medida || 'uds'})`,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <ArrowUpFromLine className="w-7 h-7 text-amber-400" />
              <span>Salida de Almacén mediante Vale</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Despacho de insumos por orden de trabajo, validación estricta de existencias y comprobante impreso
            </p>
          </div>
        </div>

        {/* Error / Advertencia */}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl flex items-center gap-3 text-red-300 text-xs font-semibold animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Salida */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-xl">
          {/* Botón Escáner Barcode / QR */}
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:scale-[1.02]"
            >
              <Scan className="w-4 h-4 text-slate-950" />
              <span>Escanear Código / QR</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Selector de Producto en Drill-Down con Módulo de Alta */}
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

            {/* Ficha técnica y advertencia de stock del material seleccionado */}
            {selectedProd && (
              <div className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs ${
                selectedProd.stock_actual <= selectedProd.stock_min
                  ? 'bg-red-950/40 border-red-800'
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div>
                  <span className="text-slate-500 block">Stock Disponible:</span>
                  <strong className={`font-mono text-base font-bold ${
                    selectedProd.stock_actual <= selectedProd.stock_min ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {selectedProd.stock_actual} {selectedProd.unidad_medida}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Ubicación de Retiro:</span>
                  <strong className="text-white font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {selectedProd.ubicacion_anaquel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Nivel de Seguridad:</span>
                  <span className="text-slate-300 font-semibold">Min: {selectedProd.stock_min} {selectedProd.unidad_medida}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Categoría:</span>
                  <span className="text-slate-300 font-semibold">{selectedProd.categoria}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 2. Cantidad */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Cantidad a Despachar <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={selectedProd ? selectedProd.stock_actual : undefined}
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ej. 20"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-base font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  {selectedProd && (
                    <span className="absolute right-4 top-3.5 text-xs font-semibold text-slate-400">
                      {selectedProd.unidad_medida}
                    </span>
                  )}
                </div>
                {selectedProd && cantidad && (
                  <p className={`text-[11px] font-mono mt-1.5 ${
                    Number(cantidad) > selectedProd.stock_actual ? 'text-red-400 font-bold' : 'text-slate-400'
                  }`}>
                    {Number(cantidad) > selectedProd.stock_actual
                      ? `⚠️ Supera el inventario disponible (${selectedProd.stock_actual} ${selectedProd.unidad_medida})`
                      : `&rarr; Quedarán ${selectedProd.stock_actual - Number(cantidad)} ${selectedProd.unidad_medida} en anaquel`}
                  </p>
                )}
              </div>

              {/* 3. Área Solicitante */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Área Solicitante de Planta <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <select
                    value={areaSolicitante}
                    onChange={(e) => setAreaSolicitante(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Responsable que Recibe en Planta <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={responsableRecibe}
                    onChange={(e) => setResponsableRecibe(e.target.value)}
                    placeholder="Ej. Juan Pérez (Supervisor)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* 5. Motivo / Orden de Trabajo (OT) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Motivo / Orden de Trabajo (OT) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Wrench className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={motivoOT}
                    onChange={(e) => setMotivoOT(e.target.value.toUpperCase())}
                    placeholder="Ej. OT-1025, Mantenimiento Preventivo Prensa 3"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-400 uppercase"
                  />
                </div>
                <span className="text-[10px] text-slate-500">Clave requerida para trazabilidad de costos.</span>
              </div>
            </div>

            {/* Operador responsable */}
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center justify-between">
              <span>Almacenista que entrega el material:</span>
              <strong className="text-white font-semibold">{user.nombre} ({user.rol})</strong>
            </div>

            {/* Botón de emisión */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
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

        {/* Modal de Escáner de Código de Barras y QR */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          productos={productos}
          onProductScanned={(prod) => {
            setSelectedProductoId(prod.id);
            showSuccess(`Material seleccionado para despacho: ${prod.codigo_sku} - ${prod.nombre}`, 'Escaneo Exitoso');
          }}
          title="Escanear Material para Salida"
        />

      </div>
    </AppShell>
  );
}
