// ==========================================
// FACTORYSTOCK — API: BITÁCORA DE AUDITORÍA
// ==========================================
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dataStore } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo los administradores pueden consultar la bitácora
    if (session.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso restringido. Solo administradores pueden consultar la bitácora.' },
        { status: 403 }
      );
    }

    const logs = await dataStore.getAuditLogs();
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error('Error en /api/auditoria GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo_accion, detalles } = body;

    if (!tipo_accion || !detalles) {
      return NextResponse.json(
        { error: 'tipo_accion y detalles son requeridos' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || 'Dispositivo desconocido';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const log = await dataStore.appendAuditLog({
      usuario_nombre: session.nombre,
      usuario_email: session.email,
      usuario_rol: session.rol,
      tipo_accion,
      detalles,
      dispositivo: userAgent.slice(0, 80),
      ip,
    });

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    console.error('Error en /api/auditoria POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
