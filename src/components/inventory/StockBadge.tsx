import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface StockBadgeProps {
  actual: number;
  min: number;
  max: number;
  unidad?: string;
  showIcon?: boolean;
}

export function StockBadge({ actual, min, max, unidad = 'pza', showIcon = true }: StockBadgeProps) {
  const unidadTexto = unidad || 'pzas';
  const maxDisplay = max > 0 ? max : 'Sin límite';

  if (actual <= min) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tl-xl rounded-br-xl text-xs font-black bg-rose-950/95 text-rose-300 border-2 border-rose-500 shadow-lg shadow-rose-950/60 animate-pulse">
        {showIcon && <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />}
        <span>
          Crítico: <strong className="text-white font-mono text-sm">{actual} {unidadTexto}</strong>{' '}
          <span className="text-rose-200/90 font-mono text-[11px] font-bold">
            (Mín: {min} | Máx: {maxDisplay} {unidadTexto})
          </span>
        </span>
      </span>
    );
  }

  if (max > 0 && actual >= max) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tl-xl rounded-br-xl text-xs font-black bg-amber-950/95 text-amber-300 border-2 border-amber-400 shadow-lg shadow-amber-950/60">
        {showIcon && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
        <span>
          Sobrestock: <strong className="text-white font-mono text-sm">{actual} {unidadTexto}</strong>{' '}
          <span className="text-amber-200/90 font-mono text-[11px] font-bold">
            (Capacidad Máx: {maxDisplay} {unidadTexto})
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tl-xl rounded-br-xl text-xs font-black bg-emerald-950/95 text-emerald-300 border-2 border-emerald-400 shadow-lg shadow-emerald-950/60">
      {showIcon && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      <span>
        Stock: <strong className="text-white font-mono text-sm">{actual} {unidadTexto}</strong>{' '}
        <span className="text-emerald-200/90 font-mono text-[11px] font-bold">
          (Máx: {maxDisplay} {unidadTexto})
        </span>
      </span>
    </span>
  );
}
