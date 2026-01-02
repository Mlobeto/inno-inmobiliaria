# 🗺️ Roadmap: Sistema Multitenant + Admin Platform

## 📋 Resumen del Proyecto

**Objetivo:** Convertir la aplicación inmobiliaria en una plataforma SaaS multitenant con panel de administrador para gestión de suscripciones, ingresos y gastos.

**Arquitectura:**
- **Backend:** Railway + Neon PostgreSQL
- **Frontend Web:** Vercel (React + Vite)
- **Frontend Mobile:** React Native (futuro)
- **Shared:** Redux + utilidades compartidas entre web y mobile

---

## ✅ COMPLETADO (Fase 1: Base SaaS)

### Backend - Sistema de Suscripciones
- ✅ Modelos creados: `Plan.js`, `Subscription.js`
- ✅ Controlador: `SubscriptionController.js` (7 endpoints)
- ✅ Middleware: `subscriptionMiddleware.js` (checkSubscription, checkFeature, checkLimit)
- ✅ Rutas: `/subscriptions/*` y `/webhooks/mercadopago`
- ✅ MercadoPago TEST integrado:
  - Access Token: `TEST-173830050006611-123014...`
  - Public Key: `TEST-65661770-62ff-482b-9538-a69efdba585b`
- ✅ Planes sincronizados con MercadoPago:
  - Basic: $9900 ARS/mes (14 días trial)
  - Professional: $29900 ARS/mes (14 días trial)
  - Enterprise: $69900 ARS/mes (14 días trial)
- ✅ Webhook handler funcionando en `/webhooks/mercadopago`

### Base de Datos
- ✅ Migraciones ejecutadas en Neon PostgreSQL
- ✅ Tablas creadas: `plans`, `subscriptions`, `tenants`, `pdf_templates`
- ✅ 4 planes en BD: free, basic, professional, enterprise
- ✅ Índices y constraints configurados

### Deployment
- ✅ Backend deployado en Railway: `https://inno-inmobiliaria-production.up.railway.app`
- ✅ Base de datos en Neon (PostgreSQL serverless)
- ✅ Frontend deployado en Vercel
- ✅ Variables de entorno configuradas
- ✅ CORS configurado para Vercel

### Endpoints Funcionando
- ✅ `GET /subscriptions/plans` - Listar planes públicos
- ✅ `GET /subscriptions/current` - Suscripción activa del tenant
- ✅ `POST /subscriptions/create-subscription` - Crear suscripción
- ✅ `POST /subscriptions/cancel` - Cancelar suscripción
- ✅ `POST /subscriptions/change-plan` - Cambiar de plan
- ✅ `POST /subscriptions/start-trial` - Iniciar trial
- ✅ `POST /webhooks/mercadopago` - Webhook de pagos

---

## 🚧 EN PROGRESO (Fase 2: Multitenant)

### Sprint 1: Multitenant Backend ✅ COMPLETADO

#### Controllers Actualizados con tenantId (10/10)
- ✅ ClientController (5 operaciones)
- ✅ PropertyController (7+ operaciones)
- ✅ LeaseController (5 operaciones)
- ✅ PaymentController (6 operaciones)
- ✅ AdminSettingsController (5 operaciones)
- ✅ garantorController (3 operaciones)
- ✅ PdfController (7 operaciones)
- ✅ TenantController (5 operaciones)
- ✅ importController (2 operaciones)
- ✅ addPropertyToClientController (3 operaciones)

**Estado:** ✅ Todos los controladores ahora inyectan `tenantId` desde `req.user.tenantId`

#### Roles y Permisos ✅ COMPLETADO
```javascript
PLATFORM_ADMIN (tenantId = NULL)
├── Dueño de la plataforma InnoInmo
├── Acceso a todos los tenants
├── Dashboard de métricas globales
└── Gestión de suscripciones

SUPER_ADMIN (tenantId = X)
├── Dueño de una inmobiliaria
├── Acceso solo a sus datos
├── Gestión de agentes
└── Configuración del tenant

AGENT (tenantId = X)
├── Empleado de una inmobiliaria
├── Acceso limitado a propiedades asignadas
└── CRUD básico
```

