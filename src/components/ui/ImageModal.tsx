'use client';

import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
}: ImageModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h3 className="text-sm font-bold text-white">
              {title || 'Visualizador de Imagen'}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={imageUrl}
              download={title ? `${title.replace(/\s+/g, '_')}.jpg` : 'foto.jpg'}
              className="p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-slate-800 transition"
              title="Descargar imagen"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Imagen central */}
        <div className="p-4 flex-1 flex items-center justify-center overflow-auto bg-slate-950/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title || 'Foto de evidencia'}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-slate-800/80"
          />
        </div>
      </div>
    </div>
  );
}
