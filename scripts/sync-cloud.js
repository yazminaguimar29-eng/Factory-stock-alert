/**
 * ============================================================================
 * FACTORYSTOCK — SINCRONIZADOR COMPLETO LOCAL -> NUBE (GOOGLE SHEETS & DRIVE)
 * ============================================================================
 * Sincroniza:
 * 1. Base de datos local (data/local-db.json) -> Google Sheets en la nube
 *    (ID: 1ez71rggXMXy6uJdN5Qeo8xVTMc24K38t-TgXsYMeZAc)
 * 2. Archivos de código e interfaz -> Google Drive (G:\Mi unidad\antigravity\factory-stock-alerts)
 *    si la unidad G: de Google Drive Desktop se encuentra activa.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { google } = require('googleapis');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env.local');
const LOCAL_DB_PATH = path.join(ROOT_DIR, 'data', 'local-db.json');
const DRIVE_TARGET_DIRS = [
  'G:\\Mi unidad\\factory-stock-alerts',
  'G:\\Mi unidad\\antigravity\\factory-stock-alerts',
  'G:\\Mi unidad\\antigravity\\scratch\\factory-stock-alerts',
];

// 1. Cargar variables de .env.local
if (fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

function getCredentials() {
  const credFile = process.env.GOOGLE_CREDENTIALS_JSON_PATH || 'stock-de-inventarios-09b2624536b2.json';
  const fullPath = path.isAbsolute(credFile) ? credFile : path.join(ROOT_DIR, credFile);
  if (fs.existsSync(fullPath)) {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  }
  throw new Error(`No se encontró el archivo de credenciales en: ${fullPath}`);
}

async function syncGoogleSheets() {
  console.log('\n============================================================');
  console.log('☁️  1. SINCRONIZANDO BASE DE DATOS LOCAL -> GOOGLE SHEETS...');
  console.log('============================================================');

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1ez71rggXMXy6uJdN5Qeo8xVTMc24K38t-TgXsYMeZAc';
  const creds = getCredentials();
  const localDb = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Verificar pestañas existentes
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = new Set((meta.data.sheets || []).map((s) => s.properties.title));
  const requiredTabs = ['Productos', 'Movimientos', 'Usuarios', 'Alertas'];
  const missingTabs = requiredTabs.filter((t) => !existingTitles.has(t));

  if (missingTabs.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missingTabs.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    console.log(`➕ Pestañas creadas: ${missingTabs.join(', ')}`);
  }

  // Sincronizar Productos
  const prodHeaders = [
    'id', 'codigo_sku', 'nombre', 'categoria', 'descripcion',
    'unidad_medida', 'proveedor_principal', 'stock_actual',
    'stock_min', 'stock_max', 'ubicacion_anaquel', 'costo_unitario', 'activo', 'imagen_url'
  ];
  const prodRows = (localDb.productos || []).map((p) => [
    p.id, p.codigo_sku, p.nombre, p.categoria, p.descripcion,
    p.unidad_medida, p.proveedor_principal, p.stock_actual,
    p.stock_min, p.stock_max, p.ubicacion_anaquel, p.costo_unitario, p.activo, p.imagen_url || ''
  ]);
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Productos!A1:N1000' });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Productos!A1:N${prodRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [prodHeaders, ...prodRows] },
  });
  console.log(`✅ Hoja [Productos] sincronizada (${prodRows.length} registros).`);

  // Sincronizar Movimientos
  const movHeaders = [
    'id', 'tipo', 'producto_id', 'cantidad', 'fecha',
    'no_factura_o_vale', 'area_solicitante', 'responsable_recibe',
    'motivo_orden_trabajo', 'usuario_almacenista', 'evidencia_foto'
  ];
  const movRows = (localDb.movimientos || []).map((m) => [
    m.id, m.tipo, m.producto_id, m.cantidad, m.fecha,
    m.no_factura_o_vale, m.area_solicitante, m.responsable_recibe,
    m.motivo_orden_trabajo, m.usuario_almacenista, m.evidencia_foto || ''
  ]);
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Movimientos!A1:K1000' });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Movimientos!A1:K${movRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [movHeaders, ...movRows] },
  });
  console.log(`✅ Hoja [Movimientos] sincronizada (${movRows.length} registros).`);

  // Sincronizar Usuarios
  const usrHeaders = ['id', 'nombre', 'email', 'password_hash', 'rol', 'area', 'activo'];
  const usrRows = (localDb.usuarios || []).map((u) => [
    u.id, u.nombre, u.email, u.password_hash, u.rol, u.area, u.activo
  ]);
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Usuarios!A1:G1000' });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Usuarios!A1:G${usrRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [usrHeaders, ...usrRows] },
  });
  console.log(`✅ Hoja [Usuarios] sincronizada (${usrRows.length} registros).`);

  // Sincronizar Alertas
  const altHeaders = ['id', 'producto_id', 'tipo_alerta', 'fecha_generada', 'email_enviado_a', 'atendida'];
  const altRows = (localDb.alertas || []).map((a) => [
    a.id, a.producto_id, a.tipo_alerta, a.fecha_generada, a.email_enviado_a, a.atendida
  ]);
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Alertas!A1:F1000' });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Alertas!A1:F${altRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [altHeaders, ...altRows] },
  });
  console.log(`✅ Hoja [Alertas] sincronizada (${altRows.length} registros).`);
}

function syncGoogleDriveFolder() {
  console.log('\n============================================================');
  console.log('📂 2. SINCRONIZANDO ARCHIVOS CON GOOGLE DRIVE (G:\\Mi unidad)');
  console.log('============================================================');

  if (!fs.existsSync('G:\\Mi unidad')) {
    console.warn('⚠️  La unidad G:\\ (Google Drive for Desktop) no está montada actualmente.');
    console.warn('   Abre la aplicación "Google Drive" en Windows para activar la unidad G: y vuelve a ejecutar este script.');
    return false;
  }

  for (const targetDir of DRIVE_TARGET_DIRS) {
    try {
      execSync(
        `robocopy "${ROOT_DIR}" "${targetDir}" /E /XD node_modules node_modules_old .next .git /R:1 /W:1 /NFL /NDL`,
        { stdio: 'inherit' }
      );
    } catch (err) {
      if (err.status && err.status >= 8) {
        console.error(`❌ Error al copiar archivos a ${targetDir}:`, err.message);
      }
    }
    console.log(`✅ Proyecto sincronizado exitosamente en: ${targetDir}`);
  }
  return true;
}

async function main() {
  try {
    await syncGoogleSheets();
  } catch (err) {
    console.error('❌ Error al sincronizar Google Sheets:', err.message);
  }

  syncGoogleDriveFolder();
  console.log('\n🎉 Proceso de sincronización finalizado.\n');
}

main();
