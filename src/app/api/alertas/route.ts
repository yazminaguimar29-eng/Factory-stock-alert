// ==========================================
// FACTORYSTOCK — API: ALERTAS AUTOMÁTICAS
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const alertas = await dataStore.getAlertas();
    const productos = await dataStore.getProductos();

    // Enriquecer alerta con datos de producto
    const alertasConDetalle = alertas.map((a) => {
      const prod = productos.find((p) => p.id === a.producto_id);
      return {
        ...a,
        producto_sku: prod?.codigo_sku || 'N/A',
        producto_nombre: prod?.nombre || 'Producto Desconocido',
        stock_actual: prod?.stock_actual || 0,
        stock_min: prod?.stock_min || 0,
        stock_max: prod?.stock_max || 0,
        ubicacion_anaquel: prod?.ubicacion_anaquel || 'N/A',
      };
    });

    return NextResponse.json({ alertas: alertasConDetalle });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return NextResponse.json(
      { error: 'No fue posible comunicarse con el servidor. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
