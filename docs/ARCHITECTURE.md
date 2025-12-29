# 🏗️ Arquitectura Multi-Tenant SaaS

## Decisiones Técnicas - Diciembre 2025

### 1. Multi-Tenancy: Tenant ID por Tabla ✅

**Decisión:** Usar `tenant_id` en cada tabla (Shared Database, Shared Schema)

**Razones:**
- ✅ **Costo-efectivo**: Una sola base de datos PostgreSQL
- ✅ **Mantenimiento simple**: Migraciones y backups centralizados
- ✅ **Escalabilidad inicial**: Suficiente para 100-500 tenants
- ✅ **Joins eficientes**: Relaciones entre tablas sin complejidad
- ⚠️ **Riesgo de data leakage**: Mitigado con middleware estricto

**Implementación:**
```sql
-- Todas las tablas incluyen:
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- ... otros campos
  CONSTRAINT tenant_isolation CHECK (tenant_id IS NOT NULL)
);

-- Índices compuestos para performance
CREATE INDEX idx_properties_tenant ON properties(tenant_id, created_at DESC);
```

**Middleware de Tenant Isolation:**
```javascript
// Extrae tenant_id del subdominio y lo inyecta en req
app.use(tenantMiddleware);

// Todos los queries incluyen automáticamente:
WHERE tenant_id = req.tenantId
```

**Alternativas descartadas:**
- ❌ Separate Database per Tenant: Costo prohibitivo, complejidad operacional
- ❌ Separate Schema per Tenant: Límite de ~1000 schemas en Postgres

---

### 2. Subdominios: `cliente.inno.app` ✅

**Decisión:** Usar subdominios para identificar tenants

**Implementación:**
```
cliente1.inno.app → tenant_id = "uuid-cliente1"
cliente2.inno.app → tenant_id = "uuid-cliente2"
app.inno.app → Super Admin dashboard
```

**DNS Setup:**
```
# Wildcard DNS
*.inno.app → CNAME → app-backend.render.com
```

**Código de resolución:**
```javascript
function extractTenantFromSubdomain(req) {
  const host = req.headers.host; // "cliente1.inno.app"
  const subdomain = host.split('.')[0];
  
  if (subdomain === 'app' || subdomain === 'www') {
    return null; // Super Admin o landing principal
  }
  
  // Buscar tenant en BD por subdomain
  const tenant = await Tenant.findOne({ where: { subdomain } });
  if (!tenant) throw new Error('Tenant not found');
  
  return tenant.id;
}
```

**Ventajas:**
- ✅ URLs profesionales y memorables
- ✅ Aislamiento visual claro
- ✅ SEO independiente por tenant
- ✅ Custom domains fáciles (`www.inmobiliariacliente.com` → CNAME)

---

### 3. Mobile: Expo React Native (iOS/Android/Web) ✅

**Decisión:** Una sola codebase Expo para 3 plataformas

**Stack:**
```
Expo SDK 51+ (React Native 0.74+)
├── Expo Router (file-based navigation)
├── NativeWind (Tailwind CSS para React Native)
├── Redux Toolkit (estado global)
├── Expo Secure Store (tokens)
└── EAS Build (compilación nativa)
```

**Estructura de navegación:**
```
mobile/app/
├── (auth)/              # Stack no autenticado
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/              # Tabs autenticadas
│   ├── _layout.tsx
│   ├── properties.tsx
│   ├── clients.tsx
│   ├── dashboard.tsx
│   └── settings.tsx
└── _layout.tsx          # Root layout
```

**Build Configuration:**
```json
// eas.json
{
  "build": {
    "production": {
      "ios": { "bundleIdentifier": "com.inno.app" },
      "android": { "package": "com.inno.app" }
    }
  }
}
```

