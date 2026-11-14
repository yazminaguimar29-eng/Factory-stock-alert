// ==========================================
// FACTORYSTOCK — CLIENTE DE GOOGLE SHEETS
// ==========================================
// Soporta autenticación mediante archivo JSON descargado de Google Cloud Console
// (ej. google-credentials.json, credentials.json) o variables de entorno.

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import { Producto, Movimiento, Usuario, Alerta } from '@/types';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly'
];

export interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
  source: 'json_file' | 'env_vars';
  filePath?: string;
}

/**
 * Extrae de forma segura el ID de Google Sheets, incluso si el usuario pegó la URL completa del navegador.
 * Ejemplos aceptados:
 * - "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
 * - "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
 */
export function getSpreadsheetId(): string {
  const raw = (
    process.env.GOOGLE_SHEETS_ID ||
    process.env.GOOGLE_SHEET_ID ||
    process.env.SPREADSHEET_ID ||
    ''
  ).trim();

  if (!raw) return '';

  const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return raw;
}

/**
 * Localiza y carga las credenciales de la Cuenta de Servicio de Google Cloud.
 * Prioridad de búsqueda:
 * 1. Ruta indicada en GOOGLE_CREDENTIALS_JSON_PATH o GOOGLE_APPLICATION_CREDENTIALS
 * 2. Archivos estándar en la raíz del proyecto (google-credentials.json, credentials.json, service-account.json)
 * 3. Cualquier archivo *.json en la raíz que contenga type === 'service_account'
 * 4. Variables de entorno GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY
 */
export function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  // 1. Ruta explícita en variable de entorno
  const envPath = process.env.GOOGLE_CREDENTIALS_JSON_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    const resolved = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
    if (fs.existsSync(resolved)) {
      try {
        const rawContent = fs.readFileSync(resolved, 'utf-8');
        const parsed = JSON.parse(rawContent);
        if (parsed.client_email && parsed.private_key) {
          return {
            client_email: parsed.client_email,
            private_key: parsed.private_key,
            project_id: parsed.project_id,
            source: 'json_file',
            filePath: path.basename(resolved),
          };
        }
      } catch (err) {
        console.error(`[Google Sheets] Error al analizar JSON en ${resolved}:`, err);
      }
    }
  }

  // 2. Nombres comunes en la raíz del proyecto
  const commonFileNames = [
    'google-credentials.json',
    'credentials.json',
    'service-account.json',
    'service_account.json',
    'google-key.json',
    'serviceAccountKey.json'
  ];

  for (const fileName of commonFileNames) {
    const candidatePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(candidatePath)) {
      try {
        const rawContent = fs.readFileSync(candidatePath, 'utf-8');
        const parsed = JSON.parse(rawContent);
        if (parsed.client_email && parsed.private_key) {
          return {
            client_email: parsed.client_email,
            private_key: parsed.private_key,
            project_id: parsed.project_id,
            source: 'json_file',
            filePath: fileName,
          };
        }
      } catch (err) {
        console.error(`[Google Sheets] Error al analizar ${fileName}:`, err);
      }
    }
  }

  // 3. Exploración de cualquier archivo *.json en la raíz (evitando package.json, tsconfig, etc.)
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    const excluded = ['package.json', 'package-lock.json', 'tsconfig.json', 'components.json', 'next.config.json'];
    for (const file of rootFiles) {
      if (file.endsWith('.json') && !excluded.includes(file)) {
        const fullPath = path.join(process.cwd(), file);
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          if (raw.includes('"service_account"')) {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'service_account' && parsed.client_email && parsed.private_key) {
              return {
                client_email: parsed.client_email,
                private_key: parsed.private_key,
                project_id: parsed.project_id,
                source: 'json_file',
                filePath: file,
              };
            }
          }
        } catch {
          // continuar con el siguiente archivo
        }
      }
    }
  } catch {}

  // 4. Fallback: Variable con el contenido completo del JSON (Ideal para Vercel)
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
          project_id: parsed.project_id,
          source: 'env_vars',
        };
      }
    } catch (err) {
      console.error('[Google Sheets] Error al analizar GOOGLE_CREDENTIALS_JSON:', err);
    }
  }

  // 5. Fallback: Variables de entorno individuales
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim(),
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      source: 'env_vars',
    };
  }

  return null;
}

