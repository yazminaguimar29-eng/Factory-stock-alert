'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Scan,
  Barcode,
  History,
  MapPin,
  Tag,
  ArrowRight,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Producto } from '@/types';
import { BarcodeScannerModal } from '@/components/scanner/BarcodeScannerModal';
import { ProductKardexModal } from '@/components/inventory/ProductKardexModal';
import { ProductLabelModal } from '@/components/inventory/ProductLabelModal';
import { useToast } from '@/components/ui/ToastContext';

interface HomeQuickSearchProps {
  productos: Producto[];
}

export function HomeQuickSearch({ productos }: HomeQuickSearchProps) {
  const [query, setQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedProdForKardex, setSelectedProdForKardex] = useState<Producto | null>(null);
  const [selectedProdForLabel, setSelectedProdForLabel] = useState<Producto | null>(null);

  const { showSuccess } = useToast();

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
      .slice(0, 6);
  }, [productos, query]);

  return (
    <div className="bg-slate-900/90 border border-violet-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Localizador Rápido de Material y Anaqueles</span>
          </h3>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Escribe el SKU o escanea con pistola/cámara para consultar stock, ubicación y Kardex
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition"
        >
          <Scan className="w-4 h-4 text-slate-950" />
          <span>Escanear Código / QR</span>
        </button>
      </div>

      {/* Input de búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe SKU (ej. 1138610), nombre de material (Harina, Dona, Tarima) o ubicación..."
          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 rounded-2xl text-sm font-medium text-white placeholder-slate-400 outline-none transition shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white font-bold bg-slate-800 px-2 py-0.5 rounded-lg"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Resultados de Búsqueda Rápida */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {results.map((p) => {
            const esCritico = p.stock_actual <= p.stock_min;
            const esSobrestock = p.stock_max > 0 && p.stock_actual >= p.stock_max;

            return (
              <div
                key={p.id}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl hover:border-violet-500/50 transition flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-black text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-600/40">
                      {p.codigo_sku}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                        esCritico
                          ? 'bg-rose-950 text-rose-300 border border-rose-600'
                          : esSobrestock
                          ? 'bg-amber-950 text-amber-300 border border-amber-600'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      }`}
                    >
                      {esCritico ? 'Stock Crítico' : esSobrestock ? 'Sobrestock' : 'Saludable'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm line-clamp-1">{p.nombre}</h4>
                  <p className="text-[11px] text-slate-400">{p.categoria}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">STOCK:</span>
                      <span className="font-mono font-black text-white text-sm">
                        {p.stock_actual}{' '}
                        <span className="text-[10px] font-normal text-slate-400">{p.unidad_medida}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">UBICACIÓN:</span>
                      <span className="font-mono font-black text-cyan-300 text-xs flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {p.ubicacion_anaquel || 'S/U'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedProdForKardex(p)}
                      title="Ver Kardex y Trazabilidad"
                      className="p-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Kardex</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProdForLabel(p)}
                      title="Imprimir Etiqueta con Código de Barras"
                      className="p-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-700/60 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href={`/salidas?sku=${p.codigo_sku}`}
                      title="Despachar Material"
                      className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs font-bold transition"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : query.trim() ? (
        <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
          No se encontraron materiales con ese SKU o nombre.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Accesos frecuentes:
          </span>
          {productos.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => setQuery(p.codigo_sku)}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 transition"
            >
              {p.codigo_sku}
            </button>
          ))}
        </div>
      )}

      {/* Modales */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        productos={productos}
        onProductScanned={(prod) => {
          setQuery(prod.codigo_sku);
          showSuccess(`Material localizado: ${prod.codigo_sku} - ${prod.nombre}`, 'Escaneo Exitoso');
        }}
        title="Localizar Material en Almacén"
      />

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