**Admin Platform Owner creado:**
- ✅ adminId: 2
- ✅ username: platform_admin
- ✅ email: admin@innoinmo.com
- ✅ role: PLATFORM_ADMIN
- ✅ tenantId: NULL

#### PlatformAdminController ✅ CREADO
**Endpoints implementados (9):**
- ✅ `GET /platform-admin/dashboard` - Métricas generales
- ✅ `GET /platform-admin/metrics` - Growth, engagement, retention
- ✅ `GET /platform-admin/revenue` - MRR, ARR, revenue por plan
- ✅ `GET /platform-admin/tenants` - Lista con paginación y filtros
- ✅ `GET /platform-admin/tenants/:id` - Detalle de tenant
- ✅ `PUT /platform-admin/tenants/:id` - Actualizar tenant
- ✅ `POST /platform-admin/tenants/:id/suspend` - Suspender
- ✅ `POST /platform-admin/tenants/:id/activate` - Reactivar
- ✅ `GET /platform-admin/subscriptions` - Lista global de suscripciones

**Rutas configuradas:**
- ✅ `/platform-admin/*` protegidas con `isPlatformAdmin`
- ✅ Rutas de tenants protegidas con `requireTenantScope`
- ✅ Rutas públicas: `/auth`, `/webhooks`

### Sprint 2: Frontend Platform Admin ⏳ PENDIENTE

#### Páginas a crear:
- [ ] PlatformDashboard - Vista general con métricas
- [ ] TenantsList - Tabla con búsqueda y filtros
- [ ] TenantDetail - Vista detallada de un tenant
- [ ] SubscriptionsList - Lista global de suscripciones
- [ ] RevenueAnalytics - Gráficos de ingresos
- [ ] MetricsPage - KPIs avanzados

### 1. Migración Multitenant - Backend

#### 1.1 Tabla Tenants
```sql
-- Ya existe en BD desde migración multitenant-migration.sql
CREATE TABLE tenants (
  "tenantId" SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  subdomain VARCHAR(100) UNIQUE,
  "isActive" BOOLEAN DEFAULT true,
  "signatureUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Estado:** ✅ Tabla creada en Neon
**Pendiente:** 
- [ ] Poblar con tenants de prueba
- [ ] Migrar datos existentes a tenant default

#### 1.2 Agregar tenantId a Todas las Tablas
**Estado:** ✅ COMPLETADO - 14 tablas con tenantId

**Tablas con tenantId:**
```javascript
✅ Admins
✅ ClientProperties  
✅ Clients
✅ Commissions
✅ Leases
✅ Property
✅ pdf_templates
✅ subscriptions
✅ tenants
✅ garantors         // ✨ Migrado: 2026-01-02
✅ payment_receipts  // ✨ Migrado: 2026-01-02
✅ rent_updates      // ✨ Migrado: 2026-01-02
✅ sale_contracts    // ✨ Migrado: 2026-01-02
✅ admin_settings    // ✨ Migrado: 2026-01-02
```

**Acción:**
1. ✅ Verificar qué tablas ya tienen `tenantId` (9 tablas)
2. ✅ Agregar `tenantId` a las 5 restantes
3. ✅ Crear índices en `tenantId` para performance
4. ✅ Agregar foreign keys a `tenants(tenantId)` con CASCADE
5. [ ] Poblar tenantId en registros existentes (próximo paso)

#### 1.3 Middleware de Tenancy
**Archivo:** `back/src/middlewares/tenancyMiddleware.js`

**Estado:** ✅ Ya existe
**Funcionalidad:**
- Detecta tenant por subdominio o header
- Inyecta `tenantId` en `req.user`
- Valida suscripción activa
- Verifica límites del plan

**Pendiente:**
- [ ] Probar con subdominios reales
- [ ] Manejar tenant "default" para desarrollo
- [ ] Agregar cache de configuración por tenant

#### 1.4 Modificar Modelos Sequelize
**Estado:** 🚧 EN PROGRESO

**Acción:** Agregar campo tenantId y scope global para filtrar por tenant

```javascript
// Ejemplo para cada modelo:
const Client = sequelize.define('Client', {
  // ... campos existentes
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'tenantId'
    }
  }
}, {
  defaultScope: {
    // Filtrar automáticamente por tenant en todas las queries
    where: sequelize.literal('"Client"."tenantId" = current_setting(\'app.current_tenant_id\')::int')
  },
  scopes: {
    byTenant: (tenantId) => ({
      where: { tenantId }
    })
  }
});
```

**Modelos a modificar:**
- ✅ Admin.js (scope byTenant agregado)
- ✅ Client.js (scope byTenant agregado)
- ✅ Property.js (scope byTenant agregado)
- ✅ Lease.js (scope byTenant agregado)
- ✅ Garantor.js (tenantId + scope agregado - 2026-01-02)
- ✅ paymentReceipt.js (tenantId + scope agregado - 2026-01-02)
- ✅ PdfTemplate.js (scope byTenant agregado)
- ✅ SaleContract.js (scope byTenant agregado - 2026-01-02)
- ✅ RentUpdate.js (tenantId + scope agregado - 2026-01-02)
- ✅ AdminSettings.js (tenantId migrado de UUID a INTEGER + scope - 2026-01-02)

#### 1.5 Modificar Controladores
**Acción:** Inyectar `tenantId` de `req.user` en todas las operaciones CRUD

**Ejemplo:**
```javascript
// ANTES:
const clients = await Client.findAll();