/**
 * Valida si Google Sheets está configurado correctamente para sincronización.
 */
export function isGoogleSheetsConfigured(): boolean {
  if (process.env.STORAGE_MODE === 'local' || process.env.FORCE_LOCAL === 'true') {
    return false;
  }
  const sheetId = getSpreadsheetId();
  const creds = getServiceAccountCredentials();
  return Boolean(sheetId && creds);
}

/**
 * Obtiene el cliente autenticado de Google Sheets API v4.
 */
export async function getGoogleSheetsClient() {
  const creds = getServiceAccountCredentials();
  if (!creds) {
    throw new Error('Google Cloud credentials no encontradas. Coloca tu archivo google-credentials.json en la raíz del proyecto.');
  }

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Diagnóstico completo del estado de conexión con Google Sheets.
 */
export async function getGoogleSheetsStatus() {
  const spreadsheetId = getSpreadsheetId();
  const creds = getServiceAccountCredentials();

  const status = {
    configured: Boolean(spreadsheetId && creds),
    hasSpreadsheetId: Boolean(spreadsheetId),
    spreadsheetId: spreadsheetId || null,
    hasCredentials: Boolean(creds),
    credentialSource: creds?.source || null,
    credentialFile: creds?.filePath || null,
    clientEmail: creds?.client_email || null,
    projectId: creds?.project_id || null,
    accessible: false,
    title: '',
    tabs: [] as string[],
    error: null as string | null,
    errorHelp: null as string | null,
  };

  if (!status.configured) {
    if (!status.hasSpreadsheetId) {
      status.errorHelp = 'Configura GOOGLE_SHEETS_ID en tu archivo .env.local con el ID o URL de tu hoja.';
    } else if (!status.hasCredentials) {
      status.errorHelp = 'Descarga el archivo JSON de tu cuenta de servicio desde Google Cloud Console y colócalo como "google-credentials.json" en la carpeta raíz.';
    }
    return status;
  }

  try {
    const sheets = await getGoogleSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    status.accessible = true;
    status.title = meta.data.properties?.title || 'Hoja de Cálculo';
    status.tabs = meta.data.sheets?.map((s) => s.properties?.title || '') || [];
  } catch (err: any) {
    status.accessible = false;
    status.error = err.message || 'Error al conectar con Google Sheets API';

    if (err.code === 403 || err.message?.includes('The caller does not have permission')) {
      status.errorHelp = `¡Permiso denegado! Debes abrir tu Google Sheet, hacer clic en "Compartir" y agregar el correo de la cuenta de servicio (${creds?.client_email}) como "Editor".`;
    } else if (err.code === 404 || err.message?.includes('Requested entity was not found')) {
      status.errorHelp = 'La hoja no fue encontrada. Revisa que el GOOGLE_SHEETS_ID sea correcto en .env.local.';
    } else if (err.message?.includes('API has not been used') || err.message?.includes('disabled')) {
      status.errorHelp = 'Debes habilitar la "Google Sheets API" en la consola de Google Cloud para este proyecto.';
    } else {
      status.errorHelp = err.message;
    }
  }

  return status;
}

/**
 * Asegura la existencia de las pestañas necesarias (Productos, Movimientos, Usuarios, Alertas)
 * y sus encabezados de columna.
 */
export async function ensureSheetStructure(): Promise<{ createdTabs: string[]; status: string }> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_ID no está definido.');

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetsList = meta.data.sheets || [];

  // Normalizar nombres de pestañas que tengan espacios o mayúsculas incorrectas (ej. "usuarios " -> "Usuarios")
  const renameRequests: any[] = [];
  const targetTabs = ['Productos', 'Movimientos', 'Usuarios', 'Alertas'];

  for (const target of targetTabs) {
    const existing = sheetsList.find(
      (s) => (s.properties?.title || '').trim().toLowerCase() === target.toLowerCase()
    );
    if (existing && existing.properties?.title !== target) {
      renameRequests.push({
        updateSheetProperties: {
          properties: {
            sheetId: existing.properties?.sheetId,
            title: target,
          },
          fields: 'title',
        },
      });
      if (existing.properties) existing.properties.title = target;
    }
  }

  if (renameRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: renameRequests },
    });
  }

  const existingTitles = new Set(sheetsList.map((s) => s.properties?.title || ''));
  const requiredTabs = ['Productos', 'Movimientos', 'Usuarios', 'Alertas'];
  const missingTabs = requiredTabs.filter((t) => !existingTitles.has(t));
  const createdTabs: string[] = [];

  if (missingTabs.length > 0) {
    const requests = missingTabs.map((title) => ({
      addSheet: {
        properties: { title },
      },
    }));
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
    createdTabs.push(...missingTabs);
  }

  // Encabezados para Productos
  const prodCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Productos!A1:N1',
  }).catch(() => ({ data: { values: [] } }));

  if (!prodCheck.data.values || prodCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Productos!A1:N1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'id', 'codigo_sku', 'nombre', 'categoria', 'descripcion',
          'unidad_medida', 'proveedor_principal', 'stock_actual',
          'stock_min', 'stock_max', 'ubicacion_anaquel', 'costo_unitario', 'activo', 'imagen_url'
        ]],
      },
    });
  }

  // Encabezados para Movimientos
  const movCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Movimientos!A1:K1',
  }).catch(() => ({ data: { values: [] } }));

  if (!movCheck.data.values || movCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Movimientos!A1:K1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'id', 'tipo', 'producto_id', 'cantidad', 'fecha',
          'no_factura_o_vale', 'area_solicitante', 'responsable_recibe',
          'motivo_orden_trabajo', 'usuario_almacenista', 'evidencia_foto'
        ]],
      },
    });
  }

  // Encabezados para Usuarios
  const usrCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Usuarios!A1:G1',
  }).catch(() => ({ data: { values: [] } }));

  if (!usrCheck.data.values || usrCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Usuarios!A1:G1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'id', 'nombre', 'email', 'password_hash', 'rol', 'area', 'activo'
        ]],
      },
    });
  }

  // Encabezados para Alertas
  const altCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Alertas!A1:F1',
  }).catch(() => ({ data: { values: [] } }));

  if (!altCheck.data.values || altCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Alertas!A1:F1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'id', 'producto_id', 'tipo_alerta', 'fecha_generada', 'email_enviado_a', 'atendida'
        ]],
      },
    });
  }

  return { createdTabs, status: 'OK' };
}

