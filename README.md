# FactoryStock — Sistema de Control de Inventario de Almacén Industrial con Alertas Automáticas

**FactoryStock** es una plataforma web empresarial diseñada específicamente para plantas de manufactura y fábricas. Centraliza el control de almacén para materias primas, refacciones, consumibles, herramientas y equipo de protección personal (EPP), reemplazando bitácoras en papel y hojas de cálculo aisladas por un flujo estricto con trazabilidad por orden de trabajo, prevención de stock negativo y despacho de comprobantes/tickets impresos.

---

## 🏭 Características Principales

1. **Contexto 100% Industrial**: Orientado a planta de producción, líneas de ensamble, mantenimiento y calidad.
2. **Capacidad Óptima**: Diseñado para controlar catálogos de hasta 500 SKUs con ubicaciones físicas codificadas en formato **A1-R2-N3** (*Anaquel 1 - Rack 2 - Nivel 3*).
3. **Reglas de Negocio Estrictas**:
   - **SKU Único**: Validación obligatoria para evitar duplicidad de códigos.
   - **Prohibición de Stock Negativo**: Validación automática en salidas (`cantidad <= stock_actual`).
   - **Trazabilidad Inmutable**: Prohibido el borrado físico de productos con movimientos históricos; desactivación lógica mediante `activo = NO`.
   - **Auditoría Permanente**: Registro automático del usuario almacenista y timestamp en cada operación.
4. **Alertas Automáticas con Antispam**:
   - 🚨 **Alerta Roja (Stock Crítico)**: Disparada cuando `stock_actual <= stock_min`. Emisión visual en panel y notificación vía **Nodemailer** hacia `ADMIN_EMAIL` y `COMPRAS_EMAIL`.
   - ⚠️ **Alerta Amarilla (Sobrestock)**: Disparada cuando `stock_actual >= stock_max`. Registro en bitácora de alertas y panel visual.
   - **Filtro Inteligente**: No genera correos repetidos por consultas al dashboard mientras la alerta permanezca desatendida.
5. **Comprobante Oficial Imprimible**:
   - Generación de vale/ticket con folio único, fecha, hora, solicitante, responsable, motivo/OT, firma de entrega y recibo, estilizado con `@media print`.
6. **Reportes y Exportación CSV**:
   - Filtros por fecha, material, tipo de movimiento y área con descarga en CSV compatible con Microsoft Excel (UTF-8 con BOM).

---

## 👥 Matriz de Roles y Permisos

| Rol | Descripción | Permisos |
| :--- | :--- | :--- |
| **ADMIN** | Gerente de Planta / Administrador General | Dashboard integral, catálogo de SKUs (crear, editar, desactivar), consulta de movimientos y auditoría, atención de alertas, gestión de usuarios/roles y exportación de reportes CSV. |
| **ALMACENISTA** | Operador físico del almacén | Consulta de existencias y anaqueles, registro de entradas con factura, salidas con vale, devoluciones, ajustes autorizados, reimpresión de tickets y consulta de alertas. |
| **JEFE_AREA** | Supervisor de línea de producción | Consulta de existencias disponibles y ubicaciones, registro de solicitudes/vales para su área operativa, y consulta de sus movimientos. Sin acceso a módulos administrativos. |

### 🔑 Credenciales de Prueba Precargadas