**Migración desde Web:**
| Web (QL Front) | Mobile (Expo) | Estrategia |
|----------------|---------------|------------|
| React Router | Expo Router | Cambiar a file-based |
| Tailwind CSS | NativeWind | Migrar clases (95% compatible) |
| localStorage | AsyncStorage / SecureStore | Abstracción de storage |
| `<div>` | `<View>` | Componentes base |
| `<img>` | `<Image>` | Expo Image optimizado |

---

### 4. Landing Page: Integrada en Proyecto Principal ✅

**Decisión:** Landing dentro del monorepo, no Next.js separado

**Razones:**
- ✅ Reutilización de componentes
- ✅ Mismo bundle de dependencias
- ✅ Deploy simplificado
- ✅ Compartir estado/auth si es necesario

**Arquitectura:**
```
Expo Web Build (mobile/web-build/)
└── Rutas públicas
    ├── /[tenant]/           # Landing de cada tenant
    │   ├── index            # Home con propiedades
    │   ├── propiedad/[id]   # Detalle de propiedad
    │   └── contacto         # Formulario lead
    └── /dashboard           # App autenticada (privada)
```

**SEO con Expo Web:**
```javascript
// app/[tenant]/index.tsx
export async function getServerSideProps({ params }) {
  const tenant = await fetchTenant(params.tenant);
  const properties = await fetchProperties(tenant.id);
  
  return {
    props: { tenant, properties },
    metadata: {
      title: `${tenant.name} - Propiedades`,
      description: tenant.description
    }
  };
}
```

**Alternativa futura:** Si SEO es crítico, migrar landing a Next.js standalone

---

### 5. Sistema de Roles: RBAC Simplificado ✅

**Roles:**
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',  // Gestión global (sin tenant_id)
  OWNER = 'owner',               // Admin del tenant
  AGENT = 'agent'                // Usuario limitado del tenant
}
```

**Matriz de Permisos:**

| Recurso | SUPER_ADMIN | OWNER | AGENT |
|---------|-------------|-------|-------|
| Tenants (global) | ✅ CRUD | ❌ | ❌ |
| Propiedades | ✅ Ver todas | ✅ CRUD | ✅ CRUD (solo asignadas) |
| Clientes | ✅ Ver todas | ✅ CRUD | ✅ CRUD |
| Contratos | ✅ Ver todas | ✅ CRUD | ✅ CRUD |
| Balance/Pagos | ✅ Ver todas | ✅ Ver todo | ❌ **Sin acceso** |
| Configuración | ✅ Global | ✅ Tenant | ❌ |
| Usuarios del tenant | ✅ | ✅ CRUD | ❌ Ver solo |
| Leads | ✅ Ver todas | ✅ Ver todo | ✅ Solo asignados |

**Implementación:**
```javascript
// Middleware de autorización
function authorize(resource, action) {
  return async (req, res, next) => {
    const { user } = req;
    
    // Super admin puede todo
    if (user.role === 'SUPER_ADMIN') return next();
    
    // Owner puede todo en su tenant
    if (user.role === 'OWNER' && resource !== 'tenants') {
      return next();
    }
    
    // Agent tiene restricciones
    if (user.role === 'AGENT') {
      if (resource === 'balance' || resource === 'payments') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      // Validar que el recurso pertenece al agent
      // ... lógica de ownership
    }
    
    return next();
  };
}

// Uso en rutas
router.get('/balance', 
  authenticate, 
  authorize('balance', 'read'), 
  getBalance
);
```

---

### 6. Planes y Suscripciones: Modelo Modular ✅

**Tabla `subscriptions`:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Plan base
  base_plan VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
  base_status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'past_due'
  
  -- Add-ons activos (JSON)
  addons JSONB DEFAULT '[]', 
  -- Ejemplo: ["landing_page", "mercadolibre", "extra_agents"]
  
  -- Límites calculados
  max_properties INTEGER NOT NULL DEFAULT 50,
  max_users INTEGER NOT NULL DEFAULT 2,
  has_landing BOOLEAN DEFAULT false,
  has_ml_integration BOOLEAN DEFAULT false,
  
  -- Facturación
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
  next_billing_date DATE NOT NULL,
  amount_cents INTEGER NOT NULL, -- Precio en centavos
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- MercadoPago
  mp_subscription_id VARCHAR(255),
  mp_status VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Cálculo de precios:**
```javascript
function calculateSubscriptionPrice(basePlan, addons, billingCycle) {
  let price = PLANS[basePlan].price;
  
  addons.forEach(addon => {
    price += ADDONS[addon].price;
  });
  
  // Descuento anual (2 meses gratis)
  if (billingCycle === 'yearly') {
    price = price * 10; // 10 meses de pago
  }
  
  return price;
}

