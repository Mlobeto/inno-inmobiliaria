# 🏗️ Deuda Técnica, Mejoras Arquitectónicas y Plan SaaS

> **Objetivo:** Transformar InnoInmobiliaria en la plataforma SaaS más sólida y escalable del sector inmobiliario, con integraciones multi-plataforma y dominios personalizados por tenant.

**Fecha de Análisis:** Marzo 2026  
**Versión:** 1.0

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Deuda Técnica](#deuda-tecnica)
3. [Arquitectura de Integraciones](#arquitectura-integraciones)
4. [Sistema de Dominios Personalizados](#dominios-personalizados)
5. [Mejoras de Seguridad](#seguridad)
6. [Escalabilidad y Performance](#escalabilidad)
7. [Plan de Implementación](#plan-implementacion)
8. [Estimaciones y Prioridades](#estimaciones)

---

## 🎯 Resumen Ejecutivo {#resumen-ejecutivo}

### Estado Actual

**✅ Fortalezas:**
- Sistema multitenant funcional con 14 tablas migradas
- Sistema de roles robusto (PLATFORM_ADMIN, SUPER_ADMIN, AGENT)
- Redux/RTK Query configurado correctamente
- Base de MercadoLibre implementada (OAuth, modelos)
- Sistema de suscripciones con MercadoPago

**⚠️ Áreas Críticas que Requieren Atención:**
- Arquitectura de integraciones no escalable (hardcoded)
- Subdominios fijos, sin soporte para dominios personalizados
- Falta de sistema de métricas y observabilidad
- Aislamiento de tenants no validado en producción
- Sin estrategia de rate limiting ni throttling
- Gestión de secretos insegura (tokens en BD sin encriptar)

**🎯 Objetivos de Transformación:**
1. **Integraciones Multi-Plataforma:** Arquitectura plugin-based para Mercado Libre, Zona Prop, Argen Prop, WhatsApp y futuras plataformas
2. **Dominios Personalizados:** Cada tenant puede usar su propio dominio (`www.inmobiliaria-xyz.com`)
3. **Seguridad Enterprise:** Encriptación, auditoría, rate limiting, WAF
4. **Escalabilidad:** Caché, CDN, optimización de queries, workers
5. **Observabilidad:** Logs estructurados, métricas, alertas, APM

---

## 🔴 Análisis de Deuda Técnica {#deuda-tecnica}

### 🔴 Crítico - Resolver Inmediatamente

#### 1. **Encriptación de Tokens de Integración**
**Problema:** Los tokens de OAuth (MercadoLibre, futuras integraciones) se almacenan en texto plano en la BD.

```sql
-- ❌ ACTUAL
CREATE TABLE "MercadoLibreConfig" (
  "accessToken" TEXT,  -- ⚠️ TEXTO PLANO
  "refreshToken" TEXT  -- ⚠️ TEXTO PLANO
);
```

**Riesgo:** Si la BD es comprometida, un atacante obtiene acceso a las cuentas de MercadoLibre de TODOS los tenants.

**Solución:**
```javascript
// back/src/utils/encryption.js
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

**Migración:**
```sql
-- Migrar tokens existentes
ALTER TABLE "MercadoLibreConfig" ADD COLUMN "accessTokenIv" VARCHAR(32);
ALTER TABLE "MercadoLibreConfig" ADD COLUMN "accessTokenAuthTag" VARCHAR(32);
ALTER TABLE "MercadoLibreConfig" ADD COLUMN "refreshTokenIv" VARCHAR(32);
ALTER TABLE "MercadoLibreConfig" ADD COLUMN "refreshTokenAuthTag" VARCHAR(32);
```

**Prioridad:** 🔴🔴🔴 CRÍTICA  
**Esfuerzo:** 2-3 días  
**Impacto:** Seguridad de datos de integración de todos los tenants

---

#### 2. **Validación de Tenant Isolation**
**Problema:** No hay tests automatizados que validen que un tenant NO puede acceder a datos de otro tenant.

**Riesgo:** Bug en un controlador podría exponer datos entre tenants.

**Solución:**
```javascript
// back/__tests__/security/tenantIsolation.test.js
const request = require('supertest');
const app = require('../../src/app');
const { generateToken, createTestTenant, createTestProperty } = require('../helpers');

describe('🔒 Tenant Isolation Security', () => {
  let tenant1, tenant2, token1, token2, property1;
  
  beforeAll(async () => {
    // Crear dos tenants de prueba
    tenant1 = await createTestTenant({ subdomain: 'tenant1' });
    tenant2 = await createTestTenant({ subdomain: 'tenant2' });
    
    token1 = generateToken({ tenantId: tenant1.tenantId, role: 'SUPER_ADMIN' });
    token2 = generateToken({ tenantId: tenant2.tenantId, role: 'SUPER_ADMIN' });
    
    // Crear propiedad en tenant1
    property1 = await createTestProperty({ tenantId: tenant1.tenantId });
  });
  
  test('❌ Tenant2 NO debe poder ver propiedades de Tenant1', async () => {
    const res = await request(app)
      .get('/api/property')
      .set('Authorization', `Bearer ${token2}`)
      .set('Host', 'tenant2.localhost');
    
    expect(res.status).toBe(200);
    expect(res.body.properties).toEqual([]);
    expect(res.body.properties).not.toContainEqual(
      expect.objectContaining({ propertyId: property1.propertyId })
    );
  });
  
  test('❌ Tenant2 NO debe poder acceder directamente a propiedad de Tenant1', async () => {
    const res = await request(app)
      .get(`/api/property/${property1.propertyId}`)
      .set('Authorization', `Bearer ${token2}`)
      .set('Host', 'tenant2.localhost');
    
    expect(res.status).toBe(404);
  });
  
  test('❌ Tenant2 NO debe poder actualizar propiedad de Tenant1', async () => {
    const res = await request(app)
      .put(`/api/property/${property1.propertyId}`)
      .set('Authorization', `Bearer ${token2}`)
      .set('Host', 'tenant2.localhost')
      .send({ price: 999999 });
    
    expect(res.status).toBe(404);
  });
  
  test('❌ Tenant2 NO debe poder eliminar propiedad de Tenant1', async () => {
    const res = await request(app)
      .delete(`/api/property/${property1.propertyId}`)
      .set('Authorization', `Bearer ${token2}`)
      .set('Host', 'tenant2.localhost');
    
    expect(res.status).toBe(404);
  });
  
  // Repetir para clients, leases, payments, etc.
});
```

**Acción:** Crear batería completa de tests de aislamiento para TODOS los recursos.

**Prioridad:** 🔴🔴🔴 CRÍTICA  
**Esfuerzo:** 1 semana  
**Impacto:** Prevención de vulnerabilidades graves

---

#### 3. **Rate Limiting Global y por Tenant**
**Problema:** No hay protección contra abuso de API. Un tenant malicioso puede saturar el servidor.

**Solución:**
```javascript
// back/src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Rate limit global (por IP)
const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:global:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit por tenant
const tenantLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:tenant:',
  }),
  windowMs: 15 * 60 * 1000,
  max: async (req) => {
    // Límites dinámicos según plan
    const planLimits = {
      FREE: 100,
      BASIC: 500,
      PROFESSIONAL: 2000,
      ENTERPRISE: 10000,
    };
    
    const tenantPlan = req.tenant?.plan || 'FREE';
    return planLimits[tenantPlan];
  },
  keyGenerator: (req) => `tenant:${req.tenantId}`,
  message: 'Has excedido el límite de solicitudes de tu plan.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para endpoints sensibles (login, register)
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // solo 5 intentos de login cada 15 minutos
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos.',
});

module.exports = {
  globalLimiter,
  tenantLimiter,
  authLimiter,
};
```

**Uso:**
```javascript
// back/src/app.js
const { globalLimiter, tenantLimiter } = require('./middlewares/rateLimiter');

app.use('/api', globalLimiter); // Aplicar a todas las rutas API
app.use('/api', authMiddleware, tenancyMiddleware, tenantLimiter); // Rate limit por tenant

// back/src/routes/auth.js
const { authLimiter } = require('../middlewares/rateLimiter');
router.post('/login', authLimiter, loginAdmin);
router.post('/register', authLimiter, register);
```

**Prioridad:** 🔴🔴 ALTA  
**Esfuerzo:** 2 días  
**Impacto:** Prevención de abuso y DoS

---

### 🟡 Importante - Resolver en Sprint Actual

#### 4. **Migración de AdminSettings.tenantId de UUID a INTEGER**
**Problema:** Inconsistencia en tipos de datos. `tenantId` es INTEGER en `tenants` pero está definido como UUID en algunas tablas derivadas.

```javascript
// ❌ ACTUAL en AdminSettings.js
tenantId: {
  type: DataTypes.UUID,  // ⚠️ INCONSISTENTE
  allowNull: true,
  references: {
    model: 'tenants',
    key: 'tenantId',  // ← Es INTEGER en tenants!
  },
}
```

**Solución:**
```sql
-- Migración
BEGIN;

-- 1. Agregar nueva columna temporal
ALTER TABLE admin_settings ADD COLUMN tenant_id_new INTEGER;

-- 2. Copiar datos (si ya hay datos con UUID, convertir)
-- Si no hay datos, este paso se omite
UPDATE admin_settings 
SET tenant_id_new = CAST(tenant_id AS INTEGER)
WHERE tenant_id IS NOT NULL;

-- 3. Eliminar columna vieja
ALTER TABLE admin_settings DROP COLUMN tenant_id;

-- 4. Renombrar nueva columna
ALTER TABLE admin_settings RENAME COLUMN tenant_id_new TO tenant_id;

-- 5. Agregar foreign key
ALTER TABLE admin_settings 
ADD CONSTRAINT fk_admin_settings_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants("tenantId") ON DELETE CASCADE;

-- 6. Crear índice
CREATE INDEX idx_admin_settings_tenant ON admin_settings(tenant_id);

COMMIT;
```

**Prioridad:** 🟡🟡 IMPORTANTE  
**Esfuerzo:** 1 día  
**Impacto:** Consistencia de base de datos

---

#### 5. **Logger Estructurado y Centralizado**
**Problema:** Logs con `console.log()` no están estructurados, dificultan debugging en producción.

**Solución:**
```javascript
// back/src/utils/logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_NODE,
    auth: {
      username: process.env.ELASTICSEARCH_USER,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
  },
  index: 'innoinmo-logs',
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'innoinmo-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // Archivos
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
    
    // Elasticsearch (producción)
    ...(process.env.NODE_ENV === 'production'
      ? [new ElasticsearchTransport(esTransportOpts)]
      : []
    ),
  ],
});

