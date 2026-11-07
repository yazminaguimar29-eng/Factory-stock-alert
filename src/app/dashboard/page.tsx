import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dataStore } from '@/lib/data-store';
import { AppShell } from '@/components/layout/AppShell';
import { StockBadge } from '@/components/inventory/StockBadge';
import { DashboardMovementsTable } from '@/components/dashboard/DashboardMovementsTable';
import { DashboardStockCharts } from '@/components/dashboard/DashboardStockCharts';
import {
  Boxes,
  AlertOctagon,
  AlertTriangle,
  ArrowUpFromLine,
  ArrowRight,
  TrendingDown,
  Clock,
  History,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [metricas, productos] = await Promise.all([
    dataStore.getDashboardMetricas(),
    dataStore.getProductos(),
  ]);

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        
        {/* Cabecera del Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-indigo-950/80 backdrop-blur-md border border-violet-400/50 border-t-4 border-t-fuchsia-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white uppercase flex items-center gap-2.5">
              <span>Panel de Control de Almacén</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-violet-100 mt-1">
              Monitoreo en tiempo real de inventario, consumo por órdenes de trabajo y alertas de abastecimiento
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-tl-xl rounded-br-xl text-xs font-mono font-black bg-fuchsia-950/90 border border-fuchsia-400/60 text-amber-300 shadow-md">
              <Clock className="w-4 h-4 text-amber-300" />
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 4 TARJETAS KPI PRINCIPALES CON LETRAS LLAMATIVAS Y FORMAS BISELADAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total SKUs */}
          <div className="bg-indigo-950/85 backdrop-blur-md border border-violet-400/50 border-t-4 border-t-violet-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-200">Total de SKUs</p>
                <h3 className="text-4xl font-black text-white mt-1 drop-shadow-md">{metricas.totalSkusActivos}</h3>
              </div>
              <div className="p-3 rotate-3 bg-violet-500/25 border border-violet-300/50 text-violet-200 rounded-tl-2xl rounded-br-2xl shadow-md">
                <Boxes className="w-6 h-6 -rotate-3" />
              </div>
            </div>
            <p className="text-xs text-violet-100 mt-3 font-bold">
              Materiales activos en catálogo industrial
            </p>
          </div>

          {/* 2. Stock Crítico (Alerta Roja) */}
          <div className="bg-rose-950/85 backdrop-blur-md border border-rose-400/60 border-t-4 border-t-rose-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-200">Stock Crítico</p>
                <h3 className="text-4xl font-black text-amber-300 mt-1 drop-shadow-md">{metricas.totalStockCritico}</h3>
              </div>
              <div className="p-3 rotate-3 bg-rose-500/30 border border-rose-300/50 text-rose-200 rounded-tl-2xl rounded-br-2xl animate-pulse shadow-md">
                <AlertOctagon className="w-6 h-6 -rotate-3" />
              </div>
            </div>
            <p className="text-xs text-rose-100 mt-3 font-bold">
              Materiales &le; Stock mínimo requerido
            </p>
          </div>

          {/* 3. Sobrestock (Alerta Amarilla) */}
          <div className="bg-amber-950/85 backdrop-blur-md border border-amber-400/60 border-t-4 border-t-amber-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-200">Sobrestock</p>
                <h3 className="text-4xl font-black text-amber-300 mt-1 drop-shadow-md">{metricas.totalSobrestock}</h3>
              </div>
              <div className="p-3 rotate-3 bg-amber-500/25 border border-amber-300/50 text-amber-200 rounded-tl-2xl rounded-br-2xl shadow-md">
                <AlertTriangle className="w-6 h-6 -rotate-3" />
              </div>
            </div>
            <p className="text-xs text-amber-100 mt-3 font-bold">
              Materiales &ge; Stock máximo de referencia
            </p>
          </div>

          {/* 4. Vales del Día */}
          <div className="bg-teal-950/85 backdrop-blur-md border border-teal-400/60 border-t-4 border-t-teal-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-teal-200">Vales del Día</p>
                <h3 className="text-4xl font-black text-emerald-300 mt-1 drop-shadow-md">{metricas.valesHoy}</h3>
              </div>
              <div className="p-3 rotate-3 bg-teal-500/25 border border-teal-300/50 text-teal-200 rounded-tl-2xl rounded-br-2xl shadow-md">
                <ArrowUpFromLine className="w-6 h-6 -rotate-3" />
              </div>
            </div>
            <p className="text-xs text-teal-100 mt-3 font-bold">
              Entregas de material registradas hoy
            </p>
          </div>
        </div>

        {/* ALERTA DE ACCIÓN INMEDIATA SI HAY STOCK CRÍTICO */}
        {metricas.totalStockCritico > 0 && (
          <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-900/50 text-red-400 rounded-lg">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-300">
                  Atención Requerida: {metricas.totalStockCritico} SKU(s) en Nivel Crítico de Abastecimiento
                </h4>
                <p className="text-xs text-red-400/90 mt-0.5">
                  Existe riesgo de paro en líneas de producción. Alertas automáticas enviadas a Compras y Administración.
                </p>
              </div>
            </div>
            <Link
              href="/alertas"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Materiales en Stock Crítico
                </h3>
              </div>
              <span className="text-xs font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-900">
                {metricas.productosCriticos.length} SKUs
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
              {metricas.productosCriticos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                  Todos los materiales se encuentran por encima de su nivel mínimo.
                </div>
              ) : (
                metricas.productosCriticos.map((prod) => (
                  <div key={prod.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-400">{prod.codigo_sku}</span>
                        <span className="text-xs text-slate-400 font-semibold">{prod.categoria}</span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">{prod.nombre}</p>
                      <p className="text-[11px] text-slate-400">
                        Ubicación: <code className="text-slate-300 font-mono">{prod.ubicacion_anaquel}</code> &bull; Proveedor: {prod.proveedor_principal}
                      </p>
                    </div>
                    <div className="text-right">
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Materiales en Sobrestock
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-900">
                {metricas.productosSobrestock.length} SKUs
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
              {metricas.productosSobrestock.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                  No hay materiales que excedan su stock máximo referencial.
                </div>
              ) : (
                metricas.productosSobrestock.map((prod) => (
                  <div key={prod.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">{prod.codigo_sku}</span>
                        <span className="text-xs text-slate-400 font-semibold">{prod.categoria}</span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">{prod.nombre}</p>
                      <p className="text-[11px] text-slate-400">
                        Ubicación: <code className="text-slate-300 font-mono">{prod.ubicacion_anaquel}</code>
                      </p>
                    </div>
                    <div className="text-right">
                      <StockBadge actual={prod.stock_actual} min={prod.stock_min} max={prod.stock_max} unidad={prod.unidad_medida} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ÚLTIMOS MOVIMIENTOS REGISTRADOS (ORDEN INVERTIDO: MÁS RECIENTES A ANTERIORES + BUSCADOR DE FECHA) */}
        <DashboardMovementsTable movimientos={metricas.ultimosMovimientos} />

      </div>
    </AppShell>
  );
}
