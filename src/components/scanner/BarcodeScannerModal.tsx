'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Scan,
  X,
  AlertCircle,
  CheckCircle2,
  Barcode,
  Keyboard,
  Flashlight,
  RotateCw,
  Search,
} from 'lucide-react';
import { Producto } from '@/types';
import { playScanBeep } from '@/lib/sound';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productos: Producto[];
  onProductScanned: (producto: Producto) => void;
  title?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  productos,
  onProductScanned,
  title = 'Escáner de Código de Barras y QR',
}: BarcodeScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'gun'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const hardwareBarcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // Iniciar cámara al abrir modal en pestaña 'camera'
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function startCamera() {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('La cámara no es soportada en este navegador o entorno no seguro (requiere HTTPS o localhost).');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          startScanningLoop();
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error al iniciar cámara:', err);
          setCameraError(err.message || 'No se pudo acceder a la cámara del dispositivo.');
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Escaneo en bucle con BarcodeDetector si está disponible en el navegador
  const startScanningLoop = () => {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (!BarcodeDetectorClass) return;

    try {
      const detector = new BarcodeDetectorClass({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
      });

      const detectFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animationFrameId.current = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            handleCodeDetected(rawValue);
            return;
          }
        } catch (e) {
          // continuar escaneando
        }

        animationFrameId.current = requestAnimationFrame(detectFrame);
      };

      animationFrameId.current = requestAnimationFrame(detectFrame);
    } catch (e) {
      console.warn('BarcodeDetector no inicializable:', e);
    }
  };

  // Listener para pistola lectora USB / Bluetooth (emulación de teclado súper rápida)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // Si el evento viene de un input normal, dejamos escribir
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && (e.target as HTMLElement).id === 'manualInput') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCodeDetected(manualInput);
        }
        return;
      }

      if (e.key === 'Enter') {
        if (hardwareBarcodeBuffer.current.trim().length > 1) {
          e.preventDefault();
          const scanned = hardwareBarcodeBuffer.current.trim();
          hardwareBarcodeBuffer.current = '';
          handleCodeDetected(scanned);
        }
      } else if (e.key.length === 1) {
        // Si el tiempo entre teclas es muy corto (< 60ms), es una pistola lectora
        if (diff > 120) {
          hardwareBarcodeBuffer.current = e.key;
        } else {
          hardwareBarcodeBuffer.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, manualInput, productos]);

  const handleCodeDetected = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    setLastScannedResult(cleanCode);

    // Buscar en productos por SKU o por Nombre o ID
    const match = productos.find(
      (p) =>
        p.codigo_sku.toUpperCase() === cleanCode ||
        p.codigo_sku.toUpperCase().includes(cleanCode) ||
        p.nombre.toUpperCase().includes(cleanCode) ||
        p.id.toUpperCase() === cleanCode
    );

    if (match) {
      playScanBeep();
      setTimeout(() => {
        onProductScanned(match);
        onClose();
      }, 400);
    } else {
      playScanBeep();
    }
  };

  if (!isOpen) return null;

  const foundProduct = lastScannedResult
    ? productos.find(
        (p) =>
          p.codigo_sku.toUpperCase() === lastScannedResult ||
          p.codigo_sku.toUpperCase().includes(lastScannedResult) ||
          p.nombre.toUpperCase().includes(lastScannedResult)
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-cyan-500/50 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col relative text-white">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md shadow-cyan-500/30">
              <Scan className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wide text-white">
                {title}
              </h3>
              <p className="text-[11px] font-bold text-cyan-200">
                Pistola USB / Bluetooth o Cámara en Vivo
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

        {/* Tab Selector: Cámara vs Pistola USB / Teclado */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/40 border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === 'camera'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Cámara en Vivo</span>
          </button>
          <button
            onClick={() => setActiveTab('gun')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === 'gun'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Pistola USB / Manual</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'camera' ? (
            <div className="space-y-3">
              {/* Camera Viewfinder */}
              <div className="relative aspect-video sm:aspect-square max-h-72 w-full bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/40 flex items-center justify-center shadow-inner">
                {cameraError ? (
                  <div className="p-6 text-center space-y-2">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-200">{cameraError}</p>
                    <p className="text-[11px] text-slate-400">
                      Usa la pestaña de <strong>Pistola USB / Manual</strong> para ingresar el código o probar con el teclado.
                    </p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Visor Láser Industrial Animado */}
                    <div className="absolute inset-8 border-2 border-cyan-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                        <span className="w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
                      </div>
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent w-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                        <span className="w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-[11px] text-center text-slate-400 font-medium">
                Apunta la cámara al código de barras o QR de la caja o anaquel.
              </p>
            </div>
          ) : (
            /* Pistola USB / Lector Manual */
            <div className="space-y-4 py-2">
              <div className="p-4 bg-slate-950/70 border border-cyan-500/30 rounded-2xl space-y-2 text-center">
                <Barcode className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Listo para Pistola Lectora USB / Bluetooth
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apunta tu lector de mano al código de barras. El sistema lo capturará en automático al disparar.
                </p>
              </div>

              {/* Input manual rápido */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  O escribe / pega el código SKU:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="manualInput"
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Ej. 1138610, TAR-009, INS-006..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm font-mono text-white outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <button
                    onClick={() => handleCodeDetected(manualInput)}
                    className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* Sugerencias Rápidas de SKUs Populares */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Prueba rápida de SKUs en catálogo:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {productos.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleCodeDetected(p.codigo_sku)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-400/60 rounded-lg text-xs font-mono text-cyan-200 transition"
                    >
                      {p.codigo_sku}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resultado del Escaneo */}
          {lastScannedResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                foundProduct
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-500 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {foundProduct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="font-mono font-black">{lastScannedResult}</span>
                  <p className="text-[11px] font-medium text-slate-300">
                    {foundProduct
                      ? `${foundProduct.nombre} (Stock: ${foundProduct.stock_actual} ${foundProduct.unidad_medida})`
                      : 'No encontrado en el catálogo de almacén'}
                  </p>
                </div>
              </div>
              {foundProduct && (
                <button
                  onClick={() => {
                    onProductScanned(foundProduct);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow uppercase tracking-wider shrink-0"
                >
                  Seleccionar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </div>
  );
}
