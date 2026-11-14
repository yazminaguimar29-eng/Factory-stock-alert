// ==========================================
// FACTORYSTOCK — ALMACÉN DE DATOS UNIFICADO
// ==========================================
// Integra Google Sheets como base de datos primaria
// y cuenta con fallback local con datos industriales para desarrollo y testing inmediato.

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  Producto, 
  Movimiento, 
  Usuario, 
  Alerta, 
  DashboardMetricas,
  TicketSalida,
  BitacoraAuditoria 
} from '@/types';
import {
  isGoogleSheetsConfigured,
  fetchProductosFromSheet,
  appendProductoToSheet,
  updateProductoInSheet,
  fetchMovimientosFromSheet,
  appendMovimientoToSheet,
  fetchUsuariosFromSheet,
  appendUsuarioToSheet,
  updateUsuarioPasswordInSheet,
  fetchAlertasFromSheet,
  appendAlertaToSheet,
  markAlertaAtendidaInSheet,
  syncLocalStateToSheet,
} from './google-sheets';
import { sendInventoryAlertEmail } from './email';

// Hashes precargados para contraseñas de demostración:
// admin123, almacen123, jefe123
const ADMIN_HASH = '$2a$10$w09ZlEfZkQ6H98kZJ9O5k.YmH07.kSj3H7L6e8kX4z3qF2J/2wB1q';
const ALMACEN_HASH = '$2a$10$w09ZlEfZkQ6H98kZJ9O5k.YmH07.kSj3H7L6e8kX4z3qF2J/2wB1q'; // para tests
const JEFE_HASH = '$2a$10$w09ZlEfZkQ6H98kZJ9O5k.YmH07.kSj3H7L6e8kX4z3qF2J/2wB1q';

// Datos industriales iniciales
export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Ing. Carlos Mendoza (Gerente)',
    email: 'admin@factorystock.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    rol: 'ADMIN',
    area: 'Gerencia de Planta',
    activo: 'SI',
  },
  {
    id: 'usr-2',
    nombre: 'Pedro Ramírez (Operador Almacén)',
    email: 'almacen@factorystock.com',
    password_hash: bcrypt.hashSync('almacen123', 10),
    rol: 'ALMACENISTA',
    area: 'Almacén Central',
    activo: 'SI',
  },
  {
    id: 'usr-3',
    nombre: 'Ing. Roberto Gómez',
    email: 'jefe.linea1@factorystock.com',
    password_hash: bcrypt.hashSync('jefe123', 10),
    rol: 'JEFE_AREA',
    area: 'Producción Línea 1',
    activo: 'SI',
  },
  {
    id: 'usr-4',
    nombre: 'Ing. Laura Torres',
    email: 'jefe.mantenimiento@factorystock.com',
    password_hash: bcrypt.hashSync('jefe123', 10),
    rol: 'JEFE_AREA',
    area: 'Mantenimiento',
    activo: 'SI',
  },
];

