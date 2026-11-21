'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StockBadge } from '@/components/inventory/StockBadge';
import { DashboardMovementsTable } from '@/components/dashboard/DashboardMovementsTable';
import { DashboardStockCharts } from '@/components/dashboard/DashboardStockCharts';
import {
  Boxes,
  AlertOctagon,
  AlertTriangle,
  ArrowUpFromLine,
  ArrowRight,
  Clock,
  Radio,
  CheckCircle,
} from 'lucide-react';
import { Producto, DashboardMetricas, UsuarioAutenticado } from '@/types';
import { STOCK_SYNC_EVENT } from '@/lib/events';

interface DashboardLiveWrapperProps {
  initialMetricas: DashboardMetricas;
  initialProductos: Producto[];
  session: UsuarioAutenticado;
}

export function DashboardLiveWrapper({
  initialMetricas,
  initialProductos,
  session,
}: DashboardLiveWrapperProps) {
  const [metricas, setMetricas] = useState<DashboardMetricas>(initialMetricas);
  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const [mRes, pRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/productos?activos=all'),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData && typeof mData.totalSkusActivos === 'number') {
          setMetricas(mData);
        }
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData && Array.isArray(pData.productos)) {
          setProductos(pData.productos);
        }
      }

      const now = new Date();
      setLastSync(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // Ignorar errores silenciosos en polling de fondo
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setLastSync(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const handleSyncEvent = () => {
      refreshData();
    };

    window.addEventListener(STOCK_SYNC_EVENT, handleSyncEvent);
    window.addEventListener('focus', handleSyncEvent);

    // Polling recurrente cada 5 segundos
    const interval = setInterval(refreshData, 5000);

    // BroadcastChannel para sincronizar con otras pestañas
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('factory_stock_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'STOCK_UPDATED') {
            refreshData();
          }
        };
      }
    } catch {
      // fallback
    }

    return () => {
      window.removeEventListener(STOCK_SYNC_EVENT, handleSyncEvent);
      window.removeEventListener('focus', handleSyncEvent);
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [refreshData]);

  return (
    <div className="space-y-6">
      {/* Cabecera del Dashboard con Indicador En Vivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-violet-400/50 border-t-4 border-t-fuchsia-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-2xl shadow-indigo-950/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : 'animate-pulse'}`} />
              <span>EN VIVO (Auto-sincronizado {lastSync && `• ${lastSync}`})</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white uppercase flex items-center gap-2.5">
            <span>Panel de Control de Almacén</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-violet-200 mt-1">
            Monitoreo en tiempo real de inventario, consumo por órdenes de trabajo y alertas de abastecimiento
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-tl-xl rounded-br-xl text-xs font-mono font-black bg-fuchsia-950/90 border border-fuchsia-400/60 text-amber-300 shadow-lg">
            <Clock className="w-4 h-4 text-amber-300" />
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* 4 TARJETAS KPI PRINCIPALES CON COLORES LLAMATIVOS Y BORDES LUMINOSOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total SKUs */}
        <div className="bg-gradient-to-br from-indigo-950/90 via-slate-900/95 to-slate-950 border-2 border-violet-400/60 border-t-4 border-t-violet-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl shadow-violet-950/40 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-300">Total de SKUs</p>
              <h3 className="text-4xl font-black text-white mt-1 drop-shadow-md font-mono">{metricas.totalSkusActivos}</h3>
            </div>
            <div className="p-3 rotate-3 bg-violet-500/25 border border-violet-300/50 text-violet-200 rounded-tl-2xl rounded-br-2xl shadow-md group-hover:rotate-6 transition-transform">
              <Boxes className="w-6 h-6 -rotate-3" />
            </div>
          </div>
          <p className="text-xs text-violet-200/90 mt-3 font-bold">
            Materiales activos en catálogo industrial
          </p>
        </div>

        {/* 2. Stock Crítico (Alerta Roja) */}
        <Link
          href="/alertas"
          className="bg-gradient-to-br from-rose-950/90 via-slate-900/95 to-slate-950 border-2 border-rose-400/70 border-t-4 border-t-rose-500 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl shadow-rose-950/40 relative overflow-hidden group hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-300">Stock Crítico</p>
              <h3 className="text-4xl font-black text-rose-300 mt-1 drop-shadow-md font-mono">{metricas.totalStockCritico}</h3>
            </div>
            <div className="p-3 rotate-3 bg-rose-500/30 border border-rose-300/50 text-rose-200 rounded-tl-2xl rounded-br-2xl animate-pulse shadow-md">
              <AlertOctagon className="w-6 h-6 -rotate-3" />
            </div>
          </div>
          <p className="text-xs text-rose-200/90 mt-3 font-bold flex items-center justify-between">
            <span>Materiales &le; Stock mínimo requerido</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* 3. Sobrestock (Alerta Amarilla) */}
        <div className="bg-gradient-to-br from-amber-950/90 via-slate-900/95 to-slate-950 border-2 border-amber-400/70 border-t-4 border-t-amber-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl shadow-amber-950/40 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">Sobrestock</p>
              <h3 className="text-4xl font-black text-amber-300 mt-1 drop-shadow-md font-mono">{metricas.totalSobrestock}</h3>
            </div>
            <div className="p-3 rotate-3 bg-amber-500/25 border border-amber-300/50 text-amber-200 rounded-tl-2xl rounded-br-2xl shadow-md group-hover:rotate-6 transition-transform">
              <AlertTriangle className="w-6 h-6 -rotate-3" />
            </div>
          </div>
          <p className="text-xs text-amber-200/90 mt-3 font-bold">
            Materiales &ge; Stock máximo de referencia
          </p>
        </div>

        {/* 4. Vales del Día */}
        <Link
          href="/salidas"
          className="bg-gradient-to-br from-teal-950/90 via-slate-900/95 to-slate-950 border-2 border-teal-400/70 border-t-4 border-t-teal-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl shadow-teal-950/40 relative overflow-hidden group hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-300">Vales del Día</p>
              <h3 className="text-4xl font-black text-emerald-300 mt-1 drop-shadow-md font-mono">{metricas.valesHoy}</h3>
            </div>
            <div className="p-3 rotate-3 bg-teal-500/25 border border-teal-300/50 text-teal-200 rounded-tl-2xl rounded-br-2xl shadow-md group-hover:rotate-6 transition-transform">
              <ArrowUpFromLine className="w-6 h-6 -rotate-3" />
            </div>
          </div>
          <p className="text-xs text-teal-200/90 mt-3 font-bold flex items-center justify-between">
            <span>Entregas de material registradas hoy</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>
      </div>

      {/* ALERTA DE ACCIÓN INMEDIATA SI HAY STOCK CRÍTICO */}
      {metricas.totalStockCritico > 0 && (
        <div className="p-4 bg-gradient-to-r from-red-950/90 to-rose-950/90 border-2 border-red-500/70 rounded-2xl flex items-center justify-between gap-4 shadow-xl shadow-red-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-900/60 text-red-300 rounded-xl border border-red-400/40">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-red-200">
                Atención Requerida: {metricas.totalStockCritico} SKU(s) en Nivel Crítico de Abastecimiento
              </h4>
              <p className="text-xs text-red-300/90 mt-0.5">
                Existe riesgo de paro en líneas de producción. Alertas automáticas enviadas a Compras y Administración.
              </p>
            </div>
          </div>
          <Link
            href="/alertas"
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-red-600/30 flex-shrink-0"
          >
            <span>Ver Alertas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* GRÁFICAS DE MATERIALES EN STOCK (NIVEL, CAPACIDAD Y DISTRIBUCIÓN) */}
      <DashboardStockCharts productos={productos} />

      {/* SECCIÓN DE TABLAS: MATERIALES CRÍTICOS Y SOBRESTOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materiales en Stock Crítico */}
        <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl overflow-hidden shadow-xl shadow-rose-950/20">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Materiales en Stock Crítico
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-300 bg-rose-950 px-2.5 py-1 rounded-full border border-rose-800">
              {metricas.productosCriticos.length} SKUs
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
            {metricas.productosCriticos.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-90" />
                Todos los materiales se encuentran por encima de su nivel mínimo.
              </div>
            ) : (
              metricas.productosCriticos.map((prod) => (
                <div key={prod.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-rose-400">{prod.codigo_sku}</span>
                      <span className="text-xs text-slate-300 font-semibold">{prod.categoria}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{prod.nombre}</p>
                    <p className="text-[11px] text-slate-400">
                      Ubicación: <code className="text-amber-300 font-mono font-bold">{prod.ubicacion_anaquel}</code> &bull; Proveedor: {prod.proveedor_principal}
                    </p>
                    <p className="text-[11px] text-rose-300 font-mono mt-1">
                      Piezas: <strong className="text-white">{prod.stock_actual} {prod.unidad_medida}</strong> | Máx: <strong className="text-slate-300">{prod.stock_max} {prod.unidad_medida}</strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StockBadge actual={prod.stock_actual} min={prod.stock_min} max={prod.stock_max} unidad={prod.unidad_medida} />
                    {session.rol !== 'JEFE_AREA' && (
                      <Link
                        href={`/entradas?sku=${prod.codigo_sku}`}
                        className="mt-2 inline-block text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                      >
                        Recepcionar Entrada &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Materiales en Sobrestock */}
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-xl shadow-amber-950/20">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Materiales en Sobrestock
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-300 bg-amber-950 px-2.5 py-1 rounded-full border border-amber-800">
              {metricas.productosSobrestock.length} SKUs
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
            {metricas.productosSobrestock.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-90" />
                No hay materiales que excedan su stock máximo referencial.
              </div>
            ) : (
              metricas.productosSobrestock.map((prod) => (
                <div key={prod.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-400">{prod.codigo_sku}</span>
                      <span className="text-xs text-slate-300 font-semibold">{prod.categoria}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{prod.nombre}</p>
                    <p className="text-[11px] text-slate-400">
                      Ubicación: <code className="text-amber-300 font-mono font-bold">{prod.ubicacion_anaquel}</code>
                    </p>
                    <p className="text-[11px] text-amber-300 font-mono mt-1">
                      Piezas: <strong className="text-white">{prod.stock_actual} {prod.unidad_medida}</strong> | Capacidad Máx: <strong className="text-slate-300">{prod.stock_max} {prod.unidad_medida}</strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StockBadge actual={prod.stock_actual} min={prod.stock_min} max={prod.stock_max} unidad={prod.unidad_medida} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ÚLTIMOS MOVIMIENTOS REGISTRADOS */}
      <DashboardMovementsTable movimientos={metricas.ultimosMovimientos} />
    </div>
  );
}
