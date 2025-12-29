# 🏢 Sistema de Configuración de Inmobiliaria

## Problema Resuelto

**Antes:** Datos de la inmobiliaria hardcoded en el código  
**Ahora:** Configuración dinámica desde la base de datos

---

## 🗂️ Cambios Realizados

### 1️⃣ Backend

**Modelo actualizado:**
- ✅ `AdminSettings` ampliado con campos de empresa
- ✅ `company_name`, `company_address`, `company_phone`, etc.
- ✅ `tenant_id` preparado para multi-tenancy (Fase 1)

**Nuevos endpoints:**
```
GET  /api/admin/settings    → Obtener configuración
PUT  /api/admin/settings    → Actualizar configuración
```

### 2️⃣ Base de Datos

**Migración:** `migrations/add-company-settings.sql`

**Nuevos campos en `admin_settings`:**
- `company_name` - Nombre de la inmobiliaria
- `company_address` - Dirección física
- `company_phone` - Teléfono de contacto
- `company_email` - Email de contacto
- `company_registration` - Matrícula profesional
- `company_cuit` - CUIT de la empresa
- `company_logo_url` - URL del logo (Cloudinary)
- `contract_footer_text` - Texto adicional para contratos
- `tenant_id` - Para multi-tenancy (futuro)
- `additional_config` - JSONB para config flexible

### 3️⃣ Frontend

**Nuevo componente:** `CompanySettings.jsx`
- Formulario para configurar la inmobiliaria
- Validación de campos
- Preview del logo
- Diseño responsive

**Nueva ruta:** `/company-settings`

---

## 🚀 Cómo Usar

### 1. Ejecutar Migración de BD

```bash
# Opción A: Script automático
bash ejecutar-migracion-company-settings.sh

# Opción B: Manual con psql
psql $DATABASE_URL -f back/migrations/add-company-settings.sql
```

### 2. Acceder al Frontend

```
http://localhost:5173/company-settings
```

### 3. Completar Datos

Rellenar formulario con:
- Nombre de tu inmobiliaria
- Dirección
- Teléfono
- Email
- Matrícula
- CUIT
- Logo (URL de Cloudinary)

### 4. Usar en Contratos

Los datos configurados se usarán automáticamente en:
- Contratos de alquiler
- Contratos de venta
- Recibos
- Autorizaciones
- Documentos generados

---

## 📝 Uso en Componentes

### Cargar configuración:

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const loadCompanySettings = async () => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_URL}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data;
  // {
  //   company_name: "Inmobiliaria Del Centro",
  //   company_address: "Calle 123, Ciudad",
  //   company_phone: "+54 9 XXX XXX-XXXX",
  //   ...
  // }
};
```

### Usar en PDFs:

```javascript
// En ContratoAlquiler.jsx, ReciboPdf.jsx, etc.
const [settings, setSettings] = useState(null);

useEffect(() => {
  loadCompanySettings().then(setSettings);
}, []);

// Luego usar:
<Text>{settings.company_name}</Text>
<Text>{settings.company_address}</Text>
```

---

## 🔐 Variables de Entorno (VITE)

**Crear archivo:** `QL Front/.env.local`

```env
# API Backend
VITE_API_URL=http://localhost:3001/api

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=tu-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=tu-preset

# Desarrollo
VITE_ENV=development
```

**Uso en código:**
```javascript
const API_URL = import.meta.env.VITE_API_URL;
// ✅ Correcto para Vite

// ❌ NO usar:
// const API_URL = process.env.REACT_APP_API_URL; // Esto es para Create React App
```

---

## 🎯 Multi-Tenancy (Futuro - Fase 1)

El campo `tenant_id` ya está preparado para cuando implementes multi-tenancy:

```javascript
// Futuro: cada tenant tendrá su configuración
GET /api/admin/settings?tenant_id=xxx

// O inferir del subdominio
GET /api/admin/settings
// Header: X-Tenant-ID: xxx
```

---

## 🧪 Testing

### Probar endpoints:

```bash
# Obtener configuración
curl http://localhost:3001/api/admin/settings \
  -H "Authorization: Bearer TOKEN"

# Actualizar configuración
curl -X PUT http://localhost:3001/api/admin/settings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Mi Inmobiliaria",
    "company_email": "info@miinmo.com"
  }'
```

---

## ✅ Checklist de Implementación

- [x] Actualizar modelo AdminSettings
- [x] Crear migración SQL
- [x] Actualizar controller con nuevos endpoints
- [x] Agregar rutas en express
- [x] Crear componente CompanySettings.jsx
- [x] Agregar ruta en React Router
- [ ] **TODO:** Ejecutar migración en tu BD
- [ ] **TODO:** Acceder a /company-settings y configurar
- [ ] **TODO:** Actualizar PDFs para usar los settings dinámicos
- [ ] **TODO:** Agregar link en navbar para acceder a settings

---

## 🔗 Próximos Pasos

1. **Agregar link al navbar:**
```jsx
// En Panel.jsx o Navbar
<Link to="/company-settings">
  <IoSettingsOutline /> Configuración
</Link>
```

2. **Usar settings en contratos:**
Reemplazar valores hardcoded por `settings.company_name`, etc.

3. **Subir logo a Cloudinary:**
Agregar upload widget en el formulario

4. **Multi-tenancy (Fase 1):**
Filtrar por `tenant_id` en los queries

---

**Estado:** ✅ Funcional (solo falta ejecutar migración)  
**Última actualización:** Diciembre 29, 2025
