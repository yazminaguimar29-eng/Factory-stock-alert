import React from 'react';
import { Factory, Warehouse, Building2, ShieldCheck } from 'lucide-react';

interface FactoryLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  plantName?: string;
  className?: string;
}

export function FactoryLogo({
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Control de Inventario y Almacén en Tiempo Real',
  plantName = 'Planta de Manufactura — Almacén Central',
  className = '',
}: FactoryLogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl',
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Icon Badge */}
      <div className="relative mb-2">
        <div className="p-3 bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 text-slate-950 rounded-2xl shadow-xl shadow-cyan-500/25 border border-cyan-300/40 transform hover:scale-105 transition-all">
          <Factory className={`${iconSizes[size]} text-slate-950`} />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-slate-900 shadow">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Main Brand Title */}
      <div className={`font-black tracking-tight text-white flex items-center justify-center gap-2 ${textSizes[size]}`}>
        <span>FACTORY</span>
        <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">STOCK</span>
      </div>

      {/* Plant Name Corporate Badge */}
      {plantName && (
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-950/90 text-cyan-200 border border-cyan-500/30 shadow-md">
          <Building2 className="w-3 h-3 text-cyan-400" />
          <span>{plantName}</span>
        </div>
      )}

      {/* Optional Subtitle */}
      {showSubtitle && subtitleText && (
        <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed drop-shadow mt-1">
          {subtitleText}
        </p>
      )}
    </div>
  );
}