// Middleware para logging de requests
logger.httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      tenantId: req.tenantId,
      userId: req.user?.adminId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
};

module.exports = logger;
```

**Uso:**
```javascript
// back/src/app.js
const logger = require('./utils/logger');
app.use(logger.httpLogger);

// En controladores
const logger = require('../utils/logger');

exports.createProperty = async (req, res) => {
  try {
    // ... código
    logger.info('Property created', {
      propertyId: property.propertyId,
      tenantId: req.tenantId,
      agentId: req.user.adminId,
    });
  } catch (error) {
    logger.error('Error creating property', {
      error: error.message,
      stack: error.stack,
      tenantId: req.tenantId,
      body: req.body,
    });
  }
};
```

**Prioridad:** 🟡🟡 IMPORTANTE  
**Esfuerzo:** 3 días  
**Impacto:** Debugging y troubleshooting en producción

---

### 🟢 Mejoras - Implementar en Próximos Sprints

#### 6. **Caché de Configuración de Tenant**
**Problema:** Cada request hace query a BD para obtener configuración del tenant.

```javascript
// ❌ ACTUAL: Query en cada request
const tenant = await Tenant.findOne({ where: { subdomain } });
```

**Solución:**
```javascript
// back/src/utils/tenantCache.js
const Redis = require('ioredis');
const { Tenant } = require('../data');

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 900; // 15 minutos

async function getTenantBySubdomain(subdomain) {
  const cacheKey = `tenant:subdomain:${subdomain}`;
  
  // Intentar obtener de caché
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Si no está en caché, buscar en BD
  const tenant = await Tenant.findOne({
    where: { subdomain },
    attributes: ['tenantId', 'businessName', 'status', 'plan', 'features'],
  });
  
  if (tenant) {
    // Guardar en caché
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(tenant));
  }
  
  return tenant;
}

async function invalidateTenantCache(tenantId, subdomain) {
  await redis.del(`tenant:subdomain:${subdomain}`);
  await redis.del(`tenant:id:${tenantId}`);
}

module.exports = {
  getTenantBySubdomain,
  invalidateTenantCache,
};
```

**Prioridad:** 🟢 MEJORA  
**Esfuerzo:** 1 día  
**Impacto:** Reducción de latencia y carga de BD

---

#### 7. **Auditoría de Acciones Críticas**
**Problema:** No hay registro de quién hizo qué y cuándo (modificaciones, eliminaciones).

**Solución:**
```sql
-- Migración: Tabla de auditoría
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE,
  user_id INTEGER REFERENCES admins("adminId") ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
  resource_type VARCHAR(50) NOT NULL, -- property, client, lease, payment
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

```javascript
// back/src/utils/audit.js
const { AuditLog } = require('../data');

async function logAction(req, action, resourceType, resourceId, oldValues, newValues) {
  await AuditLog.create({
    tenantId: req.tenantId,
    userId: req.user?.adminId,
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
}

// Middleware para auditar automáticamente
function auditMiddleware(resourceType) {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Solo auditar mutaciones exitosas
      if (req.method !== 'GET' && res.statusCode < 400) {
        const action = {
          POST: 'CREATE',
          PUT: 'UPDATE',
          PATCH: 'UPDATE',
          DELETE: 'DELETE',
        }[req.method];
        
        logAction(
          req,
          action,
          resourceType,
          req.params.id || req.params.propertyId,
          req.auditOldValues, // Capturado por el controlador
          req.body
        ).catch(err => console.error('Audit log error:', err));
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
}

module.exports = { logAction, auditMiddleware };
```

**Prioridad:** 🟢 MEJORA  
**Esfuerzo:** 2 días  
**Impacto:** Compliance, debugging, prevención de fraude

---

## 🔌 Arquitectura de Integraciones Multi-Plataforma {#arquitectura-integraciones}

### Problema Actual

Las integraciones están hardcoded y no son extensibles:

```javascript
// ❌ NO ESCALABLE
const mercadolibre = require('mercadolibre');
// ... código específico de ML mezclado con lógica de negocio
```

### Solución: Patrón Strategy + Plugin Architecture

#### 1. **Interfaz Base de IntegrationProvider**

```javascript
// back/src/integrations/BaseIntegrationProvider.js

/**
 * Interfaz base que todas las integraciones deben implementar
 */
class BaseIntegrationProvider {
  constructor(tenantId, config) {
    this.tenantId = tenantId;
    this.config = config;
    this.providerName = 'base';
  }
  
  /**
   * Autenticación OAuth - debe ser implementado por cada provider
   */
  async startAuth() {
    throw new Error('startAuth() debe ser implementado');
  }
  
  async handleCallback(code, state) {
    throw new Error('handleCallback() debe ser implementado');
  }
  
  async refreshToken() {
    throw new Error('refreshToken() debe ser implementado');
  }
  
  /**
   * Publicación de propiedades
   */
  async publishProperty(property) {
    throw new Error('publishProperty() debe ser implementado');
  }
  
  async updateProperty(listingId, property) {
    throw new Error('updateProperty() debe ser implementado');
  }
  
  async deleteProperty(listingId) {
    throw new Error('deleteProperty() debe ser implementado');
  }
  
  async pauseProperty(listingId) {
    throw new Error('pauseProperty() debe ser implementado');
  }
  
  async activateProperty(listingId) {
    throw new Error('activateProperty() debe ser implementado');
  }
  
  /**
   * Sincronización de mensajes/consultas
   */
  async fetchMessages(lastSync = null) {
    throw new Error('fetchMessages() debe ser implementado');
  }
  
  async replyToMessage(messageId, reply) {
    throw new Error('replyToMessage() debe ser implementado');
  }
  
  /**
   * Métricas y estadísticas
   */
  async getListingStats(listingId) {
    throw new Error('getListingStats() debe ser implementado');
  }
  
  /**
   * Webhook handling
   */
  async handleWebhook(payload) {
    throw new Error('handleWebhook() debe ser implementado');
  }
  
  /**
   * Verificar estado de conexión
   */
  async isConnected() {
    return this.config && this.config.accessToken !== null;
  }
  
  /**
   * Desconectar integración
   */
  async disconnect() {
    // Lógica común de desconexión
    await this.revokeTokens();
    await this.clearConfig();
  }
}

module.exports = BaseIntegrationProvider;
```

---

#### 2. **Implementación: MercadoLibre Provider**