/**
 * Inicializa y puebla la hoja de cálculo con los productos iniciales y usuarios si está vacía.
 */
export async function seedInitialDataToSheet(
  initialProductos: Producto[],
  initialUsuarios: Usuario[]
): Promise<{ seededProductos: number; seededUsuarios: number }> {
  await ensureSheetStructure();
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Verificar si Productos ya tiene filas
  const currentProds = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Productos!A2:A',
  }).catch(() => ({ data: { values: [] } }));

  let seededProductos = 0;
  if (!currentProds.data.values || currentProds.data.values.length === 0) {
    const prodRows = initialProductos.map((p) => [
      p.id,
      p.codigo_sku,
      p.nombre,
      p.categoria,
      p.descripcion,
      p.unidad_medida,
      p.proveedor_principal,
      p.stock_actual,
      p.stock_min,
      p.stock_max,
      p.ubicacion_anaquel,
      p.costo_unitario,
      p.activo
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Productos!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: prodRows },
    });
    seededProductos = prodRows.length;
  }

  // Verificar si Usuarios ya tiene filas
  const currentUsers = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Usuarios!A2:A',
  }).catch(() => ({ data: { values: [] } }));

  let seededUsuarios = 0;
  if (!currentUsers.data.values || currentUsers.data.values.length === 0) {
    const userRows = initialUsuarios.map((u) => [
      u.id,
      u.nombre,
      u.email.toLowerCase().trim(),
      u.password_hash,
      u.rol,
      u.area,
      u.activo
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Usuarios!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: userRows },
    });
    seededUsuarios = userRows.length;
  }

  return { seededProductos, seededUsuarios };
}

