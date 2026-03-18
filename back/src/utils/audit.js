'use strict';

const logger = require('./logger');

/**
 * Escribe un registro de auditoría de forma asincrónica y no bloqueante.
 *
 * Los errores se logean pero NO se propagan al caller —
 * si el audit falla, la operación principal no debe verse afectada.
 *
 * Uso en controllers (fire-and-forget, sin await):
 *   logAudit({ tenantId, adminId, action: 'CREATE', resource: 'property',
 *               resourceId: newProperty.propertyId, newValues: {...}, req });
 *
 * @param {object}            params
 * @param {number|null}       params.tenantId
 * @param {number|null}       params.adminId
 * @param {string}            params.action     CREATE|UPDATE|DELETE|LOGIN|LOGOUT|PUBLISH|SUSPEND|ACTIVATE
 * @param {string}            params.resource   property|client|tenant|lease|payment|subscription|template|auth
 * @param {string|number|null} [params.resourceId]
 * @param {object|null}       [params.oldValues]
 * @param {object|null}       [params.newValues]
 * @param {object|null}       [params.req]      Express request (para IP y User-Agent)
 */
async function logAudit({
  tenantId,
  adminId,
  action,
  resource,
  resourceId = null,
  oldValues = null,
  newValues = null,
  req = null,
}) {
  try {
    const prisma = require('./prismaClient');
    await prisma.audit_logs.create({
      data: {
        tenantId: tenantId ?? null,
        adminId: adminId ?? null,
        action,
        resource,
        resourceId: resourceId != null ? String(resourceId) : null,
        oldValues,
        newValues,
        ipAddress: req?.ip ?? null,
        userAgent: req?.get?.('user-agent') ?? null,
      },
    });
  } catch (err) {
    logger.error('Audit log write failed', {
      error: err.message,
      action,
      resource,
      resourceId,
    });
  }
}

module.exports = { logAudit };