```javascript
// back/src/integrations/providers/MercadoLibreProvider.js

const BaseIntegrationProvider = require('../BaseIntegrationProvider');
const mercadolibre = require('mercadolibre');
const { encrypt, decrypt } = require('../../utils/encryption');
const { IntegrationConfig, PropertyListing } = require('../../data');
const logger = require('../../utils/logger');

class MercadoLibreProvider extends BaseIntegrationProvider {
  constructor(tenantId, config) {
    super(tenantId, config);
    this.providerName = 'mercadolibre';
    
    this.meli = new mercadolibre.Meli(
      process.env.ML_CLIENT_ID,
      process.env.ML_CLIENT_SECRET,
      process.env.ML_REDIRECT_URI
    );
  }
  
  // ==================== AUTENTICACIÓN ====================
  
  async startAuth() {
    const authUrl = this.meli.getAuthURL(
      `${process.env.API_URL}/integrations/mercadolibre/callback`,
      'AR',
      `tenant_${this.tenantId}` // State para identificar tenant
    );
    
    return { authUrl };
  }
  
  async handleCallback(code, state) {
    try {
      // Obtener tokens
      const auth = await this.meli.authorize(code, `${process.env.API_URL}/integrations/mercadolibre/callback`);
      
      // Obtener info del usuario
      const userInfo = await this.meli.get('/users/me', { access_token: auth.access_token });
      
      // Encriptar tokens
      const encryptedAccess = encrypt(auth.access_token);
      const encryptedRefresh = encrypt(auth.refresh_token);
      
      // Guardar en BD
      await IntegrationConfig.upsert({
        tenantId: this.tenantId,
        provider: 'mercadolibre',
        externalUserId: userInfo.id,
        accessToken: encryptedAccess.encrypted,
        accessTokenIv: encryptedAccess.iv,
        accessTokenAuthTag: encryptedAccess.authTag,
        refreshToken: encryptedRefresh.encrypted,
        refreshTokenIv: encryptedRefresh.iv,
        refreshTokenAuthTag: encryptedRefresh.authTag,
        tokenExpiresAt: new Date(Date.now() + auth.expires_in * 1000),
        isActive: true,
        metadata: {
          nickname: userInfo.nickname,
          email: userInfo.email,
        },
      });
      
      logger.info('MercadoLibre connected', {
        tenantId: this.tenantId,
        mlUserId: userInfo.id,
      });
      
      return { success: true, userInfo };
    } catch (error) {
      logger.error('MercadoLibre auth error', {
        tenantId: this.tenantId,
        error: error.message,
      });
      throw error;
    }
  }
  
  async refreshToken() {
    const config = await this.getConfig();
    
    if (!config.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const decryptedRefresh = decrypt({
      encrypted: config.refreshToken,
      iv: config.refreshTokenIv,
      authTag: config.refreshTokenAuthTag,
    });
    
    const auth = await this.meli.refreshAccessToken(decryptedRefresh);
    
    // Actualizar tokens
    const encryptedAccess = encrypt(auth.access_token);
    const encryptedRefresh = encrypt(auth.refresh_token);
    
    await config.update({
      accessToken: encryptedAccess.encrypted,
      accessTokenIv: encryptedAccess.iv,
      accessTokenAuthTag: encryptedAccess.authTag,
      refreshToken: encryptedRefresh.encrypted,
      refreshTokenIv: encryptedRefresh.iv,
      refreshTokenAuthTag: encryptedRefresh.authTag,
      tokenExpiresAt: new Date(Date.now() + auth.expires_in * 1000),
    });
    
    return auth.access_token;
  }
  
  // ==================== PUBLICACIÓN ====================
  
  async publishProperty(property) {
    const accessToken = await this.getAccessToken();
    
    // Mapear propiedad a formato ML
    const listing = {
      title: this.generateTitle(property),
      category_id: this.getCategoryId(property),
      price: parseFloat(property.price),
      currency_id: 'ARS',
      available_quantity: 1,
      buying_mode: property.type === 'venta' ? 'buy_now' : 'not_specified',
      listing_type_id: 'gold_special', // Puede ser dinámico según plan
      condition: 'not_specified',
      description: this.generateDescription(property),
      pictures: property.images.map(url => ({ source: url })),
      location: {
        address_line: property.address,
        city: { name: property.city },
        state: { name: property.province },
      },
      attributes: this.mapAttributes(property),
    };
    
    const response = await this.meli.post('/items', listing, { access_token: accessToken });
    
    // Guardar listing en BD
    await PropertyListing.create({
      propertyId: property.propertyId,
      tenantId: this.tenantId,
      provider: 'mercadolibre',
      externalListingId: response.id,
      status: response.status,
      permalink: response.permalink,
      metadata: {
        mlStatus: response.status,
        mlTitle: response.title,
        mlPrice: response.price,
      },
    });
    
    logger.info('Property published to MercadoLibre', {
      tenantId: this.tenantId,
      propertyId: property.propertyId,
      mlListingId: response.id,
    });
    
    return response;
  }
  
  async updateProperty(listingId, property) {
    const accessToken = await this.getAccessToken();
    
    const updates = {
      title: this.generateTitle(property),
      price: parseFloat(property.price),
      available_quantity: 1,
      description: this.generateDescription(property),
      pictures: property.images.map(url => ({ source: url })),
      attributes: this.mapAttributes(property),
    };
    
    const response = await this.meli.put(`/items/${listingId}`, updates, { access_token: accessToken });
    
    // Actualizar en BD
    await PropertyListing.update(
      {
        metadata: {
          mlStatus: response.status,
          mlTitle: response.title,
          mlPrice: response.price,
        },
        lastSyncAt: new Date(),
      },
      {
        where: {
          externalListingId: listingId,
          tenantId: this.tenantId,
        },
      }
    );
    
    return response;
  }
  
  async deleteProperty(listingId) {
    const accessToken = await this.getAccessToken();
    
    await this.meli.put(`/items/${listingId}`, { status: 'closed' }, { access_token: accessToken });
    
    await PropertyListing.update(
      { status: 'deleted', deletedAt: new Date() },
      { where: { externalListingId: listingId, tenantId: this.tenantId } }
    );
  }
  
  async pauseProperty(listingId) {
    const accessToken = await this.getAccessToken();
    
    await this.meli.put(`/items/${listingId}`, { status: 'paused' }, { access_token: accessToken });
    
    await PropertyListing.update(
      { status: 'paused' },
      { where: { externalListingId: listingId, tenantId: this.tenantId } }
    );
  }
  
  async activateProperty(listingId) {
    const accessToken = await this.getAccessToken();
    
    await this.meli.put(`/items/${listingId}`, { status: 'active' }, { access_token: accessToken });
    
    await PropertyListing.update(
      { status: 'active' },
      { where: { externalListingId: listingId, tenantId: this.tenantId } }
    );
  }
  
  // ==================== MENSAJES ====================
  
  async fetchMessages(lastSync = null) {
    const accessToken = await this.getAccessToken();
    const config = await this.getConfig();
    
    const filters = {
      seller_id: config.externalUserId,
      status: 'unanswered',
    };
    
    if (lastSync) {
      filters.date_created_from = lastSync.toISOString();
    }
    
    const response = await this.meli.get('/questions/search', {
      ...filters,
      access_token: accessToken,
    });
    
    return response.questions || [];
  }
  
  async replyToMessage(messageId, reply) {
    const accessToken = await this.getAccessToken();
    
    await this.meli.post(`/answers`, {
      question_id: messageId,
      text: reply,
    }, { access_token: accessToken });
  }
  
  // ==================== MÉTRICAS ====================
  
  async getListingStats(listingId) {
    const accessToken = await this.getAccessToken();
    
    const visits = await this.meli.get(`/items/${listingId}/visits`, { access_token: accessToken });
    
    return {
      views: visits.total_visits || 0,
      lastUpdated: new Date(),
    };
  }
  
  // ==================== WEBHOOK ====================
  
  async handleWebhook(payload) {
    const { topic, resource } = payload;
    
    if (topic === 'questions') {
      // Notificación de nueva pregunta
      const accessToken = await this.getAccessToken();
      const question = await this.meli.get(resource, { access_token: accessToken });
      
      // Guardar pregunta en BD para mostrar en panel
      await this.saveMessage(question);
      
      // Enviar notificación al tenant
      await this.notifyTenant('new_question', question);
    }
    
    if (topic === 'items') {
      // Cambio en el item (actualización, vendido, etc.)
      const accessToken = await this.getAccessToken();
      const item = await this.meli.get(resource, { access_token: accessToken });
      
      // Actualizar estado en BD
      await PropertyListing.update(
        { status: item.status },
        { where: { externalListingId: item.id, tenantId: this.tenantId } }
      );
    }
  }
  
  // ==================== HELPERS ====================
  
  async getConfig() {
    return await IntegrationConfig.findOne({
      where: {
        tenantId: this.tenantId,
        provider: 'mercadolibre',
      },
    });
  }
  
  async getAccessToken() {
    const config = await this.getConfig();
    
    if (!config || !config.accessToken) {
      throw new Error('MercadoLibre not connected');
    }
    
    // Verificar expiración
    if (config.tokenExpiresAt && new Date() >= config.tokenExpiresAt) {
      return await this.refreshToken();
    }
    
    return decrypt({
      encrypted: config.accessToken,
      iv: config.accessTokenIv,
      authTag: config.accessTokenAuthTag,
    });
  }
  
  generateTitle(property) {
    const type = property.typeProperty.charAt(0).toUpperCase() + property.typeProperty.slice(1);
    const operation = property.type === 'venta' ? 'en Venta' : 'en Alquiler';
    return `${type} ${operation} - ${property.neighborhood || property.city}`;
  }
  
  getCategoryId(property) {
    const categories = {
      'casa-venta': 'MLA1459',
      'casa-alquiler': 'MLA1468',
      'departamento-venta': 'MLA1466',
      'departamento-alquiler': 'MLA1472',
      'lote-venta': 'MLA1470',
      'local-venta': 'MLA1476',
      'local-alquiler': 'MLA1477',
    };
    
    const key = `${property.typeProperty}-${property.type}`;
    return categories[key] || 'MLA1459'; // Default: Casas
  }
  
  mapAttributes(property) {
    const attributes = [];
    
    if (property.rooms) {
      attributes.push({ id: 'BEDROOMS', value_name: String(property.rooms) });
    }
    
    if (property.bathrooms) {
      attributes.push({ id: 'BATHROOMS', value_name: String(property.bathrooms) });
    }
    
    if (property.surface) {
      attributes.push({
        id: 'TOTAL_AREA',
        value_name: String(property.surface),
        value_struct: {
          number: property.surface,
          unit: 'm²',
        },
      });
    }
    
    return attributes;
  }
  
  generateDescription(property) {
    let desc = property.description || '';
    
    // Agregar detalles
    desc += `\n\n📍 Ubicación: ${property.address}, ${property.city}`;
    
    if (property.rooms) desc += `\n🛏️ Habitaciones: ${property.rooms}`;
    if (property.bathrooms) desc += `\n🚿 Baños: ${property.bathrooms}`;
    if (property.surface) desc += `\n📐 Superficie: ${property.surface}m²`;
    if (property.garage) desc += `\n🚗 Cochera`;
    
    return desc;
  }
}

module.exports = MercadoLibreProvider;
```