const PLANS = {
  free: { price: 0, max_properties: 10, max_users: 1 },
  pro: { price: 4900, max_properties: 50, max_users: 2 },
  enterprise: { price: null } // Contactar
};

const ADDONS = {
  landing_page: { price: 1900 },
  mercadolibre: { price: 2900 },
  extra_agent: { price: 900 } // Por agente adicional
};
```

---

### 7. Integración Mercado Libre

**OAuth 2.0 Flow:**
```javascript
// 1. Redirect a ML para autorización
GET https://auth.mercadolibre.com/authorization?
  client_id={APP_ID}
  &response_type=code
  &redirect_uri=https://app.inno.app/ml/callback

// 2. ML redirige con código
GET https://app.inno.app/ml/callback?code=AUTH_CODE

// 3. Intercambiar por access token
POST https://api.mercadolibre.com/oauth/token
{
  grant_type: 'authorization_code',
  client_id: APP_ID,
  client_secret: APP_SECRET,
  code: AUTH_CODE,
  redirect_uri: REDIRECT_URI
}

// 4. Guardar tokens por tenant
UPDATE tenants SET 
  ml_access_token = 'encrypted_token',
  ml_refresh_token = 'encrypted_refresh',
  ml_expires_at = NOW() + INTERVAL '6 hours'
WHERE id = tenant_id;
```

**Sincronización de Propiedades:**
```javascript
async function syncPropertyToML(property, tenant) {
  const mlPayload = {
    title: property.title,
    category_id: 'MLC1459', // Inmuebles
    price: property.price,
    currency_id: 'ARS',
    available_quantity: 1,
    buying_mode: property.type === 'venta' ? 'buy' : 'classified',
    listing_type_id: 'gold_special',
    condition: 'not_specified',
    description: property.description,
    pictures: property.images.map(url => ({ source: url })),
    attributes: [
      { id: 'BEDROOMS', value_name: property.bedrooms },
      { id: 'BATHROOMS', value_name: property.bathrooms },
      { id: 'TOTAL_AREA', value_name: property.surface, unit: 'm²' }
    ]
  };
  
  const response = await mlApi.post('/items', mlPayload, {
    headers: { Authorization: `Bearer ${tenant.ml_access_token}` }
  });
  
  // Guardar ML item ID
  await property.update({ ml_item_id: response.data.id });
}
```

**Webhook para Leads:**
```javascript
// ML envía notificaciones a:
POST https://app.inno.app/webhooks/mercadolibre

{
  topic: 'questions',
  resource: '/questions/12345',
  user_id: 'tenant_ml_user_id'
}

// Procesamos:
async function handleMLQuestion(notification) {
  const question = await mlApi.get(notification.resource);
  const tenant = await Tenant.findOne({ 
    where: { ml_user_id: notification.user_id } 
  });
  
  // Crear lead
  await Lead.create({
    tenant_id: tenant.id,
    source: 'mercadolibre',
    name: question.from.nickname,
    email: null, // ML no provee email
    message: question.text,
    property_id: findPropertyByMLItemId(question.item_id),
    ml_question_id: question.id
  });
  
  // Notificar al Owner/Agent
  await sendNotification(tenant, 'Nueva consulta de MercadoLibre');
}
```

---

### 8. Seguridad Multi-Tenant

**Principios:**
1. **Tenant Isolation**: Nunca confiar en client-side tenant_id
2. **Validación en cada query**: Siempre filtrar por tenant_id del token
3. **Auditoría**: Logs de acceso cross-tenant

**Middleware de Seguridad:**
```javascript
// Sequelize Global Scope
Tenant.addScope('defaultScope', (tenantId) => ({
  where: { tenant_id: tenantId }
}));

