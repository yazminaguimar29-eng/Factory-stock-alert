'use client';

// Evento global para sincronizar Dashboard, Home e Inventario en tiempo real sin recargar página
export const STOCK_SYNC_EVENT = 'factory_stock_updated';

export function notifyStockUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STOCK_SYNC_EVENT, { detail: { timestamp: Date.now() } }));
    // También soporte de BroadcastChannel para sincronizar entre pestañas abiertas del navegador
    try {
      const channel = new BroadcastChannel('factory_stock_channel');
      channel.postMessage({ type: STOCK_SYNC_EVENT, timestamp: Date.now() });
      channel.close();
    } catch {
      // BroadcastChannel no soportado en navegadores muy antiguos
    }
  }
}
