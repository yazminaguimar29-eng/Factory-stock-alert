'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';
import { playSuccessBeep, playErrorBeep } from '@/lib/sound';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const defaultTitles: Record<ToastType, string> = {
        success: 'Operación Exitosa',
        error: 'Error de Almacén',
        warning: 'Alerta de Inventario',
        info: 'Información del Sistema',
      };

      const finalTitle = title || defaultTitles[type];

      // Disparar sonido industrial según el tipo
      if (type === 'success') {
        playSuccessBeep();
      } else if (type === 'error') {
        playErrorBeep();
      }

      setToasts((prev) => [...prev, { id, type, title: finalTitle, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => showToast('success', message, title),
    [showToast]
  );
  const showError = useCallback(
    (message: string, title?: string) => showToast('error', message, title),
    [showToast]
  );
  const showWarning = useCallback(
    (message: string, title?: string) => showToast('warning', message, title),
    [showToast]
  );
  const showInfo = useCallback(
    (message: string, title?: string) => showToast('info', message, title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}

      {/* Floating Toast Container (Top-Right) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const styles = {
            success: {
              container: 'bg-emerald-950/95 border-emerald-400 text-white shadow-emerald-950/50',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
              badge: 'bg-emerald-800/80 text-emerald-200 border-emerald-600',
              accent: 'bg-emerald-400',
            },
            error: {
              container: 'bg-rose-950/95 border-rose-500 text-white shadow-rose-950/50',
              icon: <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />,
              badge: 'bg-rose-800/80 text-rose-200 border-rose-600',
              accent: 'bg-rose-500',
            },
            warning: {
              container: 'bg-amber-950/95 border-amber-400 text-white shadow-amber-950/50',
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              badge: 'bg-amber-800/80 text-amber-200 border-amber-600',
              accent: 'bg-amber-400',
            },
            info: {
              container: 'bg-cyan-950/95 border-cyan-400 text-white shadow-cyan-950/50',
              icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
              badge: 'bg-cyan-800/80 text-cyan-200 border-cyan-600',
              accent: 'bg-cyan-400',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto border-2 rounded-2xl p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-x-0 flex items-start gap-3 relative overflow-hidden ${styles.container}`}
              role="alert"
            >
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${styles.accent}`} />
              <div className="mt-0.5">{styles.icon}</div>
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-xs font-black tracking-wider uppercase drop-shadow">
                    {toast.title}
                  </h4>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${styles.badge}`}>
                    {toast.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-100 leading-snug">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
}
