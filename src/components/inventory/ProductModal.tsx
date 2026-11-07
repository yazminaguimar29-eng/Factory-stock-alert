'use client';
 
import React, { useState, useEffect } from 'react';
import { X, PackagePlus, AlertCircle, Save } from 'lucide-react';
import { Producto, CategoriaProducto } from '@/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productoToEdit?: Producto | null;
  defaultCategoria?: CategoriaProducto;
  defaultUbicacion?: string;
}

const CATEGORIAS: CategoriaProducto[] = [
  'Panadería Congelada (CA)',
  'Mixes y Harinas (BG)',
  'Icings y Coberturas (PA)',
  'Materia Prima',
  'Consumibles',
];

const UNIDADES_MEDIDA = ['CA', 'BG', 'PA', 'pza', 'kg', 'lt', 'm'];

export function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  productoToEdit,
  defaultCategoria,
  defaultUbicacion,
}: ProductModalProps) {
  const isEditing = Boolean(productoToEdit);

  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto>('Materia Prima');
  const [descripcion, setDescripcion] = useState('');
  const [unidad, setUnidad] = useState('pza');
  const [proveedor, setProveedor] = useState('');
  const [stockActual, setStockActual] = useState('0');
  const [stockMin, setStockMin] = useState('10');
  const [stockMax, setStockMax] = useState('100');
  const [ubicacion, setUbicacion] = useState('A1-R1-N1');
  const [costoUnitario, setCostoUnitario] = useState('0');
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productoToEdit) {
      setSku(productoToEdit.codigo_sku);
      setNombre(productoToEdit.nombre);
      setCategoria(productoToEdit.categoria);
      setDescripcion(productoToEdit.descripcion);
      setUnidad(productoToEdit.unidad_medida);
      setProveedor(productoToEdit.proveedor_principal);
      setStockActual(String(productoToEdit.stock_actual));
      setStockMin(String(productoToEdit.stock_min));
      setStockMax(String(productoToEdit.stock_max));
      setUbicacion(productoToEdit.ubicacion_anaquel);
      setCostoUnitario(String(productoToEdit.costo_unitario));
      setImagenUrl(productoToEdit.imagen_url || null);
    } else {
      setSku('');
      setNombre('');
      setCategoria(defaultCategoria || 'Materia Prima');
      setDescripcion('');
      setUnidad('pza');
      setProveedor('');
      setStockActual('0');
      setStockMin('10');
      setStockMax('100');
      setUbicacion(defaultUbicacion || 'A1-R1-N1');
      setCostoUnitario('0');
      setImagenUrl(null);
    }
    setError(null);
  }, [productoToEdit, isOpen, defaultCategoria, defaultUbicacion]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        codigo_sku: sku.trim().toUpperCase(),
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim(),
        unidad_medida: unidad.trim(),
        proveedor_principal: proveedor.trim(),
        stock_actual: Number(stockActual) || 0,
        stock_min: Number(stockMin) || 0,
        stock_max: Number(stockMax) || 0,
        ubicacion_anaquel: ubicacion.trim().toUpperCase(),
        costo_unitario: Number(costoUnitario) || 0,
        imagen_url: imagenUrl || undefined,
      };

      const url = isEditing ? `/api/productos/${productoToEdit?.id}` : '/api/productos';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al guardar el producto.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl my-8 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? `Editar Producto — SKU ${productoToEdit?.codigo_sku}` : 'Registrar Nuevo Producto Industrial'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Actualice las especificaciones del material' : 'Incorpore un nuevo SKU al catálogo de almacén'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Código SKU <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="Ej. MP-001, REF-104"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-500 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-500">Debe ser único en el sistema.</span>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Categoría Industrial <span className="text-amber-400">*</span>
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaProducto)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Nombre del Producto / Material <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Lámina de acero galvanizado cal. 18"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Descripción Técnica
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Uso, especificaciones técnicas o características del material"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Unidad de medida */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Unidad de Medida <span className="text-amber-400">*</span>
              </label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {UNIDADES_MEDIDA.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Ubicación física */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Ubicación Física <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value.toUpperCase())}
                placeholder="A1-R2-N3"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500">Ejemplo: A1-R2-N3 (Anaquel-Rack-Nivel)</span>
            </div>

            {/* Proveedor principal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Proveedor Principal
              </label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Razón Social Proveedor"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Niveles de Stock */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              Parámetros de Stock y Alertas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {!isEditing && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-red-400 mb-1">
                  Stock Mínimo (Alerta Roja) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockMin}
                  onChange={(e) => setStockMin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-red-900/60 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                  Stock Máximo (Alerta Amarilla) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockMax}
                  onChange={(e) => setStockMax(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-amber-900/60 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Costo Unitario ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-lg shadow-amber-400/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