| Perfil | Correo Electrónico | Contraseña | Área |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@factorystock.com` | `admin123` | Gerencia de Planta |
| **ALMACENISTA** | `almacen@factorystock.com` | `almacen123` | Almacén Central |
| **JEFE_AREA (Línea 1)** | `jefe.linea1@factorystock.com` | `jefe123` | Producción Línea 1 |
| **JEFE_AREA (Mantenimiento)**| `jefe.mantenimiento@factorystock.com` | `jefe123` | Mantenimiento |

---

## 📊 Arquitectura de Base de Datos (Google Sheets)

El sistema utiliza Google Sheets como base de datos en tiempo real mediante Service Account, estructurado en **4 hojas principales**:

### 1. `Productos`
`id`, `codigo_sku`, `nombre`, `categoria`, `descripcion`, `unidad_medida`, `proveedor_principal`, `stock_actual`, `stock_min`, `stock_max`, `ubicacion_anaquel`, `costo_unitario`, `activo`

### 2. `Movimientos`
`id`, `tipo`, `producto_id`, `cantidad`, `fecha`, `no_factura_o_vale`, `area_solicitante`, `responsable_recibe`, `motivo_orden_trabajo`, `usuario_almacenista`

### 3. `Usuarios`
`id`, `nombre`, `email`, `password_hash`, `rol`, `area`, `activo`

### 4. `Alertas`
`id`, `producto_id`, `tipo_alerta`, `fecha_generada`, `email_enviado_a`, `atendida`

> **Modo Híbrido / Fallback:** Si las variables de Google Sheets no están configuradas en `.env.local`, FactoryStock opera automáticamente con su almacén local en memoria con datos semilla industriales, permitiendo probar toda la aplicación inmediatamente sin bloqueos.

---

## ⚙️ Configuración y Variables de Entorno

Copie el archivo de ejemplo para configurar sus variables locales:

```bash
cp .env.example .env.local
```

Contenido de `.env.local`:

```ini
# Google Sheets API v4
GOOGLE_SHEETS_ID=tu_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-servicio@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Seguridad JWT
JWT_SECRET=facto_stock_secret_key_super_segura_2026

# Notificaciones SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@tu-planta.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM="FactoryStock Alertas <notificaciones@tu-planta.com>"

# Destinatarios de Alertas
ADMIN_EMAIL=admin@factorystock.com
COMPRAS_EMAIL=compras@factorystock.com
```

---

## 🚀 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Inicializar hojas en Google Sheets automáticamente
npm run setup:sheets

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abra su navegador en [http://localhost:3000](http://localhost:3000).

---

## 🧪 Verificación de los 6 Flujos Maestros

1. **Flujo 1 — Login**: Inicie sesión seleccionando cualquiera de los botones de perfil rápido (ADMIN, ALMACENISTA, JEFE_AREA). Compruebe cómo el menú lateral y las rutas se adaptan a los permisos correspondientes.
2. **Flujo 2 — Crear Producto**: Como ADMIN, vaya a `/inventario` y cree el SKU `MP-001` con nombre "Lámina de acero cal. 18", categoría "Materia Prima", unidad "pza", stock mínimo "10", stock máximo "100" y ubicación "A1-R2-N3". Verifique que el sistema impida registrar duplicados con el mismo SKU.
3. **Flujo 3 — Entrada por Compra**: Como ALMACENISTA, vaya a `/entradas`, seleccione un producto, ingrese cantidad `50` y factura `FAC-0001`. El stock aumenta automáticamente y se registra el operador.
4. **Flujo 4 — Salida por Vale y Ticket**: En `/salidas`, solicite material para "Producción Línea 1", responsable "Juan Pérez" y OT "OT-1025". Verifique que si la cantidad supera el stock actual, se rechaza la operación con el mensaje: *"No es posible realizar la salida. La cantidad solicitada supera el inventario disponible."* Si es válida, se descuenta el stock y se despliega el Ticket de entrega listo para imprimir.
5. **Flujo 5 — Stock Crítico (Alerta Roja)**: Cuando el stock actual sea `stock_actual <= stock_min`, se activa la alerta visual roja en el panel y en `/alertas`, despachando el correo vía Nodemailer a Compras y Admin sin enviar duplicados en consultas posteriores.
6. **Flujo 6 — Sobrestock (Alerta Amarilla)**: Cuando `stock_actual >= stock_max`, se despliega la alerta visual amarilla y el Administrador puede marcarla como atendida.

---

## ☁️ Despliegue en Vercel

1. Suba el código a su repositorio en GitHub: `factory-stock-alerts`.
2. Conecte el repositorio en [Vercel](https://vercel.com).
3. Agregue las variables de entorno en **Project Settings > Environment Variables**.
4. ¡El proyecto se compilará y desplegará en modo Serverless sin dependencias de servidor local!