/**
 * Sincroniza completamente la versión local (Productos, Movimientos, Usuarios, Alertas)
 * hacia la hoja de Google Sheets en la nube para que refleje exactamente lo mismo.
 */
export async function syncLocalStateToSheet(
  productos: Producto[],
  movimientos: Movimiento[],
  usuarios: Usuario[],
  alertas: Alerta[]
): Promise<{
  syncedProductos: number;
  syncedMovimientos: number;
  syncedUsuarios: number;
  syncedAlertas: number;
}> {
  await ensureSheetStructure();
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // 1. Sincronizar Productos
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Productos!A2:N1000',
  });
  if (productos.length > 0) {
    const prodRows = productos.map((p) => [
      p.id,
      p.codigo_sku,
      p.nombre,
      p.categoria,
      p.descripcion,
      p.unidad_medida,
      p.proveedor_principal,
      p.stock_actual,
      p.stock_min,
      p.stock_max,
      p.ubicacion_anaquel,
      p.costo_unitario,
      p.activo,
      p.imagen_url || '',
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Productos!A2:N${prodRows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: prodRows },
    });
  }

  // 2. Sincronizar Movimientos
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Movimientos!A2:K1000',
  });
  if (movimientos.length > 0) {
    const movRows = movimientos.map((m) => [
      m.id,
      m.tipo,
      m.producto_id,
      m.cantidad,
      m.fecha,
      m.no_factura_o_vale,
      m.area_solicitante,
      m.responsable_recibe,
      m.motivo_orden_trabajo,
      m.usuario_almacenista,
      m.evidencia_foto || '',
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Movimientos!A2:K${movRows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: movRows },
    });
  }

  // 3. Sincronizar Usuarios
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Usuarios!A2:G1000',
  });
  if (usuarios.length > 0) {
    const userRows = usuarios.map((u) => [
      u.id,
      u.nombre,
      u.email.toLowerCase().trim(),
      u.password_hash,
      u.rol,
      u.area,
      u.activo,
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Usuarios!A2:G${userRows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: userRows },
    });
  }

  // 4. Sincronizar Alertas
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Alertas!A2:F1000',
  });
  if (alertas.length > 0) {
    const alertRows = alertas.map((a) => [
      a.id,
      a.producto_id,
      a.tipo_alerta,
      a.fecha_generada,
      a.email_enviado_a,
      a.atendida,
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Alertas!A2:F${alertRows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: alertRows },
    });
  }

  return {
    syncedProductos: productos.length,
    syncedMovimientos: movimientos.length,
    syncedUsuarios: usuarios.length,
    syncedAlertas: alertas.length,
  };
}

// ==========================================
// 1. HOJA PRODUCTOS
// Columnas: id, codigo_sku, nombre, categoria, descripcion, unidad_medida, proveedor_principal, stock_actual, stock_min, stock_max, ubicacion_anaquel, costo_unitario, activo
// ==========================================