export const INITIAL_PRODUCTOS: Producto[] = [
  // -------------------------------------------------------------
  // GRUPO 1: PANADERÍA CONGELADA (CA - Cajas)
  // -------------------------------------------------------------
  {
    id: 'prod-3093719',
    codigo_sku: '3093719',
    nombre: 'DAWN ROSCA CAJETA CONG RTF 8 PC',
    categoria: 'Panadería Congelada (CA)',
    descripcion: 'Rosca de cajeta congelada RTF (Ready To Finish) 8 piezas por caja',
    unidad_medida: 'CA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 45,
    stock_min: 10,
    stock_max: 100,
    ubicacion_anaquel: 'CAM-A1-N1',
    costo_unitario: 320.00,
    activo: 'SI',
  },
  {
    id: 'prod-3093542',
    codigo_sku: '3093542',
    nombre: 'DAWN PANQUECITO LCH CNDSD RTF 48 PC',
    categoria: 'Panadería Congelada (CA)',
    descripcion: 'Panquecito sabor leche condensada RTF congelado 48 piezas por caja',
    unidad_medida: 'CA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 60,
    stock_min: 15,
    stock_max: 120,
    ubicacion_anaquel: 'CAM-A1-N2',
    costo_unitario: 285.00,
    activo: 'SI',
  },
  {
    id: 'prod-966062',
    codigo_sku: '966062',
    nombre: 'MULTIS MARMOLEADO CONG RTF 3 PC',
    categoria: 'Panadería Congelada (CA)',
    descripcion: 'Multi-panqué marmoleado congelado RTF 3 piezas por caja',
    unidad_medida: 'CA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 28,
    stock_min: 8,
    stock_max: 60,
    ubicacion_anaquel: 'CAM-A2-N1',
    costo_unitario: 195.00,
    activo: 'SI',
  },
  {
    id: 'prod-1175703',
    codigo_sku: '1175703',
    nombre: 'PANQUE MARM CASERO CONG RTS 14 PC',
    categoria: 'Panadería Congelada (CA)',
    descripcion: 'Panqué marmoleado casero congelado RTS (Ready To Serve) 14 piezas por caja',
    unidad_medida: 'CA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 34,
    stock_min: 10,
    stock_max: 70,
    ubicacion_anaquel: 'CAM-A2-N2',
    costo_unitario: 340.00,
    activo: 'SI',
  },
  {
    id: 'prod-3096055',
    codigo_sku: '3096055',
    nombre: 'DAWN DONA LEV FRITA G RTF 80 PC',
    categoria: 'Panadería Congelada (CA)',
    descripcion: 'Dona de levadura frita grande congelada RTF 80 piezas por caja',
    unidad_medida: 'CA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 40,
    stock_min: 12,
    stock_max: 90,
    ubicacion_anaquel: 'CAM-A3-N1',
    costo_unitario: 410.00,
    activo: 'SI',
  },

  // -------------------------------------------------------------
  // GRUPO 2: MIXES Y HARINAS (BG - Bultos)
  // -------------------------------------------------------------
  {
    id: 'prod-1138610',
    codigo_sku: '1138610',
    nombre: 'MIX PASTEL DE ZANAHORIA 20 KG',
    categoria: 'Mixes y Harinas (BG)',
    descripcion: 'Mezcla preparada en polvo para pastel de zanahoria bulto de 20 kg',
    unidad_medida: 'BG',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 55,
    stock_min: 15,
    stock_max: 100,
    ubicacion_anaquel: 'HAR-B1-N1',
    costo_unitario: 850.00,
    activo: 'SI',
  },
  {
    id: 'prod-444208',
    codigo_sku: '444208',
    nombre: 'DAWN 8010 PAN DE PULQUE 20 KG',
    categoria: 'Mixes y Harinas (BG)',
    descripcion: 'Mix Dawn 8010 para pan de pulque artesanal bulto de 20 kg',
    unidad_medida: 'BG',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 8, // En stock crítico inicial (<= min 10)
    stock_min: 10,
    stock_max: 40,
    ubicacion_anaquel: 'HAR-B1-N2',
    costo_unitario: 890.00,
    activo: 'SI',
  },
  {
    id: 'prod-1267493',
    codigo_sku: '1267493',
    nombre: 'BISQUETE CASERO 20 KG',
    categoria: 'Mixes y Harinas (BG)',
    descripcion: 'Mix completo para elaboración de bisquete casero bulto de 20 kg',
    unidad_medida: 'BG',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 65,
    stock_min: 20,
    stock_max: 120,
    ubicacion_anaquel: 'HAR-B2-N1',
    costo_unitario: 780.00,
    activo: 'SI',
  },

  // -------------------------------------------------------------
  // GRUPO 3: ICINGS Y COBERTURAS (PA - Cubetas)
  // -------------------------------------------------------------
  {
    id: 'prod-979552',
    codigo_sku: '979552',
    nombre: 'DAWN WHITE FLAT ICING MXCO 19.5 KG',
    categoria: 'Icings y Coberturas (PA)',
    descripcion: 'Glaseado blanco plano Dawn White Flat Icing cubeta industrial 19.5 kg',
    unidad_medida: 'PA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 35,
    stock_min: 10,
    stock_max: 70,
    ubicacion_anaquel: 'CUB-C1-N1',
    costo_unitario: 1150.00,
    activo: 'SI',
  },
  {
    id: 'prod-3038963',
    codigo_sku: '3038963',
    nombre: 'DAWN CINNAMON SPREAD MEXICO 8.62 KG',
    categoria: 'Icings y Coberturas (PA)',
    descripcion: 'Relleno untable sabor canela Dawn Cinnamon Spread cubeta 8.62 kg',
    unidad_medida: 'PA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 18,
    stock_min: 6,
    stock_max: 40,
    ubicacion_anaquel: 'CUB-C1-N2',
    costo_unitario: 620.00,
    activo: 'SI',
  },
  {
    id: 'prod-979544',
    codigo_sku: '979544',
    nombre: 'DAWN ART FLV MPL DNT ICG MXCO 19.5 KG',
    categoria: 'Icings y Coberturas (PA)',
    descripcion: 'Glaseado artificial sabor maple para dona Dawn Maple cubeta 19.5 kg',
    unidad_medida: 'PA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 42,
    stock_min: 10,
    stock_max: 80,
    ubicacion_anaquel: 'CUB-C2-N1',
    costo_unitario: 1190.00,
    activo: 'SI',
  },
  {
    id: 'prod-900101',
    codigo_sku: '900101',
    nombre: 'DAWN CRMCHS ICG MXCO 8.16 KG',
    categoria: 'Icings y Coberturas (PA)',
    descripcion: 'Glaseado con queso crema Dawn Cream Cheese Icing cubeta 8.16 kg',
    unidad_medida: 'PA',
    proveedor_principal: 'Dawn Food Products México',
    stock_actual: 14,
    stock_min: 8,
    stock_max: 35,
    ubicacion_anaquel: 'CUB-C2-N2',
    costo_unitario: 740.00,
    activo: 'SI',
  },

  // -------------------------------------------------------------
  // GRUPO 4: CONSUMIBLES E INSUMOS DE EMPAQUE / EMBARQUES
  // -------------------------------------------------------------
  {
    id: 'prod-ins-001',
    codigo_sku: 'INS-001',
    nombre: 'SLIP SHEET',
    categoria: 'Consumibles',
    descripcion: 'Hoja deslizante (Slip Sheet) para manejo y estiba de carga',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 1000,
    stock_min: 500,
    stock_max: 2000,
    ubicacion_anaquel: 'EMP-D1-N1',
    costo_unitario: 45.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-002',
    codigo_sku: 'INS-002',
    nombre: 'TARIMAS PLASTICA (LETY)',
    categoria: 'Consumibles',
    descripcion: 'Tarima plástica industrial para línea Lety',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 1,
    stock_min: 25,
    stock_max: 100,
    ubicacion_anaquel: 'TAR-E1-N1',
    costo_unitario: 480.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-003',
    codigo_sku: 'INS-003',
    nombre: 'ESQUINEROS 3X3X1.50',
    categoria: 'Consumibles',
    descripcion: 'Esquinero protector de cartón rígido medida 3x3x1.50 m',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 0,
    stock_min: 500,
    stock_max: 1500,
    ubicacion_anaquel: 'ESQ-D2-N1',
    costo_unitario: 12.50,
    activo: 'SI',
  },
  {
    id: 'prod-ins-004',
    codigo_sku: 'INS-004',
    nombre: 'ESQUINEROS 3X3X1.14',
    categoria: 'Consumibles',
    descripcion: 'Esquinero protector de cartón rígido medida 3x3x1.14 m',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 960,
    stock_min: 500,
    stock_max: 1500,
    ubicacion_anaquel: 'ESQ-D2-N2',
    costo_unitario: 10.50,
    activo: 'SI',
  },
  {
    id: 'prod-ins-005',
    codigo_sku: 'INS-005',
    nombre: 'ESQUINEROS 3X3X1.72',
    categoria: 'Consumibles',
    descripcion: 'Esquinero protector de cartón rígido medida 3x3x1.72 m',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 760,
    stock_min: 500,
    stock_max: 1500,
    ubicacion_anaquel: 'ESQ-D2-N3',
    costo_unitario: 14.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-006',
    codigo_sku: 'INS-006',
    nombre: 'TARIMAS BLANCAS',
    categoria: 'Consumibles',
    descripcion: 'Tarima de madera blanca estándar para almacén y embarques',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 118,
    stock_min: 50,
    stock_max: 300,
    ubicacion_anaquel: 'TAR-E1-N2',
    costo_unitario: 220.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-007',
    codigo_sku: 'INS-007',
    nombre: 'TARIMAS EXPORTACION',
    categoria: 'Consumibles',
    descripcion: 'Tarima tratada térmicamente para embarques de exportación',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 291,
    stock_min: 5,
    stock_max: 500,
    ubicacion_anaquel: 'TAR-E1-N3',
    costo_unitario: 290.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-008',
    codigo_sku: 'INS-008',
    nombre: 'TARIMAS CUBO',
    categoria: 'Consumibles',
    descripcion: 'Tarima tipo cubo de alta resistencia',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 0,
    stock_min: 30,
    stock_max: 100,
    ubicacion_anaquel: 'TAR-E2-N1',
    costo_unitario: 310.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-009',
    codigo_sku: 'INS-009',
    nombre: 'TARIMAS CHEP',
    categoria: 'Consumibles',
    descripcion: 'Tarima azul CHEP para logística y distribución',
    unidad_medida: 'pza',
    proveedor_principal: 'CHEP México',
    stock_actual: 3249,
    stock_min: 150,
    stock_max: 4000,
    ubicacion_anaquel: 'TAR-E2-N2',
    costo_unitario: 350.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-010',
    codigo_sku: 'INS-010',
    nombre: 'EMPLAYERS',
    categoria: 'Consumibles',
    descripcion: 'Rollo de película estirable (playo / stretch film) transparente',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 733,
    stock_min: 40,
    stock_max: 1000,
    ubicacion_anaquel: 'EMP-D1-N2',
    costo_unitario: 185.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-011',
    codigo_sku: 'INS-011',
    nombre: 'EMPLAYERS (AZUL)',
    categoria: 'Consumibles',
    descripcion: 'Rollo de película estirable (playo / stretch film) color azul',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 0,
    stock_min: 40,
    stock_max: 200,
    ubicacion_anaquel: 'EMP-D1-N3',
    costo_unitario: 195.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-012',
    codigo_sku: 'INS-012',
    nombre: 'CAJAS DE HOJAS DE MAQUINA',
    categoria: 'Consumibles',
    descripcion: 'Caja de papel bond blanco tamaño carta para impresión de vales y remisiones',
    unidad_medida: 'CA',
    proveedor_principal: 'Papelería Industrial',
    stock_actual: 10,
    stock_min: 2,
    stock_max: 30,
    ubicacion_anaquel: 'EMP-D3-N1',
    costo_unitario: 680.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-013',
    codigo_sku: 'INS-013',
    nombre: 'BOLSAS DE SELLOS',
    categoria: 'Consumibles',
    descripcion: 'Bolsa de sellos de seguridad para cierre de unidades y embarques',
    unidad_medida: 'pza',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 23,
    stock_min: 0,
    stock_max: 100,
    ubicacion_anaquel: 'EMP-D3-N2',
    costo_unitario: 250.00,
    activo: 'SI',
  },
  {
    id: 'prod-ins-014',
    codigo_sku: 'INS-014',
    nombre: 'CAJAS DE CONOS',
    categoria: 'Consumibles',
    descripcion: 'Caja de conos para empaque y soporte de materiales',
    unidad_medida: 'CA',
    proveedor_principal: 'Insumos y Empaques Industriales',
    stock_actual: 0,
    stock_min: 5,
    stock_max: 30,
    ubicacion_anaquel: 'EMP-D3-N3',
    costo_unitario: 420.00,
    activo: 'SI',
  },
];

