'use strict';

/**
 * Tests de aislamiento de tenants (multitenant security)
 *
 * Verifica que un tenant autenticado NO pueda acceder a datos de otro tenant.
 * Cubre los vectores de ataque más comunes en SaaS multitenant:
 *  - IDOR (Insecure Direct Object Reference)
 *  - Tenant context spoofing via X-Tenant-Id header
 *  - Acceso sin autenticación
 */

// ─── Variables de entorno (deben setearse ANTES de cualquier require) ────────
process.env.JWT_SECRET_KEY = 'test-secret-key-isolation-tests';
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

// ─── Mocks (deben estar antes de require('../..')) ────────────────────────────

// rate-limit-redis: evita conexión real en tests
jest.mock('rate-limit-redis', () => {
  class MockRedisStore {
    constructor() {}
    async increment() { return { totalHits: 1, resetTime: new Date() }; }
    async decrement() {}
    async resetKey() {}
  }
  return { RedisStore: MockRedisStore, default: MockRedisStore };
});

// Redis: sin conexión real en tests
jest.mock('../../utils/redis', () => {
  const client = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    scan: jest.fn().mockResolvedValue(['0', []]),
    defineCommand: jest.fn(),
    sendCommand: jest.fn().mockResolvedValue(null),
    duplicate: jest.fn(),
  };
  return {
    getRedisClient: () => client,
    getJson: jest.fn().mockResolvedValue(null),
    setJson: jest.fn().mockResolvedValue(true),
    invalidatePattern: jest.fn().mockResolvedValue(0),
  };
});

// TenantCache: controlado por cada test
jest.mock('../../utils/tenantCache', () => ({
  getTenantBySubdomain: jest.fn().mockResolvedValue(null),
  getTenantById: jest.fn().mockResolvedValue(null),
  getTenantByCustomDomain: jest.fn().mockResolvedValue(null),
  invalidateTenantCache: jest.fn().mockResolvedValue(undefined),
  getCachedData: jest.fn((key, fn) => fn()),
}));

// Prisma client: sin DB real
jest.mock('../../utils/prismaClient', () => {
  const model = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    upsert: jest.fn().mockResolvedValue({}),
    aggregate: jest.fn().mockResolvedValue({ _sum: {}, _avg: {} }),
    groupBy: jest.fn().mockResolvedValue([]),
  });
  return {
    Property: model(),
    Clients: model(),
    admins: model(),
    tenants: model(),
    Leases: model(),
    PaymentReceipts: model(),
    subscriptions: model(),
    plans: model(),
    PropertyMLListings: model(),
    MercadoLibreConfig: model(),
    MercadoLibreMessages: model(),
    Garantors: model(),
    admin_settings: model(),
    pdf_templates: model(),
    RentUpdates: model(),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    $transaction: jest.fn((fn) => fn({})),
  };
});

// ─── Imports ──────────────────────────────────────────────────────────────────
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const prisma = require('../../utils/prismaClient');
const Property = prisma.Property;
const Client = prisma.Clients;
const Admin = prisma.admins;
const { getTenantById } = require('../../utils/tenantCache');

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const TENANT_A = 1;
const TENANT_B = 2;
const SECRET = process.env.JWT_SECRET_KEY;

const makeToken = (adminId) =>
  jwt.sign({ id: adminId }, SECRET, { expiresIn: '1h' });

const TOKEN_A = makeToken(101);
const TOKEN_B = makeToken(102);

const ADMIN_A = { adminId: 101, username: 'adminA', email: 'a@test.com', role: 'SUPER_ADMIN', tenantId: TENANT_A };
const ADMIN_B = { adminId: 102, username: 'adminB', email: 'b@test.com', role: 'SUPER_ADMIN', tenantId: TENANT_B };

const TENANT_A_OBJ = { tenantId: TENANT_A, businessName: 'Inmobiliaria A', subdomain: 'tenant-a', status: 'ACTIVE', plan: 'PROFESSIONAL', features: {} };
const TENANT_B_OBJ = { tenantId: TENANT_B, businessName: 'Inmobiliaria B', subdomain: 'tenant-b', status: 'ACTIVE', plan: 'PROFESSIONAL', features: {} };

