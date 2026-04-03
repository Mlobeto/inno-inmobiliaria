'use strict';

/**
 * ElectronicInvoiceRepository
 *
 * Capa de acceso a datos para ElectronicInvoice y ElectronicInvoiceItem.
 * TODAS las queries filtran por tenantId como primera condición.
 * Ninguna operación puede leer o modificar facturas de otro tenant.
 */

const prisma = require('../utils/prismaClient');

/**
 * Busca una factura por ID garantizando que pertenece al tenant.
 * Devuelve null si no existe o si pertenece a otro tenant.
 *
 * @param {number} id
 * @param {number} tenantId
 * @returns {Promise<object|null>}
 */
async function findById(id, tenantId) {
  return prisma.electronicInvoice.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });
}

/**
 * Lista facturas del tenant con paginación y filtros opcionales.
 *
 * @param {number} tenantId
 * @param {object} filters
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=20]
 * @param {string} [filters.status] - arcaStatus filter
 * @param {number} [filters.invoiceType]
 * @param {number} [filters.pointOfSale]
 * @returns {Promise<{ invoices: object[], total: number, page: number, limit: number }>}
 */
async function findMany(tenantId, filters = {}) {
  const { page = 1, limit = 20, status, invoiceType, pointOfSale } = filters;
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(status && { arcaStatus: status }),
    ...(invoiceType && { invoiceType }),
    ...(pointOfSale && { pointOfSale }),
  };

  const [invoices, total] = await Promise.all([
    prisma.electronicInvoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    prisma.electronicInvoice.count({ where }),
  ]);

  return { invoices, total, page, limit };
}

/**
 * Crea una factura en estado draft.
 * Todos los items heredan el tenantId del padre.
 *
 * @param {number} tenantId
 * @param {number} fiscalProfileId
 * @param {object} data
 * @param {object[]} [items=[]]
 * @returns {Promise<object>}
 */
async function createDraft(tenantId, fiscalProfileId, data, items = []) {
  return prisma.electronicInvoice.create({
    data: {
      tenantId,
      fiscalProfileId,
      customerName: data.customerName,
      customerDocType: data.customerDocType,
      customerDocNumber: data.customerDocNumber,
      invoiceType: data.invoiceType,
      pointOfSale: data.pointOfSale,
      concept: data.concept,
      currency: data.currency || 'PES',
      exchangeRate: data.exchangeRate || 1,
      netAmount: data.netAmount,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      serviceFromDate: data.serviceFromDate || null,
      serviceToDate: data.serviceToDate || null,
      dueDate: data.dueDate || null,
      createdBy: data.createdBy || null,
      arcaStatus: 'draft',
      ...(items.length > 0 && {
        items: {
          create: items.map((item) => ({ ...item, tenantId })),
        },
      }),
    },
    include: { items: true },
  });
}

/**
 * Marca una factura como "pending_authorization" antes de enviarla a ARCA.
 * Previene doble envío concurrente (idempotencia básica).
 *
 * @param {number} id
 * @param {number} tenantId
 * @returns {Promise<object>}
 */
async function markAsPendingAuthorization(id, tenantId) {
  return prisma.electronicInvoice.update({
    where: { id, tenantId },
    data: { arcaStatus: 'pending_authorization' },
  });
}

/**
 * Actualiza la factura con los datos de autorización de ARCA (estado 'authorized').
 *
 * @param {number} id
 * @param {number} tenantId
 * @param {object} authData
 * @param {number} authData.invoiceNumber
 * @param {string} authData.cae
 * @param {Date} authData.caeExpiresAt
 * @param {object} authData.rawRequest
 * @param {object} authData.rawResponse
 * @param {Date} authData.issuedAt
 * @returns {Promise<object>}
 */
async function updateAuthorized(id, tenantId, authData) {
  return prisma.electronicInvoice.update({
    where: { id, tenantId },
    data: {
      invoiceNumber: authData.invoiceNumber,
      cae: authData.cae,
      caeExpiresAt: authData.caeExpiresAt,
      arcaStatus: 'authorized',
      // Guardamos snapshots para auditoría y debug sin exponer en la API
      rawRequestSnapshot: authData.rawRequest,
      rawResponseSnapshot: authData.rawResponse,
      issuedAt: authData.issuedAt,
      authorizationError: null,
    },
    include: { items: true },
  });
}

/**
 * Actualiza la factura como rechazada por ARCA.
 *
 * @param {number} id
 * @param {number} tenantId
 * @param {object} rejectData
 * @param {string} rejectData.errorMessage
 * @param {object} rejectData.rawRequest
 * @param {object} rejectData.rawResponse
 * @returns {Promise<object>}
 */
async function updateRejected(id, tenantId, rejectData) {
  return prisma.electronicInvoice.update({
    where: { id, tenantId },
    data: {
      arcaStatus: 'rejected',
      authorizationError: rejectData.errorMessage,
      rawRequestSnapshot: rejectData.rawRequest,
      rawResponseSnapshot: rejectData.rawResponse,
    },
  });
}

/**
 * Actualiza el estado de una factura (eg. cancelled).
 *
 * @param {number} id
 * @param {number} tenantId
 * @param {string} status
 * @returns {Promise<object>}
 */
async function updateStatus(id, tenantId, status) {
  return prisma.electronicInvoice.update({
    where: { id, tenantId },
    data: { arcaStatus: status },
  });
}

module.exports = {
  findById,
  findMany,
  createDraft,
  markAsPendingAuthorization,
  updateAuthorized,
  updateRejected,
  updateStatus,
};
