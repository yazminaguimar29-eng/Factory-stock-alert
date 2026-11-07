// ==========================================
// FACTORYSTOCK — API: PRODUCTOS (LISTADO Y CREACIÓN)
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('q') || '').toLowerCase().trim();
    const categoria = searchParams.get('categoria') || '';
    const soloActivos = searchParams.get('activos') !== 'false';

    let productos = await dataStore.getProductos();

    if (soloActivos && session.rol !== 'ADMIN') {
      productos = productos.filter((p) => p.activo === 'SI');
    }

    if (categoria) {
      productos = productos.filter((p) => p.categoria === categoria);
    }

    if (search) {
      productos = productos.filter(
        (p) =>
          p.codigo_sku.toLowerCase().includes(search) ||
          p.nombre.toLowerCase().includes(search) ||
          p.ubicacion_anaquel.toLowerCase().includes(search) ||
          p.proveedor_principal.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ productos });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'No fue posible comunicarse con el servidor. Intente nuevamente.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    // Regla de negocio: ADMIN y ALMACENISTA pueden registrar productos en catálogo
    if (session.rol !== 'ADMIN' && session.rol !== 'ALMACENISTA') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo el Administrador y Almacenista pueden registrar nuevos productos.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      codigo_sku,
      nombre,
      categoria,
      descripcion,
      unidad_medida,
      proveedor_principal,
      stock_actual,
      stock_min,
      stock_max,
      ubicacion_anaquel,
      costo_unitario,
      imagen_url,
    } = body;

    // Validaciones
    if (!codigo_sku || !nombre || !categoria || !unidad_medida || !ubicacion_anaquel) {
      return NextResponse.json(
        { error: 'Por favor complete todos los campos obligatorios del producto.' },
        { status: 400 }
      );
    }

    // Validar formato de ubicación física industrial (ej. A1-R2-N3)
    const ubicacionPattern = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i;
    if (!ubicacionPattern.test(ubicacion_anaquel.trim())) {
      return NextResponse.json(
        { error: 'El formato de ubicación física debe ser similar a A1-R2-N3 (Anaquel-Rack-Nivel).' },
        { status: 400 }
      );
    }

    const nuevoProducto = await dataStore.createProducto({
      codigo_sku: codigo_sku.trim().toUpperCase(),
      nombre: nombre.trim(),
      categoria,
      descripcion: descripcion ? descripcion.trim() : '',
      unidad_medida: unidad_medida.trim(),
      proveedor_principal: proveedor_principal ? proveedor_principal.trim() : '',
      stock_actual: Number(stock_actual) || 0,
      stock_min: Number(stock_min) || 0,
      stock_max: Number(stock_max) || 0,
      ubicacion_anaquel: ubicacion_anaquel.trim().toUpperCase(),
      costo_unitario: Number(costo_unitario) || 0,
      activo: 'SI',
      imagen_url: imagen_url ? imagen_url.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      producto: nuevoProducto,
      message: 'Producto registrado exitosamente.',
    });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    if (error.message?.includes('SKU ya existe')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || 'No fue posible comunicarse con el servidor. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
