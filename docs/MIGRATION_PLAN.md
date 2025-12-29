# 📋 Plan de Migración v1.0 → v2.0 (Multi-Tenant SaaS)

## Cronograma Estimado: 8-12 semanas

---

## 🎯 FASE 0: Git Setup y Preparación [SEMANA 1] ✅

### Tareas
- [x] Crear `.gitignore` completo
- [x] Crear `README.md` con visión del proyecto
- [x] Crear `docs/ARCHITECTURE.md` con decisiones técnicas
- [ ] Inicializar repositorio Git
- [ ] Crear branches: `main`, `develop`, `staging`
- [ ] Push inicial a GitHub
- [ ] Configurar protección de ramas
- [ ] Crear estructura de carpetas: `mobile/`, `landing/`, `docs/`

### Comandos
```bash
cd c:\Users\merce\Desktop\desarrollo\inno-Inmobiliaria
git init
git add .
git commit -m "feat: initial commit - single tenant v1.0"
git branch -M main
git remote add origin https://github.com/tu-usuario/inno-inmobiliaria.git
git push -u origin main

git checkout -b develop
git push -u origin develop
```

### Entregables
- ✅ Repositorio en GitHub
- ✅ Documentación inicial
- ✅ Estructura de trabajo con branches

---

## 🏗️ FASE 1: Arquitectura Multi-Tenant Backend [SEMANAS 2-3]

### 1.1 Crear Modelo Tenant
```javascript
// back/src/data/models/Tenant.js
module.exports = (sequelize) => {
  sequelize.define('Tenant', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
    subdomain: { type: DataTypes.STRING, unique: true, allowNull: false },
    
    // Configuración
    logo_url: DataTypes.STRING,
    primary_color: DataTypes.STRING,
    custom_domain: DataTypes.STRING,
    
    // Suscripción (simplificado, luego modelo separado)
    plan: { type: DataTypes.STRING, defaultValue: 'free' }, // free, pro, enterprise
    status: { type: DataTypes.STRING, defaultValue: 'trial' }, // trial, active, suspended
    
    // Contacto
    owner_email: { type: DataTypes.STRING, allowNull: false },
    owner_phone: DataTypes.STRING,
    
    // Metadatos
    onboarded_at: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, { paranoid: true });
};
```

### 1.2 Migración: Agregar tenant_id a todas las tablas
```javascript
// migrations/add-tenant-id-to-all-tables.js
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ['properties', 'clients', 'leases', 'sale_contracts', 
                    'payment_receipts', 'garantors', 'rent_updates', 
                    'client_properties', 'admin_settings'];
    
    for (const table of tables) {
      await queryInterface.addColumn(table, 'tenant_id', {
        type: Sequelize.UUID,
        allowNull: true, // Temporalmente nullable para migración
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE'
      });
      
      await queryInterface.addIndex(table, ['tenant_id', 'created_at']);
    }
  },
  
  async down(queryInterface) {
    // Rollback
  }
};
```

### 1.3 Middleware de Tenant Isolation
```javascript
// back/src/middlewares/tenantMiddleware.js
const { Tenant } = require('../data/models');

async function extractTenant(req, res, next) {
  try {
    const host = req.headers.host; // cliente1.inno.app
    const subdomain = host.split('.')[0];
    
    // Skip para super admin
    if (subdomain === 'app' || subdomain === 'api') {
      req.isSuperAdmin = true;
      return next();
    }
    
    // Buscar tenant
    const tenant = await Tenant.findOne({ 
      where: { subdomain },
      attributes: ['id', 'name', 'status', 'plan']
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    if (tenant.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }
    
    req.tenantId = tenant.id;
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = extractTenant;
```

