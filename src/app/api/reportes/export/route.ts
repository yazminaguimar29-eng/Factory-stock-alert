// ==========================================
// FACTORYSTOCK — API: EXPORTACIÓN CSV
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

    if (session.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo el Administrador puede exportar reportes.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const area = searchParams.get('area');
    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');

    const productos = await dataStore.getProductos();
    let movimientos = await dataStore.getMovimientos();

    if (tipo) {
      movimientos = movimientos.filter((m) => m.tipo === tipo);
    }
    if (area) {
      movimientos = movimientos.filter((m) => m.area_solicitante.toLowerCase() === area.toLowerCase());
    }
    if (fechaInicio) {
      movimientos = movimientos.filter((m) => new Date(m.fecha) >= new Date(fechaInicio));
    }
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      movimientos = movimientos.filter((m) => new Date(m.fecha) <= fin);
    }

    // Cabeceras CSV
    const headers = [
      'Folio / ID',
      'Tipo de Movimiento',
      'SKU',
      'Material / Producto',
      'Categoría',
      'Cantidad',
      'Unidad',
      'Fecha y Hora',
      'No. Factura o Vale',
      'Área Solicitante',
      'Responsable Recibe',
      'Motivo / Orden de Trabajo (OT)',
      'Almacenista Responsable',
      'Ubicación Anaquel'
    ];

    const escapeCsv = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = movimientos.map((m) => {
      const prod = productos.find((p) => p.id === m.producto_id);
      return [
        escapeCsv(m.id),
        escapeCsv(m.tipo),
        escapeCsv(prod?.codigo_sku || 'N/A'),
        escapeCsv(prod?.nombre || 'Desconocido'),
        escapeCsv(prod?.categoria || 'N/A'),
        escapeCsv(m.cantidad),
        escapeCsv(prod?.unidad_medida || 'pza'),
        escapeCsv(new Date(m.fecha).toLocaleString('es-MX')),
        escapeCsv(m.no_factura_o_vale),
        escapeCsv(m.area_solicitante),
        escapeCsv(m.responsable_recibe),
        escapeCsv(m.motivo_orden_trabajo),
        escapeCsv(m.usuario_almacenista),
        escapeCsv(prod?.ubicacion_anaquel || 'N/A'),
      ].join(',');
    });

    // Añadimos UTF-8 BOM (\uFEFF) para compatibilidad nativa con Excel en español
    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');

    const filename = `FactoryStock_Movimientos_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return NextResponse.json(
      { error: 'No fue posible generar la exportación CSV.' },
      { status: 500 }
    );
  }
}