export async function fetchProductosFromSheet(): Promise<Producto[]> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Productos!A2:N',
    });

    const rows = res.data.values || [];
    return rows.map((row) => ({
      id: row[0] || '',
      codigo_sku: row[1] || '',
      nombre: row[2] || '',
      categoria: (row[3] as Producto['categoria']) || 'Panadería Congelada (CA)',
      descripcion: row[4] || '',
      unidad_medida: row[5] || 'CA',
      proveedor_principal: row[6] || '',
      stock_actual: Number(row[7]) || 0,
      stock_min: Number(row[8]) || 0,
      stock_max: Number(row[9]) || 0,
      ubicacion_anaquel: row[10] || '',
      costo_unitario: Number(row[11]) || 0,
      activo: (row[12] === 'NO' ? 'NO' : 'SI') as 'SI' | 'NO',
      imagen_url: row[13] || undefined,
    }));
  } catch (err: any) {
    if (err.message && err.message.includes('Unable to parse range')) {
      await ensureSheetStructure();
      return [];
    }
    throw err;
  }
}

export async function appendProductoToSheet(p: Producto): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Productos!A:N',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        p.id,
        p.codigo_sku,
        p.nombre,
        p.categoria,
        p.descripcion,
        p.unidad_medida,
        p.proveedor_principal,
        p.stock_actual,
        p.stock_min,
        p.stock_max,
        p.ubicacion_anaquel,
        p.costo_unitario,
        p.activo,
        p.imagen_url || ''
      ]],
    },
  });
}

export async function updateProductoInSheet(p: Producto): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Productos!A:A',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === p.id);
  if (rowIndex === -1) {
    throw new Error(`Producto con ID ${p.id} no encontrado en Google Sheets.`);
  }

  const sheetRow = rowIndex + 1; // 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Productos!A${sheetRow}:N${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        p.id,
        p.codigo_sku,
        p.nombre,
        p.categoria,
        p.descripcion,
        p.unidad_medida,
        p.proveedor_principal,
        p.stock_actual,
        p.stock_min,
        p.stock_max,
        p.ubicacion_anaquel,
        p.costo_unitario,
        p.activo,
        p.imagen_url || ''
      ]],
    },
  });
}

// ==========================================
// 2. HOJA MOVIMIENTOS
// Columnas: id, tipo, producto_id, cantidad, fecha, no_factura_o_vale, area_solicitante, responsable_recibe, motivo_orden_trabajo, usuario_almacenista
// ==========================================

export async function fetchMovimientosFromSheet(): Promise<Movimiento[]> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Movimientos!A2:K',
    });

    const rows = res.data.values || [];
    return rows.map((row) => ({
      id: row[0] || '',
      tipo: (row[1] as Movimiento['tipo']) || 'ENTRADA_COMPRA',
      producto_id: row[2] || '',
      cantidad: Number(row[3]) || 0,
      fecha: row[4] || '',
      no_factura_o_vale: row[5] || '',
      area_solicitante: row[6] || '',
      responsable_recibe: row[7] || '',
      motivo_orden_trabajo: row[8] || '',
      usuario_almacenista: row[9] || '',
      evidencia_foto: row[10] || undefined,
    }));
  } catch (err: any) {
    if (err.message && err.message.includes('Unable to parse range')) {
      await ensureSheetStructure();
      return [];
    }
    throw err;
  }
}

export async function appendMovimientoToSheet(m: Movimiento): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Movimientos!A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        m.id,
        m.tipo,
        m.producto_id,
        m.cantidad,
        m.fecha,
        m.no_factura_o_vale,
        m.area_solicitante,
        m.responsable_recibe,
        m.motivo_orden_trabajo,
        m.usuario_almacenista,
        m.evidencia_foto || ''
      ]],
    },
  });
}

// ==========================================
// 3. HOJA USUARIOS
// Columnas: id, nombre, email, password_hash, rol, area, activo
// ==========================================

