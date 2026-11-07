'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  KeyRound, 
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';

interface SheetsStatus {
  configured: boolean;
  hasSpreadsheetId: boolean;
  spreadsheetId: string | null;
  hasCredentials: boolean;
  credentialSource: string | null;
  credentialFile: string | null;
  clientEmail: string | null;
  projectId: string | null;
  accessible: boolean;
  title: string;
  tabs: string[];
  error: string | null;
  errorHelp: string | null;
}

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleSheetsModal({ isOpen, onClose }: GoogleSheetsModalProps) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<SheetsStatus | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/sheets/status');
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      console.error('Error fetching sheets status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleCopyEmail = () => {
    if (status?.clientEmail) {
      navigator.clipboard.writeText(status.clientEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSyncDawnProducts = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/sheets/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full_sync' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(
          `¡Sincronización completa! Nube actualizada con ${data.syncedProductos} Productos, ${data.syncedMovimientos} Movimientos, ${data.syncedUsuarios} Usuarios y ${data.syncedAlertas} Alertas.`
        );
        fetchStatus();
      } else {
        setSyncMessage(`Error: ${data.error || 'No se pudo sincronizar'}`);
      }
    } catch (err: any) {
      setSyncMessage(`Error de conexión: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Conexión con Google Sheets & Google Cloud
              </h2>
              <p className="text-xs text-slate-400">
                Sincronización en tiempo real mediante Service Account API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Banner de Estado */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            status?.accessible 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : status?.configured 
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
          }`}>
            {status?.accessible ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {status?.accessible
                    ? '¡Google Sheets conectado y sincronizado!'
                    : status?.configured
                      ? 'Credenciales cargadas, esperando permisos en el documento'
                      : 'Modo Local Activo (Fallback Industrial Dawn Foods)'}
                </span>
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Verificar
                </button>
              </div>

              {status?.errorHelp && (
                <p className="text-xs mt-2 text-amber-300/90 font-medium leading-relaxed bg-amber-950/40 p-2.5 rounded-lg border border-amber-900/50">
                  {status.errorHelp}
                </p>
              )}

              {status?.accessible && (
                <div className="mt-2 text-xs text-emerald-300 flex flex-wrap items-center gap-3">
                  <span><strong>Documento:</strong> {status.title}</span>
                  <span>&bull;</span>
                  <span><strong>Pestañas:</strong> {status.tabs.join(', ') || 'Productos'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de Diagnóstico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* 1. Archivo JSON de Credenciales */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  Archivo de Credenciales JSON
                </span>
                {status?.hasCredentials ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    DETECTADO
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    PENDIENTE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {status?.credentialFile 
                  ? `Archivo cargado: ${status.credentialFile}`
                  : 'Coloca "google-credentials.json" en la raíz del proyecto.'}
              </p>
              {status?.projectId && (
                <p className="text-[11px] font-mono text-slate-500">
                  Proyecto Google Cloud: {status.projectId}
                </p>
              )}
            </div>

            {/* 2. Google Sheets ID */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  GOOGLE_SHEETS_ID
                </span>
                {status?.hasSpreadsheetId ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    CONFIGURADO
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    NO ASIGNADO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono truncate" title={status?.spreadsheetId || ''}>
                {status?.spreadsheetId ? status.spreadsheetId : 'Definir en .env.local'}
              </p>
            </div>
          </div>

          {/* Correo de la Cuenta de Servicio (Crucial para Compartir) */}
          {status?.clientEmail && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Correo de la Cuenta de Servicio (Google Cloud)
                </span>
                <span className="text-[11px] text-cyan-400 font-semibold">
                  Paso indispensable: Permiso de Editor
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Abre tu hoja de Google Sheets, pulsa el botón verde <strong>Compartir (Share)</strong> y añade este correo:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={status.clientEmail}
                  className="flex-1 bg-slate-950 border border-cyan-800/80 rounded-lg px-3 py-2 text-xs font-mono text-cyan-200 select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyEmail}
                  className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          )}

          {/* Guía Rápida de 4 Pasos */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Pasos para conectar con Google Cloud Console:
            </h3>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                Entra a <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">console.cloud.google.com <ExternalLink className="w-3 h-3" /></a> y crea o selecciona un proyecto.
              </li>
              <li>
                En <strong>APIs y servicios &gt; Biblioteca</strong>, habilita la <strong>Google Sheets API</strong>.
              </li>
              <li>
                En <strong>Credenciales &gt; Crear credenciales</strong>, selecciona <strong>Cuenta de servicio</strong>. Luego en la pestaña <strong>Claves (Keys)</strong> haz clic en <strong>Agregar clave &gt; Crear clave nueva &gt; JSON</strong>.
              </li>
              <li>
                Guarda el archivo descargado en la carpeta del proyecto como <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono">google-credentials.json</code> y pon el ID de tu hoja en <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono">.env.local</code>.
              </li>
            </ol>
          </div>

          {/* Acciones de Sincronización */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">
                Sincronizar Versión Local con la Nube (Google Sheets)
              </p>
              <p className="text-[11px] text-slate-300">
                Actualiza las 4 hojas en la nube (Productos, Movimientos, Usuarios y Alertas) para que reflejen exactamente tu versión local.
              </p>
            </div>
            <button
              onClick={handleSyncDawnProducts}
              disabled={syncing}
              className="px-4 py-2 rounded-tl-xl rounded-br-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition shrink-0"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {syncing ? 'Sincronizando...' : 'Sincronizar Local → Nube'}
            </button>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              {syncMessage}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            FactoryStock Almacén &bull; Dawn Foods API v4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