// DESPUÉS:
const { tenantId } = req.user;
const clients = await Client.findAll({ where: { tenantId } });
```

**Controladores a modificar:**
- ✅ ClientController.js (5 operaciones actualizadas - 2026-01-02)
  - createClient, getAllClients, getClientById, updateClient, deleteClient
- ✅ PropertyController.js (7+ operaciones actualizadas - 2026-01-02)
  - createProperty, getPropertiesByType, updateProperty, deleteProperty, filterProperties, getAllProperties, getPropertyById
- ✅ LeaseController.js (5 operaciones principales actualizadas - 2026-01-02)
  - createLease, getAllLeases, getLeaseById, terminateLease, checkPendingPayments
- [ ] PaymentController.js (PRÓXIMO)
- [ ] AdminSettingsController.js
- [ ] TenantController.js
- [ ] PdfController.js

---

### 2. Frontend - Unificación Redux en Shared

#### 2.1 Estructura Actual
```
front/src/redux/
  ├── slices/
  │   ├── authSlice.js
  │   ├── clientSlice.js
  │   ├── propertySlice.js
  │   ├── leaseSlice.js
  │   └── ...
  └── store.js

mobile/src/store/
  ├── slices/
  └── store.ts
```

#### 2.2 Nueva Estructura Propuesta
```
shared/src/redux/
  ├── slices/
  │   ├── authSlice.js          # 🔄 Compartido web + mobile
  │   ├── clientSlice.js        # 🔄 Compartido web + mobile
  │   ├── propertySlice.js      # 🔄 Compartido web + mobile
  │   ├── leaseSlice.js         # 🔄 Compartido web + mobile
  │   ├── subscriptionSlice.js  # 🆕 Nueva (solo web)
  │   └── adminSlice.js         # 🆕 Nueva (solo web admin)
  ├── store.js                  # 🔄 Store base compartido
  └── api/                      # 🔄 RTK Query endpoints compartidos

front/src/redux/
  ├── webStore.js               # Store específico de web (importa de shared)
  └── webOnlySlices/            # Slices exclusivos de web

mobile/src/store/
  ├── mobileStore.js            # Store específico de mobile (importa de shared)
  └── mobileOnlySlices/         # Slices exclusivos de mobile