const INITIAL_MOVIMIENTOS: Movimiento[] = [
  {
    id: 'mov-1',
    tipo: 'ENTRADA_COMPRA',
    producto_id: 'prod-1138610',
    cantidad: 50,
    fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
    no_factura_o_vale: 'FAC-DAWN-8891',
    area_solicitante: 'Almacén Central',
    responsable_recibe: 'Pedro Ramírez',
    motivo_orden_trabajo: 'Recepcion lote de mixes harinas Dawn 20KG',
    usuario_almacenista: 'Pedro Ramírez',
  },
  {
    id: 'mov-2',
    tipo: 'SALIDA_VALE',
    producto_id: 'prod-3093719',
    cantidad: 5,
    fecha: new Date(Date.now() - 86400000).toISOString(),
    no_factura_o_vale: 'VALE-1001',
    area_solicitante: 'Producción Línea 1',
    responsable_recibe: 'Juan Pérez',
    motivo_orden_trabajo: 'OT-1025 Panadería Horneado',
    usuario_almacenista: 'Pedro Ramírez',
  },
  {
    id: 'mov-3',
    tipo: 'SALIDA_VALE',
    producto_id: 'prod-979552',
    cantidad: 3,
    fecha: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    no_factura_o_vale: 'VALE-1002',
    area_solicitante: 'Producción Línea 2',
    responsable_recibe: 'Ing. Roberto Gómez',
    motivo_orden_trabajo: 'OT-1028 Cobertura y Decorado',
    usuario_almacenista: 'Pedro Ramírez',
  }
];

