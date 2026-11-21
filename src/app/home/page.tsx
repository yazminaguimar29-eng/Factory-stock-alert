import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { dataStore } from '@/lib/data-store';
import { AppShell } from '@/components/layout/AppShell';
import { HomeQuickSearch } from '@/components/home/HomeQuickSearch';
import { HomeLiveMetrics } from '@/components/home/HomeLiveMetrics';
import {
  Building2,
  ShieldCheck,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Radio,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [metricas, productos] = await Promise.all([
    dataStore.getDashboardMetricas(),
    dataStore.getProductos(),
  ]);

  // Determinar turno operativo según hora actual de México
  const currentHour = new Date().getHours();
  let shiftName = 'Turno Matutino';
  let shiftHours = '06:00 - 14:00';
  let shiftEmoji = '☀️';

  if (currentHour >= 14 && currentHour < 22) {
    shiftName = 'Turno Vespertino';
    shiftHours = '14:00 - 22:00';
    shiftEmoji = '⛅';
  } else if (currentHour >= 22 || currentHour < 6) {
    shiftName = 'Turno Nocturno';
    shiftHours = '22:00 - 06:00';
    shiftEmoji = '🌙';
  }

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'bg-purple-950/90 text-purple-300 border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.3)]';
      case 'ALMACENISTA':
        return 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
      case 'JEFE_AREA':
        return 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <AppShell user={session}>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ========================================================= */}
        {/* 1. CABECERA PRINCIPAL DE BIENVENIDA Y ESTADO OPERATIVO    */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-cyan-400/50 border-t-4 border-t-cyan-400 p-6 rounded-tl-3xl rounded-br-3xl shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Planta de Manufactura — Almacén Central</span>
                </span>

                <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-mono font-black border ${getRoleBadge(session.rol)}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{session.rol}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase flex items-center gap-2.5">
                <span>Bienvenido al Portal, {session.nombre.split(' ')[0]}</span>
              </h1>

              <p className="text-xs sm:text-sm font-bold text-violet-200 max-w-2xl">
                Sistema centralizado para control de existencias, recepción de compras, despacho por vales y monitoreo en tiempo real.
              </p>
            </div>

            {/* Widgets de Turno y Estado del Sistema (Sin mención de nube o Google Sheets) */}
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
              {/* Turno Operativo */}
              <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/50 text-xs shadow-lg shadow-amber-950/30">
                <div className="flex items-center gap-1.5 text-amber-300 font-black">
                  <span>{shiftEmoji}</span>
                  <span className="uppercase">{shiftName}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{shiftHours}</p>
              </div>

              {/* Estado Operativo en Vivo */}
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-xs shadow-lg shadow-emerald-950/30">
                <div className="flex items-center gap-1.5 text-emerald-300 font-black">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="uppercase tracking-wider font-mono text-[11px]">Sistema en Vivo</span>
                </div>
                <p className="text-[10px] text-emerald-200 font-medium mt-0.5">Sincronización Automática Activa</p>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. LANZADOR DE ACCESOS RÁPIDOS OPERATIVOS (ACTION HUB)     */}
        {/* ========================================================= */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400 inline-block shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span>Accesos Rápidos a Módulos Principales</span>
            </h2>
            <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Acceso Inmediato en 1 Clic</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Recepción de Entradas */}
            <Link
              href="/entradas"
              className="group p-5 bg-gradient-to-br from-emerald-950/90 via-slate-900/90 to-slate-950 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl shadow-xl shadow-emerald-950/30 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/40 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shadow">
                  <ArrowDownToLine className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Acceder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-4 uppercase group-hover:text-emerald-300 transition-colors">
                Recepción de Material
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                Registro de compras de proveedores con número de factura y actualización inmediata de stock.
              </p>
            </Link>

            {/* 2. Despacho por Vales (Salidas) */}
            <Link
              href="/salidas"
              className="group p-5 bg-gradient-to-br from-cyan-950/90 via-slate-900/90 to-slate-950 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-3xl shadow-xl shadow-cyan-950/30 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-500/40 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shadow">
                  <ArrowUpFromLine className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Acceder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-4 uppercase group-hover:text-cyan-300 transition-colors">
                Despacho por Vales (Salidas)
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                Surtido a líneas de producción por Orden de Trabajo (OT) con generación de comprobante y ticket PDF.
              </p>
            </Link>

            {/* 3. Catálogo e Inventario */}
            <Link
              href="/inventario"
              className="group p-5 bg-gradient-to-br from-violet-950/90 via-slate-900/90 to-slate-950 border-2 border-violet-500/50 hover:border-violet-400 rounded-3xl shadow-xl shadow-violet-950/30 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-violet-500/20 text-violet-300 rounded-2xl border border-violet-500/40 group-hover:bg-violet-500 group-hover:text-slate-950 transition-colors shadow">
                  <Boxes className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-violet-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Acceder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-4 uppercase group-hover:text-violet-300 transition-colors">
                Catálogo e Inventario
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                Control de anaqueles, conteo exacto de piezas, capacidad máxima y trazabilidad Kardex.
              </p>
            </Link>

            {/* 4. Dashboard y Gráficas de Stock */}
            <Link
              href="/dashboard"
              className="group p-5 bg-gradient-to-br from-fuchsia-950/90 via-slate-900/90 to-slate-950 border-2 border-fuchsia-500/50 hover:border-fuchsia-400 rounded-3xl shadow-xl shadow-fuchsia-950/30 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-fuchsia-500/20 text-fuchsia-300 rounded-2xl border border-fuchsia-500/40 group-hover:bg-fuchsia-500 group-hover:text-slate-950 transition-colors shadow">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-fuchsia-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Acceder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-4 uppercase group-hover:text-fuchsia-300 transition-colors">
                Dashboard y Gráficas
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                Visualización gráfica de capacidad de materiales en stock, semáforos de nivel y distribución.
              </p>
            </Link>

            {/* 5. Alertas de Abastecimiento */}
            <Link
              href="/alertas"
              className="group p-5 bg-gradient-to-br from-rose-950/90 via-slate-900/90 to-slate-950 border-2 border-rose-500/50 hover:border-rose-400 rounded-3xl shadow-xl shadow-rose-950/30 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-rose-500/20 text-rose-300 rounded-2xl border border-rose-500/40 group-hover:bg-rose-500 group-hover:text-slate-950 transition-colors shadow">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>{metricas.totalStockCritico} Críticos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-4 uppercase group-hover:text-rose-300 transition-colors">
                Alertas de Stock
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                Monitoreo automático de materiales que se encuentran por debajo del punto mínimo de seguridad.
              </p>
            </Link>

            {/* 6. Módulo de Bitácora de Auditoría (Admin) o Devoluciones */}
            {session.rol === 'ADMIN' ? (
              <Link
                href="/auditoria"
                className="group p-5 bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-slate-950 border-2 border-indigo-500/50 hover:border-indigo-400 rounded-3xl shadow-xl shadow-indigo-950/30 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/40 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors shadow">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-4 uppercase group-hover:text-indigo-300 transition-colors">
                  Bitácora de Auditoría
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                  Registro cronológico corporativo de accesos de usuarios, IP, terminales y ajustes de almacén.
                </p>
              </Link>
            ) : (
              <Link
                href="/devoluciones"
                className="group p-5 bg-gradient-to-br from-teal-950/90 via-slate-900/90 to-slate-950 border-2 border-teal-500/50 hover:border-teal-400 rounded-3xl shadow-xl shadow-teal-950/30 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-teal-500/20 text-teal-300 rounded-2xl border border-teal-500/40 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors shadow">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Acceder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-4 uppercase group-hover:text-teal-300 transition-colors">
                  Devoluciones de Planta
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                  Reingreso de material no utilizado con reintegración automática al inventario físico.
                </p>
              </Link>
            )}

          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. LOCALIZADOR Y BUSCADOR RÁPIDO INTEGRADO EN HOME        */}
        {/* ========================================================= */}
        <HomeQuickSearch productos={productos} />

        {/* ========================================================= */}
        {/* 4. RESUMEN EJECUTIVO DE KPIS INDUSTRIALES EN TIEMPO REAL  */}
        {/* ========================================================= */}
        <HomeLiveMetrics initialMetricas={metricas} />

        {/* ========================================================= */}
        {/* 5. PROTOCOLOS OPERATIVOS DEL ALMACÉN                     */}
        {/* ========================================================= */}
        <div className="p-5 bg-slate-950/90 border border-slate-800 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Protocolos de Seguridad y Operación de Almacén
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-900/80 border border-emerald-900/40 rounded-xl">
              <strong className="text-emerald-400 block mb-1 font-bold">1. Recepciones Físicas</strong>
              Todo material debe coincidir estrictamente con la factura de compra y registrarse en el sistema al momento de descarga.
            </div>

            <div className="p-3 bg-slate-900/80 border border-cyan-900/40 rounded-xl">
              <strong className="text-cyan-400 block mb-1 font-bold">2. Despacho por Vales</strong>
              Prohibida la salida de materiales sin folio de vale u orden de trabajo autorizada. Imprime el comprobante firmado.
            </div>

            <div className="p-3 bg-slate-900/80 border border-amber-900/40 rounded-xl">
              <strong className="text-amber-400 block mb-1 font-bold">3. Seguridad Industrial</strong>
              Uso indispensable de chaleco reflejante, calzado industrial y respeto a las líneas amarillas de montacargas.
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