```

#### 2.3 Migración de Redux
**Slices a migrar a Shared:**
- [ ] authSlice - Autenticación y usuario
- [ ] clientSlice - Gestión de clientes
- [ ] propertySlice - Gestión de propiedades
- [ ] leaseSlice - Gestión de alquileres
- [ ] paymentSlice - Gestión de pagos

**Slices nuevos a crear:**
- [ ] subscriptionSlice - Estado de suscripción del tenant
- [ ] tenantSlice - Información del tenant actual
- [ ] adminSlice - Panel de administrador (solo web)

#### 2.4 API Layer con RTK Query
```javascript
// shared/src/redux/api/baseApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.VITE_API_URL || 'http://localhost:3001',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Client', 'Property', 'Lease', 'Payment', 'Subscription', 'Admin'],
  endpoints: () => ({}),
});
```

**Endpoints a crear:**
- [ ] clientApi - CRUD clientes
- [ ] propertyApi - CRUD propiedades
- [ ] leaseApi - CRUD alquileres
- [ ] paymentApi - CRUD pagos
- [ ] subscriptionApi - Suscripciones y planes
- [ ] adminApi - Estadísticas y gestión (panel admin)

---

## 🆕 FASE 3: Panel de Administrador de Plataforma

### Objetivo
Crear un panel administrativo **SOLO PARA WEB** (responsive) donde el super admin de la plataforma pueda:
1. Ver todas las suscripciones activas
2. Gestionar tenants
3. Ver ingresos y gastos de la plataforma
4. Estadísticas globales
5. Gestión de planes y precios

### 3.1 Backend - Admin Platform API

#### 3.1.1 Nuevo Controlador: PlatformAdminController.js
```javascript
// back/src/controllers/PlatformAdminController.js

class PlatformAdminController {
  
  // Dashboard principal
  async getDashboard(req, res) {
    // Retornar:
    // - Total de tenants activos
    // - Total de suscripciones por plan
    // - Ingresos del mes actual
    // - Ingresos proyectados
    // - Gráficos de crecimiento
  }
  
  // Gestión de Tenants
  async listTenants(req, res) { }
  async getTenantDetail(req, res) { }
  async updateTenant(req, res) { }
  async suspendTenant(req, res) { }
  async activateTenant(req, res) { }
  
  // Gestión de Suscripciones
  async listSubscriptions(req, res) { }
  async getSubscriptionDetail(req, res) { }
  async cancelSubscription(req, res) { }
  async changeSubscriptionPlan(req, res) { }
  
  // Ingresos y Gastos
  async getRevenue(req, res) {
    // Filtros: fecha desde, fecha hasta, plan, estado
    // Retornar ingresos totales, por plan, por mes
  }
  
  async getExpenses(req, res) {
    // Gastos de infraestructura:
    // - Railway
    // - Neon DB
    // - Cloudinary
    // - MercadoPago comisiones
  }
  
  // Estadísticas
  async getMetrics(req, res) {
    // MRR (Monthly Recurring Revenue)
    // ARR (Annual Recurring Revenue)
    // Churn rate
    // LTV (Lifetime Value)
    // CAC (Customer Acquisition Cost)
  }
  
  // Gestión de Planes
  async updatePlanPricing(req, res) { }
  async togglePlanVisibility(req, res) { }
  async createPlan(req, res) { }
}
```

#### 3.1.2 Nuevo Modelo: PlatformExpense.js
```javascript
// back/src/data/models/PlatformExpense.js

const PlatformExpense = sequelize.define('PlatformExpense', {
  expenseId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  category: {
    type: DataTypes.ENUM('infrastructure', 'marketing', 'operations', 'development'),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING(100),
    // 'railway', 'neon', 'cloudinary', 'mercadopago', 'ads', etc.
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'ARS'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPeriod: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: true
  }
});
```

#### 3.1.3 Nuevas Rutas
```javascript
// back/src/routes/platformAdmin.js

router.use(isPlatformAdmin); // Middleware de autorización

// Dashboard
router.get('/dashboard', PlatformAdminController.getDashboard);

// Tenants
router.get('/tenants', PlatformAdminController.listTenants);
router.get('/tenants/:tenantId', PlatformAdminController.getTenantDetail);
router.put('/tenants/:tenantId', PlatformAdminController.updateTenant);
router.post('/tenants/:tenantId/suspend', PlatformAdminController.suspendTenant);
router.post('/tenants/:tenantId/activate', PlatformAdminController.activateTenant);

