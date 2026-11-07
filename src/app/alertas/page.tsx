'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  RotateCw,
  CheckCircle2,
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
  X,
  ShieldAlert,
} from 'lucide-react';
import { AlertaConDetalle, UsuarioAutenticado } from '@/types';

const SECURITY_PINS = ['1234', 'admin123', 'almacen123'];

export default function AlertasPage() {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [alertas, setAlertas] = useState<AlertaConDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAtendida, setFilterAtendida] = useState<'TODAS' | 'NO' | 'SI'>('NO');

  // Estado del Candado de Seguridad en "Pendientes de Atención"
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pendingAlertaIdToAttend, setPendingAlertaIdToAttend] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      });

    loadAlertas();
  }, []);

  const loadAlertas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alertas');
      const data = await res.json();
      if (data.alertas) {
        setAlertas(data.alertas);
      }
    } catch (err) {
      console.error('Error cargando alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeMarcarAtendida = async (alertaId: string) => {
    try {
      const res = await fetch(`/api/alertas/${alertaId}/atender`, {
        method: 'PATCH',
      });
      if (res.ok) {
        loadAlertas();
      }
    } catch (err) {
      console.error('Error al atender alerta:', err);
    }
  };

  const handleMarcarAtendidaClick = (alertaId: string) => {
    if (!isUnlocked) {
      setPendingAlertaIdToAttend(alertaId);
      setPinInput('');
      setPinError(null);
      setShowLockModal(true);
      return;
    }
    executeMarcarAtendida(alertaId);
  };

  const handleToggleLockButton = () => {
    if (isUnlocked) {
      setIsUnlocked(false);
    } else {
      setPendingAlertaIdToAttend(null);
      setPinInput('');
      setPinError(null);
      setShowLockModal(true);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (SECURITY_PINS.includes(cleanPin)) {
      setIsUnlocked(true);
      setShowLockModal(false);
      setPinInput('');
      setPinError(null);
      if (pendingAlertaIdToAttend) {
        await executeMarcarAtendida(pendingAlertaIdToAttend);
        setPendingAlertaIdToAttend(null);
      }
    } else {
      setPinError('Código o contraseña incorrecta. Usa el PIN de seguridad (1234) o clave de administrador.');
    }
  };

  const filteredAlertas = alertas.filter((a) => {
    if (filterAtendida === 'TODAS') return true;
    return a.atendida === filterAtendida;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-indigo-950/80 backdrop-blur-md border border-violet-400/50 border-t-4 border-t-amber-400 p-5 rounded-tl-3xl rounded-br-3xl shadow-xl">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2.5">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
              <span>Centro de Alertas Automáticas</span>
            </h1>
            <p className="text-xs text-violet-100 font-bold mt-1">
              Detección de stock crítico para prevención de paros de planta y control de sobrestock de almacén
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón de Candado de Seguridad */}
            <button
              onClick={handleToggleLockButton}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-tl-xl rounded-br-xl text-xs font-black border transition-all shadow-lg ${
                isUnlocked
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-rose-950/90 border-rose-400 text-amber-300 hover:bg-rose-900'
              }`}
              title={
                isUnlocked
                  ? 'Candado desbloqueado. Clic para volver a bloquear.'
                  : 'Candado de seguridad activo en Pendientes de Atención. Clic para desbloquear.'
              }
            >
              {isUnlocked ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Candado Abierto (Bloquear)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>Candado de Seguridad Activo</span>
                </>
              )}
            </button>

            <button
              onClick={loadAlertas}
              title="Refrescar alertas"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-tl-xl rounded-br-xl border border-slate-700 transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filtros de estado con Candado en Pendientes de Atención */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-tl-2xl rounded-br-2xl border border-slate-700 w-fit shadow-lg">
            <button
              onClick={() => setFilterAtendida('NO')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-tl-xl rounded-br-xl text-xs font-black transition-colors ${
                filterAtendida === 'NO'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Lock className={`w-3.5 h-3.5 ${filterAtendida === 'NO' ? 'text-slate-950' : 'text-amber-400'}`} />
              )}
              <span>Pendientes de Atención</span>
            </button>
            <button
              onClick={() => setFilterAtendida('SI')}
              className={`px-3.5 py-2 rounded-tl-xl rounded-br-xl text-xs font-black transition-colors ${
                filterAtendida === 'SI'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Historial Atendidas
            </button>
            <button
              onClick={() => setFilterAtendida('TODAS')}
              className={`px-3.5 py-2 rounded-tl-xl rounded-br-xl text-xs font-black transition-colors ${
                filterAtendida === 'TODAS'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Todas
            </button>
          </div>

          {filterAtendida === 'NO' && (
            <div className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-700 px-3.5 py-2 rounded-tl-xl rounded-br-xl">
              {isUnlocked ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">
                    Autorizado para marcar alertas pendientes como atendidas
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-200 font-bold">
                    Protegido con Candado de Seguridad para evitar cierres accidentales
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* LISTADO DE ALERTAS */}
        <div className="space-y-3">
          {filteredAlertas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-tl-3xl rounded-br-3xl p-8 text-center text-slate-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-white">No hay alertas {filterAtendida === 'NO' ? 'pendientes' : ''}</p>
              <p className="text-xs text-slate-400 mt-1">Todos los materiales operan dentro de sus parámetros estándar.</p>
            </div>
          ) : (
            filteredAlertas.map((alerta) => {
              const esCritica = alerta.tipo_alerta === 'STOCK_BAJO';
              const yaAtendida = alerta.atendida === 'SI';

              return (
                <div
                  key={alerta.id}
                  className={`p-5 rounded-tl-2xl rounded-br-2xl border transition-all ${
                    yaAtendida
                      ? 'bg-slate-900/60 border-slate-800 opacity-70'
                      : esCritica
                      ? 'bg-red-950/50 border-red-700/80 shadow-lg shadow-red-950/30'
                      : 'bg-amber-950/50 border-amber-700/80 shadow-lg shadow-amber-950/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Detalle y badge */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                            esCritica
                              ? 'bg-red-950 text-red-300 border border-red-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {esCritica ? <AlertOctagon className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {esCritica ? 'ALERTA ROJA — STOCK CRÍTICO' : 'ALERTA AMARILLA — SOBRESTOCK'}
                        </span>

                        <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {new Date(alerta.fecha_generada).toLocaleString('es-MX')}
                        </span>

                        {yaAtendida ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            ATENDIDA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/50 text-[10px] font-bold">
                            {isUnlocked ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                            {isUnlocked ? 'DESBLOQUEADA' : 'PROTEGIDA'}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="font-mono text-amber-300">{alerta.producto_sku}</span>
                          <span>&bull;</span>
                          <span>{alerta.producto_nombre}</span>
                        </h3>
                        <p className="text-xs text-slate-200 mt-1">
                          {esCritica
                            ? `Stock actual en almacén: ${alerta.stock_actual} (Mínimo de seguridad: ${alerta.stock_min}). Requiere orden de compra inmediata para evitar paro de línea.`
                            : `Stock actual en almacén: ${alerta.stock_actual} (Máximo permitido: ${alerta.stock_max}). Posible saturación de anaquel.`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          Anaquel: <code className="font-mono text-white font-bold">{alerta.ubicacion_anaquel}</code>
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          Notificado a: <strong className="text-white">{alerta.email_enviado_a}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Acciones con Candado de Seguridad */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      {user.rol !== 'JEFE_AREA' && !yaAtendida && (
                        <button
                          onClick={() => handleMarcarAtendidaClick(alerta.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-tl-xl rounded-br-xl border transition-colors ${
                            isUnlocked
                              ? 'bg-emerald-900/80 hover:bg-emerald-800 text-white border-emerald-500'
                              : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/60'
                          }`}
                        >
                          {isUnlocked ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>Marcar Atendida</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-amber-400" />
                              <span>Desbloquear para Atender</span>
                            </>
                          )}
                        </button>
                      )}

                      {esCritica && user.rol !== 'JEFE_AREA' && (
                        <Link
                          href={`/entradas?sku=${alerta.producto_sku}`}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-tl-xl rounded-br-xl transition-colors shadow-md shadow-emerald-500/20"
                        >
                          <span>Recepcionar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL DE CANDADO DE SEGURIDAD */}
        {showLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border-2 border-amber-400/70 rounded-tl-3xl rounded-br-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/20 border border-amber-400/50 rounded-tl-xl rounded-br-xl text-amber-300">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase">
                      Candado de Seguridad
                    </h3>
                    <p className="text-[11px] text-amber-200 font-semibold">
                      Protección de Alertas Pendientes de Atención
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLockModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUnlockSubmit} className="space-y-4">
                <p className="text-xs text-slate-200 leading-relaxed">
                  Para evitar que una alerta crítica se marque como atendida por error, ingresa el <strong>PIN de seguridad</strong> o contraseña de autorización:
                </p>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5">
                    PIN / Clave de Seguridad
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      autoFocus
                      required
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Ingresa PIN (ej. 1234 o admin123)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-amber-400/60 rounded-tl-xl rounded-br-xl text-sm font-mono text-white focus:outline-none focus:border-amber-300"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                    PIN rápido de planta: <strong className="text-amber-300">1234</strong> (o clave <strong className="text-amber-300">admin123</strong>)
                  </span>
                </div>

                {pinError && (
                  <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-xl flex items-center gap-2 text-xs text-rose-200 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowLockModal(false)}
                    className="px-4 py-2 text-xs font-black text-white bg-slate-800 hover:bg-slate-700 rounded-tl-xl rounded-br-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-tl-xl rounded-br-xl shadow-lg"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Desbloquear Candado</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
