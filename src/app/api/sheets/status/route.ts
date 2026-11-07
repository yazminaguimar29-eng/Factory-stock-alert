import { NextResponse } from 'next/server';
import { 
  getGoogleSheetsStatus, 
  ensureSheetStructure 
} from '@/lib/google-sheets';
import { dataStore } from '@/lib/data-store';

export async function GET() {
  try {
    const status = await getGoogleSheetsStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      {
        configured: false,
        error: error.message || 'Error al obtener estado de Google Sheets',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'sync';

    if (action === 'ensure_tabs') {
      const res = await ensureSheetStructure();
      return NextResponse.json({
        success: true,
        message: 'Estructura de hojas verificada con éxito.',
        createdTabs: res.createdTabs,
      });
    }

    // Sincronizar la versión local completa (Productos, Movimientos, Usuarios, Alertas) con Google Sheets en la nube
    const res = await dataStore.syncLocalToCloud();
    return NextResponse.json({
      success: true,
      message: 'Versión local sincronizada al 100% con Google Sheets en la nube.',
      seededProductos: res.syncedProductos,
      syncedProductos: res.syncedProductos,
      syncedMovimientos: res.syncedMovimientos,
      syncedUsuarios: res.syncedUsuarios,
      syncedAlertas: res.syncedAlertas,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al sincronizar con Google Sheets',
      },
      { status: 500 }
    );
  }
}