### 1.4 Sequelize Global Hook
```javascript
// back/src/data/index.js
sequelize.addHook('beforeFind', (options) => {
  // Agregar tenant_id automáticamente si está en contexto
  if (global.currentTenantId && !options.where?.tenant_id) {
    if (!options.where) options.where = {};
    options.where.tenant_id = global.currentTenantId;
  }
});

sequelize.addHook('beforeCreate', (instance) => {
  if (global.currentTenantId && !instance.tenant_id) {
    instance.tenant_id = global.currentTenantId;
  }
});
```

### 1.5 Migrar Usuarios a Multi-Tenant
```javascript
// Modificar Admin.js → User.js
module.exports = (sequelize) => {
  sequelize.define('User', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { 
      type: DataTypes.UUID, 
      allowNull: true, // null para SUPER_ADMIN
      references: { model: 'tenants', key: 'id' }
    },
    
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    
    role: { 
      type: DataTypes.ENUM('SUPER_ADMIN', 'OWNER', 'AGENT'),
      defaultValue: 'AGENT'
    },
    
    // Info personal
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    avatar_url: DataTypes.STRING,
    
    // Estado
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login_at: DataTypes.DATE,
    
    deletedAt: DataTypes.DATE
  }, { 
    paranoid: true,
    indexes: [
      { fields: ['tenant_id', 'role'] },
      { fields: ['email'], unique: true }
    ]
  });
};
```

### Testing
```javascript
// __tests__/tenantIsolation.test.js
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    const tenant1 = await Tenant.create({ subdomain: 'tenant1' });
    const tenant2 = await Tenant.create({ subdomain: 'tenant2' });
    
    const prop1 = await Property.create({ tenant_id: tenant1.id, address: 'Test 1' });
    
    // Usuario de tenant2 intenta acceder a propiedad de tenant1
    const token = generateToken({ userId: 'user2', tenantId: tenant2.id });
    const res = await request(app)
      .get(`/properties/${prop1.id}`)
      .set('Host', 'tenant2.inno.app')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(404); // No debe encontrarla
  });
});
```

---

## 👥 FASE 2: Sistema de Roles (RBAC) [SEMANA 4]

### 2.1 Actualizar Modelo de Roles
```javascript
// Roles en User model (ya creado arriba)
// SUPER_ADMIN: Sin tenant_id, acceso global
// OWNER: tenant_id presente, admin del tenant
// AGENT: tenant_id presente, acceso limitado
```

### 2.2 Middleware de Autorización
```javascript
// back/src/middlewares/authorize.js
function authorize(resource, action, options = {}) {
  return async (req, res, next) => {
    const { user } = req;
    
    // Super admin puede todo
    if (user.role === 'SUPER_ADMIN') return next();
    
    // Verificar que pertenece al mismo tenant
    if (user.tenant_id !== req.tenantId) {
      return res.status(403).json({ error: 'Forbidden: different tenant' });
    }
    
    // Owner puede todo en su tenant
    if (user.role === 'OWNER') {
      // Excepto acciones globales
      if (resource === 'tenants') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return next();
    }
    
    // Agent tiene restricciones
    if (user.role === 'AGENT') {
      const blocked = ['payments', 'balance', 'subscriptions', 'users'];
      if (blocked.includes(resource)) {
        return res.status(403).json({ 
          error: 'Agents cannot access financial data' 
        });
      }
      
      // Validar ownership en propiedades/leads asignados
      if (options.checkOwnership) {
        const resourceId = req.params.id;
        const owned = await checkResourceOwnership(
          resource, 
          resourceId, 
          user.id
        );
        
        if (!owned) {
          return res.status(403).json({ 
            error: 'You can only access assigned resources' 
          });
        }
      }
      
      return next();
    }
    
    res.status(403).json({ error: 'Forbidden' });
  };
}

// Uso en rutas
router.get('/balance', 
  authenticate, 
  authorize('balance', 'read'), 
  getBalanceController
);

router.delete('/properties/:id',
  authenticate,
  authorize('properties', 'delete', { checkOwnership: true }),
  deletePropertyController
);
```

