// ==========================================
// FACTORYSTOCK — API: MÉTRICAS DE DASHBOARD
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

    const metricas = await dataStore.getDashboardMetricas();

    // Si es JEFE_AREA, filtrar los movimientos a los de su área
    if (session.rol === 'JEFE_AREA') {
      metricas.ultimosMovimientos = metricas.ultimosMovimientos.filter(
        (m) => m.area_solicitante.toLowerCase().includes(session.area.toLowerCase()) ||
               m.responsable_recibe.toLowerCase().includes(session.nombre.toLowerCase())
      );
    }

    return NextResponse.json(metricas);
  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    return NextResponse.json(
      { error: 'No fue posible comunicarse con el servidor. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