/** Configura los mocks para simular un admin autenticado con su tenant */
function setupAuth(admin, tenant) {
  Admin.findUnique.mockResolvedValue(admin);
  getTenantById.mockResolvedValue(tenant);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Tenant Isolation — Seguridad Multitenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // 1. AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════
  describe('1. Autenticación', () => {
    it('rechaza requests sin token JWT', async () => {
      const res = await request(app).get('/api/property');
      expect(res.status).toBe(401);
    });

    it('rechaza requests con token JWT inválido', async () => {
      const res = await request(app)
        .get('/api/property')
        .set('Authorization', 'Bearer token-invalido-xyz');
      expect(res.status).toBe(401);
    });

    it('rechaza tokens firmados con clave incorrecta', async () => {
      const wrongToken = jwt.sign({ id: 101 }, 'clave-incorrecta', { expiresIn: '1h' });
      const res = await request(app)
        .get('/api/property')
        .set('Authorization', `Bearer ${wrongToken}`);
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. AISLAMIENTO EN PROPIEDADES
  // ═══════════════════════════════════════════════════════════
  describe('2. Aislamiento — Propiedades', () => {
    it('filtra propiedades por el tenantId del JWT (tenant A)', async () => {
      setupAuth(ADMIN_A, TENANT_A_OBJ);
      Property.findMany.mockResolvedValue([
        { propertyId: 1, title: 'Casa A1', tenantId: TENANT_A, ClientProperties: [] },
      ]);

      const res = await request(app)
        .get('/api/property')
        .set('Authorization', `Bearer ${TOKEN_A}`);

      expect(res.status).toBe(200);
      expect(Property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        })
      );
    });

    it('filtra propiedades por el tenantId del JWT (tenant B)', async () => {
      setupAuth(ADMIN_B, TENANT_B_OBJ);
      Property.findMany.mockResolvedValue([]);

      await request(app)
        .get('/api/property')
        .set('Authorization', `Bearer ${TOKEN_B}`);

      const callArgs = Property.findMany.mock.calls[0][0];
      expect(callArgs.where.tenantId).toBe(TENANT_B);
      expect(callArgs.where.tenantId).not.toBe(TENANT_A);
    });

    it('previene IDOR — tenant A no puede leer propiedad de tenant B (404)', async () => {
      setupAuth(ADMIN_A, TENANT_A_OBJ);
      // Propiedad 99 existe en B, pero findFirst con tenantId=A retorna null
      Property.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/property/99')
        .set('Authorization', `Bearer ${TOKEN_A}`);

      expect(res.status).toBe(404);
      // La consulta debe haberse filtrado por tenantId de A, no de B
      expect(Property.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        })
      );
    });

    it('previene IDOR — tenant A no puede borrar propiedad de tenant B (404)', async () => {
      setupAuth(ADMIN_A, TENANT_A_OBJ);
      Property.deleteMany.mockResolvedValue({ count: 0 }); // count=0 = no pertenece a este tenant

      const res = await request(app)
        .delete('/api/property/99')
        .set('Authorization', `Bearer ${TOKEN_A}`);

      expect(res.status).toBe(404);
      expect(Property.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. AISLAMIENTO EN CLIENTES
  // ═══════════════════════════════════════════════════════════
  describe('3. Aislamiento — Clientes', () => {
    it('filtra clientes por tenantId del JWT', async () => {
      setupAuth(ADMIN_A, TENANT_A_OBJ);
      Client.findMany.mockResolvedValue([
        { idClient: 10, name: 'Cliente A1', tenantId: TENANT_A },
      ]);

      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${TOKEN_A}`);

      expect(res.status).toBe(200);
      expect(Client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        })
      );
    });

    it('previene IDOR — tenant A no puede leer cliente de tenant B (404)', async () => {
      setupAuth(ADMIN_A, TENANT_A_OBJ);
      Client.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/client/99')
        .set('Authorization', `Bearer ${TOKEN_A}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. INTEGRIDAD DEL CONTEXTO DE TENANT
  // ═══════════════════════════════════════════════════════════
  describe('4. Integridad del contexto de tenant', () => {
    it('usa tenantId del JWT aunque se envíe X-Tenant-Id de otro tenant en el header', async () => {
      setupAuth(ADMIN_A, TENANT_A_OBJ);
      // El tenancyMiddleware puede resolver tenant B por el header, pero
      // el controller usa req.user.tenantId (del JWT) que es tenant A
      getTenantById.mockImplementation((id) => {
        if (id === TENANT_A) return Promise.resolve(TENANT_A_OBJ);
        if (id === TENANT_B) return Promise.resolve(TENANT_B_OBJ);
        return Promise.resolve(null);
      });
      Property.findMany.mockResolvedValue([]);

      await request(app)
        .get('/api/property')
        .set('Authorization', `Bearer ${TOKEN_A}`)
        .set('X-Tenant-Id', String(TENANT_B)); // Intento de spoofing

      // El controller debe haber usado tenantId=A (del JWT), no B (del header)
      expect(Property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        })
      );
    });

    it('un PLATFORM_ADMIN no puede acceder a rutas de tenant', async () => {
      const platformAdmin = { ...ADMIN_A, role: 'PLATFORM_ADMIN', tenantId: null };
      Admin.findUnique.mockResolvedValue(platformAdmin);

      const res = await request(app)
        .get('/api/property')
        .set('Authorization', `Bearer ${TOKEN_A}`);

      expect(res.status).toBe(403);
    });
  });
});
