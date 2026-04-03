'use strict';

/**
 * FiscalAuditRepository
 *
 * Registra toda actividad relevante del módulo fiscal: llamadas a ARCA,
 * onboarding, emisiones, errores, etc.
 *
 * Los campos requestData / responseData son sanitizados ANTES de llegar aquí
 * (no incluir tokens, claves ni secretos).
 */

const prisma = require('../utils/prismaClient');

/**
 * Registra un evento de auditoría fiscal.
 *
 * @param {object} entry
 * @param {number} entry.tenantId
 * @param {string} entry.action          - eg. 'invoice.authorize', 'profile.certificate_upload'
 * @param {string} entry.entityType      - eg. 'ElectronicInvoice', 'TenantFiscalProfile'
 * @param {string|number|null} entry.entityId
 * @param {object|null} entry.requestData  - Snapshot sanitizado del request enviado a ARCA
 * @param {object|null} entry.responseData - Snapshot sanitizado de la respuesta recibida
 * @param {'success'|'failure'|'pending'} entry.status
 * @param {string|null} [entry.errorMessage]
 * @param {number|null} [entry.createdBy]
 * @returns {Promise<object>}
 */
async function log(entry) {
  return prisma.fiscalAuditLog.create({
    data: {
      tenantId: entry.tenantId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ? String(entry.entityId) : null,
      requestData: entry.requestData || null,
      responseData: entry.responseData || null,
      status: entry.status,
      errorMessage: entry.errorMessage || null,
      createdBy: entry.createdBy || null,
    },
  });
}

/**
 * Lista entradas del audit log de un tenant con paginación.
 *
 * @param {number} tenantId
 * @param {object} filters
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=50]
 * @param {string} [filters.entityType]
 * @param {string} [filters.action]
 * @returns {Promise<{ entries: object[], total: number }>}
 */
async function findMany(tenantId, filters = {}) {
  const { page = 1, limit = 50, entityType, action } = filters;
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(entityType && { entityType }),
    ...(action && { action }),
  };

  const [entries, total] = await Promise.all([
    prisma.fiscalAuditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.fiscalAuditLog.count({ where }),
  ]);

  return { entries, total, page, limit };
}

module.exports = { log, findMany };
