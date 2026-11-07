'use client';

import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, X, RefreshCw, Eye, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { ImageModal } from './ImageModal';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  helpText?: string;
  sublabel?: string;
  compact?: boolean;
}

/**
 * Comprime una imagen en el cliente usando HTML5 Canvas antes de subirla.
 */
function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function PhotoUpload({
  value,
  onChange,
  label = 'Foto / Imagen',
  helpText,
  sublabel,
  compact = false,
}: PhotoUploadProps) {
  const effectiveHelpText = sublabel || helpText || 'Sube una foto desde tu equipo o toma una con la cámara (JPG, PNG, WebP)';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Comprimir en cliente
      const compressedDataUrl = await compressImage(file);

      // 2. Subir al servidor /api/upload
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedDataUrl, filename: file.name }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        // Fallback: si falla la ruta de servidor, usar el dataUrl comprimido directamente
        onChange(compressedDataUrl);
      }
    } catch (err: any) {
      console.error('Error al subir foto:', err);
      setError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        // Estado con Foto Cargada
        <div className="relative group rounded-xl border border-slate-700 bg-slate-950/80 p-2 flex items-center gap-3">
          <div
            className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 cursor-pointer shadow-md"
            onClick={() => setIsZoomOpen(true)}
            title="Ver en grande"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Eye className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Foto cargada con éxito</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
              {value.startsWith('data:') ? 'Imagen codificada lista' : value}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Cambiar</span>
              </button>
              <span className="text-slate-600">&bull;</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition"
              >
                <X className="w-3 h-3" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Estado sin Foto: Botón de Carga / Drag & Drop
        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
            loading
              ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300 cursor-wait'
              : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/50 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
          } ${compact ? 'p-3' : 'p-5'}`}
        >
          {loading ? (
            <div className="flex items-center gap-2 py-1">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">Procesando y subiendo foto...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                  <Camera className="w-4 h-4" />
                </span>
                <span className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                  <UploadCloud className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">
                Toca para subir foto o tomar con la cámara
              </p>
              {!compact && (
                <p className="text-[11px] text-slate-500 mt-0.5">{effectiveHelpText}</p>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 font-semibold mt-1">{error}</p>
      )}

      {/* Modal Zoom */}
      <ImageModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        imageUrl={value || null}
        title={label}
      />
    </div>
  );
}