const INITIAL_ALERTAS: Alerta[] = [
  {
    id: 'alt-1',
    producto_id: 'prod-444208',
    tipo_alerta: 'STOCK_BAJO',
    fecha_generada: new Date().toISOString(),
    email_enviado_a: 'admin@factorystock.com, compras@factorystock.com',
    atendida: 'NO',
  },
  {
    id: 'alt-ins-002',
    producto_id: 'prod-ins-002',
    tipo_alerta: 'STOCK_BAJO',
    fecha_generada: new Date().toISOString(),
    email_enviado_a: 'admin@factorystock.com, compras@factorystock.com',
    atendida: 'NO',
  },
  {
    id: 'alt-ins-003',
    producto_id: 'prod-ins-003',
    tipo_alerta: 'STOCK_BAJO',
    fecha_generada: new Date().toISOString(),
    email_enviado_a: 'admin@factorystock.com, compras@factorystock.com',
    atendida: 'NO',
  },
  {
    id: 'alt-ins-008',
    producto_id: 'prod-ins-008',
    tipo_alerta: 'STOCK_BAJO',
    fecha_generada: new Date().toISOString(),
    email_enviado_a: 'admin@factorystock.com, compras@factorystock.com',
    atendida: 'NO',
  },
  {
    id: 'alt-ins-011',
    producto_id: 'prod-ins-011',
    tipo_alerta: 'STOCK_BAJO',
    fecha_generada: new Date().toISOString(),
    email_enviado_a: 'admin@factorystock.com, compras@factorystock.com',
    atendida: 'NO',
  },
  {
    id: 'alt-ins-014',
    producto_id: 'prod-ins-014',
    tipo_alerta: 'STOCK_BAJO',
    fecha_generada: new Date().toISOString(),
    email_enviado_a: 'admin@factorystock.com, compras@factorystock.com',
    atendida: 'NO',
  },
];