export async function fetchUsuariosFromSheet(): Promise<Usuario[]> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Usuarios!A2:G',
    });

    const rows = res.data.values || [];
    const usuarios: Usuario[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let passHash = (row[3] || '').trim();

      // Si la contraseña en Google Sheets no tiene formato de hash bcrypt, la hasheamos y actualizamos la celda
      if (passHash && !passHash.startsWith('$2a$') && !passHash.startsWith('$2b$')) {
        try {
          const salt = bcrypt.genSaltSync(10);
          passHash = bcrypt.hashSync(passHash, salt);
          const sheetRow = i + 2; // Fila 2 en adelante
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Usuarios!D${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[passHash]] },
          }).catch((err) => console.error('[Google Sheets] Error al encriptar hash existente:', err));
        } catch (e) {
          console.error('[Google Sheets] Error al migrar hash:', e);
        }
      }

      usuarios.push({
        id: row[0] || '',
        nombre: row[1] || '',
        email: (row[2] || '').toLowerCase().trim(),
        password_hash: passHash,
        rol: (row[4] as Usuario['rol']) || 'JEFE_AREA',
        area: row[5] || '',
        activo: (row[6] === 'NO' ? 'NO' : 'SI') as 'SI' | 'NO',
      });
    }

    return usuarios;
  } catch (err: any) {
    if (err.message && err.message.includes('Unable to parse range')) {
      await ensureSheetStructure();
      return [];
    }
    throw err;
  }
}

export async function appendUsuarioToSheet(u: Usuario): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Asegurar que la contraseña guardada en Google Sheets siempre sea un hash encriptado
  let finalHash = u.password_hash;
  if (!finalHash.startsWith('$2a$') && !finalHash.startsWith('$2b$')) {
    const salt = bcrypt.genSaltSync(10);
    finalHash = bcrypt.hashSync(finalHash, salt);
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Usuarios!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        u.id,
        u.nombre,
        u.email.toLowerCase().trim(),
        finalHash,
        u.rol,
        u.area,
        u.activo
      ]],
    },
  });
}

/**
 * Actualiza la contraseña encriptada (hash bcrypt) de un usuario en Google Sheets.
 */
export async function updateUsuarioPasswordInSheet(email: string, passwordHash: string): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Usuarios!C:C',
  });

  const rows = res.data.values || [];
  const cleanEmail = email.toLowerCase().trim();
  const rowIndex = rows.findIndex((r) => (r[0] || '').toLowerCase().trim() === cleanEmail);
  if (rowIndex === -1) {
    throw new Error(`Usuario con correo ${email} no encontrado en Google Sheets.`);
  }

  const sheetRow = rowIndex + 1; // 1-indexed

  // Asegurar formato hash
  let finalHash = passwordHash;
  if (!finalHash.startsWith('$2a$') && !finalHash.startsWith('$2b$')) {
    const salt = bcrypt.genSaltSync(10);
    finalHash = bcrypt.hashSync(finalHash, salt);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Usuarios!D${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[finalHash]],
    },
  });
}

// ==========================================
// 4. HOJA ALERTAS
// Columnas: id, producto_id, tipo_alerta, fecha_generada, email_enviado_a, atendida
// ==========================================

export async function fetchAlertasFromSheet(): Promise<Alerta[]> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Alertas!A2:F',
    });

    const rows = res.data.values || [];
    return rows.map((row) => ({
      id: row[0] || '',
      producto_id: row[1] || '',
      tipo_alerta: (row[2] as Alerta['tipo_alerta']) || 'STOCK_BAJO',
      fecha_generada: row[3] || '',
      email_enviado_a: row[4] || '',
      atendida: (row[5] === 'SI' ? 'SI' : 'NO') as 'SI' | 'NO',
    }));
  } catch (err: any) {
    if (err.message && err.message.includes('Unable to parse range')) {
      await ensureSheetStructure();
      return [];
    }
    throw err;
  }
}

export async function appendAlertaToSheet(a: Alerta): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Alertas!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        a.id,
        a.producto_id,
        a.tipo_alerta,
        a.fecha_generada,
        a.email_enviado_a,
        a.atendida
      ]],
    },
  });
}

export async function markAlertaAtendidaInSheet(id: string): Promise<void> {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Alertas!A:A',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) {
    throw new Error(`Alerta con ID ${id} no encontrada en Google Sheets.`);
  }

  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Alertas!F${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['SI']],
    },
  });
}
