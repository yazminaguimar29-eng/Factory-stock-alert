// ==========================================
// FACTORYSTOCK — DEFINICIONES DE TIPOS DE DATOS
// ==========================================

export type RolUsuario = 'ADMIN' | 'ALMACENISTA' | 'JEFE_AREA';

export type CategoriaProducto = 
  | 'Panadería Congelada (CA)' 
  | 'Mixes y Harinas (BG)' 
  | 'Icings y Coberturas (PA)' 
  | 'Materia Prima' 
  | 'Refacciones' 
  | 'Consumibles' 
  | 'Herramienta' 
  | 'EPP' 
  | string;

export type UnidadMedida = 'CA' | 'BG' | 'PA' | 'pza' | 'kg' | 'lt' | string;

export type EstadoActivo = 'SI' | 'NO';

export type TipoMovimiento = 
  | 'ENTRADA_COMPRA' 
  | 'SALIDA_VALE' 
  | 'DEVOLUCION' 
  | 'AJUSTE';

export type AreaSolicitante = 
  | 'Producción Línea 1' 
  | 'Producción Línea 2' 
  | 'Mantenimiento' 
  | 'Calidad' 
  | 'Embarques'
  | string;

export type TipoAlerta = 'STOCK_BAJO' | 'SOBRESTOCK';

export type EstadoStock = 'NORMAL' | 'CRITICO' | 'SOBRESTOCK';

// ------------------------------------------
// 1. PRODUCTO (Hoja: Productos)
// ------------------------------------------
export interface Producto {
  id: string;
  codigo_sku: string;
  nombre: string;
  categoria: CategoriaProducto;
  descripcion: string;
  unidad_medida: UnidadMedida;
  proveedor_principal: string;
  stock_actual: number;
  stock_min: number;
  stock_max: number;
  ubicacion_anaquel: string; // Formato A1-R2-N3
  costo_unitario: number;
  activo: EstadoActivo;
  imagen_url?: string; // URL o base64 de la foto del producto
}

// ------------------------------------------
// 2. MOVIMIENTO (Hoja: Movimientos)
// ------------------------------------------
export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  producto_id: string;
  cantidad: number;
  fecha: string; // ISO string o Formato fecha/hora legible
  no_factura_o_vale: string;
  area_solicitante: AreaSolicitante;
  responsable_recibe: string;
  motivo_orden_trabajo: string;
  usuario_almacenista: string;
  evidencia_foto?: string; // Foto de remisión, vale firmado o evidencia
}

export interface MovimientoConDetalle extends Movimiento {
  producto_sku?: string;
  producto_nombre?: string;
  producto_categoria?: CategoriaProducto;
  producto_unidad?: string;
  ubicacion_anaquel?: string;
}

// ------------------------------------------
// 3. USUARIO (Hoja: Usuarios)
// ------------------------------------------
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: RolUsuario;
  area: string;
  activo: EstadoActivo;
}

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  area: string;
}

// ------------------------------------------
// 4. ALERTA (Hoja: Alertas)
// ------------------------------------------
export interface Alerta {
  id: string;
  producto_id: string;
  tipo_alerta: TipoAlerta;
  fecha_generada: string;
  email_enviado_a: string;
  atendida: EstadoActivo;
}

export interface AlertaConDetalle extends Alerta {
  producto_sku?: string;
  producto_nombre?: string;
  stock_actual?: number;
  stock_min?: number;
  stock_max?: number;
  ubicacion_anaquel?: string;
}

// ------------------------------------------
// 5. TICKET / COMPROBANTE DE SALIDA
// ------------------------------------------
export interface TicketSalida {
  folio_vale: string;
  fecha: string;
  hora: string;
  producto_nombre: string;
  producto_sku: string;
  cantidad: number;
  unidad_medida: string;
  area_solicitante: string;
  responsable_recibe: string;
  motivo_orden_trabajo: string;
  usuario_almacenista: string;
  ubicacion_anaquel: string;
}

// ------------------------------------------
// 6. DASHBOARD METRICS
// ------------------------------------------
export interface DashboardMetricas {
  totalSkusActivos: number;
  totalStockCritico: number;
  totalSobrestock: number;
  valesHoy: number;
  alertasPendientes: number;
  productosCriticos: Producto[];
  productosSobrestock: Producto[];
  ultimosMovimientos: MovimientoConDetalle[];
}

// ------------------------------------------
// 7. BITÁCORA DE AUDITORÍA (Audit Log)
// ------------------------------------------
export type TipoAccionAuditoria = 
  | 'INICIO_SESION'
  | 'ENTRADA'
  | 'SALIDA'
  | 'DEVOLUCION'
  | 'AJUSTE'
  | 'ALTA_PRODUCTO'
  | 'EDICION_PRODUCTO'
  | 'ELIMINACION_PRODUCTO';

export interface BitacoraAuditoria {
  id: string;
  fecha: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: RolUsuario;
  tipo_accion: TipoAccionAuditoria;
  detalles: string;
  dispositivo?: string;
  ip?: string;
}

