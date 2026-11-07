// ==========================================
// FACTORYSTOCK — API: MARCAR ALERTA COMO ATENDIDA
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    if (session.rol === 'JEFE_AREA') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo Administrador y Almacén pueden gestionar alertas.' },
        { status: 403 }
      );
    }

    const { id } = params;
    await dataStore.marcarAlertaAtendida(id);

    return NextResponse.json({
      success: true,
      message: 'Alerta marcada como atendida exitosamente.',
    });
  } catch (error: any) {
    console.error('Error al atender alerta:', error);
    return NextResponse.json(
      { error: error.message || 'No fue posible actualizar la alerta.' },
      { status: 500 }
    );
  }
}
