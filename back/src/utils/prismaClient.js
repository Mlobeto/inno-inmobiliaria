'use strict';

/**
 * Singleton de Prisma Client — InnoInmo
 *
 * Prisma 7 usa el driver adapter (@prisma/adapter-pg) en lugar de
 * la conexión interna. El adapter reutiliza el pool de pg.
 *
 * Uso:
 *   const prisma = require('../utils/prismaClient');
 *   const properties = await prisma.properties.findMany({ where: { tenantId: 1 } });
 */

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let _prisma = null;

function getPrismaClient() {
  if (_prisma) return _prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida en las variables de entorno');
  }

  const adapter = new PrismaPg({ connectionString });
  _prisma = new PrismaClient({ adapter });

  return _prisma;
}

module.exports = getPrismaClient();
