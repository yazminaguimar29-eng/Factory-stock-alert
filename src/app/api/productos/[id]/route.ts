// ==========================================
// FACTORYSTOCK — API: PRODUCTO INDIVIDUAL (EDICIÓN / DESACTIVACIÓN)
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    if (session.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo el Administrador puede modificar productos.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const productoExistente = await dataStore.getProductoById(id);
    if (!productoExistente) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
    }

    // Si viene cambio de activo (desactivación/activación lógica)
    if (body.activo && (body.activo === 'SI' || body.activo === 'NO')) {
      const updated = await dataStore.toggleActivoProducto(id, body.activo);
      return NextResponse.json({
        success: true,
        producto: updated,
        message: body.activo === 'NO' ? 'Producto desactivado correctamente.' : 'Producto activado correctamente.',
      });
    }

    // Actualización completa de datos
    const actualizado = await dataStore.updateProducto({
      ...productoExistente,
      nombre: body.nombre ? body.nombre.trim() : productoExistente.nombre,
      categoria: body.categoria || productoExistente.categoria,
      descripcion: body.descripcion !== undefined ? body.descripcion.trim() : productoExistente.descripcion,
      unidad_medida: body.unidad_medida || productoExistente.unidad_medida,
      proveedor_principal: body.proveedor_principal !== undefined ? body.proveedor_principal.trim() : productoExistente.proveedor_principal,
      stock_min: body.stock_min !== undefined ? Number(body.stock_min) : productoExistente.stock_min,
      stock_max: body.stock_max !== undefined ? Number(body.stock_max) : productoExistente.stock_max,
      ubicacion_anaquel: body.ubicacion_anaquel ? body.ubicacion_anaquel.trim().toUpperCase() : productoExistente.ubicacion_anaquel,
      costo_unitario: body.costo_unitario !== undefined ? Number(body.costo_unitario) : productoExistente.costo_unitario,
      imagen_url: body.imagen_url !== undefined ? body.imagen_url : productoExistente.imagen_url,
    });

    return NextResponse.json({
      success: true,
      producto: actualizado,
      message: 'Producto actualizado exitosamente.',
    });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: error.message || 'No fue posible comunicarse con el servidor. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
