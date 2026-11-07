/**
 * =======================================================
 * FACTORYSTOCK — SCRIPT DE INICIALIZACIÓN DE GOOGLE SHEETS
 * =======================================================
 * Este script crea automáticamente las 4 hojas principales
 * con sus columnas y reglas exactas en la hoja de cálculo de Google.
 *
 * Ejecutar con:
 *   npm run setup:sheets
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de .env.local de forma nativa sin requerir paquetes externos
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
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

const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error('\n❌ ERROR: Faltan variables de Google Sheets en .env.local:');
  console.error(' - GOOGLE_SHEETS_ID');
  console.error(' - GOOGLE_SERVICE_ACCOUNT_EMAIL');
  console.error(' - GOOGLE_PRIVATE_KEY\n');
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Definición exacta de las 4 hojas y sus columnas
const HOJAS_CONFIG = [
  {
    title: 'Productos',
    headers: [
      'id',
      'codigo_sku',
      'nombre',
      'categoria',
      'descripcion',
      'unidad_medida',
      'proveedor_principal',
      'stock_actual',
      'stock_min',
      'stock_max',
      'ubicacion_anaquel',
      'costo_unitario',
      'activo'
    ]
  },
  {
    title: 'Movimientos',
    headers: [
      'id',
      'tipo',
      'producto_id',
      'cantidad',
      'fecha',
      'no_factura_o_vale',
      'area_solicitante',
      'responsable_recibe',
      'motivo_orden_trabajo',
      'usuario_almacenista'
    ]
  },
  {
    title: 'Usuarios',
    headers: [
      'id',
      'nombre',
      'email',
      'password_hash',
      'rol',
      'area',
      'activo'
    ]
  },
  {
    title: 'Alertas',
    headers: [
      'id',
      'producto_id',
      'tipo_alerta',
      'fecha_generada',
      'email_enviado_a',
      'atendida'
    ]
  }
];

async function main() {
  console.log('🏭 Conectando a Google Sheets API v4...');
  
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);
    console.log(`📋 Hojas existentes en el documento:`, existingSheets);

    for (const config of HOJAS_CONFIG) {
      if (!existingSheets.includes(config.title)) {
        console.log(`➕ Creando hoja: ${config.title}...`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: config.title }
                }
              }
            ]
          }
        });
      }

      // Escribir cabeceras en fila 1
      console.log(`📝 Actualizando cabeceras en ${config.title}...`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${config.title}!A1:${String.fromCharCode(64 + config.headers.length)}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [config.headers]
        }
      });
    }

    console.log('\n✅ ¡Estructura de Google Sheets configurada exitosamente para FactoryStock!');
    console.log('Las 4 hojas (Productos, Movimientos, Usuarios, Alertas) tienen sus cabeceras exactas.');
  } catch (err) {
    console.error('❌ Error durante la configuración de Google Sheets:', err.message);
  }
}

main();