const INITIAL_AUDIT_LOGS: BitacoraAuditoria[] = [
  {
    id: 'aud-1',
    fecha: new Date(Date.now() - 3600000 * 5).toISOString(),
    usuario_nombre: 'Ing. Carlos Mendoza (Gerente)',
    usuario_email: 'admin@factorystock.com',
    usuario_rol: 'ADMIN',
    tipo_accion: 'INICIO_SESION',
    detalles: 'Acceso seguro al panel de control desde navegador de estación',
    dispositivo: 'Windows 11 / Chrome Desktop',
    ip: '192.168.1.45',
  },
  {
    id: 'aud-2',
    fecha: new Date(Date.now() - 3600000 * 4).toISOString(),
    usuario_nombre: 'Pedro Ramírez (Operador Almacén)',
    usuario_email: 'almacen@factorystock.com',
    usuario_rol: 'ALMACENISTA',
    tipo_accion: 'ENTRADA',
    detalles: 'Recepción de compra FAC-DAWN-8891 (+50 CA HARINA DAWN)',
    dispositivo: 'Terminal Zebra Almacén 01',
    ip: '192.168.1.112',
  },
  {
    id: 'aud-3',
    fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
    usuario_nombre: 'Pedro Ramírez (Operador Almacén)',
    usuario_email: 'almacen@factorystock.com',
    usuario_rol: 'ALMACENISTA',
    tipo_accion: 'SALIDA',
    detalles: 'Surtido vale VALE-1001 (-5 CA) a Producción Línea 1',
    dispositivo: 'Terminal Zebra Almacén 01',
    ip: '192.168.1.112',
  },
];

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'local-db.json');

interface LocalDatabaseSchema {
  productos: Producto[];
  movimientos: Movimiento[];
  usuarios: Usuario[];
  alertas: Alerta[];
  audit_logs?: BitacoraAuditoria[];
}

// Almacén persistente local en disco (data/local-db.json) y memoria
class DataStore {
  private static instance: DataStore;
  private localProductos: Producto[] = [...INITIAL_PRODUCTOS];
  private localMovimientos: Movimiento[] = [...INITIAL_MOVIMIENTOS];
  private localUsuarios: Usuario[] = [...INITIAL_USUARIOS];
  private localAlertas: Alerta[] = [...INITIAL_ALERTAS];
  private localAuditLogs: BitacoraAuditoria[] = [...INITIAL_AUDIT_LOGS];

