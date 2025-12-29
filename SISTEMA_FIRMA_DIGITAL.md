# Sistema de Firma Digital para Recibos

## ✅ Implementación Completa

### 🎨 Frontend

**Nuevo Componente: SignatureManager**
- Ubicación: `QL Front/src/Components/Admin/SignatureManager.jsx`
- Ruta: `/signature-manager`
- Características:
  - Canvas interactivo para dibujar firma con mouse o touch
  - Botones: Limpiar, Guardar, Eliminar
  - Vista previa de firma actual
  - Subida automática a Cloudinary
  - Interfaz moderna con TailwindCSS

**Dependencia Instalada:**
- `react-signature-canvas` - Librería para captura de firma digital

**Integración en ReciboPDF:**
- Carga automática de firma desde backend
- Inserción de imagen en zona de firma del PDF
- Fallback a texto "Firma" si no hay firma guardada
- Manejo de errores CORS

### 🔧 Backend

**Nuevo Modelo: AdminSettings**
- Archivo: `back/src/data/models/AdminSettings.js`
- Tabla: `admin_settings`
- Campos:
  - id (SERIAL PRIMARY KEY)
  - signatureUrl (VARCHAR 500)
  - createdAt, updatedAt (TIMESTAMPS)

**Nuevo Controlador: AdminSettingsController**
- Archivo: `back/src/controllers/AdminSettingsController.js`
- Endpoints:
  - `GET /api/admin/signature` - Obtener firma actual
  - `POST /api/admin/signature` - Guardar/actualizar firma
  - `DELETE /api/admin/signature` - Eliminar firma

**Nueva Ruta:**
- Archivo: `back/src/routes/adminSettings.js`
- Montada en: `/api/admin`

**Migración Ejecutada:**
- Archivo: `back/migrations/create-admin-settings.sql`
- ✅ Ejecutada en Neon PostgreSQL
- Tabla creada con registro inicial

### 📋 Flujo de Uso

1. **Crear Firma:**
   - Ir a `/signature-manager`
   - Dibujar firma en el canvas
   - Click en "Guardar Firma"
   - Se sube a Cloudinary y URL se guarda en BD

2. **Generar Recibo:**
   - Sistema carga automáticamente la firma
   - PDF se genera con firma insertada
   - Si no hay firma, muestra texto por defecto

3. **Actualizar/Eliminar:**
   - Desde `/signature-manager`
   - Botón "Eliminar Firma" para borrar
   - Crear nueva firma repite proceso

### 🔐 Variables de Entorno Requeridas

Ya configuradas en tu proyecto:
- `VITE_API_BASE_URL` - URL del backend
- `VITE_CLOUDINARY_CLOUD_NAME` - Nombre de cuenta Cloudinary

⚠️ **Importante:** Asegúrate de tener el upload preset `inmobiliaria` configurado en Cloudinary (unsigned).

### 🚀 Próximos Pasos

1. Acceder a `/signature-manager`
2. Crear la firma de la titular
3. Probar generación de recibo con firma
4. Commit y push a producción

### 📝 Notas Técnicas

- La firma se almacena como imagen PNG en Cloudinary
- Canvas se recorta automáticamente (trim) antes de subir
- Imagen se inserta en coordenadas (125, 210) con tamaño 50x15
- Manejo de CORS con `crossOrigin: 'Anonymous'`
- Carga asíncrona de imagen antes de generar PDF
