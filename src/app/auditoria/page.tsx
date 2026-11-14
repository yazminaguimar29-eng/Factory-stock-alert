import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { dataStore } from '@/lib/data-store';
import { AppShell } from '@/components/layout/AppShell';
import { AuditoriaTableClient } from '@/components/auditoria/AuditoriaTableClient';
import {
  ShieldCheck,
  FileText,
  UserCheck,
  SlidersHorizontal,
  Clock,
  Laptop,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Solo administradores pueden ver la bitácora
  if (session.rol !== 'ADMIN') {
    redirect('/dashboard');
  }

  const logs = await dataStore.getAuditLogs();

  // Métricas
  const totalLogs = logs.length;
  const hoyStr = new Date().toISOString().split('T')[0];
  const loginsHoy = logs.filter(
    (l) => l.tipo_accion === 'INICIO_SESION' && l.fecha.startsWith(hoyStr)
  ).length;
  const ajustesTotal = logs.filter((l) => l.tipo_accion === 'AJUSTE').length;
  const movimientosTotal = logs.filter(
    (l) => l.tipo_accion === 'ENTRADA' || l.tipo_accion === 'SALIDA' || l.tipo_accion === 'DEVOLUCION'
  ).length;

  return (
    <AppShell user={session}>
      <div className="space-y-6">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-indigo-950/80 backdrop-blur-md border border-violet-400/50 border-t-4 border-t-indigo-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white uppercase">
                  Bitácora de Auditoría Corporativa
                </h1>
                <p className="text-xs sm:text-sm font-bold text-violet-200 mt-0.5">
                  Registro cronológico de accesos, movimientos de stock, ajustes y dispositivos (Audit Log)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tiempo Real</span>
            </span>
          </div>
        </div>

        {/* Tarjetas KPI de Auditoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-violet-500/30 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Eventos</p>
                <h3 className="text-3xl font-black text-white mt-1">{totalLogs}</h3>
              </div>
              <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/40">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Registros almacenados en sistema</p>
          </div>

          <div className="bg-slate-900/90 border border-violet-500/30 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Inicios Sesión Hoy</p>
                <h3 className="text-3xl font-black text-cyan-400 mt-1">{loginsHoy}</h3>
              </div>
              <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Accesos autenticados hoy</p>
          </div>

          <div className="bg-slate-900/90 border border-violet-500/30 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Operaciones Almacén</p>
                <h3 className="text-3xl font-black text-emerald-400 mt-1">{movimientosTotal}</h3>
              </div>
              <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Entradas, salidas y devoluciones</p>
          </div>

          <div className="bg-slate-900/90 border border-violet-500/30 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Ajustes Físicos</p>
                <h3 className="text-3xl font-black text-amber-300 mt-1">{ajustesTotal}</h3>
              </div>
              <div className="p-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Modificaciones manuales de inventario</p>
          </div>
        </div>

        {/* Tabla Interactiva de Auditoría */}
        <AuditoriaTableClient initialLogs={logs} />

      </div>
    </AppShell>
  );
}