// Suscripciones
router.get('/subscriptions', PlatformAdminController.listSubscriptions);
router.get('/subscriptions/:subscriptionId', PlatformAdminController.getSubscriptionDetail);

// Finanzas
router.get('/revenue', PlatformAdminController.getRevenue);
router.get('/expenses', PlatformAdminController.getExpenses);
router.post('/expenses', PlatformAdminController.createExpense);
router.get('/metrics', PlatformAdminController.getMetrics);

// Planes
router.put('/plans/:planId', PlatformAdminController.updatePlanPricing);
router.post('/plans', PlatformAdminController.createPlan);
```

#### 3.1.4 Middleware: isPlatformAdmin
```javascript
// back/src/middlewares/platformAdminMiddleware.js

const isPlatformAdmin = async (req, res, next) => {
  try {
    const { role, email } = req.user;
    
    // Solo super admins pueden acceder
    if (role !== 'platform_admin') {
      return res.status(403).json({
        error: 'Acceso denegado. Requiere rol de Platform Admin.'
      });
    }
    
    // Opcional: verificar email en whitelist
    const allowedEmails = process.env.PLATFORM_ADMIN_EMAILS?.split(',') || [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      return res.status(403).json({
        error: 'Email no autorizado para Platform Admin.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};
```

---

### 3.2 Frontend - Panel Admin (Solo Web)

#### 3.2.1 Nueva Ruta: /platform-admin
```
front/src/Admin/Platform/
  ├── PlatformAdminLayout.jsx          # Layout con sidebar
  ├── Dashboard/
  │   ├── DashboardPage.jsx            # Vista principal con KPIs
  │   ├── RevenueChart.jsx             # Gráfico de ingresos
  │   ├── SubscriptionsChart.jsx       # Distribución de suscripciones
  │   └── MetricsCards.jsx             # Tarjetas con métricas
  ├── Tenants/
  │   ├── TenantsListPage.jsx          # Lista de todos los tenants
  │   ├── TenantDetailPage.jsx         # Detalle de un tenant
  │   └── TenantActions.jsx            # Suspender/activar/editar
  ├── Subscriptions/
  │   ├── SubscriptionsListPage.jsx    # Lista de suscripciones
  │   ├── SubscriptionDetailPage.jsx   # Detalle de suscripción
  │   └── SubscriptionFilters.jsx      # Filtros por plan, estado
  ├── Finance/
  │   ├── RevenuePage.jsx              # Ingresos detallados
  │   ├── ExpensesPage.jsx             # Gastos detallados
  │   ├── ExpenseForm.jsx              # Formulario para agregar gasto
  │   └── FinancialReports.jsx         # Reportes y exportaciones
  └── Plans/
      ├── PlansManagerPage.jsx         # Gestión de planes
      └── PlanPricingForm.jsx          # Editar precios
```

#### 3.2.2 Redux - adminSlice
```javascript
// shared/src/redux/slices/adminSlice.js

const initialState = {
  dashboard: {
    totalTenants: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    metrics: {
      mrr: 0,
      arr: 0,
      churnRate: 0,
    },
  },
  tenants: [],
  subscriptions: [],
  revenue: [],
  expenses: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setDashboard: (state, action) => {
      state.dashboard = action.payload;
    },
    setTenants: (state, action) => {
      state.tenants = action.payload;
    },
    setSubscriptions: (state, action) => {
      state.subscriptions = action.payload;
    },
    // ...
  },
});
```

#### 3.2.3 API con RTK Query
```javascript
// shared/src/redux/api/adminApi.js

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => '/platform-admin/dashboard',
      providesTags: ['Admin'],
    }),
    
    listTenants: builder.query({
      query: () => '/platform-admin/tenants',
      providesTags: ['Admin'],
    }),
    
    getRevenue: builder.query({
      query: (params) => ({
        url: '/platform-admin/revenue',
        params,
      }),
    }),
    
    createExpense: builder.mutation({
      query: (data) => ({
        url: '/platform-admin/expenses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),
  }),
});
```

#### 3.2.4 Componentes UI
**Tecnologías:**
- Shadcn/ui o Material-UI para componentes
- Recharts o Chart.js para gráficos
- React Table para tablas de datos
- Date-fns para manejo de fechas

**Componentes clave:**
- [ ] KPICard - Tarjeta con métrica (MRR, ARR, etc.)
- [ ] LineChart - Gráfico de líneas para ingresos
- [ ] PieChart - Gráfico circular para distribución de planes
- [ ] DataTable - Tabla con filtros y paginación
- ✅ Verificar y completar migración de tablas con tenantId (14/14 tablas)
- ✅ Migración SQL ejecutada: add-tenant-id-to-remaining-tables.sql
- 🚧 Modificar todos los modelos Sequelize con scope de tenant (EN PROGRESO)
- [ ] ExpenseForm - Formulario para registrar gastos

---

## 📝 Checklist de Implementación

### Sprint 1: Multitenant Backend (1-2 semanas)
- ✅ Verificar y completar migración de tablas con tenantId (14/14 tablas - 2026-01-02)
- ✅ Migración SQL ejecutada: add-tenant-id-to-remaining-tables.sql (2026-01-02)
- ✅ Modificar todos los modelos Sequelize con scope de tenant (10/10 modelos - 2026-01-02)
  - ✅ Admin, Client, Property, Lease, Garantor, PaymentReceipt, PdfTemplate, SaleContract, RentUpdate, AdminSettings
- [ ] Actualizar todos los controladores para filtrar por tenantId (PRÓXIMO)
- [ ] Implementar tenant detection por subdominio
- [ ] Crear endpoint para registro de nuevo tenant
- [ ] Testing multitenant con 2-3 tenants de prueba

### Sprint 2: Frontend Multitenant (1 semana)
- [ ] Migrar Redux a carpeta shared (JavaScript)
- [ ] Implementar RTK Query para todas las entidades
- [ ] Agregar detección de tenant en frontend
- [ ] Testing de funcionalidades en múltiples tenants

### Sprint 3: Panel Admin Backend (1 semana)
- [ ] Crear PlatformAdminController
- [ ] Crear modelo PlatformExpense
- [ ] Implementar endpoints de dashboard
- [ ] Implementar endpoints de tenants
- [ ] Implementar endpoints de finanzas
- [ ] Middleware isPlatformAdmin
- [ ] Testing de seguridad

### Sprint 4: Panel Admin Frontend (2 semanas)
- [ ] Crear estructura de rutas /platform-admin
- [ ] Implementar DashboardPage con KPIs
- [ ] Implementar TenantsListPage
- [ ] Implementar SubscriptionsListPage
- [ ] Implementar RevenuePage con gráficos
- [ ] Implementar ExpensesPage
- [ ] Redux adminSlice + adminApi
- [ ] Testing e2e del panel

---

## 🔐 Consideraciones de Seguridad

### Aislamiento de Datos
- ✅ Cada tenant solo ve sus propios datos
- ✅ `tenantId` siempre inyectado desde token JWT
- ✅ Validación a nivel de base de datos (foreign keys)
- [ ] Row Level Security (RLS) en Neon PostgreSQL (opcional)

### Roles y Permisos
```javascript
// Jerarquía de roles (actualizado 2026-01-02):
1. PLATFORM_ADMIN   // Super admin de InnoInmo (tenantId = NULL)
                    // Acceso al panel /platform-admin
                    // Gestiona TODOS los tenants, suscripciones, finanzas
                    
2. SUPER_ADMIN      // Dueño de UNA inmobiliaria (tenantId = X)
                    // Gestiona su tenant: usuarios, configuración, propiedades
                    
3. AGENT            // Empleado de UNA inmobiliaria (tenantId = X)
                    // Acceso limitado a funciones operativas
```

**Implementación:**
- ✅ Modelo Admin actualizado con rol PLATFORM_ADMIN (2026-01-02)
- ✅ Campo tenantId ahora es nullable (NULL solo para PLATFORM_ADMIN)
- ✅ Validación en modelo: PLATFORM_ADMIN debe tener tenantId NULL
- ✅ Middleware isPlatformAdmin creado (2026-01-02)
- ✅ Middleware requireTenantScope para rutas de tenant específico
- ✅ Migración SQL ejecutada en Neon
- ✅ PlatformAdminController creado con 9 endpoints (2026-01-02)
- ✅ Rutas protegidas con middlewares (2026-01-02)
- ✅ 10 controladores actualizados con tenantId injection (2026-01-02)

**Archivos creados:**
- `back/src/middlewares/platformAdminMiddleware.js`
- `back/src/controllers/PlatformAdminController.js` ✨ NUEVO
- `back/src/routes/platformAdmin.js` ✨ NUEVO
- `back/migrations/add-platform-admin-role.sql`
- `back/scripts/createPlatformAdmin.js`

**Usuario Platform Admin:**
- Username: `platform_admin`
- Email: `admin@innoinmo.com`
- Password: `ChangeMe123!` (temporal)
- AdminId: 2
- TenantId: NULL
- Role: PLATFORM_ADMIN

### Prevención de Cross-Tenant Access
- ✅ Validar que todas las rutas de tenants pasen por requireTenantScope
- ✅ Todas las queries filtradas por tenantId desde req.user
- [ ] Logging de intentos de acceso cross-tenant
- [ ] Rate limiting por tenant

---

## 🎯 Métricas de Éxito

### Técnicas
- [ ] 100% de queries filtradas por tenantId
- [ ] 0 queries que filtren por tenant en aplicación (debe ser en BD)
- [ ] Tiempo de respuesta < 500ms en panel admin
- [ ] Cobertura de tests > 80%

### Negocio
- [ ] Dashboard admin con datos en tiempo real
- [ ] Exportación de reportes financieros
- [ ] Alertas de métricas críticas (churn > 5%, MRR down, etc.)
- [ ] Tracking de conversión de trials a pagos

---

## 📚 Recursos y Referencias

### Documentación
- [Sequelize Scopes](https://sequelize.org/docs/v6/other-topics/scopes/)
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multi-tenancy)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- [MercadoPago API](https://www.mercadopago.com.ar/developers/es/docs)

### Diagramas
```
# Arquitectura Multitenant

┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Web App    │  │  Admin Panel │  │  Mobile App  │  │
│  │ (tenant.app) │  │ (/platform-  │  │   (futuro)   │  │
│  │              │  │   admin)     │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend API    │
                    │   (Railway)     │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │  Tenancy    │ │
                    │ │ Middleware  │ │
                    │ └─────────────┘ │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Neon Database  │
                    │   (PostgreSQL)  │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │   tenants   │ │
                    │ ├─────────────┤ │
                    │ │   clients   │ │
                    │ │ (+ tenantId)│ │
                    │ ├─────────────┤ │
                    │ │ properties  │ │
                    │ │ (+ tenantId)│ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

---

## 🚀 Próximos Pasos Inmediatos

1. **HOY:**
   - [ ] Verificar qué tablas ya tienen `tenantId` en Neon
   - [ ] Crear script de migración para agregar `tenantId` donde falte
   - [ ] Comenzar modificación de primer modelo (Client.js)

2. **ESTA SEMANA:**
   - [ ] Completar migración de todos los modelos
   - [ ] Modificar 3-4 controladores principales
   - [ ] Testing básico de multitenant

3. **PRÓXIMA SEMANA:**
   - [ ] Migrar Redux a shared
   - [ ] Comenzar panel de administrador

---

## 📞 Notas de Desarrollo

### Decisiones Arquitectónicas
- **Por qué Neon:** Serverless, escala automático, separación de backend
- **Por qué Railway:** No sleep mode (crítico para webhooks), DB permanente
- **Por qué MercadoPago:** Mejor cobertura en Argentina/LatAm

### Convenciones de Código
- Nombres de tablas: snake_case
- Nombres de modelos: PascalCase
- Endpoints: kebab-case
- Variables: camelCase

### Testing Strategy
- Unit tests: Jest + Supertest
- Integration tests: con DB de prueba
- E2E tests: Playwright (futuro)

---

**Última actualización:** 30 de Diciembre, 2025
**Estado:** Sistema de suscripciones deployado, iniciando fase multitenant
