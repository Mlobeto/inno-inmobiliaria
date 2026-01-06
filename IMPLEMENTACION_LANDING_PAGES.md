# 🏠 Implementación de Landing Pages por Tenant

## 📋 Resumen Ejecutivo

Sistema que permite a cada inmobiliaria (tenant) con plan Professional/Enterprise tener su propia landing page pública en un subdominio personalizado donde pueden publicar propiedades seleccionadas y recibir contactos vía WhatsApp.

## 🎯 Características

- ✅ **URL personalizada**: `{subdomain}.innoinmobiliaria.com`
- ✅ **Selector por propiedad**: Checkbox "Publicar en Landing" en cada propiedad
- ✅ **Template responsivo**: Diseño moderno y mobile-first
- ✅ **WhatsApp directo**: Botón de contacto con mensaje pre-cargado de la propiedad
- ✅ **Sin autenticación**: Acceso público para visitantes
- ✅ **Información de empresa**: Logo, nombre, teléfono, WhatsApp del tenant

---

## 🗄️ Base de Datos

### 1. Campo en Properties
```sql
ALTER TABLE properties 
ADD COLUMN "isPublishedInLanding" BOOLEAN DEFAULT false;

COMMENT ON COLUMN properties."isPublishedInLanding" IS 'Si la propiedad está visible en la landing page pública del tenant';
```

### 2. Campo de WhatsApp en AdminSettings
```sql
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS company_whatsapp VARCHAR(50);

COMMENT ON COLUMN admin_settings.company_whatsapp IS 'Número de WhatsApp para contacto en landing (formato: +5491112345678)';
```

---

## 🔧 Backend

### Endpoints Públicos (sin auth)

#### `GET /api/public/:subdomain`
Información del tenant y propiedades publicadas

**Response:**
```json
{
  "success": true,
  "tenant": {
    "subdomain": "quintero-propiedades",
    "businessName": "Quintero Lobeto Propiedades",
    "phone": "+5491112345678",
    "whatsapp": "+5491112345678",
    "email": "contacto@quintero.com",
    "address": "Av. Principal 123",
    "logo": "https://cloudinary.com/...",
    "plan": "professional"
  },
  "properties": [
    {
      "id": 15,
      "title": "Casa 3 ambientes en Palermo",
      "address": "Av. Córdoba 1234",
      "price": "USD 250.000",
      "type": "venta",
      "images": ["url1", "url2"],
      "description": "...",
      "rooms": 3,
      "bathrooms": 2
    }
  ]
}
```

#### `GET /api/public/:subdomain/property/:id`
Detalle completo de una propiedad

#### `POST /api/public/:subdomain/contact`
Formulario de contacto (opcional - crea lead)

---

## 🎨 Frontend

### Rutas Públicas

1. **Landing del Tenant** → `/landing/:subdomain`
   - Header con logo y datos del tenant
   - Grid de propiedades publicadas
   - Filtros (venta/alquiler, precio)
   
2. **Detalle de Propiedad** → `/landing/:subdomain/property/:id`
   - Galería de imágenes
   - Información completa
   - Botón WhatsApp con mensaje pre-cargado

### Componentes Nuevos

```
front/src/Components/Landing/
  ├── TenantLanding.jsx       # Landing principal del tenant
  ├── PropertyCard.jsx        # Card de propiedad para grid
  ├── PropertyDetail.jsx      # Detalle de propiedad
  ├── ContactButton.jsx       # Botón de WhatsApp
  └── LandingHeader.jsx       # Header con info del tenant
```

---

## 🔨 Panel Admin - Cambios

### PanelPropiedades.jsx

Agregar columna con checkbox:
```jsx
<td className="px-4 py-3 text-center">
  <input
    type="checkbox"
    checked={propiedad.isPublishedInLanding}
    onChange={() => handleTogglePublish(propiedad.id)}
    disabled={!tenantHasLanding}
    className="w-5 h-5 text-green-600"
  />
  {tenantHasLanding ? (
    <span className="text-xs text-gray-500 ml-2">
      {propiedad.isPublishedInLanding ? 'Publicada' : 'No publicada'}
    </span>
  ) : (
    <span className="text-xs text-yellow-600 ml-2">
      Plan sin landing
    </span>
  )}
</td>
```

### CompanySettings.jsx

✅ Ya agregado: Campo `company_whatsapp`

---

## 📱 Mensaje de WhatsApp

Template automático cuando el usuario hace click desde la landing:

```
Hola! Vi esta propiedad en {businessName}:

📍 {address}
💰 {price}
🏠 {title}

Me gustaría tener más información.
```

**URL generada:**
```
https://wa.me/{whatsapp}?text={mensajeEncoded}
```

---

## 🚀 Plan de Implementación

### Fase 1: Base de Datos ✅
- [x] Migración `isPublishedInLanding` en properties
- [x] Campo `company_whatsapp` en admin_settings

### Fase 2: Backend
- [ ] Endpoint `GET /api/public/:subdomain`
- [ ] Endpoint `GET /api/public/:subdomain/property/:id`
- [ ] Middleware para resolver tenant desde subdomain
- [ ] Actualizar PropertyController para guardar `isPublishedInLanding`

### Fase 3: Frontend Admin
- [ ] Agregar checkbox en PanelPropiedades
- [ ] Endpoint para toggle publish
- [ ] Validar que tenant tenga landing habilitado

### Fase 4: Frontend Público
- [ ] Componente TenantLanding
- [ ] Componente PropertyDetail
- [ ] Ruta `/landing/:subdomain`
- [ ] Botón WhatsApp con mensaje automático

### Fase 5: Testing
- [ ] Crear propiedad de prueba
- [ ] Publicar en landing
- [ ] Verificar URL `{subdomain}.innoinmobiliaria.com`
- [ ] Probar botón de WhatsApp

---

## 🎨 Diseño de Referencia

### Landing Principal
```
┌─────────────────────────────────────────┐
│  [Logo] Quintero Propiedades            │
│  📞 +549... | ✉ contacto@...           │
├─────────────────────────────────────────┤
│                                         │
│  Encuentra tu próxima propiedad         │
│                                         │
│  [Filtros: Venta/Alquiler | Precio]   │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ Img  │ │ Img  │ │ Img  │           │
│  │ $$$  │ │ $$$  │ │ $$$  │           │
│  └──────┘ └──────┘ └──────┘           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📝 Notas Técnicas

1. **Subdominios en desarrollo**: Usar parámetro de ruta `/landing/:subdomain` en lugar de subdominio real
2. **Subdominios en producción**: Configurar DNS wildcard `*.innoinmobiliaria.com` → servidor
3. **Imágenes**: Usar primera imagen del array `images` como thumbnail
4. **SEO**: Agregar meta tags con título, descripción e imagen de la propiedad
5. **Performance**: Cachear datos del tenant (Redis en futuro)

---

## 🔐 Seguridad

- ✅ Sin autenticación en endpoints públicos
- ✅ Solo propiedades con `isPublishedInLanding=true`
- ✅ Solo tenants con `features.landingPage=true`
- ✅ Validar subdomain existe antes de mostrar
- ⚠️ Rate limiting en endpoints públicos (prevenir scraping)

---

## 🎯 Próximos Pasos

1. **Ahora**: Implementar endpoints backend
2. **Luego**: Crear componentes de landing
3. **Después**: Agregar analytics básico (vistas por propiedad)
4. **Futuro**: Formulario de contacto que cree leads
5. **Futuro**: Dashboard de métricas de landing

---

**Fecha de implementación**: Enero 2026  
**Estado**: 🚧 En desarrollo
