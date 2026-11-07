// ==========================================
// FACTORYSTOCK — API: MOVIMIENTOS DE ALMACÉN
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
    const tipo = searchParams.get('tipo');
    const productoId = searchParams.get('producto_id');
    const area = searchParams.get('area');
    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');

    const productos = await dataStore.getProductos();
    let movimientos = await dataStore.getMovimientos();

    // Si es JEFE_AREA, solo puede consultar los movimientos correspondientes a su área asignada
    if (session.rol === 'JEFE_AREA') {
      movimientos = movimientos.filter((m) => 
        m.area_solicitante.toLowerCase().includes(session.area.toLowerCase()) ||
        m.responsable_recibe.toLowerCase().includes(session.nombre.toLowerCase())
      );
    }

    // Filtros opcionales
    if (tipo) {
      movimientos = movimientos.filter((m) => m.tipo === tipo);
    }
    if (productoId) {
      movimientos = movimientos.filter((m) => m.producto_id === productoId);
    }
    if (area) {
      movimientos = movimientos.filter((m) => m.area_solicitante.toLowerCase() === area.toLowerCase());
    }
    if (fechaInicio) {
      movimientos = movimientos.filter((m) => new Date(m.fecha) >= new Date(fechaInicio));
    }
    if (fechaFin) {
      const finDate = new Date(fechaFin);
      finDate.setHours(23, 59, 59, 999);
      movimientos = movimientos.filter((m) => new Date(m.fecha) <= finDate);
    }

    // Enriquecer con información de producto para visualización y reportes
    const movimientosEnriquecidos = movimientos.map((m) => {
      const prod = productos.find((p) => p.id === m.producto_id);
      return {
        ...m,
        producto_sku: prod?.codigo_sku || 'N/A',
        producto_nombre: prod?.nombre || 'Producto Desconocido',
        producto_categoria: prod?.categoria || 'Materia Prima',
        producto_unidad: prod?.unidad_medida || 'pza',
        ubicacion_anaquel: prod?.ubicacion_anaquel || 'N/A',
      };
    });

    return NextResponse.json({ movimientos: movimientosEnriquecidos });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
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

    const body = await request.json();
    const {
      tipo,
      producto_id,
      cantidad,
      no_factura_o_vale,
      area_solicitante,
      responsable_recibe,
      motivo_orden_trabajo,
      evidencia_foto,
    } = body;

    // Regla de permisos:
    // JEFE_AREA puede generar solicitudes/vales de salida y devoluciones para su línea.
    // Las entradas por compras de proveedor y los ajustes de auditoría son exclusivos de ADMIN y ALMACENISTA.
    if (session.rol === 'JEFE_AREA' && tipo !== 'SALIDA_VALE' && tipo !== 'DEVOLUCION') {
      return NextResponse.json(
        { error: 'Las compras de proveedor (Entradas) y ajustes de auditoría deben ser registradas por el personal de Almacén.' },
        { status: 403 }
      );
    }

    // Validar tipo
    const tiposPermitidos = ['ENTRADA_COMPRA', 'SALIDA_VALE', 'DEVOLUCION', 'AJUSTE'];
    if (!tiposPermitidos.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo de movimiento no válido. Permitidos: ${tiposPermitidos.join(', ')}` },
        { status: 400 }
      );
    }

    if (!producto_id || !cantidad || Number(cantidad) <= 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar un producto válido e ingresar una cantidad mayor a 0.' },
        { status: 400 }
      );
    }

    // Validaciones específicas según el tipo de movimiento
    if (tipo === 'ENTRADA_COMPRA' && !no_factura_o_vale?.trim()) {
      return NextResponse.json(
        { error: 'Debe ingresar el número de factura de compra para la entrada de material.' },
        { status: 400 }
      );
    }

    if (tipo === 'SALIDA_VALE') {
      if (!area_solicitante?.trim()) {
        return NextResponse.json(
          { error: 'Debe especificar el área solicitante de la planta.' },
          { status: 400 }
        );
      }
      if (!responsable_recibe?.trim()) {
        return NextResponse.json(
          { error: 'Debe indicar el nombre del responsable que recibe el material.' },
          { status: 400 }
        );
      }
      if (!motivo_orden_trabajo?.trim()) {
        return NextResponse.json(
          { error: 'Debe indicar el motivo o número de orden de trabajo (OT).' },
          { status: 400 }
        );
      }
    }

    // Usuario almacenista registrado automáticamente
    const usuarioAlmacenista = session.nombre || session.email;

    // Generar folio automático si no viene especificado
    let folioVale = (no_factura_o_vale || '').trim();
    if (tipo === 'SALIDA_VALE' && !folioVale) {
      folioVale = `VALE-${Date.now().toString().slice(-6)}`;
    } else if (tipo === 'DEVOLUCION' && !folioVale) {
      folioVale = `DEV-${Date.now().toString().slice(-6)}`;
    } else if (tipo === 'AJUSTE' && !folioVale) {
      folioVale = `AJU-${Date.now().toString().slice(-6)}`;
    }

    const resultado = await dataStore.registrarMovimiento({
      tipo,
      producto_id,
      cantidad: Number(cantidad),
      no_factura_o_vale: folioVale,
      area_solicitante: area_solicitante || 'Almacén Central',
      responsable_recibe: responsable_recibe || usuarioAlmacenista,
      motivo_orden_trabajo: motivo_orden_trabajo || 'Ajuste de inventario',
      usuario_almacenista: usuarioAlmacenista,
      evidencia_foto: evidencia_foto || undefined,
    });

    return NextResponse.json({
      success: true,
      movimiento: resultado.movimiento,
      nuevoStock: resultado.nuevoStock,
      ticket: resultado.ticket,
      message: 'Movimiento registrado exitosamente.',
    });
  } catch (error: any) {
    console.error('Error al registrar movimiento:', error);
    // Mensaje estricto de negocio solicitado por el usuario
    if (error.message?.includes('supera el inventario disponible')) {
      return NextResponse.json(
        { error: 'No es posible realizar la salida. La cantidad solicitada supera el inventario disponible.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'No fue posible registrar el movimiento.' },
      { status: 500 }
    );
  }
}
