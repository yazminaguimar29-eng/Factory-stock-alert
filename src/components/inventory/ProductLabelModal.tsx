'use client';

import React, { useState } from 'react';
import { Printer, Tag, X, Check, Box, MapPin, Layers, ShieldCheck } from 'lucide-react';
import { Producto } from '@/types';

interface ProductLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
}

/**
 * Genera un código de barras SVG simulado de alta fidelidad tipo Code 128
 * calculando anchos de barra a partir del string del SKU.
 */
function SvgBarcode({ value }: { value: string }) {
  const bars: { width: number; isSpace: boolean }[] = [];
  
  // Patrón de inicio Code 128
  bars.push({ width: 3, isSpace: false }, { width: 1, isSpace: true }, { width: 2, isSpace: false }, { width: 2, isSpace: true });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 3) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    const s2 = ((code >> 3) % 2) + 1;
    bars.push(
      { width: b1, isSpace: false },
      { width: s1, isSpace: true },
      { width: b2, isSpace: false },
      { width: s2, isSpace: true }
    );
  }

  // Patrón de fin
  bars.push(
    { width: 2, isSpace: false },
    { width: 3, isSpace: true },
    { width: 3, isSpace: false },
    { width: 1, isSpace: true },
    { width: 2, isSpace: false }
  );

  let currentX = 10;
  const elements = bars.map((bar, idx) => {
    const x = currentX;
    currentX += bar.width * 2;
    if (bar.isSpace) return null;
    return (
      <rect
        key={idx}
        x={x}
        y="0"
        width={bar.width * 2}
        height="60"
        fill="#000000"
      />
    );
  });

  const totalWidth = currentX + 10;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${totalWidth} 60`}
        className="w-full h-14 max-w-xs"
        preserveAspectRatio="none"
      >
        {elements}
      </svg>
      <span className="font-mono text-sm font-black tracking-[0.25em] text-black mt-1">
        *{value}*
      </span>
    </div>
  );
}

export function ProductLabelModal({ isOpen, onClose, producto }: ProductLabelModalProps) {
  const [labelSize, setLabelSize] = useState<'estante' | 'tarima'>('estante');

  if (!isOpen || !producto) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Modal Header (Oculto al imprimir) */}
        <div className="px-6 py-4 border-b border-amber-500/30 flex items-center justify-between bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
              <Tag className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wide text-white">
                Impresión de Etiqueta Industrial
              </h3>
              <p className="text-[11px] font-bold text-amber-200">
                Código de barras para anaquel o tarima (4x6" o 5x3 cm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tamaño (Oculto al imprimir) */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/40 border-b border-slate-800 gap-2 print:hidden">
          <button
            onClick={() => setLabelSize('estante')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              labelSize === 'estante'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Anaquel / Estante (5 x 3 cm)</span>
          </button>
          <button
            onClick={() => setLabelSize('tarima')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              labelSize === 'tarima'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Tarima / Pallet (4 x 6")</span>
          </button>
        </div>

        {/* Vista Previa de la Etiqueta (Se imprime exactamente este bloque) */}
        <div className="p-6 bg-slate-850 flex justify-center items-center overflow-x-auto print:p-0 print:bg-white">
          <div
            id="printable-label"
            className={`bg-white text-black border-4 border-black p-4 flex flex-col justify-between shadow-xl print:shadow-none print:border-4 print:border-black ${
              labelSize === 'estante'
                ? 'w-96 max-w-full min-h-[220px]'
                : 'w-[450px] max-w-full min-h-[300px]'
            }`}
          >
            {/* Cabecera de Etiqueta */}
            <div className="border-b-2 border-black pb-1.5 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Box className="w-4 h-4 text-black" />
                <span className="text-[11px] font-black tracking-widest uppercase text-black">
                  FACTORYSTOCK &bull; ALMACÉN
                </span>
              </div>
              <span className="text-[10px] font-bold font-mono text-black border border-black px-1.5 py-0.2 rounded">
                {producto.categoria}
              </span>
            </div>

            {/* Ubicación Física y SKU Destacados */}
            <div className="flex items-center justify-between gap-2 bg-slate-100 p-2 border-2 border-black rounded mb-2">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                  UBICACIÓN FÍSICA
                </span>
                <span className="text-xl font-black font-mono tracking-tight text-black flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-black inline shrink-0" />
                  {producto.ubicacion_anaquel || 'S/U'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                  CÓDIGO SKU
                </span>
                <span className="text-xl font-black font-mono tracking-wider text-black">
                  {producto.codigo_sku}
                </span>
              </div>
            </div>

            {/* Nombre del Producto en Grande */}
            <div className="my-1">
              <h2 className="text-base sm:text-lg font-black leading-tight text-black line-clamp-2 uppercase">
                {producto.nombre}
              </h2>
              {producto.descripcion && (
                <p className="text-[10px] text-slate-700 line-clamp-1 mt-0.5 font-medium">
                  {producto.descripcion}
                </p>
              )}
            </div>

            {/* Código de Barras Nítido */}
            <div className="my-2 bg-white p-2 border border-slate-300 rounded flex justify-center">
              <SvgBarcode value={producto.codigo_sku} />
            </div>

            {/* Pie de Etiqueta: Proveedor, Umbrales y Unidad */}
            <div className="border-t-2 border-black pt-1.5 flex items-center justify-between text-[10px] font-bold">
              <div>
                <span className="text-slate-600">PROV:</span>{' '}
                <span className="text-black uppercase">{producto.proveedor_principal}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>MÍN: {producto.stock_min}</span>
                <span>|</span>
                <span>MÁX: {producto.stock_max}</span>
                <span>|</span>
                <span className="bg-black text-white px-1.5 py-0.5 rounded font-mono">
                  {producto.unidad_medida}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions (Oculto al imprimir) */}
        <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-400 font-medium">
            Compatible con impresoras térmicas <strong>Zebra, Brother, Epson</strong> o papel normal.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
