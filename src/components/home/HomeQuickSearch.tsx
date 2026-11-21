'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  History,
  MapPin,
  Tag,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { Producto } from '@/types';
import { ProductKardexModal } from '@/components/inventory/ProductKardexModal';
import { ProductLabelModal } from '@/components/inventory/ProductLabelModal';

interface HomeQuickSearchProps {
  productos: Producto[];
}

export function HomeQuickSearch({ productos }: HomeQuickSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedProdForKardex, setSelectedProdForKardex] = useState<Producto | null>(null);
  const [selectedProdForLabel, setSelectedProdForLabel] = useState<Producto | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return productos
      .filter(
        (p) =>
          p.codigo_sku.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          p.ubicacion_anaquel.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [productos, query]);

  return (
    <div className="bg-slate-950/90 border-2 border-violet-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-violet-500/30 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            <span>Localizador Rápido de Material y Anaqueles</span>
          </h3>
          <p className="text-xs text-violet-200 font-bold mt-0.5">
            Escribe el SKU o nombre del material para consultar piezas en stock, capacidad máxima y ubicación física
          </p>
        </div>

        <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-400 self-start sm:self-auto shadow-sm">
          {productos.length} Materiales Catalogados
        </span>
      </div>

      {/* Input de búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por SKU (ej. 1138610), material (Harina, Tapa, Caja) o ubicación física..."
          className="w-full pl-11 pr-24 py-3.5 bg-slate-900 border-2 border-violet-400/60 focus:border-cyan-400 rounded-2xl text-sm font-bold text-white placeholder-violet-300/50 outline-none transition shadow-inner"
        />
        <Search className="w-5 h-5 text-cyan-400 absolute left-3.5 top-4" />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-3 text-xs text-slate-950 hover:text-black font-black bg-cyan-400 hover:bg-cyan-300 px-3 py-1 rounded-lg transition"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Resultados de Búsqueda Rápida */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {results.map((p) => {
            const esCritico = p.stock_actual <= p.stock_min;
            const esSobrestock = p.stock_max > 0 && p.stock_actual >= p.stock_max;
            const unidad = p.unidad_medida || 'pzas';
            const pct = p.stock_max > 0 ? Math.min(100, Math.round((p.stock_actual / p.stock_max) * 100)) : 0;

            return (
              <div
                key={p.id}
                className="p-4 bg-slate-900/95 border-2 border-violet-500/40 hover:border-cyan-400 rounded-2xl transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-md border border-amber-400">
                      SKU: {p.codigo_sku}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-md border ${
                        esCritico
                          ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-rose-950/60'
                          : esSobrestock
                          ? 'bg-amber-950 text-amber-300 border-amber-400'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-400'
                      }`}
                    >
                      {esCritico ? 'Stock Crítico' : esSobrestock ? 'Sobrestock' : 'Saludable'}
                    </span>
                  </div>

                  <h4 className="font-black text-white text-base line-clamp-1">{p.nombre}</h4>
                  <p className="text-xs font-semibold text-violet-300">{p.categoria}</p>
                </div>

                {/* Bloque de Existencias y Capacidad Máxima */}
                <div className="mt-3 pt-3 border-t-2 border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-cyan-300 block font-black uppercase tracking-wider">PIEZAS ACTUALES:</span>
                      <span className="font-mono font-black text-white text-base">
                        {p.stock_actual}{' '}
                        <span className="text-xs font-sans text-cyan-300 font-bold">{unidad}</span>
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-amber-400 block font-black uppercase tracking-wider">CAPACIDAD MÁXIMA:</span>
                      <span className="font-mono font-black text-amber-300 text-base">
                        {p.stock_max > 0 ? `${p.stock_max} ${unidad}` : 'Sin límite'}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso de capacidad */}
                  {p.stock_max > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] font-mono font-bold text-slate-300 mb-0.5">
                        <span>Ocupación de Anaquel ({pct}%)</span>
                        <span className="text-slate-400">Máx: {p.stock_max} {unidad}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            esCritico ? 'bg-rose-500' : esSobrestock ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs font-mono font-black text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{p.ubicacion_anaquel || 'S/U'}</span>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedProdForKardex(p)}
                        title="Ver Kardex y Trazabilidad"
                        className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500 text-indigo-300 hover:text-white rounded-lg text-xs font-black transition flex items-center gap-1 shadow"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Kardex</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedProdForLabel(p)}
                        title="Imprimir Etiqueta"
                        className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-500 text-amber-300 hover:text-white rounded-lg text-xs font-black transition flex items-center gap-1 shadow"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Etiqueta</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : query.trim().length > 0 ? (
        <div className="p-4 text-center text-xs font-bold text-violet-300 bg-slate-950/60 rounded-2xl border border-violet-500/20">
          No se encontraron materiales que coincidan con la búsqueda &quot;{query}&quot;.
        </div>
      ) : null}

      {/* Modales de Kardex y Etiqueta */}
      <ProductKardexModal
        isOpen={Boolean(selectedProdForKardex)}
        onClose={() => setSelectedProdForKardex(null)}
        producto={selectedProdForKardex}
      />

      <ProductLabelModal
        isOpen={Boolean(selectedProdForLabel)}
        onClose={() => setSelectedProdForLabel(null)}
        producto={selectedProdForLabel}
      />
    </div>
  );
}