// Aplicar automáticamente
Property.findAll(); // ❌ Prohibido sin tenant_id

// Forzar tenant_id en todos los queries
sequelize.addHook('beforeFind', (options) => {
  if (!options.where) options.where = {};
  options.where.tenant_id = getCurrentTenantId();
});

// Tests de penetración
describe('Tenant Isolation', () => {
  it('should not access other tenant data', async () => {
    const tenant1Token = generateToken({ tenantId: 'uuid1' });
    const tenant2Property = await Property.create({ tenant_id: 'uuid2' });
    
    const res = await request(app)
      .get(`/properties/${tenant2Property.id}`)
      .set('Authorization', `Bearer ${tenant1Token}`);
    
    expect(res.status).toBe(404); // ✅ No debe ver propiedad de otro tenant
  });
});
```

---

### 9. Performance y Escalabilidad

**Database Indexing:**
```sql
-- Índices críticos
CREATE INDEX idx_properties_tenant_date ON properties(tenant_id, created_at DESC);
CREATE INDEX idx_clients_tenant_email ON clients(tenant_id, email);
CREATE INDEX idx_leases_tenant_status ON leases(tenant_id, status);

-- Particionamiento futuro (cuando > 10M rows)
CREATE TABLE properties (
  -- ...
) PARTITION BY LIST (tenant_id);
```

**Caching:**
```javascript
// Redis para datos de tenant
const tenantCache = await redis.get(`tenant:${subdomain}`);
if (tenantCache) return JSON.parse(tenantCache);

const tenant = await Tenant.findOne({ where: { subdomain } });
await redis.setex(`tenant:${subdomain}`, 3600, JSON.stringify(tenant));
```

**Throttling por Tenant:**
```javascript
const rateLimit = require('express-rate-limit');

const tenantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    // Límites según plan
    const plan = req.tenant.subscription.base_plan;
    return { free: 100, pro: 1000, enterprise: 10000 }[plan];
  },
  keyGenerator: (req) => req.tenantId
});
```

---

### 10. Monitoreo y Observabilidad

**Métricas clave:**
- Requests por tenant
- Database query time por tenant
- Errores por tenant
- Storage usage por tenant
- API rate limit hits

**Sentry Context:**
```javascript
Sentry.setContext('tenant', {
  id: req.tenantId,
  subdomain: req.tenant.subdomain,
  plan: req.tenant.subscription.base_plan
});
```

**Alertas:**
- Cross-tenant data access attempt
- Tenant exceeding plan limits
- ML API integration failures
- Payment failures

---

## 📊 Estimaciones de Capacidad

**Con 1 instancia PostgreSQL (4GB RAM):**
- ~500 tenants activos
- ~50,000 propiedades totales
- ~500,000 clientes
- 1,000 requests/min

**Costo estimado:**
- DB: $25/mes (Render PostgreSQL)
- Backend: $15/mes (Render)
- Storage: $10/mes (Cloudinary)
- **Total: ~$50/mes** para 100-500 tenants

---

## 🔄 Próximos Pasos

1. ✅ Implementar modelo Tenant y migraciones
2. ⏳ Middleware de tenant isolation
3. ⏳ Sistema de roles RBAC
4. ⏳ Migración a Expo React Native
5. ⏳ Landing page por tenant
6. ⏳ Sistema de leads
7. ⏳ Integración MercadoLibre
8. ⏳ Sistema de suscripciones

**Última actualización:** Diciembre 29, 2025
