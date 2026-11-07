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
  if (actual <= min) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800 shadow-sm animate-pulse">
        {showIcon && <AlertOctagon className="w-3.5 h-3.5 text-red-400" />}
        Stock Crítico ({actual} / min {min} {unidad})
      </span>
    );
  }

  if (max > 0 && actual >= max) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800 shadow-sm">
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
        Sobrestock ({actual} / max {max} {unidad})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800 shadow-sm">
      {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
      Normal ({actual} {unidad})
    </span>
  );
}