---

#### 3. **Implementación: ZonaProp Provider**

```javascript
// back/src/integrations/providers/ZonaPropProvider.js

const BaseIntegrationProvider = require('../BaseIntegrationProvider');
const axios = require('axios');
const { encrypt, decrypt } = require('../../utils/encryption');
const { IntegrationConfig, PropertyListing } = require('../../data');
const logger = require('../../utils/logger');

class ZonaPropProvider extends BaseIntegrationProvider {
  constructor(tenantId, config) {
    super(tenantId, config);
    this.providerName = 'zonaprop';
    this.apiUrl = 'https://api.zonaprop.com.ar/v1';
  }
  
  // ==================== AUTENTICACIÓN ====================
  
  async startAuth() {
    // ZonaProp usa API Key en lugar de OAuth
    return {
      authUrl: null,
      message: 'ZonaProp requiere una API Key. Contacta con soporte de ZonaProp.',
      requiresApiKey: true,
    };
  }
  
  async handleCallback(code, state) {
    throw new Error('ZonaProp no usa OAuth. Use setApiKey() en su lugar.');
  }
  
  async setApiKey(apiKey) {
    // Encriptar API Key
    const encrypted = encrypt(apiKey);
    
    // Guardar en BD
    await IntegrationConfig.upsert({
      tenantId: this.tenantId,
      provider: 'zonaprop',
      accessToken: encrypted.encrypted,
      accessTokenIv: encrypted.iv,
      accessTokenAuthTag: encrypted.authTag,
      isActive: true,
    });
    
    logger.info('ZonaProp API Key configured', {
      tenantId: this.tenantId,
    });
    
    return { success: true };
  }
  
  // ==================== PUBLICACIÓN ====================
  
  async publishProperty(property) {
    const apiKey = await this.getApiKey();
    
    const listing = {
      operacion: property.type === 'venta' ? 'Venta' : 'Alquiler',
      tipo_propiedad: this.mapPropertyType(property.typeProperty),
      direccion: property.address,
      barrio: property.neighborhood,
      localidad: property.city,
      provincia: property.province || 'Buenos Aires',
      precio: parseFloat(property.price),
      moneda: 'ARS',
      superficie_total: property.surface,
      superficie_cubierta: property.coveredSurface || property.surface,
      dormitorios: property.rooms,
      banos: property.bathrooms,
      cocheras: property.garage ? 1 : 0,
      descripcion: property.description,
      imagenes: property.images.map(url => ({ url })),
      contacto: {
        nombre: property.agentName || 'Inmobiliaria',
        telefono: property.contactPhone,
        email: property.contactEmail,
      },
    };
    
    const response = await axios.post(`${this.apiUrl}/propiedades`, listing, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Guardar listing
    await PropertyListing.create({
      propertyId: property.propertyId,
      tenantId: this.tenantId,
      provider: 'zonaprop',
      externalListingId: response.data.id,
      status: 'active',
      permalink: response.data.url,
      metadata: response.data,
    });
    
    logger.info('Property published to ZonaProp', {
      tenantId: this.tenantId,
      propertyId: property.propertyId,
      zpListingId: response.data.id,
    });
    
    return response.data;
  }
  
  async updateProperty(listingId, property) {
    const apiKey = await this.getApiKey();
    
    const updates = {
      precio: parseFloat(property.price),
      descripcion: property.description,
      imagenes: property.images.map(url => ({ url })),
    };
    
    const response = await axios.put(`${this.apiUrl}/propiedades/${listingId}`, updates, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    await PropertyListing.update(
      { metadata: response.data, lastSyncAt: new Date() },
      { where: { externalListingId: listingId, tenantId: this.tenantId } }
    );
    
    return response.data;
  }
  
  async deleteProperty(listingId) {
    const apiKey = await this.getApiKey();
    
    await axios.delete(`${this.apiUrl}/propiedades/${listingId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    await PropertyListing.update(
      { status: 'deleted', deletedAt: new Date() },
      { where: { externalListingId: listingId, tenantId: this.tenantId } }
    );
  }
  
  async pauseProperty(listingId) {
    const apiKey = await this.getApiKey();
    
    await axios.patch(`${this.apiUrl}/propiedades/${listingId}`, {
      estado: 'pausada',
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    await PropertyListing.update(
      { status: 'paused' },
      { where: { externalListingId: listingId, tenantId: this.tenantId } }
    );
  }
  
  async activateProperty(listingId) {
    const apiKey = await this.getApiKey();
    
    await axios.patch(`${this.apiUrl}/propiedades/${listingId}`, {
      estado: 'activa',
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    await PropertyListing.update(
      { status: 'active' },
      { where: { externalListingId: listingId, tenantId: this.tenantId } }
    );
  }
  
  // ==================== MENSAJES ====================
  
  async fetchMessages(lastSync = null) {
    const apiKey = await this.getApiKey();
    
    const params = { estado: 'pendiente' };
    if (lastSync) {
      params.desde = lastSync.toISOString();
    }
    
    const response = await axios.get(`${this.apiUrl}/consultas`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      params,
    });
    
    return response.data.consultas || [];
  }
  
  async replyToMessage(messageId, reply) {
    const apiKey = await this.getApiKey();
    
    await axios.post(`${this.apiUrl}/consultas/${messageId}/responder`, {
      respuesta: reply,
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
  }
  
  // ==================== MÉTRICAS ====================
  
  async getListingStats(listingId) {
    const apiKey = await this.getApiKey();
    
    const response = await axios.get(`${this.apiUrl}/propiedades/${listingId}/estadisticas`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    return {
      views: response.data.visitas || 0,
      contacts: response.data.contactos || 0,
      lastUpdated: new Date(),
    };
  }
  
  // ==================== HELPERS ====================
  
  async getApiKey() {
    const config = await IntegrationConfig.findOne({
      where: {
        tenantId: this.tenantId,
        provider: 'zonaprop',
      },
    });
    
    if (!config || !config.accessToken) {
      throw new Error('ZonaProp not connected');
    }
    
    return decrypt({
      encrypted: config.accessToken,
      iv: config.accessTokenIv,
      authTag: config.accessTokenAuthTag,
    });
  }
  
  mapPropertyType(type) {
    const mapping = {
      'casa': 'Casa',
      'departamento': 'Departamento',
      'duplex': 'Duplex',
      'local': 'Local Comercial',
      'oficina': 'Oficina',
      'lote': 'Terreno',
      'terreno': 'Terreno',
    };
    
    return mapping[type] || 'Casa';
  }
}

module.exports = ZonaPropProvider;
```

---

#### 4. **Factory para Crear Providers**

```javascript
// back/src/integrations/IntegrationFactory.js

const MercadoLibreProvider = require('./providers/MercadoLibreProvider');
const ZonaPropProvider = require('./providers/ZonaPropProvider');
const ArgenPropProvider = require('./providers/ArgenPropProvider');
const WhatsAppProvider = require('./providers/WhatsAppProvider');

const PROVIDERS = {
  mercadolibre: MercadoLibreProvider,
  zonaprop: ZonaPropProvider,
  argenprop: ArgenPropProvider,
  whatsapp: WhatsAppProvider,
};

class IntegrationFactory {
  /**
   * Crea una instancia del provider solicitado
   */
  static create(providerName, tenantId, config = null) {
    const ProviderClass = PROVIDERS[providerName.toLowerCase()];
    
    if (!ProviderClass) {
      throw new Error(`Provider desconocido: ${providerName}`);
    }
    
    return new ProviderClass(tenantId, config);
  }
  
  /**
   * Obtiene lista de providers disponibles
   */
  static getAvailableProviders() {
    return Object.keys(PROVIDERS);
  }
  
  /**
   * Registra un nuevo provider (para extensibilidad futura)
   */
  static registerProvider(name, ProviderClass) {
    PROVIDERS[name.toLowerCase()] = ProviderClass;
  }
}

module.exports = IntegrationFactory;
```

---

#### 5. **Controlador Unificado de Integraciones**

```javascript
// back/src/controllers/IntegrationController.js

const IntegrationFactory = require('../integrations/IntegrationFactory');
const { IntegrationConfig } = require('../data');
const logger = require('../utils/logger');

/**
 * Obtener lista de integraciones disponibles
 */
exports.getAvailableIntegrations = async (req, res) => {
  try {
    const providers = IntegrationFactory.getAvailableProviders();
    
    const integrations = providers.map(name => ({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      description: getProviderDescription(name),
      features: getProviderFeatures(name),
    }));
    
    res.json({
      success: true,
      integrations,
    });
  } catch (error) {
    logger.error('Error getting integrations', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener estado de integraciones del tenant
 */
exports.getIntegrationStatus = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const configs = await IntegrationConfig.findAll({
      where: { tenantId },
      attributes: ['provider', 'isActive', 'lastSyncAt', 'createdAt'],
    });
    
    res.json({
      success: true,
      integrations: configs,
    });
  } catch (error) {
    logger.error('Error getting integration status', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Iniciar autenticación con un provider
 */
exports.startAuth = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { provider } = req.params;
    
    const integration = IntegrationFactory.create(provider, tenantId);
    const result = await integration.startAuth();
    
    res.json({
      success: true,
      provider,
      ...result,
    });
  } catch (error) {
    logger.error('Error starting auth', {
      provider: req.params.provider,
      error: error.message,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Callback de OAuth (genérico para todos los providers)
 */
exports.handleCallback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;
    
    // Extraer tenantId del state
    const tenantId = parseInt(state.replace('tenant_', ''));
    
    const integration = IntegrationFactory.create(provider, tenantId);
    await integration.handleCallback(code, state);
    
    // Redirigir al frontend con éxito
    res.redirect(`${process.env.FRONTEND_URL}/admin/integrations?success=true&provider=${provider}`);
  } catch (error) {
    logger.error('Error in callback', {
      provider: req.params.provider,
      error: error.message,
    });
    res.redirect(`${process.env.FRONTEND_URL}/admin/integrations?error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Desconectar integración
 */
exports.disconnect = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { provider } = req.params;
    
    const integration = IntegrationFactory.create(provider, tenantId);
    await integration.disconnect();
    
    res.json({
      success: true,
      message: `${provider} desconectado exitosamente`,
    });
  } catch (error) {
    logger.error('Error disconnecting', {
      provider: req.params.provider,
      error: error.message,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Publicar propiedad en un provider específico
 */
exports.publishProperty = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { provider, propertyId } = req.params;
    
    const property = await Property.findOne({
      where: { propertyId, tenantId },
    });
    
    if (!property) {
      return res.status(404).json({ success: false, message: 'Propiedad no encontrada' });
    }
    
    const integration = IntegrationFactory.create(provider, tenantId);
    const result = await integration.publishProperty(property);
    
    res.json({
      success: true,
      provider,
      listing: result,
    });
  } catch (error) {
    logger.error('Error publishing property', {
      provider: req.params.provider,
      propertyId: req.params.propertyId,
      error: error.message,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ... más endpoints para update, delete, pause, etc.

function getProviderDescription(name) {
  const descriptions = {
    mercadolibre: 'Marketplace líder en Latinoamérica',
    zonaprop: 'Portal inmobiliario de Argentina',
    argenprop: 'Portal inmobiliario de Argentina',
    whatsapp: 'WhatsApp Business API para contacto directo',
  };
  return descriptions[name] || '';
}

function getProviderFeatures(name) {
  const features = {
    mercadolibre: ['Publicación automática', 'Gestión de consultas', 'Estadísticas de visitas'],
    zonaprop: ['Publicación automática', 'Gestión de consultas', 'Planes destacados'],
    argenprop: ['Publicación automática', 'Gestión de consultas'],
    whatsapp: ['Chat directo', 'Mensajes automáticos', 'Plantillas personalizadas'],
  };
  return features[name] || [];
}

module.exports = exports;
```

---

#### 6. **Rutas Unificadas de Integraciones**

```javascript
// back/src/routes/integrations.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const IntegrationController = require('../controllers/IntegrationController');

// Autenticación requerida para todas las rutas
router.use(authMiddleware);
router.use(tenancyMiddleware);

// ==================== GESTIÓN GENERAL ====================

// Listar integraciones disponibles
router.get('/available', IntegrationController.getAvailableIntegrations);

// Estado de integraciones del tenant
router.get('/status', IntegrationController.getIntegrationStatus);

// ==================== AUTENTICACIÓN ====================

// Iniciar autenticación con un provider
router.get('/:provider/auth/start', IntegrationController.startAuth);

// Callback de OAuth (no requiere tenancy, viene desde provider)
router.get('/:provider/callback', IntegrationController.handleCallback);

// Desconectar integración
router.post('/:provider/disconnect', IntegrationController.disconnect);

// ==================== PUBLICACIONES ====================

// Publicar propiedad en un provider
router.post('/:provider/publish/:propertyId', IntegrationController.publishProperty);

// Actualizar publicación
router.put('/:provider/listings/:propertyId', IntegrationController.updateListing);

// Eliminar publicación
router.delete('/:provider/listings/:propertyId', IntegrationController.deleteListing);

// Pausar/Reactivar publicación
router.patch('/:provider/listings/:propertyId/pause', IntegrationController.pauseListing);
router.patch('/:provider/listings/:propertyId/activate', IntegrationController.activateListing);

// ==================== MENSAJES ====================

// Obtener mensajes
router.get('/:provider/messages', IntegrationController.getMessages);

// Responder mensaje
router.post('/:provider/messages/:messageId/reply', IntegrationController.replyToMessage);

// ==================== ESTADÍSTICAS ====================

// Obtener estadísticas de una publicación
router.get('/:provider/listings/:propertyId/stats', IntegrationController.getListingStats);

// ==================== WEBHOOKS ====================

// Webhook receiver (público, sin auth)
router.post('/:provider/webhook', IntegrationController.handleWebhook);

module.exports = router;
```

---

#### 7. **Modelo de Datos Unificado**

```sql
-- Migración: Sistema de integraciones unificado

BEGIN;

-- ============================================
-- Tabla: integration_configs
-- Configuración de integraciones por tenant
-- ============================================
CREATE TABLE IF NOT EXISTS integration_configs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- mercadolibre, zonaprop, argenprop, whatsapp
  external_user_id VARCHAR(100),
  
  -- Tokens encriptados
  access_token TEXT,
  access_token_iv VARCHAR(32),
  access_token_auth_tag VARCHAR(32),
  
  refresh_token TEXT,
  refresh_token_iv VARCHAR(32),
  refresh_token_auth_tag VARCHAR(32),
  
  token_expires_at TIMESTAMP,
  
  is_active BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP,
  
  -- Metadata específica del provider (JSON)
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, provider)
);

-- Índices
CREATE INDEX idx_integration_configs_tenant ON integration_configs(tenant_id);
CREATE INDEX idx_integration_configs_provider ON integration_configs(provider);
CREATE INDEX idx_integration_configs_active ON integration_configs(is_active);

-- ============================================
-- Tabla: property_listings
-- Publicaciones de propiedades en plataformas externas
-- ============================================
CREATE TABLE IF NOT EXISTS property_listings (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES "Property"("propertyId") ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- mercadolibre, zonaprop, argenprop
  
  external_listing_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, deleted, error
  permalink TEXT,
  
  -- Metadata específica del provider
  metadata JSONB DEFAULT '{}',
  
  last_sync_at TIMESTAMP,
  sync_errors TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE(property_id, provider, tenant_id)
);

-- Índices
CREATE INDEX idx_property_listings_property ON property_listings(property_id);
CREATE INDEX idx_property_listings_tenant ON property_listings(tenant_id);
CREATE INDEX idx_property_listings_provider ON property_listings(provider);
CREATE INDEX idx_property_listings_status ON property_listings(status);
CREATE INDEX idx_property_listings_external_id ON property_listings(external_listing_id);

-- ============================================
-- Tabla: integration_messages
-- Mensajes y consultas desde plataformas externas
-- ============================================
CREATE TABLE IF NOT EXISTS integration_messages (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  property_id INTEGER REFERENCES "Property"("propertyId") ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  
  external_message_id VARCHAR(100) NOT NULL,
  external_listing_id VARCHAR(100),
  external_user_id VARCHAR(100),
  external_user_name VARCHAR(255),
  
  message TEXT NOT NULL,
  reply TEXT,
  
  status VARCHAR(50) DEFAULT 'UNANSWERED', -- UNANSWERED, ANSWERED, DELETED
  is_read BOOLEAN DEFAULT false,
  
  received_at TIMESTAMP,
  answered_at TIMESTAMP,
  
  -- Metadata específica del provider
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(external_message_id, provider)
);

-- Índices
CREATE INDEX idx_integration_messages_tenant ON integration_messages(tenant_id);
CREATE INDEX idx_integration_messages_property ON integration_messages(property_id);
CREATE INDEX idx_integration_messages_provider ON integration_messages(provider);
CREATE INDEX idx_integration_messages_status ON integration_messages(status);
CREATE INDEX idx_integration_messages_read ON integration_messages(is_read);
CREATE INDEX idx_integration_messages_received ON integration_messages(received_at);

-- ============================================
-- Tabla: integration_sync_logs
-- Log de sincronizaciones
-- ============================================
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- full, incremental, messages, stats
  
  status VARCHAR(50) NOT NULL, -- pending, running, completed, failed
  
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  error_message TEXT,
  
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_integration_sync_logs_tenant ON integration_sync_logs(tenant_id);
CREATE INDEX idx_integration_sync_logs_provider ON integration_sync_logs(provider);
CREATE INDEX idx_integration_sync_logs_status ON integration_sync_logs(status);
CREATE INDEX idx_integration_sync_logs_started ON integration_sync_logs(started_at);

COMMIT;
```

---

### Ventajas de esta Arquitectura

1. **✅ Extensibilidad:** Agregar nueva integración solo requiere crear un nuevo Provider que implemente la interfaz base
2. **✅ Mantenibilidad:** Código organizado, cada provider en su propio archivo
3. **✅ Testabilidad:** Fácil crear mocks de providers para tests
4. **✅ Consistencia:** Todos los providers usan la misma estructura y endpoints
5. **✅ Unificación Frontend:** El frontend trabaja con una única API de integraciones
6. **✅ Observabilidad:** Logs centralizados, métricas por provider

---

## 🌐 Sistema de Dominios Personalizados {#dominios-personalizados}

### Problema Actual

Subdominios fijos: `demo.innoinmo.com`, `cliente1.innoinmo.com`

**Limitaciones:**
- Branding limitado
- No se puede usar dominio propio de la inmobiliaria
- Menos profesional para clientes Enterprise

### Solución: Custom Domains con Verificación DNS

#### 1. **Arquitectura de Dominios**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    Cliente visita: www.inmobiliariaXYZ.com     │
│                                                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           DNS Resolution                        │
│  www.inmobiliariaXYZ.com → CNAME →              │
│  xyz.innoinmo.com → A Record → Your Server IP   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         Reverse Proxy (Nginx/Caddy)             │
│  - Leer SNI del certificado SSL                 │
│  - Buscar tenant por domain en BD/Cache         │
│  - Proxy a backend con tenant_id                │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              Backend API                        │
│  - Extraer tenant de header X-Tenant-ID         │
│  - Aplicar tenancy middleware                   │
│  - Servir datos filtrados del tenant            │
└─────────────────────────────────────────────────┘
```

---

#### 2. **Modelo de Datos**

```sql
-- Migración: Custom domains

BEGIN;

-- Agregar campos a tabla tenants
ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(255) UNIQUE;
ALTER TABLE tenants ADD COLUMN custom_domain_verified BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN custom_domain_verification_token VARCHAR(100);
ALTER TABLE tenants ADD COLUMN ssl_certificate_issued BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN ssl_expires_at TIMESTAMP;

-- Índice para búsqueda rápida por dominio
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);

-- Tabla de verificaciones de dominio
CREATE TABLE domain_verifications (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  verification_method VARCHAR(50) NOT NULL, -- DNS_TXT, DNS_CNAME, HTTP_FILE
  verification_token VARCHAR(100) NOT NULL,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed, expired
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domain_verifications_tenant ON domain_verifications(tenant_id);
CREATE INDEX idx_domain_verifications_domain ON domain_verifications(domain);

COMMIT;
```

---

#### 3. **Backend: Domain Management Controller**

```javascript
// back/src/controllers/DomainController.js

const { Tenant, DomainVerification } = require('../data');
const crypto = require('crypto');
const acme = require('acme-client');
const logger = require('../utils/logger');

/**
 * Agregar dominio personalizado
 */
exports.addCustomDomain = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { domain } = req.body;
    
    // Validar formato de dominio
    if (!isValidDomain(domain)) {
      return res.status(400).json({
        success: false,
        message: 'Dominio inválido. Use el formato "www.ejemplo.com" o "ejemplo.com".',
      });
    }
    
    // Verificar que el dominio no está en uso
    const existingDomain = await Tenant.findOne({
      where: { custom_domain: domain },
    });
    
    if (existingDomain) {
      return res.status(409).json({
        success: false,
        message: 'Este dominio ya está en uso por otra inmobiliaria.',
      });
    }
    
    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Crear registro de verificación
    await DomainVerification.create({
      tenantId,
      domain,
      verificationMethod: 'DNS_TXT',
      verificationToken,
      status: 'pending',
    });
    
    // Actualizar tenant
    await Tenant.update(
      {
        custom_domain: domain,
        custom_domain_verified: false,
        custom_domain_verification_token: verificationToken,
      },
      { where: { tenantId } }
    );
    
    logger.info('Custom domain added', { tenantId, domain });
    
    res.json({
      success: true,
      message: 'Dominio agregado. Sigue las instrucciones para verificarlo.',
      domain,
      verificationToken,
      instructions: {
        method: 'DNS_TXT',
        steps: [
          'Ingresa al panel de administración DNS de tu proveedor (GoDaddy, Namecheap, etc.)',
          `Crea un registro TXT con el nombre "_innoinmo-verification"`,
          `Valor del registro: ${verificationToken}`,
          'Espera a que el DNS se propague (puede tardar hasta 24 horas)',
          'Haz click en "Verificar Dominio" en el panel de administración',
        ],
      },
    });
  } catch (error) {
    logger.error('Error adding custom domain', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verificar dominio personalizado
 */
exports.verifyCustomDomain = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const tenant = await Tenant.findByPk(tenantId);
    
    if (!tenant.custom_domain) {
      return res.status(400).json({
        success: false,
        message: 'No has configurado un dominio personalizado.',
      });
    }
    
    // Verificar registro DNS TXT
    const dns = require('dns').promises;
    
    try {
      const records = await dns.resolveTxt(`_innoinmo-verification.${tenant.custom_domain}`);
      
      // Buscar el token en los registros TXT
      const tokenFound = records.some(record =>
        record.join('').includes(tenant.custom_domain_verification_token)
      );
      
      if (!tokenFound) {
        return res.status(400).json({
          success: false,
          message: 'No se encontró el registro TXT de verificación. Asegúrate de haberlo configurado correctamente.',
        });
      }
      
      // Dominio verificado!
      await tenant.update({
        custom_domain_verified: true,
      });
      
      await DomainVerification.update(
        { status: 'verified', verified_at: new Date() },
        { where: { tenantId, domain: tenant.custom_domain } }
      );
      
      // Iniciar emisión de certificado SSL
      await issueCertificate(tenant);
      
      logger.info('Custom domain verified', { tenantId, domain: tenant.custom_domain });
      
      res.json({
        success: true,
        message: '¡Dominio verificado exitosamente! Tu certificado SSL se está emitiendo.',
        domain: tenant.custom_domain,
      });
      
    } catch (dnsError) {
      logger.error('DNS verification failed', {
        tenantId,
        domain: tenant.custom_domain,
        error: dnsError.message,
      });
      
      await DomainVerification.update(
        { status: 'failed', error_message: dnsError.message },
        { where: { tenantId, domain: tenant.custom_domain } }
      );
      
      res.status(400).json({
        success: false,
        message: 'No se pudo verificar el dominio. Verifica la configuración DNS.',
        error: dnsError.message,
      });
    }
  } catch (error) {
    logger.error('Error verifying custom domain', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Emitir certificado SSL con Let's Encrypt
 */
async function issueCertificate(tenant) {
  try {
    const accountPrivateKey = await acme.forge.createPrivateKey();
    
    const client = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production,
      accountKey: accountPrivateKey,
    });
    
    // Crear orden
    const [key, csr] = await acme.forge.createCsr({
      commonName: tenant.custom_domain,
    });
    
    const cert = await client.auto({
      csr,
      email: tenant.email,
      termsOfServiceAgreed: true,
      challengeCreateFn: async (authz, challenge, keyAuthorization) => {
        // Implementar desafío HTTP-01 o DNS-01
        // HTTP-01: Crear archivo .well-known/acme-challenge/{token}
        // DNS-01: Crear registro TXT _acme-challenge.{domain}
        
        logger.info('ACME challenge created', {
          domain: tenant.custom_domain,
          type: challenge.type,
          token: challenge.token,
          keyAuthorization,
        });
        
        // Aquí debes exponer el challenge para que Let's Encrypt lo verifique
        // Puede ser via HTTP endpoint temporal o registro DNS
      },
      challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
        // Limpiar challenge después de verificación
        logger.info('ACME challenge removed', {
          domain: tenant.custom_domain,
          type: challenge.type,
        });
      },
    });
    
    // Guardar certificado
    await saveCertificate(tenant.tenantId, tenant.custom_domain, key.toString(), cert.toString());
    
    await tenant.update({
      ssl_certificate_issued: true,
      ssl_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
    });
    
    logger.info('SSL certificate issued', {
      tenantId: tenant.tenantId,
      domain: tenant.custom_domain,
    });
    
    // Recargar configuración de Nginx/Caddy
    await reloadReverseProxy();
    
  } catch (error) {
    logger.error('Error issuing SSL certificate', {
      tenantId: tenant.tenantId,
      domain: tenant.custom_domain,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Guardar certificado en disco
 */
async function saveCertificate(tenantId, domain, privateKey, certificate) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const certDir = path.join(__dirname, '../../ssl-certificates', domain);
  await fs.mkdir(certDir, { recursive: true });
  
  await fs.writeFile(path.join(certDir, 'privkey.pem'), privateKey);
  await fs.writeFile(path.join(certDir, 'fullchain.pem'), certificate);
  
  logger.info('Certificate saved', { tenantId, domain });
}

/**
 * Recargar configuración de reverse proxy
 */
async function reloadReverseProxy() {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    // Nginx
    await execPromise('sudo nginx -s reload');
    logger.info('Nginx reloaded');
  } catch (error) {
    // Caddy (alternativa más simple)
    try {
      await execPromise('sudo systemctl reload caddy');
      logger.info('Caddy reloaded');
    } catch (caddyError) {
      logger.error('Failed to reload reverse proxy', { error: error.message });
    }
  }
}

/**
 * Eliminar dominio personalizado
 */
exports.removeCustomDomain = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    await Tenant.update(
      {
        custom_domain: null,
        custom_domain_verified: false,
        custom_domain_verification_token: null,
        ssl_certificate_issued: false,
        ssl_expires_at: null,
      },
      { where: { tenantId } }
    );
    
    logger.info('Custom domain removed', { tenantId });
    
    res.json({
      success: true,
      message: 'Dominio personalizado eliminado.',
    });
  } catch (error) {
    logger.error('Error removing custom domain', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

function isValidDomain(domain) {
  const regex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return regex.test(domain);
}

module.exports = exports;
```

---

#### 4. **Reverse Proxy: Caddy Configuration**

Caddy es más simple que Nginx para SSL automático:

```caddyfile
# /etc/caddy/Caddyfile

# Subdominios por defecto
*.innoinmo.com {
  tls {
    # Certificado wildcard
    on_demand
  }
  
  reverse_proxy localhost:3001 {
    header_up X-Forwarded-Host {host}
    header_up X-Real-IP {remote}
  }
}

# Dominios personalizados (dinámico desde BD)
# Este bloque se genera automáticamente cuando se verifica un dominio

import /etc/caddy/custom-domains/*.caddy
```

**Script para generar configuración de dominio custom:**

```javascript
// back/src/utils/generateCaddyConfig.js

const fs = require('fs').promises;
const path = require('path');
const { Tenant } = require('../data');
const logger = require('./logger');

async function generateCaddyConfigs() {
  try {
    const tenants = await Tenant.findAll({
      where: {
        custom_domain_verified: true,
        ssl_certificate_issued: true,
      },
    });
    
    for (const tenant of tenants) {
      const config = `
# Tenant: ${tenant.businessName} (ID: ${tenant.tenantId})
${tenant.custom_domain} {
  tls /ssl-certificates/${tenant.custom_domain}/fullchain.pem /ssl-certificates/${tenant.custom_domain}/privkey.pem
  
  reverse_proxy localhost:3001 {
    header_up X-Forwarded-Host {host}
    header_up X-Real-IP {remote}
    header_up X-Tenant-ID ${tenant.tenantId}
  }
}
`;
      
      const configPath = path.join('/etc/caddy/custom-domains', `${tenant.tenantId}.caddy`);
      await fs.writeFile(configPath, config);
      
      logger.info('Caddy config generated', {
        tenantId: tenant.tenantId,
        domain: tenant.custom_domain,
      });
    }
    
    // Recargar Caddy
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    await execPromise('sudo systemctl reload caddy');
    
  } catch (error) {
    logger.error('Error generating Caddy configs', { error: error.message });
  }
}

module.exports = generateCaddyConfigs;
```

---

#### 5. **Middleware: Domain Resolution**

```javascript
// back/src/middlewares/domainMiddleware.js

const { Tenant } = require('../data');
const { getTenantByDomain } = require('../utils/tenantCache');
const logger = require('../utils/logger');

async function resolveTenantByDomain(req, res, next) {
  try {
    const host = req.get('host') || '';
    
    // Remover puerto si existe
    const domain = host.split(':')[0];
    
    // Primero verificar si es subdominio de innoinmo.com
    if (domain.endsWith('.innoinmo.com')) {
      const subdomain = domain.split('.')[0];
      
      const tenant = await Tenant.findOne({
        where: { subdomain },
        attributes: ['tenantId', 'businessName', 'status', 'plan', 'features'],
      });
      
      if (tenant) {
        req.tenantId = tenant.tenantId;
        req.tenant = tenant;
        return next();
      }
    }
    
    // Si no es subdominio, verificar si es dominio personalizado
    const tenant = await getTenantByDomain(domain);
    
    if (tenant) {
      req.tenantId = tenant.tenantId;
      req.tenant = tenant;
      return next();
    }
    
    // Si no se encontró tenant, retornar error
    logger.warn('Tenant not found for domain', { domain });
    
    return res.status(404).json({
      error: 'Tenant no encontrado',
      message: 'No existe una inmobiliaria configurada para este dominio.',
    });
    
  } catch (error) {
    logger.error('Error resolving tenant by domain', { error: error.message });
    return res.status(500).json({
      error: 'Error resolviendo dominio',
      message: error.message,
    });
  }
}

module.exports = resolveTenantByDomain;
```

**Actualizar caché de tenants:**

```javascript
// back/src/utils/tenantCache.js

const Redis = require('ioredis');
const { Tenant } = require('../data');

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 900; // 15 minutos

async function getTenantByDomain(domain) {
  const cacheKey = `tenant:domain:${domain}`;
  
  // Intentar obtener de caché
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Verificar subdominios y dominios personalizados
  const tenant = await Tenant.findOne({
    where: {
      [Op.or]: [
        { subdomain: domain.split('.')[0] },
        { custom_domain: domain },
      ],
    },
    attributes: ['tenantId', 'businessName', 'status', 'plan', 'features'],
  });
  
  if (tenant) {
    // Guardar en caché
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(tenant));
  }
  
  return tenant;
}

async function invalidateTenantDomainCache(domain) {
  await redis.del(`tenant:domain:${domain}`);
}

module.exports = {
  getTenantByDomain,
  invalidateTenantDomainCache,
};
```

---

#### 6. **Frontend: Configuración de Dominio**

```jsx
// front/src/Components/Admin/Settings/CustomDomain.jsx

import { useState } from 'react';
import { useAddCustomDomainMutation, useVerifyCustomDomainMutation } from '@shared/redux';

const CustomDomain = ({ currentDomain, verified }) => {
  const [domain, setDomain] = useState(currentDomain || '');
  const [verificationToken, setVerificationToken] = useState(null);
  
  const [addDomain, { isLoading: isAdding }] = useAddCustomDomainMutation();
  const [verifyDomain, { isLoading: isVerifying }] = useVerifyCustomDomainMutation();
  
  const handleAddDomain = async () => {
    try {
      const result = await addDomain({ domain }).unwrap();
      setVerificationToken(result.verificationToken);
      alert('Dominio agregado. Sigue las instrucciones de verificación.');
    } catch (error) {
      alert(error.data?.message || 'Error al agregar dominio');
    }
  };
  
  const handleVerifyDomain = async () => {
    try {
      await verifyDomain().unwrap();
      alert('¡Dominio verificado exitosamente!');
    } catch (error) {
      alert(error.data?.message || 'Error al verificar dominio');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Dominio Personalizado</h2>
      
      {!currentDomain ? (
        <>
          <p className="text-gray-600 mb-4">
            Usa tu propio dominio para tu inmobiliaria (ej: www.tuinmobiliaria.com)
          </p>
          
          <div className="mb-4">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="www.tuinmobiliaria.com"
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleAddDomain}
            disabled={isAdding || !domain}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isAdding ? 'Agregando...' : 'Agregar Dominio'}
          </button>
        </>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600">Tu dominio actual:</p>
            <p className="text-xl font-bold">{currentDomain}</p>
            <span className={`px-2 py-1 rounded text-sm ${verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {verified ? '✓ Verificado' : '⏳ Pendiente de verificación'}
            </span>
          </div>
          
          {!verified && verificationToken && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <h3 className="font-bold mb-2">📋 Instrucciones de Verificación</h3>
              <ol className="list-decimal ml-4 space-y-2 text-sm">
                <li>Ingresa al panel DNS de tu proveedor</li>
                <li>Crea un registro TXT con nombre: <code className="bg-gray-200 px-1">_innoinmo-verification</code></li>
                <li>Valor del registro: <code className="bg-gray-200 px-1">{verificationToken}</code></li>
                <li>Espera a que el DNS se propague (puede tardar hasta 24 horas)</li>
                <li>Haz click en "Verificar Dominio"</li>
              </ol>
            </div>
          )}
          
          {!verified && (
            <button
              onClick={handleVerifyDomain}
              disabled={isVerifying}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {isVerifying ? 'Verificando...' : 'Verificar Dominio'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CustomDomain;
```

---

## 🔐 Mejoras de Seguridad {#seguridad}

### 1. **WAF (Web Application Firewall)**

Implementar Cloudflare como WAF:

```javascript
// Configuración de Cloudflare
// 1. Agregar dominio a Cloudflare
// 2. Habilitar:
//    - SSL/TLS Full (Strict)
//    - Always Use HTTPS
//    - Automatic HTTPS Rewrites
//    - WAF Rules
//    - DDoS Protection
//    - Rate Limiting (10000 req/hour por IP)
```

---

### 2. **Sanitización de Inputs**

```javascript
// back/src/middlewares/sanitize.js

const xss = require('xss');
const validator = require('validator');

function sanitizeMiddleware(req, res, next) {
  // Sanitizar body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitizar query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Escapar HTML/XSS
      sanitized[key] = xss(value);
      
      // Normalizar espacios
      sanitized[key] = validator.trim(sanitized[key]);
      
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
      
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

module.exports = sanitizeMiddleware;
```

---

### 3. **Helmet.js para Headers de Seguridad**

```javascript
// back/src/app.js

const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", process.env.API_URL],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## 🚀 Escalabilidad y Performance {#escalabilidad}

### 1. **Database Connection Pooling**

```javascript
// back/src/data/index.js

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
  
  pool: {
    max: 20,        // Máximo de conexiones
    min: 5,         // Mínimo de conexiones
    acquire: 60000, // Timeout para adquirir conexión (60s)
    idle: 10000,    // Tiempo antes de cerrar conexión idle (10s)
  },
  
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
    statement_timeout: 30000, // 30s timeout para queries
  },
});
```

---

### 2. **CDN para Assets Estáticos**

```javascript
// Configuración de Cloudinary con CDN

// back/src/utils/cloudinaryHelper.js

const cloudinary = require('cloudinary').v2;

cloud

inary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optimizar imágenes automáticamente
function getOptimizedImageUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',          // WebP si el navegador lo soporta
    quality: 'auto:best',          // Calidad automática optimizada
    transformation: [
      { width: options.width || 800, crop: 'limit' },
      { effect: 'sharpen:50' },
      { dpr: 'auto' },             // Densidad de pixeles automática
    ],
  });
}

module.exports = { getOptimizedImageUrl };
```

---

### 3. **Background Jobs con Bull**

```javascript
// back/src/jobs/syncIntegrationsJob.js

const Queue = require('bull');
const Redis = require('ioredis');
const IntegrationFactory = require('../integrations/IntegrationFactory');
const { Tenant, IntegrationConfig } = require('../data');
const logger = require('../utils/logger');

const syncQueue = new Queue('integration-sync', process.env.REDIS_URL);

// Procesar jobs
syncQueue.process(async (job) => {
  const { tenantId, provider } = job.data;
  
  try {
    logger.info('Starting integration sync', { tenantId, provider });
    
    const tenant = await Tenant.findByPk(tenantId);
    const config = await IntegrationConfig.findOne({
      where: { tenantId, provider },
    });
    
    if (!config || !config.isActive) {
      throw new Error('Integration not active');
    }
    
    const integration = IntegrationFactory.create(provider, tenantId, config);
    
    // Sincronizar mensajes
    await integration.fetchMessages();
    
    // Sincronizar estadísticas de listings
    // ... lógica de sync
    
    logger.info('Integration sync completed', { tenantId, provider });
    
  } catch (error) {
    logger.error('Integration sync failed', {
      tenantId,
      provider,
      error: error.message,
    });
    throw error;
  }
});

// Programar sincronizaciones periódicas
async function schedulePeriodicSyncs() {
  const tenants = await Tenant.findAll({
    include: [{
      model: IntegrationConfig,
      where: { isActive: true },
    }],
  });
  
  for (const tenant of tenants) {
    for (const config of tenant.IntegrationConfigs) {
      // Sincronizar cada 15 minutos
      await syncQueue.add(
        { tenantId: tenant.tenantId, provider: config.provider },
        { repeat: { cron: '*/15 * * * *' } }
      );
    }
  }
}

module.exports = { syncQueue, schedulePeriodicSyncs };
```

---

## 📅 Plan de Implementación {#plan-implementacion}

### **Fase 1: Seguridad Crítica (Sprint 1 - 2 semanas) 🔴**

**Objetivo:** Resolver vulnerabilidades críticas

| Tarea | Esfuerzo | Responsable |
|-------|----------|-------------|
| Encriptación de tokens OAuth | 2 días | Backend Dev |
| Tests de tenant isolation | 1 semana | QA + Backend Dev |
| Rate limiting global y por tenant | 2 días | Backend Dev |
| Sanitización de inputs | 1 día | Backend Dev |
| Helmet.js y headers de seguridad | 1 día | Backend Dev |

**Entregables:**
- ✅ Todos los tokens encriptados
- ✅ Batería de tests de aislamiento pasando
- ✅ Rate limiting activo en producción
- ✅ WAF configurado (Cloudflare)

---

### **Fase 2: Arquitectura de Integraciones (Sprint 2-3 - 3 semanas) 🟡**

**Objetivo:** Implementar sistema de integraciones extensible

| Tarea | Esfuerzo | Responsable |
|-------|----------|-------------|
| Crear interfaz BaseIntegrationProvider | 2 días | Backend Dev |
| Migrar MercadoLibre a nuevo sistema | 3 días | Backend Dev |
| Implementar ZonaProp provider | 4 días | Backend Dev |
| Implementar ArgenProp provider | 4 días | Backend Dev |
| Implementar WhatsApp provider | 3 días | Backend Dev |
| Controlador unificado de integraciones | 2 días | Backend Dev |
| Frontend de gestión de integraciones | 1 semana | Frontend Dev |
| Tests E2E de integraciones | 3 días | QA |

**Entregables:**
- ✅ 4 integraciones funcionando (ML, ZP, AP, WA)
- ✅ Panel admin para conectar/desconectar
- ✅ Publicación automática en múltiples plataformas
- ✅ Gestión unificada de mensajes

---

### **Fase 3: Dominios Personalizados (Sprint 4 - 2 semanas) 🟢**

**Objetivo:** Permitir que tenants usen sus propios dominios

| Tarea | Esfuerzo | Responsable |
|-------|----------|-------------|
| Modelo de datos de dominios | 1 día | Backend Dev |
| Controlador de gestión de dominios | 3 días | Backend Dev |
| Verificación DNS automatizada | 2 días | Backend Dev |
| Emisión SSL con Let's Encrypt | 3 días | DevOps |
| Configuración de Caddy/Nginx | 2 días | DevOps |
| Frontend de configuración de dominio | 2 días | Frontend Dev |
| Documentación para usuarios | 1 día | Tech Writer |

**Entregables:**
- ✅ Tenants pueden agregar dominio personalizado
- ✅ Verificación DNS automática
- ✅ Certificados SSL emitidos automáticamente
- ✅ Documentación paso a paso

---

### **Fase 4: Observabilidad y Performance (Sprint 5 - 2 semanas) 🟢**

**Objetivo:** Mejorar debugging, monitoreo y velocidad

| Tarea | Esfuerzo | Responsable |
|-------|----------|-------------|
| Logger estructurado (Winston + ES) | 2 días | Backend Dev |
| Logs de auditoría | 2 días | Backend Dev |
| Caché de configuración de tenant | 1 día | Backend Dev |
| Connection pooling y query optimization | 2 días | Backend Dev |
| CDN para assets (Cloudinary) | 1 día | Backend Dev |
| Background jobs (Bull) | 3 días | Backend Dev |
| Dashboard de métricas (Grafana) | 3 días | DevOps |

**Entregables:**
- ✅ Logs centralizados en Elasticsearch
- ✅ Reducción de latencia en 50%
- ✅ Dashboard de métricas en tiempo real
- ✅ Alertas automáticas configuradas

---

## 📊 Estimaciones y Prioridades {#estimaciones}

### Resumen de Esfuerzo Total

| Fase | Duración | Story Points | Costo (estimado) |
|------|----------|--------------|------------------|
| Fase 1: Seguridad | 2 semanas | 21 | $8,000 USD |
| Fase 2: Integraciones | 3 semanas | 34 | $13,000 USD |
| Fase 3: Dominios | 2 semanas | 21 | $8,000 USD |
| Fase 4: Performance | 2 semanas | 18 | $7,000 USD |
| **TOTAL** | **9 semanas** | **94** | **$36,000 USD** |

### Priorización (MoSCoW)

#### **Must Have (Crítico)**
1. 🔴 Encriptación de tokens
2. 🔴 Tenant isolation tests
3. 🔴 Rate limiting
4. 🟡 Migración ML a arquitectura plugin
5. 🟡 ZonaProp integration

#### **Should Have (Importante)**
6. 🟡 ArgenProp integration
7. 🟡 WhatsApp integration
8. 🟢 Dominios personalizados
9. 🟢 Logger estructurado

#### **Could Have (Nice to have)**
10. 🟢 Caché de tenant
11. 🟢 Background jobs
12. 🟢 Dashboard de métricas

#### **Won't Have (Futuro)**
- Integración con redes sociales (Facebook, Instagram)
- Sistema de CRM avanzado
- Analíticas predictivas con ML

---

## 🎓 Recomendaciones Finales

### Stack Tecnológico Recomendado

```
Backend:
✅ Node.js + Express
✅ PostgreSQL (Neon Serverless)
✅ Redis (caché + queues)
✅ Bull (background jobs)
✅ Winston + Elasticsearch (logs)

Frontend:
✅ React + Vite
✅ Redux Toolkit + RTK Query
✅ Tailwind CSS

Mobile:
✅ React Native + Expo

DevOps:
✅ Railway (backend)
✅ Vercel (frontend)
✅ Cloudflare (CDN + WAF)
✅ Caddy (reverse proxy + SSL)
✅ GitHub Actions (CI/CD)

Monitoring:
✅ Grafana + Prometheus
✅ Sentry (error tracking)
✅ LogRocket (session replay)
```

---

### Próximos Pasos Inmediatos

1. **Esta Semana:**
   - ✅ Revisar y aprobar este documento
   - ✅ Crear tickets en Jira/Linear para Fase 1
   - ✅ Configurar entorno de staging

2. **Sprint 1 (Semanas 1-2):**
   - Implementar encriptación de tokens
   - Crear tests de tenant isolation
   - Implementar rate limiting
   - Deploy a staging

3. **Sprint 2 (Semanas 3-5):**
   - Refactorizar MercadoLibre a nueva arquitectura
   - Implementar ZonaProp
   - Implementar ArgenProp

---

## 📞 Contacto y Seguimiento

**Próxima Revisión:** Cada viernes (standup semanal)  
**Canal de Slack:** #innoinmo-dev  
**Documentación:** Notion + GitHub Wiki  

---

**Fin del documento** 🚀

Este roadmap te llevará de un MVP multitenant a una plataforma SaaS de nivel enterprise. Cada fase es independiente y pueden ajustarse prioridades según necesidad de negocio.

¿Alguna sección que quieras que profundice más?