### 2.3 Asignación de Recursos a Agentes
```javascript
// Nueva tabla: property_assignments
CREATE TABLE property_assignments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  property_id UUID NOT NULL,
  agent_id UUID NOT NULL, -- User con role AGENT
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID, -- User que asignó
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);
```

---

## 📱 FASE 3: Migración a Expo React Native [SEMANAS 5-7]

### 3.1 Setup Expo
```bash
cd c:\Users\merce\Desktop\desarrollo\inno-Inmobiliaria
npx create-expo-app mobile --template tabs
cd mobile
npm install @react-navigation/native @reduxjs/toolkit react-redux
npm install nativewind tailwindcss
npm install expo-secure-store axios
```

### 3.2 Configuración Expo
```json
// mobile/app.json
{
  "expo": {
    "name": "InnoInmobiliaria",
    "slug": "inno-inmobiliaria",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": { "image": "./assets/splash.png" },
    
    "ios": {
      "bundleIdentifier": "com.inno.inmobiliaria",
      "supportsTablet": true,
      "infoPlist": { "NSCameraUsageDescription": "Para fotos de propiedades" }
    },
    
    "android": {
      "package": "com.inno.inmobiliaria",
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png" }
    },
    
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    
    "plugins": ["expo-router", "expo-secure-store"],
    "scheme": "inno"
  }
}
```

### 3.3 Estructura de Navegación
```
mobile/app/
├── _layout.tsx              # Root layout
├── (auth)/                  # Auth stack (no tabs)
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
│
├── (tabs)/                  # Main app (tabs)
│   ├── _layout.tsx          # Tab navigator
│   ├── index.tsx            # Dashboard/Home
│   ├── properties/
│   │   ├── index.tsx        # Lista de propiedades
│   │   ├── [id].tsx         # Detalle
│   │   └── new.tsx          # Nueva propiedad
│   ├── clients/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   ├── leads/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   └── settings/
│       ├── index.tsx
│       ├── profile.tsx
│       └── subscription.tsx
│
└── +not-found.tsx           # 404
```

### 3.4 Migrar Redux Store
```typescript
// mobile/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertiesReducer from './slices/propertiesSlice';
// ... migrar desde QL Front/src/redux

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    clients: clientsReducer,
    // ...
  }
});
```

### 3.5 Adaptar Componentes
```tsx
// Antes (Web - QL Front)
<div className="bg-white p-4 rounded-lg shadow">
  <h2 className="text-xl font-bold">Propiedades</h2>
  <img src={property.image} alt="Propiedad" />
</div>

// Después (Expo - Mobile)
import { View, Text, Image } from 'react-native';

<View className="bg-white p-4 rounded-lg shadow">
  <Text className="text-xl font-bold">Propiedades</Text>
  <Image source={{ uri: property.image }} className="w-full h-48" />
</View>
```

### 3.6 Autenticación con SecureStore
```typescript
// mobile/services/auth.ts
import * as SecureStore from 'expo-secure-store';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync('authToken', token);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('authToken');
}

export async function removeToken() {
  await SecureStore.deleteItemAsync('authToken');
}
```

---

## 🏠 FASE 4: Landing Page Integrada [SEMANA 8]

