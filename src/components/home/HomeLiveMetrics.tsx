'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Boxes, AlertOctagon, AlertTriangle, ArrowUpFromLine, ArrowRight, Radio } from 'lucide-react';
import { DashboardMetricas } from '@/types';
import { STOCK_SYNC_EVENT } from '@/lib/events';

interface HomeLiveMetricsProps {
  initialMetricas: DashboardMetricas;
}

export function HomeLiveMetrics({ initialMetricas }: HomeLiveMetricsProps) {
  const [metricas, setMetricas] = useState<DashboardMetricas>(initialMetricas);
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLatestMetrics = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.totalSkusActivos === 'number') {
          setMetricas(data);
          const now = new Date();
          setLastSync(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      // Ignorar errores silenciosos de red en polling
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setLastSync(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // Escuchar eventos globales de sincronización en tiempo real
    const handleSyncEvent = () => {
      fetchLatestMetrics();
    };

    window.addEventListener(STOCK_SYNC_EVENT, handleSyncEvent);
    window.addEventListener('focus', handleSyncEvent);

    // Polling recurrente cada 5 segundos para mantener 100% sincronizado con el dashboard
    const interval = setInterval(fetchLatestMetrics, 5000);

    // BroadcastChannel para sincronizar entre pestañas abiertas
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('factory_stock_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'STOCK_UPDATED') {
            fetchLatestMetrics();
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
      if (channel) {
        channel.close();
      }
    };
  }, [fetchLatestMetrics]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400 inline-block shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span>Resumen Ejecutivo de Planta (En Vivo)</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : 'animate-pulse'}`} />
            <span>Sincronizado {lastSync && `• ${lastSync}`}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total SKUs */}
        <div className="p-5 bg-gradient-to-br from-cyan-950/90 via-slate-900/90 to-slate-950 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-3xl shadow-xl shadow-cyan-950/30 transition-all hover:-translate-y-1 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 block">
              Total Materiales
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shadow-md">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <h4 className="text-3xl sm:text-4xl font-black text-white mt-2 drop-shadow-lg tracking-tight font-mono">
            {metricas.totalSkusActivos}
          </h4>
          <p className="text-xs text-cyan-200/80 font-bold mt-1">
            SKUs activos en catálogo
          </p>
        </div>

        {/* 2. Stock Crítico */}
        <Link
          href="/alertas"
          className="p-5 bg-gradient-to-br from-rose-950/90 via-slate-900/90 to-slate-950 border-2 border-rose-500/50 hover:border-rose-400 rounded-3xl shadow-xl shadow-rose-950/30 transition-all hover:-translate-y-1 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 block">
              Stock Crítico
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/40 group-hover:bg-rose-500 group-hover:text-slate-950 transition-colors shadow-md">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <h4 className="text-3xl sm:text-4xl font-black text-rose-300 mt-2 drop-shadow-lg tracking-tight font-mono">
            {metricas.totalStockCritico}
          </h4>
          <p className="text-xs text-rose-200/80 font-bold mt-1 flex items-center justify-between">
            <span>&le; Mínimo de seguridad</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* 3. Sobrestock */}
        <div className="p-5 bg-gradient-to-br from-amber-950/90 via-slate-900/90 to-slate-950 border-2 border-amber-500/50 hover:border-amber-400 rounded-3xl shadow-xl shadow-amber-950/30 transition-all hover:-translate-y-1 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
              Sobrestock
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h4 className="text-3xl sm:text-4xl font-black text-amber-300 mt-2 drop-shadow-lg tracking-tight font-mono">
            {metricas.totalSobrestock}
          </h4>
          <p className="text-xs text-amber-200/80 font-bold mt-1">
            &ge; Capacidad máxima
          </p>
        </div>

        {/* 4. Vales del Día */}
        <Link
          href="/salidas"
          className="p-5 bg-gradient-to-br from-emerald-950/90 via-slate-900/90 to-slate-950 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl shadow-xl shadow-emerald-950/30 transition-all hover:-translate-y-1 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 block">
              Vales del Día
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shadow-md">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
          </div>
          <h4 className="text-3xl sm:text-4xl font-black text-emerald-300 mt-2 drop-shadow-lg tracking-tight font-mono">
            {metricas.valesHoy}
          </h4>
          <p className="text-xs text-emerald-200/80 font-bold mt-1 flex items-center justify-between">
            <span>Entregas surtidas hoy</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>
      </div>
    </div>
  );
}