  private constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const data: LocalDatabaseSchema = JSON.parse(raw);
        if (Array.isArray(data.productos) && data.productos.length > 0) {
          this.localProductos = data.productos;
        }
        if (Array.isArray(data.movimientos)) {
          this.localMovimientos = data.movimientos;
        }
        if (Array.isArray(data.usuarios) && data.usuarios.length > 0) {
          this.localUsuarios = data.usuarios;
        }
        if (Array.isArray(data.alertas)) {
          this.localAlertas = data.alertas;
        }
        if (Array.isArray(data.audit_logs) && data.audit_logs.length > 0) {
          this.localAuditLogs = data.audit_logs;
        }
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.error('[Local DB] Error al leer base de datos local:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: LocalDatabaseSchema = {
        productos: this.localProductos,
        movimientos: this.localMovimientos,
        usuarios: this.localUsuarios,
        alertas: this.localAlertas,
        audit_logs: this.localAuditLogs,
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Local DB] Error al guardar base de datos local en disco:', err);
    }
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  /**
   * Sincroniza el estado local completo (data/local-db.json) con Google Sheets en la nube.
   */
  public async syncLocalToCloud() {
    this.loadFromDisk();
    return await syncLocalStateToSheet(
      this.localProductos,
      this.localMovimientos,
      this.localUsuarios,
      this.localAlertas
    );
  }

  // ==========================================
  // PRODUCTOS
  // ==========================================

  public async getProductos(): Promise<Producto[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        const sheetProds = await fetchProductosFromSheet();
        if (sheetProds.length === 0 && this.localProductos.length > 0) {
          await this.syncLocalToCloud();
          return this.localProductos;
        }
        return sheetProds;
      } catch (err) {
        console.error('[Google Sheets] Error al leer productos, usando fallback local:', err);
      }
    }
    return this.localProductos;
  }

  public async getProductoById(id: string): Promise<Producto | null> {
    const prods = await this.getProductos();
    return prods.find((p) => p.id === id) || null;
  }

  public async getProductoBySku(sku: string): Promise<Producto | null> {
    const prods = await this.getProductos();
    const cleanSku = sku.trim().toUpperCase();
    return prods.find((p) => p.codigo_sku.trim().toUpperCase() === cleanSku) || null;
  }

  public async createProducto(p: Omit<Producto, 'id'>): Promise<Producto> {
    const existing = await this.getProductoBySku(p.codigo_sku);
    if (existing) {
      throw new Error(`El código SKU ya existe. Ingrese un SKU diferente.`);
    }

    const nuevoProducto: Producto = {
      ...p,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      codigo_sku: p.codigo_sku.trim().toUpperCase(),
      stock_actual: Number(p.stock_actual) || 0,
      stock_min: Number(p.stock_min) || 0,
      stock_max: Number(p.stock_max) || 0,
      costo_unitario: Number(p.costo_unitario) || 0,
      activo: p.activo || 'SI',
      imagen_url: p.imagen_url ? p.imagen_url.trim() : undefined,
    };

    if (isGoogleSheetsConfigured()) {
      try {
        await appendProductoToSheet(nuevoProducto);
      } catch (err) {
        console.error('[Google Sheets] Error al crear producto en sheet:', err);
      }
    }

    this.localProductos.push(nuevoProducto);
    this.saveToDisk();
    await this.verificarAlertasProducto(nuevoProducto);
    return nuevoProducto;
  }

  public async updateProducto(p: Producto): Promise<Producto> {
    const existingSku = await this.getProductoBySku(p.codigo_sku);
    if (existingSku && existingSku.id !== p.id) {
      throw new Error(`El código SKU ya existe. Ingrese un SKU diferente.`);
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await updateProductoInSheet(p);
      } catch (err) {
        console.error('[Google Sheets] Error al actualizar producto en sheet:', err);
      }
    }

    const index = this.localProductos.findIndex((item) => item.id === p.id);
    if (index !== -1) {
      this.localProductos[index] = p;
      this.saveToDisk();
    }

    await this.verificarAlertasProducto(p);
    return p;
  }

  public async toggleActivoProducto(id: string, activo: 'SI' | 'NO'): Promise<Producto> {
    const prod = await this.getProductoById(id);
    if (!prod) {
      throw new Error('Producto no encontrado.');
    }

    // Regla de negocio: No borrar productos, solo desactivar mediante activo = NO
    prod.activo = activo;
    return this.updateProducto(prod);
  }

  // ==========================================
  // MOVIMIENTOS
  // ==========================================

  public async getMovimientos(): Promise<Movimiento[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        const sheetMovs = await fetchMovimientosFromSheet();
        return [...sheetMovs]
          .reverse()
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      } catch (err) {
        console.error('[Google Sheets] Error al leer movimientos, usando fallback local:', err);
      }
    }
    // Retornar en orden cronológico descendente (los más recientes primero)
    return [...this.localMovimientos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  public async registrarMovimiento(params: {
    tipo: Movimiento['tipo'];
    producto_id: string;
    cantidad: number;
    no_factura_o_vale: string;
    area_solicitante: string;
    responsable_recibe: string;
    motivo_orden_trabajo: string;
    usuario_almacenista: string;
    evidencia_foto?: string;
  }): Promise<{ movimiento: Movimiento; nuevoStock: number; ticket?: TicketSalida }> {
    const prod = await this.getProductoById(params.producto_id);
    if (!prod) {
      throw new Error('El producto seleccionado no existe o está inactivo.');
    }

    const cantidad = Number(params.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número mayor a cero.');
    }

    let nuevoStock = prod.stock_actual;

    switch (params.tipo) {
      case 'ENTRADA_COMPRA':
      case 'DEVOLUCION':
        nuevoStock += cantidad;
        break;

      case 'SALIDA_VALE':
        // Regla obligatoria: Prohibido stock negativo
        if (cantidad > prod.stock_actual) {
          throw new Error('No es posible realizar la salida. La cantidad solicitada supera el inventario disponible.');
        }
        nuevoStock -= cantidad;
        break;

      case 'AJUSTE':
        // En ajuste, la cantidad puede ser positiva o sustitutiva, aquí manejamos ajuste absoluto o delta
        // Tratamos cantidad como nuevo stock si es ajuste absoluto o ajuste directo
        nuevoStock = cantidad;
        break;

      default:
        throw new Error(`Tipo de movimiento no permitido: ${params.tipo}`);
    }

    const fechaHora = new Date();
    const movimiento: Movimiento = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tipo: params.tipo,
      producto_id: prod.id,
      cantidad,
      fecha: fechaHora.toISOString(),
      no_factura_o_vale: params.no_factura_o_vale.trim(),
      area_solicitante: params.area_solicitante.trim(),
      responsable_recibe: params.responsable_recibe.trim(),
      motivo_orden_trabajo: params.motivo_orden_trabajo.trim(),
      usuario_almacenista: params.usuario_almacenista.trim(),
      evidencia_foto: params.evidencia_foto ? params.evidencia_foto.trim() : undefined,
    };

    // Actualizar producto
    prod.stock_actual = nuevoStock;
    await this.updateProducto(prod);

    // Guardar movimiento
    if (isGoogleSheetsConfigured()) {
      try {
        await appendMovimientoToSheet(movimiento);
      } catch (err) {
        console.error('[Google Sheets] Error al guardar movimiento:', err);
      }
    }
    this.localMovimientos.unshift(movimiento);
    this.saveToDisk();

    // Generar ticket si es SALIDA_VALE
    let ticket: TicketSalida | undefined = undefined;
    if (params.tipo === 'SALIDA_VALE') {
      ticket = {
        folio_vale: movimiento.no_factura_o_vale,
        fecha: fechaHora.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        hora: fechaHora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        producto_nombre: prod.nombre,
        producto_sku: prod.codigo_sku,
        cantidad,
        unidad_medida: prod.unidad_medida,
        area_solicitante: movimiento.area_solicitante,
        responsable_recibe: movimiento.responsable_recibe,
        motivo_orden_trabajo: movimiento.motivo_orden_trabajo,
        usuario_almacenista: movimiento.usuario_almacenista,
        ubicacion_anaquel: prod.ubicacion_anaquel,
      };
    }

    // Evaluar alertas automáticas
    await this.verificarAlertasProducto(prod);

    return { movimiento, nuevoStock, ticket };
  }

  // ==========================================
  // ALERTAS AUTOMÁTICAS Y CONTROL DE SPAM
  // ==========================================

  public async getAlertas(): Promise<Alerta[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        return await fetchAlertasFromSheet();
      } catch (err) {
        console.error('[Google Sheets] Error al leer alertas, usando fallback local:', err);
      }
    }
    return [...this.localAlertas].sort((a, b) => new Date(b.fecha_generada).getTime() - new Date(a.fecha_generada).getTime());
  }

  public async marcarAlertaAtendida(id: string): Promise<void> {
    if (isGoogleSheetsConfigured()) {
      try {
        await markAlertaAtendidaInSheet(id);
      } catch (err) {
        console.error('[Google Sheets] Error al marcar alerta atendida:', err);
      }
    }

    const alerta = this.localAlertas.find((a) => a.id === id);
    if (alerta) {
      alerta.atendida = 'SI';
    }
  }

  /**
   * Evalúa si un producto entra en estado de Alerta Roja o Amarilla.
   * Aplica deduplicación: NO envía correos ni crea registros repetidos si ya existe
   * una alerta pendiente (atendida = 'NO') para ese producto y tipo.
   */
  public async verificarAlertasProducto(prod: Producto): Promise<void> {
    // Si el producto no está activo, no genera alertas
    if (prod.activo === 'NO') return;

    const alertasActuales = await this.getAlertas();

    // 1. ALERTA ROJA — STOCK BAJO (stock_actual <= stock_min)
    if (prod.stock_actual <= prod.stock_min) {
      const alertaActivaExistente = alertasActuales.find(
        (a) => a.producto_id === prod.id && a.tipo_alerta === 'STOCK_BAJO' && a.atendida === 'NO'
      );

      // Si no hay una alerta abierta activa, se genera una nueva y se notifica
      if (!alertaActivaExistente) {
        const resultadoEmail = await sendInventoryAlertEmail({
          producto: prod,
          tipoAlerta: 'STOCK_BAJO',
        });

        const nuevaAlerta: Alerta = {
          id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          producto_id: prod.id,
          tipo_alerta: 'STOCK_BAJO',
          fecha_generada: new Date().toISOString(),
          email_enviado_a: resultadoEmail.recipients,
          atendida: 'NO',
        };

        if (isGoogleSheetsConfigured()) {
          try {
            await appendAlertaToSheet(nuevaAlerta);
          } catch (err) {
            console.error('[Google Sheets] Error al registrar alerta roja:', err);
          }
        }
        this.localAlertas.unshift(nuevaAlerta);
      }
    }

    // 2. ALERTA AMARILLA — SOBRESTOCK (stock_actual >= stock_max)
    if (prod.stock_actual >= prod.stock_max && prod.stock_max > 0) {
      const alertaActivaExistente = alertasActuales.find(
        (a) => a.producto_id === prod.id && a.tipo_alerta === 'SOBRESTOCK' && a.atendida === 'NO'
      );

      if (!alertaActivaExistente) {
        const resultadoEmail = await sendInventoryAlertEmail({
          producto: prod,
          tipoAlerta: 'SOBRESTOCK',
        });

        const nuevaAlerta: Alerta = {
          id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          producto_id: prod.id,
          tipo_alerta: 'SOBRESTOCK',
          fecha_generada: new Date().toISOString(),
          email_enviado_a: resultadoEmail.recipients,
          atendida: 'NO',
        };

        if (isGoogleSheetsConfigured()) {
          try {
            await appendAlertaToSheet(nuevaAlerta);
          } catch (err) {
            console.error('[Google Sheets] Error al registrar alerta amarilla:', err);
          }
        }
        this.localAlertas.unshift(nuevaAlerta);
      }
    }

    // Regla de negocio: Cuando el producto regrese a nivel normal, se cierran las alertas previas
    // para que si en el futuro vuelve a caer en estado crítico, se genere una nueva alerta.
    if (prod.stock_actual > prod.stock_min) {
      const alertasBajoPendientes = alertasActuales.filter(
        (a) => a.producto_id === prod.id && a.tipo_alerta === 'STOCK_BAJO' && a.atendida === 'NO'
      );
      for (const a of alertasBajoPendientes) {
        await this.marcarAlertaAtendida(a.id);
      }
    }

    if (prod.stock_max > 0 && prod.stock_actual < prod.stock_max) {
      const alertasSobrePendientes = alertasActuales.filter(
        (a) => a.producto_id === prod.id && a.tipo_alerta === 'SOBRESTOCK' && a.atendida === 'NO'
      );
      for (const a of alertasSobrePendientes) {
        await this.marcarAlertaAtendida(a.id);
      }
    }
  }

  // ==========================================
  // USUARIOS
  // ==========================================

  public async getUsuarios(): Promise<Usuario[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        return await fetchUsuariosFromSheet();
      } catch (err) {
        console.error('[Google Sheets] Error al leer usuarios, usando fallback local:', err);
      }
    }
    return this.localUsuarios;
  }

  public async getUsuarioByEmail(email: string): Promise<Usuario | null> {
    const usuarios = await this.getUsuarios();
    const clean = email.toLowerCase().trim();
    return usuarios.find((u) => u.email.toLowerCase().trim() === clean && u.activo === 'SI') || null;
  }

  public async createUsuario(u: {
    nombre: string;
    email: string;
    password_plain: string;
    rol: Usuario['rol'];
    area: string;
  }): Promise<Usuario> {
    const existing = await this.getUsuarioByEmail(u.email);
    if (existing) {
      throw new Error('Ya existe un usuario con este correo electrónico.');
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(u.password_plain, salt);

    const nuevo: Usuario = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nombre: u.nombre.trim(),
      email: u.email.toLowerCase().trim(),
      password_hash,
      rol: u.rol,
      area: u.area.trim(),
      activo: 'SI',
    };

    if (isGoogleSheetsConfigured()) {
      try {
        await appendUsuarioToSheet(nuevo);
      } catch (err) {
        console.error('[Google Sheets] Error al crear usuario:', err);
      }
    }
    this.localUsuarios.push(nuevo);
    this.saveToDisk();
    return nuevo;
  }

  public async resetUsuarioPassword(email: string, newPasswordPlain: string): Promise<Usuario> {
    const cleanEmail = email.toLowerCase().trim();
    const usuario = await this.getUsuarioByEmail(cleanEmail);
    if (!usuario) {
      throw new Error('No se encontró ningún usuario con ese correo electrónico.');
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(newPasswordPlain, salt);

    if (isGoogleSheetsConfigured()) {
      try {
        await updateUsuarioPasswordInSheet(cleanEmail, password_hash);
      } catch (err) {
        console.error('[Google Sheets] Error al actualizar contraseña de usuario:', err);
      }
    }

    usuario.password_hash = password_hash;

    const local = this.localUsuarios.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (local) {
      local.password_hash = password_hash;
    }
    this.saveToDisk();

    return usuario;
  }

  // ==========================================
  // DASHBOARD & MÉTRICAS
  // ==========================================

  public async getDashboardMetricas(): Promise<DashboardMetricas> {
    const productos = await this.getProductos();
    const movimientos = await this.getMovimientos();
    const alertas = await this.getAlertas();

    const productosActivos = productos.filter((p) => p.activo === 'SI');

    const productosCriticos = productosActivos.filter(
      (p) => p.stock_actual <= p.stock_min
    );

    const productosSobrestock = productosActivos.filter(
      (p) => p.stock_max > 0 && p.stock_actual >= p.stock_max
    );

    // Vales del día
    const hoyStr = new Date().toISOString().split('T')[0];
    const valesHoy = movimientos.filter(
      (m) => m.tipo === 'SALIDA_VALE' && m.fecha.startsWith(hoyStr)
    ).length;

    const alertasPendientes = alertas.filter((a) => a.atendida === 'NO').length;

    // Enriquecer movimientos en orden de más recientes a anteriores
    const sortedMovimientos = [...movimientos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    const ultimosMovimientos = sortedMovimientos.map((m) => {
      const prod = productos.find((p) => p.id === m.producto_id);
      return {
        ...m,
        producto_sku: prod?.codigo_sku || 'N/A',
        producto_nombre: prod?.nombre || 'Producto Desconocido',
        producto_categoria: prod?.categoria,
        producto_unidad: prod?.unidad_medida,
        ubicacion_anaquel: prod?.ubicacion_anaquel,
      };
    });

    return {
      totalSkusActivos: productosActivos.length,
      totalStockCritico: productosCriticos.length,
      totalSobrestock: productosSobrestock.length,
      valesHoy,
      alertasPendientes,
      productosCriticos,
      productosSobrestock,
      ultimosMovimientos,
    };
  }

  // ==========================================
  // BITÁCORA DE AUDITORÍA (Audit Log)
  // ==========================================

  public async getAuditLogs(): Promise<BitacoraAuditoria[]> {
    this.loadFromDisk();
    return [...this.localAuditLogs].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  public async appendAuditLog(
    entry: Omit<BitacoraAuditoria, 'id' | 'fecha'>
  ): Promise<BitacoraAuditoria> {
    const newEntry: BitacoraAuditoria = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      fecha: new Date().toISOString(),
      ...entry,
    };

    this.localAuditLogs.unshift(newEntry);
    this.saveToDisk();
    return newEntry;
  }
}

export const dataStore = DataStore.getInstance();