### 4.1 Rutas Públicas en Expo Web
```typescript
// mobile/app/(public)/[tenant]/index.tsx
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import PropertyCard from '@/components/PropertyCard';

export default function TenantLanding() {
  const { tenant } = useLocalSearchParams();
  const [properties, setProperties] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/public/${tenant}/properties`)
      .then(res => res.json())
      .then(setProperties);
  }, [tenant]);
  
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header con logo del tenant */}
      <View className="bg-white p-4 shadow">
        <Text className="text-2xl font-bold">{tenant} Propiedades</Text>
      </View>
      
      {/* Filtros */}
      <View className="p-4">
        {/* ... filtros de búsqueda */}
      </View>
      
      {/* Lista de propiedades */}
      <FlatList
        data={properties}
        renderItem={({ item }) => <PropertyCard property={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
```

### 4.2 Backend: Endpoints Públicos
```javascript
// back/src/routes/public.js
const express = require('express');
const router = express.Router();
const { Property, Client } = require('../data/models');

// Listado público de propiedades por tenant
router.get('/:subdomain/properties', async (req, res) => {
  const tenant = await Tenant.findOne({ 
    where: { subdomain: req.params.subdomain } 
  });
  
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  
  const properties = await Property.findAll({
    where: { 
      tenant_id: tenant.id,
      is_published: true, // Solo publicadas
      status: 'available'
    },
    attributes: ['id', 'title', 'address', 'price', 'images', 'type'],
    order: [['created_at', 'DESC']],
    limit: 50
  });
  
  res.json(properties);
});

// Detalle de propiedad
router.get('/:subdomain/properties/:id', async (req, res) => {
  // ... similar con detalles completos
});

// Formulario de contacto (crear lead)
router.post('/:subdomain/leads', async (req, res) => {
  const { name, email, phone, message, property_id } = req.body;
  
  const tenant = await Tenant.findOne({ 
    where: { subdomain: req.params.subdomain } 
  });
  
  const lead = await Lead.create({
    tenant_id: tenant.id,
    source: 'landing_page',
    name,
    email,
    phone,
    message,
    property_id,
    status: 'new'
  });
  
  // Notificar al owner
  await sendEmailNotification(tenant.owner_email, 'Nuevo lead', lead);
  
  res.json({ success: true, lead_id: lead.id });
});

module.exports = router;
```

---

## 🤝 FASE 5: Sistema de Leads [SEMANA 9]

### 5.1 Modelo Lead
```javascript
// back/src/data/models/Lead.js
module.exports = (sequelize) => {
  sequelize.define('Lead', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    
    // Origen
    source: { 
      type: DataTypes.ENUM('landing_page', 'mercadolibre', 'manual', 'whatsapp', 'email'),
      allowNull: false
    },
    source_id: DataTypes.STRING, // ML question ID, etc
    
    // Datos del lead
    name: { type: DataTypes.STRING, allowNull: false },
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    message: DataTypes.TEXT,
    
    // Relación
    property_id: { 
      type: DataTypes.UUID,
      references: { model: 'properties', key: 'id' }
    },
    
    // Asignación
    assigned_to: { 
      type: DataTypes.UUID, 
      references: { model: 'users', key: 'id' }
    },
    
    // Estado
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'lost'),
      defaultValue: 'new'
    },
    
    // Seguimiento
    contacted_at: DataTypes.DATE,
    converted_at: DataTypes.DATE,
    notes: DataTypes.TEXT,
    
    deletedAt: DataTypes.DATE
  }, { paranoid: true });
};
```

### 5.2 CRM Básico
```typescript
// mobile/app/(tabs)/leads/index.tsx
import { FlatList, View, Text } from 'react-native';
import { useSelector } from 'react-redux';

export default function LeadsScreen() {
  const user = useSelector(state => state.auth.user);
  const leads = useSelector(state => state.leads.list);
  
  // Agent solo ve sus leads asignados
  const filteredLeads = user.role === 'AGENT'
    ? leads.filter(l => l.assigned_to === user.id)
    : leads;
  
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={filteredLeads}
        renderItem={({ item }) => <LeadCard lead={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
```

---

## 🛒 FASE 6: Integración Mercado Libre [SEMANA 10]

### 6.1 OAuth Setup
```javascript
// back/src/controllers/MLController.js
const axios = require('axios');

exports.initiateMLAuth = async (req, res) => {
  const { tenantId } = req;
  
  const authUrl = `https://auth.mercadolibre.com.ar/authorization?` +
    `response_type=code&` +
    `client_id=${process.env.ML_APP_ID}&` +
    `redirect_uri=${process.env.ML_REDIRECT_URI}&` +
    `state=${tenantId}`; // Para validar callback
  
  res.json({ auth_url: authUrl });
};

exports.handleMLCallback = async (req, res) => {
  const { code, state: tenantId } = req.query;
  
  // Intercambiar código por token
  const tokenRes = await axios.post('https://api.mercadolibre.com/oauth/token', {
    grant_type: 'authorization_code',
    client_id: process.env.ML_APP_ID,
    client_secret: process.env.ML_APP_SECRET,
    code,
    redirect_uri: process.env.ML_REDIRECT_URI
  });
  
  const { access_token, refresh_token, expires_in, user_id } = tokenRes.data;
  
  // Guardar tokens (encriptados)
  await Tenant.update({
    ml_access_token: encrypt(access_token),
    ml_refresh_token: encrypt(refresh_token),
    ml_user_id: user_id,
    ml_expires_at: new Date(Date.now() + expires_in * 1000)
  }, { where: { id: tenantId } });
  
  res.redirect(`https://${req.tenant.subdomain}.inno.app/settings?ml=connected`);
};
```

### 6.2 Sincronización de Propiedades
Ver sección en ARCHITECTURE.md

---

## 💳 FASE 7: Suscripciones [SEMANA 11]

### 7.1 Modelo Subscription
Ver código en ARCHITECTURE.md

### 7.2 MercadoPago Integration
```javascript
// back/src/controllers/SubscriptionController.js
const mercadopago = require('mercadopago');

mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

exports.createSubscription = async (req, res) => {
  const { plan, addons, billing_cycle } = req.body;
  const { tenant } = req;
  
  const price = calculatePrice(plan, addons, billing_cycle);
  
  const preference = {
    items: [{
      title: `Plan ${plan} - ${tenant.name}`,
      unit_price: price,
      quantity: 1
    }],
    payer: { email: tenant.owner_email },
    back_urls: {
      success: `https://${tenant.subdomain}.inno.app/subscription/success`,
      failure: `https://${tenant.subdomain}.inno.app/subscription/failure`
    },
    auto_return: 'approved',
    external_reference: tenant.id
  };
  
  const response = await mercadopago.preferences.create(preference);
  
  res.json({ init_point: response.body.init_point });
};
```

---

## 🧪 FASE 9: Testing [SEMANA 12]

### Tests Críticos
```javascript
// __tests__/integration/tenantIsolation.test.js
// __tests__/integration/rolePermissions.test.js
// __tests__/integration/mercadolibre.test.js
// __tests__/e2e/onboarding.test.js
// __tests__/e2e/propertyCreation.test.js
```

---

## 🚀 FASE 10: Deploy

### Backend (Render)
```bash
# render.yaml
services:
  - type: web
    name: inno-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase: name: inno-db
      - key: JWT_SECRET
        generateValue: true
```

### Mobile (EAS Build)
```bash
cd mobile
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

---

## ✅ Checklist Final

**Backend:**
- [ ] Multi-tenancy implementado
- [ ] Roles RBAC funcionando
- [ ] Tenant isolation testeado
- [ ] ML integration funcionando
- [ ] Subscriptions activas
- [ ] Endpoints públicos (landing)

**Mobile:**
- [ ] App Expo compilada iOS
- [ ] App Expo compilada Android
- [ ] Autenticación funcionando
- [ ] CRUD propiedades
- [ ] Sistema de leads
- [ ] Diferenciación por rol (Owner/Agent)

**Infraestructura:**
- [ ] DNS wildcard configurado
- [ ] Backend en Render
- [ ] DB PostgreSQL optimizada
- [ ] Cloudinary para storage
- [ ] Sentry para monitoreo
- [ ] Backups automatizados

**Legal/Negocio:**
- [ ] Términos y condiciones
- [ ] Política de privacidad
- [ ] Pricing page
- [ ] Documentación de API
- [ ] Onboarding flow

---

**Última actualización:** Diciembre 29, 2025
